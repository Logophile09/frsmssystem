import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../lib/api';
import Badge from '../components/Badge';

interface Summary {
  totalIncidents: number;
  activeIncidents: number;
  totalPersonnel: number;
  onDutyPersonnel: number;
  totalVehicles: number;
  availableVehicles: number;
  pendingFalseAlarmReviews: number;
  certificatesExpiringSoon: number;
  incidentsBySeverity: Record<string, number>;
  incidentsByStatus: Record<string, number>;
  recentIncidents: { id: number; incident_number: string; incident_type: string; location: string; severity: string; status: string; created_at: string }[];
}

const SEVERITY_COLORS: Record<string, string> = { low: '#10b981', moderate: '#f59e0b', high: '#f97316', critical: '#e11d48' };

function Card({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>;
  if (!summary) return <div className="text-slate-400">Loading dashboard…</div>;

  const severityData = Object.entries(summary.incidentsBySeverity).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(summary.incidentsByStatus).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold text-ink-900">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="Active Incidents" value={summary.activeIncidents} sub={`${summary.totalIncidents} total`} />
        <Card label="Personnel On Duty" value={summary.onDutyPersonnel} sub={`${summary.totalPersonnel} total`} />
        <Card label="Vehicles Available" value={summary.availableVehicles} sub={`${summary.totalVehicles} total`} />
        <Card label="False-Alarm Reviews" value={summary.pendingFalseAlarmReviews} sub="pending, score ≥ 65" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-ink-900">Incidents by Severity</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" outerRadius={80} label>
                {severityData.map((d) => (
                  <Cell key={d.name} fill={SEVERITY_COLORS[d.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-ink-900">Incidents by Status</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#f8641f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-ink-900">Recent Incidents</div>
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">#</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Location</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Severity</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summary.recentIncidents.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-2 text-slate-700">{i.incident_number}</td>
                <td className="px-4 py-2 text-slate-700">{i.incident_type}</td>
                <td className="px-4 py-2 text-slate-700">{i.location}</td>
                <td className="px-4 py-2">
                  <Badge value={i.severity} />
                </td>
                <td className="px-4 py-2">
                  <Badge value={i.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
