import { useEffect, useState } from 'react';
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { SEVERITY_LABELS, INCIDENT_TYPES } from '../lib/dispatchRecommendation';

interface Incident {
  id: number;
  incident_number: string;
  incident_type: string;
  description: string | null;
  location: string;
  severity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  is_anonymous_caller: boolean;
  caller_count: number;
  smoke_sensor_triggered: boolean;
  fire_personnel_confirmed_smoke: boolean;
  ai_false_alarm_score: number | null;
  ai_false_alarm_label: string | null;
  ai_false_alarm_factors: string[] | null;
  incident_personnel: { personnel_id: number; personnel: { id: number; full_name: string; rank_title: string } }[];
  incident_vehicles: { vehicle_id: number; vehicles: { id: number; unit_code: string; vehicle_type: string } }[];
}

interface SimplePersonnel {
  id: number;
  full_name: string;
  rank_title: string;
}
interface SimpleVehicle {
  id: number;
  unit_code: string;
  vehicle_type: string;
}

const SEVERITIES: Array<'1' | '2' | '3' | '4' | '5'> = ['1', '2', '3', '4', '5'];
const STATUSES = ['reported', 'dispatched', 'on_scene', 'resolved', 'closed'];

// Known streets / landmarks within Brgy. Culiat's jurisdiction, matching the
// addresses already used across Establishments and past incident records.
// Keeping this as a fixed list (instead of free text) means every incident
// location is one of a known, dispatchable set of places -- no typos, no
// ambiguous street names, and it stays consistent with the map/GPS data.
const KNOWN_LOCATIONS = [
  'Tandang Sora Ave., Brgy. Culiat, Quezon City',
  'Visayas Ave., Brgy. Culiat, Quezon City',
  'Tandang Sora Ave. corner Visayas Ave., Brgy. Culiat, Quezon City',
  'Culiat Road, Brgy. Culiat, Quezon City',
  'Kalayaan St., Brgy. Culiat, Quezon City',
  'Mabuhay St., Brgy. Culiat, Quezon City',
  'Brgy. Culiat, Quezon City',
  'Other (specify below)',
] as const;

export default function IncidentsPage() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [personnel, setPersonnel] = useState<SimplePersonnel[]>([]);
  const [vehicles, setVehicles] = useState<SimpleVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Incident | 'new' | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [otherLocation, setOtherLocation] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [incidents, p, v] = await Promise.all([api.get('/incidents'), api.get('/personnel'), api.get('/vehicles')]);
      setRows(incidents);
      setPersonnel(p);
      setVehicles(v);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openNew() {
    setForm({
      incident_type: '',
      description: '',
      location: '',
      severity: '3',
      personnel_ids: [],
      vehicle_ids: [],
      is_anonymous_caller: false,
      caller_count: 1,
      smoke_sensor_triggered: false,
      fire_personnel_confirmed_smoke: false,
    });
    setOtherLocation(false);
    setEditing('new');
  }

  function openEdit(row: Incident) {
    setForm({
      incident_type: row.incident_type,
      description: row.description ?? '',
      location: row.location,
      severity: row.severity,
      status: row.status,
      personnel_ids: row.incident_personnel.map((x) => x.personnel_id),
      vehicle_ids: row.incident_vehicles.map((x) => x.vehicle_id),
      is_anonymous_caller: row.is_anonymous_caller ?? false,
      caller_count: row.caller_count ?? 1,
      smoke_sensor_triggered: row.smoke_sensor_triggered ?? false,
      fire_personnel_confirmed_smoke: row.fire_personnel_confirmed_smoke ?? false,
    });
    setOtherLocation(!(KNOWN_LOCATIONS as readonly string[]).includes(row.location));
    setEditing(row);
  }

  function toggleId(key: 'personnel_ids' | 'vehicle_ids', id: number) {
    setForm((f: any) => {
      const list: number[] = f[key] ?? [];
      return { ...f, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (editing === 'new') await api.post('/incidents', form);
      else if (editing) await api.put(`/incidents/${editing.id}`, form);
      setEditing(null);
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Incident) {
    if (!confirm('Delete this incident?')) return;
    await api.del(`/incidents/${row.id}`);
    await loadAll();
  }

  return (
    <div>
      <div className="module-header">
        <div className="flex items-center gap-4">
          <div className="module-icon">
            <AlertTriangle size={21} />
          </div>
          <div>
            <h1 className="module-title">Incidents &amp; Dispatch</h1>
            <p className="module-description">Log emergencies, assign personnel &amp; vehicles, track status.</p>
          </div>
        </div>
        <button onClick={openNew} className="btn-primary">
          <AlertTriangle size={15} /> Log Incident
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
            <thead className="bg-slate-50/70 dark:bg-white/[0.03]">
              <tr>
                <th className="table-head-cell">#</th>
                <th className="table-head-cell">Type</th>
                <th className="table-head-cell">Location</th>
                <th className="table-head-cell">Alert Level</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell">AI Score</th>
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
                    No incidents logged yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell font-semibold text-navy-900 dark:text-slate-100">{r.incident_number}</td>
                  <td className="table-cell">{r.incident_type}</td>
                  <td className="table-cell">{r.location}</td>
                  <td className="table-cell">
                    <Badge value={r.severity} />
                  </td>
                  <td className="table-cell">
                    <Badge value={r.status} />
                  </td>
                  <td className="table-cell">
                    {r.ai_false_alarm_score != null ? (
                      <span
                        className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                        title={(r.ai_false_alarm_factors ?? []).join('\n')}
                      >
                        <span className="font-bold text-navy-900 dark:text-slate-200">{r.ai_false_alarm_score}</span>
                        <Badge value={r.ai_false_alarm_label} />
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(r)} title="Edit" className="btn-icon">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(r)} title="Delete" className="btn-icon-danger">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Log Incident' : `Edit ${(editing as Incident).incident_number}`} onClose={() => setEditing(null)} wide>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Incident Type</label>
                <select
                  value={form.incident_type ?? ''}
                  onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
                  className="field-input"
                >
                  <option value="" disabled>
                    Select incident type…
                  </option>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Location</label>
                <select
                  value={otherLocation ? 'Other (specify below)' : form.location ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Other (specify below)') {
                      setOtherLocation(true);
                      setForm({ ...form, location: '' });
                    } else {
                      setOtherLocation(false);
                      setForm({ ...form, location: val });
                    }
                  }}
                  className="field-input"
                >
                  <option value="" disabled>
                    Select location…
                  </option>
                  {KNOWN_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                {otherLocation && (
                  <input
                    value={form.location ?? ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Enter the exact address"
                    className="mt-2 field-input"
                  />
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Description</label>
                <button
                  type="button"
                  onClick={async () => {
                    setAiSummaryLoading(true);
                    setAiSummaryError(null);
                    try {
                      const res = await api.post('/ai/incident-summary', {
                        incident_number: (editing !== 'new' && (editing as Incident)?.incident_number) || undefined,
                        incident_type: form.incident_type,
                        location: form.location,
                        severity: form.severity,
                        status: form.status,
                        description: form.description,
                      });
                      if (res?.summary) setForm((f: any) => ({ ...f, description: res.summary }));
                    } catch (e: any) {
                      setAiSummaryError(e?.message ?? 'AI summary failed');
                    } finally {
                      setAiSummaryLoading(false);
                    }
                  }}
                  disabled={aiSummaryLoading || !form.incident_type || !form.location}
                  className="text-xs font-medium text-leaf-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-leaf-400"
                >
                  {aiSummaryLoading ? 'Drafting with Groq…' : 'Draft with Groq (AI)'}
                </button>
              </div>
              <textarea
                rows={3}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="field-input"
              />
              {aiSummaryError && <p className="mt-1 text-xs text-rose-600">{aiSummaryError}</p>}
              <p className="mt-1 text-xs text-slate-400">
                Groq drafts a report-style paragraph from the fields above; review and edit before saving --
                nothing is written automatically.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Alert Level</label>
                <select
                  value={form.severity ?? '3'}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="field-input"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {SEVERITY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              {editing !== 'new' && (
                <div>
                  <label className="field-label">Status</label>
                  <select
                    value={form.status ?? 'reported'}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="field-input"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="field-label">Assign Personnel</label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
                {personnel.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={(form.personnel_ids ?? []).includes(p.id)} onChange={() => toggleId('personnel_ids', p.id)} />
                    {p.full_name} <span className="text-xs text-slate-400 dark:text-slate-500">({p.rank_title})</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Assign Vehicles</label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
                {vehicles.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={(form.vehicle_ids ?? []).includes(v.id)} onChange={() => toggleId('vehicle_ids', v.id)} />
                    {v.unit_code} <span className="text-xs text-slate-400 dark:text-slate-500">({v.vehicle_type})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-leaf-100 bg-leaf-50/60 p-3 dark:border-leaf-400/15 dark:bg-white/5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-leaf-700 dark:text-leaf-300">
                False-Alarm AI Inputs
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!form.is_anonymous_caller}
                    onChange={(e) => setForm({ ...form, is_anonymous_caller: e.target.checked })}
                  />
                  Anonymous caller
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!form.smoke_sensor_triggered}
                    onChange={(e) => setForm({ ...form, smoke_sensor_triggered: e.target.checked })}
                  />
                  IoT smoke sensor triggered
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!form.fire_personnel_confirmed_smoke}
                    onChange={(e) => setForm({ ...form, fire_personnel_confirmed_smoke: e.target.checked })}
                  />
                  Fire personnel confirmed smoke
                </label>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Number of callers</label>
                  <input
                    type="number"
                    min={0}
                    value={form.caller_count ?? 1}
                    onChange={(e) => setForm({ ...form, caller_count: Number(e.target.value) })}
                    className="w-24 field-input"
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-leaf-700/80 dark:text-slate-400">
                The AI false-alarm score is recalculated on save from these inputs, time of day, and whether this
                location has a history of confirmed false alarms — see the False Alarm Review page for the full
                score breakdown.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="btn-outline">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
