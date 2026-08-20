import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

interface QueueRow {
  id: number;
  incident_number: string;
  incident_type: string;
  location: string;
  severity: string;
  ai_false_alarm_score: number;
  ai_false_alarm_label: string;
  ai_false_alarm_factors: string[] | null;
  false_alarm_review_status: string;
  created_at: string;
}

export default function FalseAlarmsPage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<QueueRow | null>(null);

  async function load() {
    setLoading(true);
    setRows(await api.get('/false-alarms'));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(decision: 'confirmed_false' | 'confirmed_real' | 'pending') {
    if (!reviewing) return;
    await api.post(`/false-alarms/${reviewing.id}/review`, { decision });
    setReviewing(null);
    await load();
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-600 dark:bg-white/[0.06] dark:text-leaf-300">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-navy-900 dark:text-slate-100">False Alarm Review</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sorted by AI false-alarm score, highest first. Scoring is a transparent, rule-based weighted model — not a
            black box — every factor is shown before you decide.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-navy-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
          <thead className="bg-slate-50 dark:bg-white/[0.03]">
            <tr>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">#</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Type</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Location</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">AI Score</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Label</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Review Status</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-300">{r.incident_number}</td>
                <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">{r.incident_type}</td>
                <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">{r.location}</td>
                <td className="px-5 py-2.5 font-medium text-slate-800 dark:text-slate-200">{r.ai_false_alarm_score}</td>
                <td className="px-5 py-2.5">
                  <Badge value={r.ai_false_alarm_label} />
                </td>
                <td className="px-5 py-2.5">
                  <Badge value={r.false_alarm_review_status} />
                </td>
                <td className="whitespace-nowrap px-5 py-2.5 text-right">
                  <button onClick={() => setReviewing(r)} className="text-leaf-600 hover:underline dark:text-leaf-300">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewing && (
        <Modal title={`Review ${reviewing.incident_number}`} onClose={() => setReviewing(null)}>
          <div className="mb-4 flex items-center gap-3">
            <div className="text-3xl font-semibold text-navy-900 dark:text-slate-100">{reviewing.ai_false_alarm_score}</div>
            <Badge value={reviewing.ai_false_alarm_label} />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Score breakdown</p>
          <ul className="mb-5 space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-300">
            {(reviewing.ai_false_alarm_factors ?? []).map((f, i) => (
              <li key={i}>• {f}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => decide('confirmed_false')} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
              Confirm False Alarm
            </button>
            <button onClick={() => decide('confirmed_real')} className="rounded-lg bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
              Confirm Real Incident
            </button>
            <button onClick={() => decide('pending')} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
              Reset to Pending
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
