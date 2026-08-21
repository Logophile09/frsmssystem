import { useEffect, useMemo, useState } from 'react';
import { GitBranch, Truck, Users, ShieldAlert, CheckCircle2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import {
  INCIDENT_TYPES,
  recommendDispatch,
  type DispatchInput,
  type DispatchRecommendation,
  type Severity,
  SEVERITY_LABELS,
} from '../lib/dispatchRecommendation';

interface IncidentRow {
  id: number;
  incident_number: string;
  incident_type: string;
  location: string;
  severity: Severity;
  status: string;
  created_at: string;
}
interface VehicleRow {
  id: number;
  unit_code: string;
  vehicle_type: string;
  status: string;
}
interface PersonnelRow {
  id: number;
  status: string;
}

const SEVERITIES: Severity[] = ['1', '2', '3', '4', '5'];

const PRIORITY_BADGE: Record<string, string> = {
  immediate: 'bg-rose-100 text-rose-800',
  high: 'bg-orange-100 text-orange-800',
  moderate: 'bg-amber-100 text-amber-800',
  low: 'bg-emerald-100 text-emerald-800',
};

export default function DispatchRecommendationPage() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [form, setForm] = useState<DispatchInput>({
    incidentType: 'Structure Fire',
    severity: '3',
    occupantsTrapped: false,
    hazardousMaterials: false,
    multipleCasualties: false,
  });
  const [result, setResult] = useState<DispatchRecommendation | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [i, v, p] = await Promise.all([api.get('/incidents'), api.get('/vehicles'), api.get('/personnel')]);
      setIncidents((i ?? []).filter((r: IncidentRow) => r.status === 'reported' || r.status === 'dispatched'));
      setVehicles(v ?? []);
      setPersonnel(p ?? []);
      setLoading(false);
    })();
  }, []);

  const activeVehicleTypes = useMemo(() => Array.from(new Set(vehicles.map((v) => v.vehicle_type))).sort(), [vehicles]);

  function loadFromIncident(id: string) {
    setSelectedIncidentId(id);
    setResult(null);
    if (!id) return;
    const inc = incidents.find((r) => String(r.id) === id);
    if (!inc) return;
    setForm((f) => ({
      ...f,
      incidentType: INCIDENT_TYPES.includes(inc.incident_type as any) ? inc.incident_type : 'Other',
      severity: inc.severity,
    }));
  }

  function run() {
    const rec = recommendDispatch(form, vehicles, personnel);
    setResult(rec);
    setAiAnalysis(null);
    setAiError(null);
  }

  // Groq API-driven decision-tree analysis: the tree above is always
  // what actually gets recommended -- this just asks Groq to read the
  // same trace and narrate it for the dispatcher. See
  // backend/src/routes/ai.ts for the human-in-the-loop framing.
  async function runAiAnalysis() {
    if (!result) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.post('/ai/dispatch-analysis', { input: form, result });
      setAiAnalysis(res?.analysis ?? null);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div>
      <div className="module-header">
        <div className="flex items-center gap-4">
          <div className="module-icon">
            <GitBranch size={21} />
          </div>
          <div>
            <h1 className="module-title">Dispatch Recommendation</h1>
            <p className="module-description">
              A transparent, decision-tree AI — every recommendation shows the exact path of questions and
              branches it took to get there, cross-checked against live fleet &amp; personnel availability.
              Optionally, Groq can narrate that trace in plain language for the dispatcher.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        {/* Input form */}
        <div className="surface-card p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Incident details</p>

          <label className="field-label">Load from an active incident (optional)</label>
          <select
            value={selectedIncidentId}
            onChange={(e) => loadFromIncident(e.target.value)}
            disabled={loading}
            className="field-input mb-4"
          >
            <option value="">— Enter manually —</option>
            {incidents.map((r) => (
              <option key={r.id} value={r.id}>
                {r.incident_number} · {r.incident_type} · {r.location}
              </option>
            ))}
          </select>

          <label className="field-label">Incident type</label>
          <select
            value={form.incidentType}
            onChange={(e) => setForm({ ...form, incidentType: e.target.value })}
            className="field-input mb-4"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label className="field-label">Alert Level</label>
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
            className="field-input mb-4"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </select>

          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-white/5 dark:bg-white/[0.03]">
            {[
              { key: 'occupantsTrapped', label: 'Occupants / passengers reported trapped' },
              { key: 'multipleCasualties', label: 'Multiple casualties reported' },
              { key: 'hazardousMaterials', label: 'Hazardous materials confirmed' },
            ].map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={(form as any)[c.key] ?? false}
                  onChange={(e) => setForm({ ...form, [c.key]: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-leaf-500 focus:ring-leaf-400"
                />
                {c.label}
              </label>
            ))}
          </div>

          <button onClick={run} className="btn-primary mt-5 w-full !py-2.5">
            Run Decision Tree
          </button>

          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            Fleet snapshot: {vehicles.filter((v) => v.status === 'available').length} of {vehicles.length} vehicles
            available across {activeVehicleTypes.length} types · {personnel.filter((p) => p.status === 'on_duty').length}{' '}
            personnel on duty.
          </p>
        </div>

        {/* Result */}
        <div className="surface-card p-5">
          {!result && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-slate-400">
              <GitBranch size={32} className="mb-3 opacity-40" />
              <p className="text-sm">Fill in the incident details and run the tree to see a recommendation.</p>
            </div>
          )}

          {result && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${PRIORITY_BADGE[result.priority]}`}>
                  {result.priority} priority
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <Users size={15} /> ~{result.minPersonnel} personnel needed
                </span>
              </div>

              <p className="mb-5 text-sm text-slate-700 dark:text-slate-300">{result.summary}</p>

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended units</p>
              <div className="mb-5 grid gap-2 sm:grid-cols-2">
                {result.units.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <Truck size={15} className="text-leaf-500" /> {u.quantity}× {u.vehicleType}
                    </span>
                    <span className={u.shortfall > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {u.availableNow} available
                      {u.shortfall > 0 ? ` (short ${u.shortfall})` : ''}
                    </span>
                  </div>
                ))}
              </div>

              {result.mutualAidAdvised && (
                <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                  Fleet shortfall detected — consider requesting mutual aid or reassigning a returning unit.
                </div>
              )}

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Decision path</p>
              <div className="space-y-2">
                {result.trace.map((step, i) => (
                  <div key={i} style={{ marginLeft: step.depth * 16 }} className="flex gap-2">
                    <div className="mt-1 flex flex-col items-center">
                      <CheckCircle2 size={14} className="shrink-0 text-leaf-500" />
                      {i < result.trace.length - 1 && <div className="mt-1 h-full w-px flex-1 bg-slate-200 dark:bg-white/10" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {step.question} <span className="font-normal text-slate-500">→ {step.answer}</span>
                      </p>
                      <p className="text-xs text-slate-500">{step.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Sparkles size={14} className="text-leaf-500" /> Groq AI analysis
                  </p>
                  <button
                    onClick={runAiAnalysis}
                    disabled={aiLoading}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    {aiLoading ? 'Analyzing…' : aiAnalysis ? 'Re-run' : 'Explain this recommendation'}
                  </button>
                </div>
                <p className="mb-2 text-xs text-slate-400">
                  Groq reads this same decision-tree trace and narrates it in plain language -- it never changes
                  which units get recommended; the tree above remains the authoritative output.
                </p>
                {aiError && <p className="text-sm text-rose-600">{aiError}</p>}
                {aiAnalysis && (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    {aiAnalysis}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
