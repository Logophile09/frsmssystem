import React, { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Inbox, type LucideIcon } from 'lucide-react';
import { api } from '../lib/api';
import Modal from './Modal';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea';
  options?: (string | { value: string | number; label: string })[];
  required?: boolean;
  step?: string;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface CrudPageProps<T extends { id: number | string }> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  endpoint: string;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  canDelete?: boolean;
  onBeforeSave?: (values: Record<string, unknown>) => Record<string, unknown>;
}

export default function CrudPage<T extends { id: number | string }>({
  title,
  description,
  icon: Icon,
  endpoint,
  columns,
  fields,
  canDelete = true,
  onBeforeSave,
}: CrudPageProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<T | null | 'new'>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss the success toast after a few seconds so it doesn't linger.
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(t);
  }, [successMessage]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(endpoint);
      setRows(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  function openNew() {
    const blank: Record<string, unknown> = {};
    fields.forEach((f) => (blank[f.name] = ''));
    setForm(blank);
    setEditing('new');
  }

  function openEdit(row: T) {
    setForm({ ...row });
    setEditing(row);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // Only send the columns this page actually declares as fields, and
      // turn blank optional inputs into null instead of "". This also
      // drops any extra keys (like an embedded `establishments` relation
      // object) that got pulled in when an existing row was loaded into
      // the edit form for display purposes.
      const cleaned: Record<string, unknown> = {};
      fields.forEach((f) => {
        const v = form[f.name];
        cleaned[f.name] = v === '' || v === undefined ? null : v;
      });
      const payload = onBeforeSave ? onBeforeSave(cleaned) : cleaned;
      const wasNew = editing === 'new';
      if (editing === 'new') {
        await api.post(endpoint, payload);
      } else if (editing) {
        await api.put(`${endpoint}/${(editing as T).id}`, payload);
      }
      setEditing(null);
      setSuccessMessage(wasNew ? 'Successfully logged.' : 'Successfully updated.');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: T) {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.del(`${endpoint}/${row.id}`);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const filtered = rows.filter((r) =>
    search ? JSON.stringify(r).toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div>
      <div className="module-header">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="module-icon">
              <Icon size={21} />
            </div>
          )}
          <div>
            <h1 className="module-title">{title}</h1>
            {description && <p className="module-description">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records…"
              className="field-search w-48 sm:w-56"
            />
          </div>
          <button onClick={openNew} className="btn-primary">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-2.5 text-sm font-semibold text-leaf-700 dark:border-leaf-400/20 dark:bg-leaf-500/10 dark:text-leaf-300">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-leaf-500 text-[10px] text-white">✓</span>
          {successMessage}
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <div className="surface-card-header">
          <p className="stat-chip">
            <span className={`stat-chip-dot ${loading ? 'animate-pulse bg-slate-400' : 'bg-leaf-500'}`} />
            {loading ? 'Loading…' : `${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
            <thead className="bg-slate-50/70 dark:bg-white/[0.03]">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="table-head-cell">
                    {c.label}
                  </th>
                ))}
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-14 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-14">
                    <div className="flex flex-col items-center justify-center gap-2.5 text-slate-400 dark:text-slate-500">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
                        <Inbox size={20} className="opacity-70" />
                      </div>
                      <p className="text-sm font-medium">No records yet.</p>
                      <button onClick={openNew} className="text-xs font-bold text-leaf-600 hover:underline dark:text-leaf-300">
                        Add the first one
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={row.id} className="table-row">
                  {columns.map((c) => (
                    <td key={c.key} className="table-cell">
                      {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(row)} title="Edit" className="btn-icon">
                        <Pencil size={13} />
                      </button>
                      {canDelete && (
                        <button onClick={() => remove(row)} title="Delete" className="btn-icon-danger">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? `Add ${title}` : `Edit ${title}`} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="field-label">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={(form[f.name] as string) ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="field-input"
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {f.options?.map((o) => {
                      const value = typeof o === 'string' ? o : o.value;
                      const label = typeof o === 'string' ? o.replace(/_/g, ' ') : o.label;
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={(form[f.name] as string) ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    rows={3}
                    className="field-input"
                  />
                ) : (
                  <input
                    type={f.type}
                    step={f.step}
                    required={f.required}
                    value={(form[f.name] as string) ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="field-input"
                  />
                )}
              </div>
            ))}
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
