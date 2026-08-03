import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

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
  ai_false_alarm_score: number | null;
  ai_false_alarm_label: string | null;
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

const SEVERITIES = ['low', 'moderate', 'high', 'critical'];
const STATUSES = ['reported', 'dispatched', 'on_scene', 'resolved', 'closed'];

export default function IncidentsPage() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [personnel, setPersonnel] = useState<SimplePersonnel[]>([]);
  const [vehicles, setVehicles] = useState<SimpleVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Incident | 'new' | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

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
    setForm({ incident_type: '', description: '', location: '', severity: 'moderate', personnel_ids: [], vehicle_ids: [] });
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
    });
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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Incidents &amp; Dispatch</h1>
          <p className="text-sm text-slate-500">Log emergencies, assign personnel &amp; vehicles, track status.</p>
        </div>
        <button onClick={openNew} className="rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-600">
          + Log Incident
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">#</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Type</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Location</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Severity</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">AI Score</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No incidents logged yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700">{r.incident_number}</td>
                <td className="px-4 py-2.5 text-slate-700">{r.incident_type}</td>
                <td className="px-4 py-2.5 text-slate-700">{r.location}</td>
                <td className="px-4 py-2.5">
                  <Badge value={r.severity} />
                </td>
                <td className="px-4 py-2.5">
                  <Badge value={r.status} />
                </td>
                <td className="px-4 py-2.5">
                  {r.ai_false_alarm_score != null ? (
                    <span className="text-xs text-slate-600">
                      {r.ai_false_alarm_score} · <Badge value={r.ai_false_alarm_label} />
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button onClick={() => openEdit(r)} className="mr-3 text-leaf-500 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(r)} className="text-rose-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Log Incident' : `Edit ${(editing as Incident).incident_number}`} onClose={() => setEditing(null)} wide>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Incident Type</label>
                <input
                  value={form.incident_type ?? ''}
                  onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
                  placeholder="Structure Fire, Medical Emergency, …"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Location</label>
                <input
                  value={form.location ?? ''}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
              <textarea
                rows={3}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Severity</label>
                <select
                  value={form.severity ?? 'moderate'}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {editing !== 'new' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                  <select
                    value={form.status ?? 'reported'}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
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
              <label className="mb-1 block text-xs font-medium text-slate-600">Assign Personnel</label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {personnel.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={(form.personnel_ids ?? []).includes(p.id)} onChange={() => toggleId('personnel_ids', p.id)} />
                    {p.full_name} <span className="text-xs text-slate-400">({p.rank_title})</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Assign Vehicles</label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {vehicles.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={(form.vehicle_ids ?? []).includes(v.id)} onChange={() => toggleId('vehicle_ids', v.id)} />
                    {v.unit_code} <span className="text-xs text-slate-400">({v.vehicle_type})</span>
                  </label>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400">
              The AI false-alarm score is recalculated automatically from the description, severity, time of day, and
              this location's history whenever the incident is saved.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-600 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
