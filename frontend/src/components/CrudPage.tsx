import React, { useEffect, useState } from 'react';
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
  endpoint: string;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  canDelete?: boolean;
  onBeforeSave?: (values: Record<string, unknown>) => Record<string, unknown>;
}

export default function CrudPage<T extends { id: number | string }>({
  title,
  description,
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
      const payload = onBeforeSave ? onBeforeSave(form) : form;
      if (editing === 'new') {
        await api.post(endpoint, payload);
      } else if (editing) {
        await api.put(`${endpoint}/${(editing as T).id}`, payload);
      }
      setEditing(null);
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-ember-500 focus:outline-none"
          />
          <button
            onClick={openNew}
            className="rounded-lg bg-ember-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-ember-700"
          >
            + Add
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2.5 text-left font-medium text-slate-500">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  No records yet.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 text-slate-700">
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button onClick={() => openEdit(row)} className="mr-3 text-ember-600 hover:underline">
                    Edit
                  </button>
                  {canDelete && (
                    <button onClick={() => remove(row)} className="text-rose-600 hover:underline">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? `Add ${title}` : `Edit ${title}`} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={(form[f.name] as string) ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-ember-500 focus:outline-none"
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-ember-500 focus:outline-none"
                  />
                ) : (
                  <input
                    type={f.type}
                    step={f.step}
                    required={f.required}
                    value={(form[f.name] as string) ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-ember-500 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-ember-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-ember-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
