import { useEffect, useMemo, useState } from 'react';
import { UserCog, Search, Shield, ShieldCheck, Clock, UserCheck, Ban, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTableRow } from '../components/Skeleton';

interface StaffAccount {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'staff';
  status: 'active' | 'disabled' | 'pending';
  position?: string | null;
  station?: string | null;
  avatar_url?: string | null;
  last_login_at: string | null;
  created_at: string;
}

export default function StaffAccountsPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '', role: 'staff' });
  const [deletingAccount, setDeletingAccount] = useState<StaffAccount | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await api.get('/staff-accounts'));
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message, 'Failed to load staff accounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createAccount() {
    setSaving(true);
    setError(null);
    try {
      await api.post('/staff-accounts', form);
      setAdding(false);
      setForm({ email: '', password: '', username: '', full_name: '', role: 'staff' });
      toast.success(`Account created for ${form.full_name}.`);
      await load();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message, 'Failed to create account');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: StaffAccount) {
    const nextStatus = row.status === 'active' ? 'disabled' : 'active';
    try {
      await api.put(`/staff-accounts/${row.id}`, { status: nextStatus });
      toast.success(`Account ${nextStatus === 'active' ? 'activated' : 'disabled'} for ${row.full_name}.`);
      await load();
    } catch (e: any) {
      toast.error(e.message, 'Status update failed');
    }
  }

  async function toggleRole(row: StaffAccount) {
    const nextRole = row.role === 'admin' ? 'staff' : 'admin';
    try {
      await api.put(`/staff-accounts/${row.id}`, { role: nextRole });
      toast.success(`Role updated to ${nextRole} for ${row.full_name}.`);
      await load();
    } catch (e: any) {
      toast.error(e.message, 'Role update failed');
    }
  }

  async function confirmRemove() {
    if (!deletingAccount) return;
    setActionLoading(true);
    try {
      await api.del(`/staff-accounts/${deletingAccount.id}`);
      toast.success(`Account for ${deletingAccount.full_name} has been removed.`);
      setDeletingAccount(null);
      await load();
    } catch (e: any) {
      toast.error(e.message, 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  }

  const stats = useMemo(
    () => ({
      total: rows.length,
      admins: rows.filter((r) => r.role === 'admin').length,
      pending: rows.filter((r) => r.status === 'pending').length,
      active: rows.filter((r) => r.status === 'active').length,
    }),
    [rows],
  );

  const filtered = rows.filter((r) =>
    search
      ? [r.username, r.full_name, r.position, r.station].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const pendingRows = rows.filter((r) => r.status === 'pending');

  return (
    <div>
      <div className="module-header">
        <div className="flex items-center gap-4">
          <div className="module-icon">
            <UserCog size={21} />
          </div>
          <div>
            <h1 className="module-title">Staff Accounts</h1>
            <p className="module-description">Manage who can log in, and at what role. Admin only.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff…"
              className="field-search w-48 sm:w-56"
            />
          </div>
          <button onClick={() => setAdding(true)} className="btn-primary">
            <UserCog size={15} /> New Account
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Staff', value: stats.total, icon: UserCog, accent: 'text-navy-700 dark:text-slate-200' },
          { label: 'Admins', value: stats.admins, icon: ShieldCheck, accent: 'text-leaf-600 dark:text-leaf-300' },
          { label: 'Pending Approval', value: stats.pending, icon: Clock, accent: 'text-amber-600 dark:text-amber-300' },
          { label: 'Active', value: stats.active, icon: UserCheck, accent: 'text-emerald-600 dark:text-emerald-300' },
        ].map((s) => (
          <div key={s.label} className="mini-stat">
            <div className={`mini-stat-icon ${s.accent}`}>
              <s.icon size={16} />
            </div>
            <div className="min-w-0">
              <p className={`mini-stat-value ${s.accent}`}>{s.value}</p>
              <p className="mini-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {pendingRows.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 dark:border-amber-400/20 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <Clock size={18} className="shrink-0 text-amber-600 dark:text-amber-300" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {pendingRows.length} account{pendingRows.length === 1 ? '' : 's'} awaiting approval before they can sign in.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pendingRows.map((r) => (
              <button
                key={r.id}
                onClick={() => toggleStatus(r)}
                className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-400/30 dark:bg-navy-900 dark:text-amber-200 dark:hover:bg-amber-500/10"
              >
                Approve {r.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <div className="surface-card-header">
          <p className="stat-chip">
            <span className={`stat-chip-dot ${loading ? 'animate-pulse bg-slate-400' : 'bg-leaf-500'}`} />
            {loading ? 'Loading…' : `${filtered.length} account${filtered.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
            <thead className="bg-slate-50/70 dark:bg-white/[0.03]">
              <tr>
                <th className="table-head-cell">Staff Member</th>
                <th className="table-head-cell">Role</th>
                <th className="table-head-cell">Position</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell">Last Login</th>
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={6} />
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-slate-400 dark:text-slate-500">
                    No accounts match your search.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((r) => {
                  const isSelf = r.id === profile?.id;
                  return (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.full_name} avatarUrl={r.avatar_url} seed={r.username} className="h-9 w-9 text-xs" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy-900 dark:text-slate-100">
                              {r.full_name} {isSelf && <span className="font-normal text-slate-400">(you)</span>}
                            </p>
                            <p className="truncate text-xs text-slate-400 dark:text-slate-500">@{r.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge value={r.role} />
                      </td>
                      <td className="table-cell">{r.position ? `${r.position}${r.station ? ` · ${r.station}` : ''}` : '—'}</td>
                      <td className="table-cell">
                        <Badge value={r.status} />
                      </td>
                      <td className="table-cell text-slate-500 dark:text-slate-400">
                        {r.last_login_at ? new Date(r.last_login_at).toLocaleString() : 'never'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleRole(r)}
                            disabled={isSelf}
                            title={r.role === 'admin' ? 'Make Staff' : 'Make Admin'}
                            className="btn-icon disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {r.role === 'admin' ? <Shield size={13} /> : <ShieldCheck size={13} />}
                          </button>
                          <button
                            onClick={() => toggleStatus(r)}
                            disabled={isSelf}
                            title={r.status === 'active' ? 'Disable' : r.status === 'pending' ? 'Approve' : 'Re-enable'}
                            className="btn-icon disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {r.status === 'active' ? <Ban size={13} /> : <UserCheck size={13} />}
                          </button>
                          <button
                            onClick={() => setDeletingAccount(r)}
                            disabled={isSelf}
                            title="Delete"
                            className="btn-icon-danger disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {adding && (
        <Modal title="New Staff Account" onClose={() => setAdding(false)}>
          <div className="space-y-3">
            <div>
              <label className="field-label">Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Email (login)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Temporary Password</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field-input"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="field-label">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="field-input">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="btn-outline">
              Cancel
            </button>
            <button onClick={createAccount} disabled={saving} className="btn-primary">
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm deletion dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAccount)}
        title="Remove Staff Account"
        message={
          <span>
            Are you sure you want to remove the account for{' '}
            <strong>{deletingAccount?.full_name}</strong>? This user will no longer be able to log in.
          </span>
        }
        confirmText="Remove Account"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={confirmRemove}
        onCancel={() => setDeletingAccount(null)}
      />
    </div>
  );
}
