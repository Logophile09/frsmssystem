import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, ShieldX, RotateCcw } from 'lucide-react';
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

  const pendingCount = rows.filter((r) => r.false_alarm_review_status === 'pending').length;

  return (
    <div>
      <div className="module-header">
        <div className="flex items-center gap-4">
          <div className="module-icon">
            <ShieldAlert size={21} />
          </div>
          <div>
            <h1 className="module-title">False Alarm Review</h1>
            <p className="module-description">
              Sorted by AI false-alarm score, highest first. Scoring is a transparent, rule-based weighted model —
              not a black box — every factor is shown before you decide.
            </p>
          </div>
        </div>
        <p className="stat-chip">
          <span className={`stat-chip-dot ${pendingCount > 0 ? 'bg-amber-500' : 'bg-leaf-500'}`} />
          {pendingCount} pending review{pendingCount === 1 ? '' : 's'}
        </p>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
            <thead className="bg-slate-50/70 dark:bg-white/[0.03]">
              <tr>
                <th className="table-head-cell">#</th>
                <th className="table-head-cell">Type</th>
                <th className="table-head-cell">Location</th>
                <th className="table-head-cell">AI Score</th>
                <th className="table-head-cell">Label</th>
                <th className="table-head-cell">Review Status</th>
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-400 dark:text-slate-500">
                    Nothing awaiting review.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell font-semibold text-navy-900 dark:text-slate-100">{r.incident_number}</td>
                  <td className="table-cell">{r.incident_type}</td>
                  <td className="table-cell">{r.location}</td>
                  <td className="table-cell font-bold text-navy-900 dark:text-slate-200">{r.ai_false_alarm_score}</td>
                  <td className="table-cell">
                    <Badge value={r.ai_false_alarm_label} />
                  </td>
                  <td className="table-cell">
                    <Badge value={r.false_alarm_review_status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right">
                    <button onClick={() => setReviewing(r)} className="btn-outline !px-3 !py-1.5 !text-xs">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reviewing && (
        <Modal title={`Review ${reviewing.incident_number}`} onClose={() => setReviewing(null)}>
          <div className="mb-4 flex items-center gap-3">
            <div className="text-3xl font-extrabold text-navy-900 dark:text-slate-100">{reviewing.ai_false_alarm_score}</div>
            <Badge value={reviewing.ai_false_alarm_label} />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Score breakdown</p>
          <ul className="mb-5 space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-300">
            {(reviewing.ai_false_alarm_factors ?? []).map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" /> {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => decide('confirmed_false')}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <ShieldCheck size={15} /> Confirm False Alarm
            </button>
            <button onClick={() => decide('confirmed_real')} className="btn-danger">
              <ShieldX size={15} /> Confirm Real Incident
            </button>
            <button onClick={() => decide('pending')} className="btn-outline">
              <RotateCcw size={14} /> Reset to Pending
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
