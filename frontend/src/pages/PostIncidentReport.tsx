import { useEffect, useMemo, useState } from 'react';
import { FileText, Printer, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

interface IncidentRef {
  id: number;
  incident_number: string;
  incident_type: string;
  location: string;
  severity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

interface Report {
  id: number;
  incident_id: number;
  response_time_minutes: number | null;
  outcome: string;
  injuries_count: number;
  fatalities_count: number;
  property_damage_estimate: number | null;
  actions_taken: string | null;
  lessons_learned: string | null;
  narrative: string | null;
  status: 'draft' | 'finalized';
  created_at: string;
  updated_at: string;
  incidents: IncidentRef | null;
  profiles: { id: string; full_name: string } | null;
}

const OUTCOMES = ['extinguished', 'contained', 'rescued', 'treated_transported', 'false_alarm', 'other'];

const emptyForm = {
  response_time_minutes: '' as number | '',
  outcome: 'other',
  injuries_count: 0,
  fatalities_count: 0,
  property_damage_estimate: '' as number | '',
  actions_taken: '',
  lessons_learned: '',
  narrative: '',
  status: 'draft' as 'draft' | 'finalized',
};

export default function PostIncidentReportPage() {
  const [pending, setPending] = useState<IncidentRef[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'filed'>('pending');

  const [editingIncident, setEditingIncident] = useState<IncidentRef | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [printing, setPrinting] = useState<Report | null>(null);

  async function load() {
    setLoading(true);
    const [p, r] = await Promise.all([api.get('/post-incident-reports/pending'), api.get('/post-incident-reports')]);
    setPending(p ?? []);
    setReports(r ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openForIncident(incident: IncidentRef) {
    setEditingIncident(incident);
    setEditingReport(null);
    setForm(emptyForm);
    setDraftError(null);
  }

  function openForReport(report: Report) {
    setEditingIncident(report.incidents);
    setEditingReport(report);
    setForm({
      response_time_minutes: report.response_time_minutes ?? '',
      outcome: report.outcome,
      injuries_count: report.injuries_count,
      fatalities_count: report.fatalities_count,
      property_damage_estimate: report.property_damage_estimate ?? '',
      actions_taken: report.actions_taken ?? '',
      lessons_learned: report.lessons_learned ?? '',
      narrative: report.narrative ?? '',
      status: report.status,
    });
    setDraftError(null);
  }

  function close() {
    setEditingIncident(null);
    setEditingReport(null);
  }

  async function draftNarrative() {
    if (!editingIncident) return;
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await api.post('/ai/post-incident-report', {
        incident: editingIncident,
        report: form,
      });
      if (res?.narrative) setForm((f) => ({ ...f, narrative: res.narrative }));
    } catch (e: any) {
      setDraftError(e?.message ?? 'AI draft failed');
    } finally {
      setDrafting(false);
    }
  }

  async function save(finalize?: boolean) {
    if (!editingIncident) return;
    setSaving(true);
    const payload = {
      ...form,
      response_time_minutes: form.response_time_minutes === '' ? null : Number(form.response_time_minutes),
      property_damage_estimate: form.property_damage_estimate === '' ? null : Number(form.property_damage_estimate),
      status: finalize ? 'finalized' : form.status,
    };
    try {
      if (editingReport) {
        await api.put(`/post-incident-reports/${editingReport.id}`, payload);
      } else {
        await api.post('/post-incident-reports', { incident_id: editingIncident.id, ...payload });
      }
      close();
      await load();
    } finally {
      setSaving(false);
    }
  }

  const filedCount = reports.length;
  const pendingCount = pending.length;

  return (
    <div>
      <div className="module-header">
        <div className="flex items-center gap-4">
          <div className="module-icon">
            <FileText size={21} />
          </div>
          <div>
            <h1 className="module-title">Post-Incident Reporting</h1>
            <p className="module-description">
              File the after-action report for a resolved incident — response time, outcome, casualties/damage,
              and lessons learned — with an optional Groq-drafted narrative you review before finalizing.
            </p>
          </div>
        </div>
        <p className="stat-chip">
          <span className={`stat-chip-dot ${pendingCount > 0 ? 'bg-amber-500' : 'bg-leaf-500'}`} />
          {pendingCount} incident{pendingCount === 1 ? '' : 's'} awaiting a report
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('pending')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${tab === 'pending' ? 'bg-navy-900 text-white dark:bg-leaf-500 dark:text-navy-950' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}
        >
          Needs a report ({pendingCount})
        </button>
        <button
          onClick={() => setTab('filed')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${tab === 'filed' ? 'bg-navy-900 text-white dark:bg-leaf-500 dark:text-navy-950' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}
        >
          Filed reports ({filedCount})
        </button>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'pending' ? (
            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
              <thead className="bg-slate-50/70 dark:bg-white/[0.03]">
                <tr>
                  <th className="table-head-cell">#</th>
                  <th className="table-head-cell">Type</th>
                  <th className="table-head-cell">Location</th>
                  <th className="table-head-cell">Alert Level</th>
                  <th className="table-head-cell">Status</th>
                  <th className="table-head-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-slate-400 dark:text-slate-500">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && pending.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-slate-400 dark:text-slate-500">
                      Every resolved incident already has a filed report.
                    </td>
                  </tr>
                )}
                {pending.map((inc) => (
                  <tr key={inc.id} className="table-row">
                    <td className="table-cell font-semibold text-navy-900 dark:text-slate-100">{inc.incident_number}</td>
                    <td className="table-cell">{inc.incident_type}</td>
                    <td className="table-cell">{inc.location}</td>
                    <td className="table-cell">
                      <Badge value={inc.severity} />
                    </td>
                    <td className="table-cell">
                      <Badge value={inc.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right">
                      <button onClick={() => openForIncident(inc)} className="btn-outline !px-3 !py-1.5 !text-xs">
                        File Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
              <thead className="bg-slate-50/70 dark:bg-white/[0.03]">
                <tr>
                  <th className="table-head-cell">#</th>
                  <th className="table-head-cell">Type</th>
                  <th className="table-head-cell">Outcome</th>
                  <th className="table-head-cell">Response Time</th>
                  <th className="table-head-cell">Casualties</th>
                  <th className="table-head-cell">Status</th>
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
                {!loading && reports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-slate-400 dark:text-slate-500">
                      No reports filed yet.
                    </td>
                  </tr>
                )}
                {reports.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="table-cell font-semibold text-navy-900 dark:text-slate-100">
                      {r.incidents?.incident_number ?? `Incident #${r.incident_id}`}
                    </td>
                    <td className="table-cell">{r.incidents?.incident_type ?? '—'}</td>
                    <td className="table-cell">
                      <Badge value={r.outcome} />
                    </td>
                    <td className="table-cell">{r.response_time_minutes != null ? `${r.response_time_minutes} min` : '—'}</td>
                    <td className="table-cell">
                      {r.injuries_count} injured{r.fatalities_count ? `, ${r.fatalities_count} fatal` : ''}
                    </td>
                    <td className="table-cell">
                      <Badge value={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right">
                      <button onClick={() => setPrinting(r)} className="btn-outline mr-2 !px-3 !py-1.5 !text-xs">
                        <Printer size={13} className="mr-1 inline" /> Print
                      </button>
                      <button onClick={() => openForReport(r)} className="btn-outline !px-3 !py-1.5 !text-xs">
                        {r.status === 'finalized' ? 'View / Amend' : 'Continue'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editingIncident && (
        <Modal title={`Post-Incident Report — ${editingIncident.incident_number}`} onClose={close} wide>
          <div className="mb-4 rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <span className="font-semibold text-navy-900 dark:text-slate-100">{editingIncident.incident_type}</span> at{' '}
            {editingIncident.location} — Alert Level {editingIncident.severity}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="field-label">Response Time (minutes)</label>
              <input
                type="number"
                min={0}
                value={form.response_time_minutes}
                onChange={(e) => setForm({ ...form, response_time_minutes: e.target.value === '' ? '' : Number(e.target.value) })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Outcome</label>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className="field-input">
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Est. Property Damage (₱)</label>
              <input
                type="number"
                min={0}
                value={form.property_damage_estimate}
                onChange={(e) => setForm({ ...form, property_damage_estimate: e.target.value === '' ? '' : Number(e.target.value) })}
                className="field-input"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Injuries</label>
              <input
                type="number"
                min={0}
                value={form.injuries_count}
                onChange={(e) => setForm({ ...form, injuries_count: Number(e.target.value) })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Fatalities</label>
              <input
                type="number"
                min={0}
                value={form.fatalities_count}
                onChange={(e) => setForm({ ...form, fatalities_count: Number(e.target.value) })}
                className="field-input"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="field-label">Actions Taken</label>
            <textarea
              rows={2}
              value={form.actions_taken}
              onChange={(e) => setForm({ ...form, actions_taken: e.target.value })}
              className="field-input"
              placeholder="What crews did on scene…"
            />
          </div>

          <div className="mt-3">
            <label className="field-label">Lessons Learned</label>
            <textarea
              rows={2}
              value={form.lessons_learned}
              onChange={(e) => setForm({ ...form, lessons_learned: e.target.value })}
              className="field-input"
              placeholder="What should change for next time…"
            />
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Report Narrative</label>
              <button
                type="button"
                onClick={draftNarrative}
                disabled={drafting}
                className="flex items-center gap-1 text-xs font-medium text-leaf-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-leaf-400"
              >
                <Sparkles size={12} /> {drafting ? 'Drafting with Groq…' : 'Draft with Groq (AI)'}
              </button>
            </div>
            <textarea
              rows={5}
              value={form.narrative}
              onChange={(e) => setForm({ ...form, narrative: e.target.value })}
              className="field-input"
              placeholder="Full after-action narrative…"
            />
            {draftError && <p className="mt-1 text-xs text-rose-600">{draftError}</p>}
            <p className="mt-1 text-xs text-slate-400">
              Groq drafts from the incident record plus the fields above; review and edit before finalizing — nothing
              is written automatically.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button onClick={() => save(false)} disabled={saving} className="btn-outline">
              Save Draft
            </button>
            <button onClick={() => save(true)} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save & Finalize'}
            </button>
          </div>
        </Modal>
      )}

      {printing && (
        <Modal title="Post-Incident Report Preview" onClose={() => setPrinting(null)} wide>
          <div className="space-y-4">
            <div className="no-print flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-white/5">
              <p className="text-xs text-slate-600 dark:text-slate-300">Formatted for standard Letter / A4 paper printout.</p>
              <button onClick={() => window.print()} className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold">
                <Printer size={14} /> Print
              </button>
            </div>
            <div className="printable-document rounded-2xl border border-slate-300 bg-white p-8 text-navy-950 shadow-inner dark:border-slate-700 dark:bg-white dark:text-slate-900">
              <h2 className="mb-1 text-lg font-extrabold uppercase tracking-wide">Post-Incident Report</h2>
              <p className="mb-4 text-sm text-slate-600">
                {printing.incidents?.incident_number} — {printing.incidents?.incident_type}
              </p>
              <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="font-semibold">Location</dt>
                  <dd>{printing.incidents?.location}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Response Time</dt>
                  <dd>{printing.response_time_minutes != null ? `${printing.response_time_minutes} minutes` : 'Not recorded'}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Outcome</dt>
                  <dd className="capitalize">{printing.outcome.replace(/_/g, ' ')}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Casualties</dt>
                  <dd>
                    {printing.injuries_count} injured, {printing.fatalities_count} fatal
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Est. Property Damage</dt>
                  <dd>{printing.property_damage_estimate != null ? `₱${printing.property_damage_estimate.toLocaleString()}` : 'Not recorded'}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Prepared By</dt>
                  <dd>{printing.profiles?.full_name ?? '—'}</dd>
                </div>
              </dl>
              {printing.narrative && (
                <div className="mb-4">
                  <p className="mb-1 font-semibold">Narrative</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{printing.narrative}</p>
                </div>
              )}
              {printing.actions_taken && (
                <div className="mb-4">
                  <p className="mb-1 font-semibold">Actions Taken</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{printing.actions_taken}</p>
                </div>
              )}
              {printing.lessons_learned && (
                <div>
                  <p className="mb-1 font-semibold">Lessons Learned</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{printing.lessons_learned}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
