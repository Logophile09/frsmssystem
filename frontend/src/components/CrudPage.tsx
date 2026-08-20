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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-600 dark:bg-white/[0.06] dark:text-leaf-300">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-navy-900 dark:text-slate-100">{title}</h1>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-48 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm text-navy-900 focus:border-leaf-400 focus:outline-none focus:ring-2 focus:ring-leaf-400/20 dark:border-white/10 dark:bg-navy-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-leaf-500/20 transition-colors duration-200 hover:bg-leaf-600"
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-leaf-200 bg-leaf-50 px-4 py-2 text-sm font-medium text-leaf-700 dark:border-leaf-400/20 dark:bg-leaf-500/10 dark:text-leaf-300">
          ✓ {successMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-navy-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {loading ? 'Loading…' : `${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
            <thead className="bg-slate-50 dark:bg-white/[0.03]">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">
                    {c.label}
                  </th>
                ))}
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                      <Inbox size={28} className="opacity-60" />
                      <p className="text-sm">No records yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={row.id} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-2.5 text-slate-700 dark:text-slate-300">
                      {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-5 py-2.5 text-right">
                    <button
                      onClick={() => openEdit(row)}
                      className="mr-3 inline-flex items-center gap-1 text-leaf-600 hover:underline dark:text-leaf-300"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => remove(row)}
                        className="inline-flex items-center gap-1 text-rose-600 hover:underline dark:text-rose-400"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
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
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={(form[f.name] as string) ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-navy-900 focus:border-leaf-400 focus:outline-none focus:ring-2 focus:ring-leaf-400/20 dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-navy-900 focus:border-leaf-400 focus:outline-none focus:ring-2 focus:ring-leaf-400/20 dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
                  />
                ) : (
                  <input
                    type={f.type}
                    step={f.step}
                    required={f.required}
                    value={(form[f.name] as string) ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-navy-900 focus:border-leaf-400 focus:outline-none focus:ring-2 focus:ring-leaf-400/20 dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
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
