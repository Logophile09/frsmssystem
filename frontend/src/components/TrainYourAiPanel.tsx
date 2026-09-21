import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, ChevronDown, Loader2, RotateCcw, Save, Sparkles } from 'lucide-react';
import { aiSettingsApi, AiAccuracyResponse } from '../lib/aiSettings';
import { computeFalseAlarmScore, DEFAULT_SCORE_THRESHOLDS, DEFAULT_SCORE_WEIGHTS, ScoreThresholds, ScoreWeights } from '../lib/falseAlarmScoring';
import { useAuth } from '../context/AuthContext';

type WeightKey = keyof ScoreWeights;

const WEIGHT_FIELDS: { key: WeightKey; label: string; min: number; max: number; hint: string }[] = [
  { key: 'anonymousCaller', label: 'Anonymous caller', min: 0, max: 50, hint: 'Caller gave no verifiable name/number' },
  { key: 'repeatedFalseAlarmLocation', label: 'Repeated false-alarm location', min: 0, max: 50, hint: 'This address has a prior confirmed false alarm' },
  { key: 'noSmokeSensorTrigger', label: 'No smoke sensor trigger', min: 0, max: 50, hint: 'IoT smoke sensor did not fire' },
  { key: 'smokeSensorTriggered', label: 'Smoke sensor triggered', min: -80, max: 0, hint: 'IoT smoke sensor did fire' },
  { key: 'singleCaller', label: 'Single caller', min: 0, max: 40, hint: 'Only one person called it in' },
  { key: 'multipleCallers', label: 'Multiple callers', min: -50, max: 0, hint: 'More than one person called it in' },
  { key: 'nightTime', label: 'Night time (10pm–5am)', min: 0, max: 30, hint: 'Reported overnight' },
  { key: 'firePersonnelConfirmedSmoke', label: 'Personnel confirmed smoke', min: -80, max: 0, hint: 'Crew on-scene visually confirmed smoke/fire' },
];

const LABEL_STYLE: Record<string, string> = {
  very_likely_real: 'text-emerald-600 dark:text-emerald-300',
  needs_review: 'text-amber-600 dark:text-amber-300',
  likely_false: 'text-orange-600 dark:text-orange-300',
  confirmed_false: 'text-rose-600 dark:text-rose-300',
};
const LABEL_TEXT: Record<string, string> = {
  very_likely_real: 'Very Likely Real Fire',
  needs_review: 'Needs Review',
  likely_false: 'Likely False Alarm',
  confirmed_false: 'Confirmed False Alarm',
};

function weightsEqual(a: ScoreWeights, b: ScoreWeights) {
  return (Object.keys(a) as WeightKey[]).every((k) => a[k] === b[k]);
}
function thresholdsEqual(a: ScoreThresholds, b: ScoreThresholds) {
  return a.veryLikelyRealMax === b.veryLikelyRealMax && a.needsReviewMax === b.needsReviewMax && a.likelyFalseMax === b.likelyFalseMax;
}

export default function TrainYourAiPanel() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || (profile?.role as string) === 'super admin';

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savedWeights, setSavedWeights] = useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS);
  const [savedThresholds, setSavedThresholds] = useState<ScoreThresholds>(DEFAULT_SCORE_THRESHOLDS);
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS);
  const [thresholds, setThresholds] = useState<ScoreThresholds>(DEFAULT_SCORE_THRESHOLDS);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<AiAccuracyResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // "Try it" simulator inputs -- toggling these recomputes a live score
  // against whatever weights are currently on the sliders (unsaved
  // included), so the feedback loop is instant.
  const [simAnonymous, setSimAnonymous] = useState(true);
  const [simSmoke, setSimSmoke] = useState(false);
  const [simCallers, setSimCallers] = useState(1);
  const [simNight, setSimNight] = useState(false);
  const [simConfirmed, setSimConfirmed] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    Promise.all([aiSettingsApi.getWeights(), aiSettingsApi.getAccuracy()])
      .then(([w, a]) => {
        setSavedWeights(w.weights);
        setSavedThresholds(w.thresholds);
        setWeights(w.weights);
        setThresholds(w.thresholds);
        setUpdatedAt(w.updatedAt);
        setAccuracy(a);
        setLoaded(true);
      })
      .catch((e) => setError(e.message ?? 'Could not load AI settings'));
  }, [open, loaded]);

  const dirty = !weightsEqual(weights, savedWeights) || !thresholdsEqual(thresholds, savedThresholds);

  const simResult = useMemo(
    () =>
      computeFalseAlarmScore(
        {
          isAnonymousCaller: simAnonymous,
          repeatedFalseAlarmLocation: false,
          smokeSensorTriggered: simSmoke,
          callerCount: simCallers,
          firePersonnelConfirmedSmoke: simConfirmed,
          reported_at: simNight ? new Date(new Date().setHours(23, 0, 0, 0)) : new Date(new Date().setHours(14, 0, 0, 0)),
        },
        weights,
        thresholds,
      ),
    [weights, thresholds, simAnonymous, simSmoke, simCallers, simNight, simConfirmed],
  );

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const result = await aiSettingsApi.saveWeights(weights, thresholds);
      setSavedWeights(result.weights);
      setSavedThresholds(result.thresholds);
      setUpdatedAt(result.updatedAt);
      setSavedMsg('Saved. New incidents will be scored with these weights.');
    } catch (e: any) {
      setError(e.message ?? 'Could not save weights');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const result = await aiSettingsApi.resetWeights();
      setSavedWeights(result.weights);
      setSavedThresholds(result.thresholds);
      setWeights(result.weights);
      setThresholds(result.thresholds);
      setUpdatedAt(result.updatedAt);
      setSavedMsg('Restored factory-default weights.');
    } catch (e: any) {
      setError(e.message ?? 'Could not reset weights');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            <BrainCircuit size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Train Your AI — False-Alarm Model</p>
            <p className="text-xs text-slate-500 dark:text-white/50">
              Tune the scoring rules and see how they perform against reviewed incidents.
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-300 dark:text-white/40 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-200 px-5 py-5 dark:border-white/10">
          {!loaded && !error && (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-400 dark:text-white/40">
              <Loader2 size={16} className="animate-spin" /> Loading current model weights…
            </div>
          )}

          {error && !loaded && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>
          )}

          {loaded && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Weight sliders */}
              <div className="lg:col-span-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Scoring rules (points added/subtracted)</p>
                <div className="space-y-4">
                  {WEIGHT_FIELDS.map((f) => (
                    <div key={f.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-white/80">{f.label}</span>
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-white/50">
                          {weights[f.key] >= 0 ? `+${weights[f.key]}` : weights[f.key]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={f.min}
                        max={f.max}
                        step={1}
                        value={weights[f.key]}
                        disabled={!isAdmin}
                        onChange={(e) => setWeights((w) => ({ ...w, [f.key]: Number(e.target.value) }))}
                        className="w-full accent-flagred-600 disabled:opacity-50"
                      />
                      <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/35">{f.hint}</p>
                    </div>
                  ))}
                </div>

                <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Label thresholds (max score per band)</p>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-xs text-slate-500 dark:text-white/50">Very likely real ≤</span>
                    <input
                      type="number"
                      min={0}
                      max={98}
                      disabled={!isAdmin}
                      value={thresholds.veryLikelyRealMax}
                      onChange={(e) => setThresholds((t) => ({ ...t, veryLikelyRealMax: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500 dark:text-white/50">Needs review ≤</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      disabled={!isAdmin}
                      value={thresholds.needsReviewMax}
                      onChange={(e) => setThresholds((t) => ({ ...t, needsReviewMax: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500 dark:text-white/50">Likely false ≤</span>
                    <input
                      type="number"
                      min={2}
                      max={99}
                      disabled={!isAdmin}
                      value={thresholds.likelyFalseMax}
                      onChange={(e) => setThresholds((t) => ({ ...t, likelyFalseMax: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </label>
                </div>

                {isAdmin ? (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={!dirty || saving}
                      className="flex items-center gap-2 rounded-full bg-flagred-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors duration-300 hover:bg-flagred-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save weights
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors duration-300 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
                    >
                      <RotateCcw size={14} /> Reset to defaults
                    </button>
                    {updatedAt && <span className="text-[11px] text-slate-400 dark:text-white/35">Last updated {new Date(updatedAt).toLocaleString()}</span>}
                  </div>
                ) : (
                  <p className="mt-5 text-xs text-slate-400 dark:text-white/40">Only admins can save changes. You can still try the simulator below.</p>
                )}
                {error && loaded && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
                {savedMsg && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{savedMsg}</p>}
              </div>

              {/* Live simulator + accuracy feedback */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    <Sparkles size={13} /> Try it — live preview
                  </p>
                  <div className="space-y-2.5 text-sm">
                    <label className="flex items-center justify-between gap-3">
                      <span className="text-slate-600 dark:text-white/70">Anonymous caller</span>
                      <input type="checkbox" checked={simAnonymous} onChange={(e) => setSimAnonymous(e.target.checked)} className="h-4 w-4 accent-flagred-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span className="text-slate-600 dark:text-white/70">Smoke sensor triggered</span>
                      <input type="checkbox" checked={simSmoke} onChange={(e) => setSimSmoke(e.target.checked)} className="h-4 w-4 accent-flagred-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span className="text-slate-600 dark:text-white/70">Personnel confirmed smoke</span>
                      <input type="checkbox" checked={simConfirmed} onChange={(e) => setSimConfirmed(e.target.checked)} className="h-4 w-4 accent-flagred-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span className="text-slate-600 dark:text-white/70">Reported at night</span>
                      <input type="checkbox" checked={simNight} onChange={(e) => setSimNight(e.target.checked)} className="h-4 w-4 accent-flagred-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span className="text-slate-600 dark:text-white/70">Caller count</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={simCallers}
                        onChange={(e) => setSimCallers(Math.max(1, Number(e.target.value)))}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{simResult.score}</span>
                      <span className={`text-xs font-bold uppercase tracking-wide ${LABEL_STYLE[simResult.label]}`}>{LABEL_TEXT[simResult.label]}</span>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-[11px] text-slate-500 dark:text-white/50">
                      {simResult.factors.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {accuracy && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Model accuracy so far</p>
                    {accuracy.total === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-white/40">No reviewed incidents yet — accuracy will appear once dispatch confirms real/false outcomes.</p>
                    ) : (
                      <>
                        <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
                          {accuracy.accuracy}% <span className="text-xs font-medium text-slate-400 dark:text-white/40">({accuracy.correct}/{accuracy.total} reviewed correctly predicted)</span>
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-lg bg-rose-50 px-2 py-1.5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                            False negatives: {accuracy.confusionMatrix.falseNegative}
                            <p className="text-[10px] opacity-70">Called "real" but was a false alarm</p>
                          </div>
                          <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            False positives: {accuracy.confusionMatrix.falsePositive}
                            <p className="text-[10px] opacity-70">Called "false" but was real</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
