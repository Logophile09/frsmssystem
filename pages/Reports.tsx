import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
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

const SEVERITY_COLORS: Record<string, string> = { '1': '#10b981', '2': '#84cc16', '3': '#f59e0b', '4': '#f97316', '5': '#e11d48' };
const SEVERITY_LABELS: Record<string, string> = { '1': 'Alert Level 1', '2': 'Alert Level 2', '3': 'Alert Level 3', '4': 'Alert Level 4', '5': 'Alert Level 5' };
const VEHICLE_COLORS: Record<string, string> = { available: '#10b981', dispatched: '#3b82f6', maintenance: '#f59e0b', out_of_service: '#e11d48' };
const PERSONNEL_COLORS: Record<string, string> = { on_duty: '#10b981', off_duty: '#94a3b8', on_leave: '#f59e0b' };

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface-card p-5">
      <p className="surface-card-title mb-3">{title}</p>
      {children}
    </div>
  );
}

// Custom pie label: pushes the count outside the slice with a thin leader
// line back to it, instead of recharts' default (which prints the raw value
// right at the pie's edge — fine when slices are evenly sized, but numbers
// from neighboring thin slices collide and become unreadable, e.g. a "1"
// landing on top of an "8" between two adjacent Alert Level slices).
function renderPieLabel({ cx, cy, midAngle, outerRadius, value }: any) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="fill-slate-600 text-[11px] font-bold dark:fill-slate-300"
    >
      {value}
    </text>
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
    return Object.entries(out).map(([key, value]) => ({ name: SEVERITY_LABELS[key] ?? key, key, value }));
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
      <div className="module-header">
        <div className="flex items-center gap-4">
          <div className="module-icon">
            <BarChart3 size={21} />
          </div>
          <div>
            <h1 className="module-title">Reports</h1>
            <p className="module-description">Incident trends, alert level/status breakdown, and fleet &amp; personnel readiness.</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Incident Trend (by day)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#ce1126" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incidents by Alert Level">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <Pie
                data={bySeverity}
                dataKey="value"
                nameKey="name"
                outerRadius={65}
                label={renderPieLabel}
                labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
              >
                {bySeverity.map((d) => (
                  <Cell key={d.name} fill={SEVERITY_COLORS[d.key] ?? '#94a3b8'} />
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
            <PieChart margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <Pie
                data={fleetReadiness}
                dataKey="value"
                nameKey="name"
                outerRadius={65}
                label={renderPieLabel}
                labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
              >
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
            <PieChart margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <Pie
                data={personnelReadiness}
                dataKey="value"
                nameKey="name"
                outerRadius={65}
                label={renderPieLabel}
                labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
              >
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