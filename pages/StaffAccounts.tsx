import { useEffect, useState } from 'react';
import { UserCog, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

interface StaffAccount {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'staff';
  status: 'active' | 'disabled' | 'pending';
  position?: string | null;
  station?: string | null;
  last_login_at: string | null;
  created_at: string;
}

export default function StaffAccountsPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '', role: 'staff' });

  async function load() {
    setLoading(true);
    try {
      setRows(await api.get('/staff-accounts'));
    } catch (e: any) {
      setError(e.message);
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
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: StaffAccount) {
    const nextStatus = row.status === 'active' ? 'disabled' : 'active';
    await api.put(`/staff-accounts/${row.id}`, { status: nextStatus });
    await load();
  }

  async function toggleRole(row: StaffAccount) {
    await api.put(`/staff-accounts/${row.id}`, { role: row.role === 'admin' ? 'staff' : 'admin' });
    await load();
  }

  async function remove(row: StaffAccount) {
    if (!confirm(`Remove the account for ${row.full_name}? This cannot be undone.`)) return;
    await api.del(`/staff-accounts/${row.id}`);
    await load();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-600 dark:bg-white/[0.06] dark:text-leaf-300">
            <UserCog size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-navy-900 dark:text-slate-100">Staff Accounts</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage who can log in, and at what role. Admin only.</p>
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-leaf-500/20 transition-colors duration-200 hover:bg-leaf-600"
        >
          <Plus size={15} /> New Account
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-navy-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
          <thead className="bg-slate-50 dark:bg-white/[0.03]">
            <tr>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Username</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Full Name</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Role</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Position</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Last Login</th>
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
                <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-300">{r.username}</td>
                <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">{r.full_name}</td>
                <td className="px-5 py-2.5">
                  <Badge value={r.role} />
                </td>
                <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">
                  {r.position ? `${r.position}${r.station ? ` · ${r.station}` : ''}` : '—'}
                </td>
                <td className="px-5 py-2.5">
                  <Badge value={r.status} />
                </td>
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{r.last_login_at ? new Date(r.last_login_at).toLocaleString() : 'never'}</td>
                <td className="whitespace-nowrap px-5 py-2.5 text-right">
                  <button onClick={() => toggleRole(r)} className="mr-3 text-leaf-500 hover:underline" disabled={r.id === profile?.id}>
                    Make {r.role === 'admin' ? 'Staff' : 'Admin'}
                  </button>
                  <button onClick={() => toggleStatus(r)} className="mr-3 text-leaf-500 hover:underline" disabled={r.id === profile?.id}>
                    {r.status === 'active' ? 'Disable' : r.status === 'pending' ? 'Approve' : 'Re-enable'}
                  </button>
                  <button onClick={() => remove(r)} className="text-rose-600 hover:underline" disabled={r.id === profile?.id}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && (
        <Modal title="New Staff Account" onClose={() => setAdding(false)}>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Email (login)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Temporary Password</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
              Cancel
            </button>
            <button
              onClick={createAccount}
              disabled={saving}
              className="rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-600 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
