import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { api } from '../lib/api';

interface Incident {
  id: number;
  severity: string;
  status: string;
  created_at: string;
}
interface Vehicle {
  id: number;
  status: string;
}
interface Personnel {
  id: number;
  status: string;
}

const SEVERITY_COLORS: Record<string, string> = { low: '#10b981', moderate: '#f59e0b', high: '#f97316', critical: '#e11d48' };
const VEHICLE_COLORS: Record<string, string> = { available: '#10b981', dispatched: '#3b82f6', maintenance: '#f59e0b', out_of_service: '#e11d48' };
const PERSONNEL_COLORS: Record<string, string> = { on_duty: '#10b981', off_duty: '#94a3b8', on_leave: '#f59e0b' };

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-navy-800">
      <p className="mb-3 text-sm font-medium text-navy-900 dark:text-slate-100">{title}</p>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/incidents'), api.get('/vehicles'), api.get('/personnel')])
      .then(([i, v, p]) => {
        setIncidents(i);
        setVehicles(v);
        setPersonnel(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const trend = useMemo(() => {
    const byDay: Record<string, number> = {};
    incidents.forEach((i) => {
      const day = new Date(i.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      byDay[day] = (byDay[day] ?? 0) + 1;
    });
    return Object.entries(byDay).map(([day, count]) => ({ day, count }));
  }, [incidents]);

  const bySeverity = useMemo(() => {
    const out: Record<string, number> = {};
    incidents.forEach((i) => (out[i.severity] = (out[i.severity] ?? 0) + 1));
    return Object.entries(out).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const byStatus = useMemo(() => {
    const out: Record<string, number> = {};
    incidents.forEach((i) => (out[i.status] = (out[i.status] ?? 0) + 1));
    return Object.entries(out).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const fleetReadiness = useMemo(() => {
    const out: Record<string, number> = {};
    vehicles.forEach((v) => (out[v.status] = (out[v.status] ?? 0) + 1));
    return Object.entries(out).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const personnelReadiness = useMemo(() => {
    const out: Record<string, number> = {};
    personnel.forEach((p) => (out[p.status] = (out[p.status] ?? 0) + 1));
    return Object.entries(out).map(([name, value]) => ({ name, value }));
  }, [personnel]);

  if (loading) return <div className="text-slate-400">Loading reports…</div>;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-navy-900 dark:text-slate-100">Reports</h1>
        <p className="text-sm text-slate-500">Incident trends, severity/status breakdown, and fleet &amp; personnel readiness.</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Incident Trend (by day)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#e0a017" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incidents by Severity">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={bySeverity} dataKey="value" nameKey="name" outerRadius={80} label>
                {bySeverity.map((d) => (
                  <Cell key={d.name} fill={SEVERITY_COLORS[d.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incidents by Status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fleet Readiness">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={fleetReadiness} dataKey="value" nameKey="name" outerRadius={80} label>
                {fleetReadiness.map((d) => (
                  <Cell key={d.name} fill={VEHICLE_COLORS[d.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Personnel Readiness">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={personnelReadiness} dataKey="value" nameKey="name" outerRadius={80} label>
                {personnelReadiness.map((d) => (
                  <Cell key={d.name} fill={PERSONNEL_COLORS[d.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
