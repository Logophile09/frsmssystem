import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

interface StaffAccount {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'staff';
  status: 'active' | 'disabled';
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
    await api.put(`/staff-accounts/${row.id}`, { status: row.status === 'active' ? 'disabled' : 'active' });
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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Staff Accounts</h1>
          <p className="text-sm text-slate-500">Manage who can log in, and at what role. Admin only.</p>
        </div>
        <button onClick={() => setAdding(true)} className="rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-600">
          + New Account
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Username</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Full Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Role</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Last Login</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700">{r.username}</td>
                <td className="px-4 py-2.5 text-slate-700">{r.full_name}</td>
                <td className="px-4 py-2.5">
                  <Badge value={r.role} />
                </td>
                <td className="px-4 py-2.5">
                  <Badge value={r.status} />
                </td>
                <td className="px-4 py-2.5 text-slate-500">{r.last_login_at ? new Date(r.last_login_at).toLocaleString() : 'never'}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button onClick={() => toggleRole(r)} className="mr-3 text-leaf-500 hover:underline" disabled={r.id === profile?.id}>
                    Make {r.role === 'admin' ? 'Staff' : 'Admin'}
                  </button>
                  <button onClick={() => toggleStatus(r)} className="mr-3 text-leaf-500 hover:underline" disabled={r.id === profile?.id}>
                    {r.status === 'active' ? 'Disable' : 'Re-enable'}
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
              <label className="mb-1 block text-xs font-medium text-slate-600">Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email (login)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Temporary Password</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
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
