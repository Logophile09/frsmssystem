import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Inbox,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { SkeletonTableRow } from './Skeleton';
import { useToast } from '../context/ToastContext';

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
  sortable?: boolean;
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
  extraActions?: (row: T) => React.ReactNode;
  headerActions?: React.ReactNode;
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
  extraActions,
  headerActions,
}: CrudPageProps<T>) {
  const toast = useToast();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<T | null | 'new'>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Deletion confirm dialog state
  const [deletingRow, setDeletingRow] = useState<T | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(endpoint);
      setRows(data ?? []);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message, `Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  // Reset pagination when search query or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

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
      toast.success(wasNew ? `Added ${title} record.` : `Updated ${title} record.`);
      await load();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message, 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingRow) return;
    setDeletingLoading(true);
    try {
      await api.del(`${endpoint}/${deletingRow.id}`);
      toast.success(`Record removed.`);
      setDeletingRow(null);
      await load();
    } catch (e: any) {
      toast.error(e.message, 'Delete failed');
    } finally {
      setDeletingLoading(false);
    }
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  function exportCsv() {
    if (filteredAndSortedRows.length === 0) {
      toast.warning('No records available to export.');
      return;
    }
    const headers = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`);
    const csvLines = [headers.join(',')];

    filteredAndSortedRows.forEach((row) => {
      const line = columns.map((c) => {
        const val = (row as any)[c.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvLines.push(line.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Export downloaded.');
  }

  // Filtered & Sorted Rows
  const filteredAndSortedRows = useMemo(() => {
    let result = rows.filter((r) =>
      search ? JSON.stringify(r).toLowerCase().includes(search.toLowerCase()) : true
    );

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const valA = (a as any)[sortKey];
        const valB = (b as any)[sortKey];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [rows, search, sortKey, sortDirection]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

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

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records…"
              className="field-search w-48 sm:w-56"
            />
          </div>

          <button
            onClick={exportCsv}
            title="Export current list to CSV"
            className="btn-outline text-xs"
          >
            <Download size={14} /> Export CSV
          </button>

          {headerActions}

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

      <div className="surface-card overflow-hidden">
        <div className="surface-card-header flex flex-wrap items-center justify-between gap-3">
          <p className="stat-chip">
            <span
              className={`stat-chip-dot ${
                loading ? 'animate-pulse bg-slate-400' : 'bg-leaf-500'
              }`}
            />
            {loading
              ? 'Loading…'
              : `${filteredAndSortedRows.length} record${
                  filteredAndSortedRows.length === 1 ? '' : 's'
                }${search ? ' (filtered)' : ''}`}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-navy-900 dark:text-slate-300"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
            <thead className="bg-slate-50/70 dark:bg-white/[0.03]">
              <tr>
                {columns.map((c) => {
                  const isSorted = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      onClick={() => handleSort(c.key)}
                      className="table-head-cell select-none cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{c.label}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={13} className="text-leaf-600 dark:text-leaf-400" />
                          ) : (
                            <ArrowDown size={13} className="text-leaf-600 dark:text-leaf-400" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="opacity-35" />
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={columns.length + 1} />
                ))}

              {!loading && filteredAndSortedRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-14">
                    <div className="flex flex-col items-center justify-center gap-2.5 text-slate-400 dark:text-slate-500">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
                        <Inbox size={20} className="opacity-70" />
                      </div>
                      <p className="text-sm font-medium">No records found.</p>
                      {search ? (
                        <button
                          onClick={() => setSearch('')}
                          className="text-xs font-bold text-leaf-600 hover:underline dark:text-leaf-300"
                        >
                          Clear search filter
                        </button>
                      ) : (
                        <button
                          onClick={openNew}
                          className="text-xs font-bold text-leaf-600 hover:underline dark:text-leaf-300"
                        >
                          Add the first one
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedRows.map((row) => (
                  <tr key={row.id} className="table-row">
                    {columns.map((c) => (
                      <td key={c.key} className="table-cell">
                        {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {extraActions && extraActions(row)}
                        <button
                          onClick={() => openEdit(row)}
                          title="Edit"
                          className="btn-icon"
                        >
                          <Pencil size={13} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeletingRow(row)}
                            title="Delete"
                            className="btn-icon-danger"
                          >
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

        {/* Pagination bar */}
        {!loading && filteredAndSortedRows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {Math.min(currentPage * pageSize, filteredAndSortedRows.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filteredAndSortedRows.length}
              </span>{' '}
              entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-icon h-7 w-7 disabled:cursor-not-allowed disabled:opacity-40"
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-icon h-7 w-7 disabled:cursor-not-allowed disabled:opacity-40"
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? `Add ${title}` : `Edit ${title}`}
          onClose={() => setEditing(null)}
        >
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

      {/* Modern Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingRow)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete Record"
        isDestructive={true}
        loading={deletingLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingRow(null)}
      />
    </div>
  );
}
