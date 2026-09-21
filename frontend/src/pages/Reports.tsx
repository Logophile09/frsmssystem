import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Filter, MapPin, X } from 'lucide-react';
import { api } from '../lib/api';
import { aiSettingsApi, AiAccuracyResponse } from '../lib/aiSettings';
import Badge from '../components/Badge';

interface Incident {
  id: number;
  incident_number: string;
  incident_type: string;
  location: string;
  severity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
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
const ACCURACY_COLORS = ['#10b981', '#e11d48'];

const DATE_RANGES: { key: string; label: string; days: number | null }[] = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
];

function ChartCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="surface-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="surface-card-title">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [accuracy, setAccuracy] = useState<AiAccuracyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<string>('30');
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    Promise.all([api.get('/incidents'), api.get('/vehicles'), api.get('/personnel'), aiSettingsApi.getAccuracy().catch(() => null)])
      .then(([i, v, p, acc]) => {
        setIncidents(i);
        setVehicles(v);
        setPersonnel(p);
        setAccuracy(acc);
      })
      .finally(() => setLoading(false));
  }, []);

  const incidentTypes = useMemo(() => Array.from(new Set(incidents.map((i) => i.incident_type))).sort(), [incidents]);

  const filtered = useMemo(() => {
    const range = DATE_RANGES.find((r) => r.key === dateRange);
    const cutoff = range?.days != null ? Date.now() - range.days * 86400000 : null;
    return incidents.filter((i) => {
      if (cutoff != null && new Date(i.created_at).getTime() < cutoff) return false;
      if (severityFilter.size > 0 && !severityFilter.has(i.severity)) return false;
      if (typeFilter && i.incident_type !== typeFilter) return false;
      return true;
    });
  }, [incidents, dateRange, severityFilter, typeFilter]);

  const filtersActive = severityFilter.size > 0 || !!typeFilter || dateRange !== '30';

  function toggleSeverity(key: string) {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function clearFilters() {
    setDateRange('30');
    setSeverityFilter(new Set());
    setTypeFilter('');
  }

  const trend = useMemo(() => {
    const byDay: Record<string, number> = {};
    filtered.forEach((i) => {
      const day = new Date(i.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      byDay[day] = (byDay[day] ?? 0) + 1;
    });
    return Object.entries(byDay).map(([day, count]) => ({ day, count }));
  }, [filtered]);

  const bySeverity = useMemo(() => {
    const out: Record<string, number> = {};
    filtered.forEach((i) => (out[i.severity] = (out[i.severity] ?? 0) + 1));
    return Object.entries(out).map(([key, value]) => ({ name: SEVERITY_LABELS[key] ?? key, key, value }));
  }, [filtered]);

  const byStatus = useMemo(() => {
    const out: Record<string, number> = {};
    filtered.forEach((i) => (out[i.status] = (out[i.status] ?? 0) + 1));
    return Object.entries(out).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const topLocations = useMemo(() => {
    const out: Record<string, number> = {};
    filtered.forEach((i) => (out[i.location] = (out[i.location] ?? 0) + 1));
    return Object.entries(out)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 24 ? `${name.slice(0, 24)}…` : name, fullName: name, value }));
  }, [filtered]);

  const avgResponseMinutes = useMemo(() => {
    const durations = filtered
      .filter((i) => (i.status === 'resolved' || i.status === 'closed') && i.resolved_at)
      .map((i) => (new Date(i.resolved_at as string).getTime() - new Date(i.created_at).getTime()) / 60000)
      .filter((m) => Number.isFinite(m) && m >= 0);
    return durations.length > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : null;
  }, [filtered]);

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

  const accuracyChart = useMemo(() => {
    if (!accuracy || accuracy.total === 0) return [];
    return [
      { name: 'Correctly predicted', value: accuracy.correct },
      { name: 'Missed', value: accuracy.total - accuracy.correct },
    ];
  }, [accuracy]);

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
            <p className="module-description">Incident trends, alert level/status breakdown, fleet &amp; personnel readiness, and AI model accuracy.</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="surface-card mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-white/40">
          <Filter size={14} /> Filters
        </div>

        <div className="flex overflow-hidden rounded-full border border-slate-200 dark:border-white/10">
          {DATE_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setDateRange(r.key)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                dateRange === r.key
                  ? 'bg-flagred-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-white/[0.02] dark:text-white/60 dark:hover:bg-white/5'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['1', '2', '3', '4', '5'].map((key) => (
            <button
              key={key}
              onClick={() => toggleSeverity(key)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
                severityFilter.has(key)
                  ? 'border-transparent text-white'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5'
              }`}
              style={severityFilter.has(key) ? { backgroundColor: SEVERITY_COLORS[key] } : undefined}
            >
              Level {key}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/70"
        >
          <option value="">All incident types</option>
          {incidentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
          >
            <X size={12} /> Clear
          </button>
        )}

        <span className="ml-auto text-xs font-medium text-slate-400 dark:text-white/40">
          {filtered.length} of {incidents.length} incidents
          {avgResponseMinutes != null && <> · avg. response {Math.round(avgResponseMinutes)}m</>}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Incident Trend (by day)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#15803d" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incidents by Alert Level" action={<span className="text-[11px] font-medium text-slate-400 dark:text-white/35">Click a slice to filter</span>}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={bySeverity} dataKey="value" nameKey="name" outerRadius={80} label>
                {bySeverity.map((d) => (
                  <Cell
                    key={d.name}
                    fill={SEVERITY_COLORS[d.key] ?? '#94a3b8'}
                    className="cursor-pointer"
                    onClick={() => toggleSeverity(d.key)}
                    opacity={severityFilter.size === 0 || severityFilter.has(d.key) ? 1 : 0.35}
                  />
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

        <ChartCard title="Top Incident Locations">
          {topLocations.length === 0 ? (
            <p className="flex h-[220px] items-center justify-center text-sm text-slate-400 dark:text-white/40">No incidents in range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topLocations} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''} />
                <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
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

        <ChartCard title="AI False-Alarm Model Accuracy">
          {!accuracy || accuracy.total === 0 ? (
            <p className="flex h-[220px] items-center justify-center text-center text-sm text-slate-400 dark:text-white/40">
              No reviewed incidents yet — confirm real/false outcomes on the False Alarms page to populate this.
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={accuracyChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {accuracyChart.map((d, idx) => (
                      <Cell key={d.name} fill={ACCURACY_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 text-sm">
                <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{accuracy.accuracy}%</p>
                <p className="mb-2 text-xs text-slate-400 dark:text-white/40">
                  {accuracy.correct} of {accuracy.total} reviewed incidents correctly predicted
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-300">{accuracy.confusionMatrix.falseNegative} missed real fires</p>
                <p className="text-xs text-amber-600 dark:text-amber-300">{accuracy.confusionMatrix.falsePositive} missed false alarms</p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Drill-down — the exact incidents behind whatever filters/slice
          are currently selected, so a chart is a way IN to the data, not
          just a picture of it. */}
      <div className="surface-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-white/10">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Filtered Incidents <span className="font-normal text-slate-400 dark:text-white/40">({filtered.length})</span>
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
            <thead className="sticky top-0 bg-slate-50 dark:bg-navy-900">
              <tr>
                <th className="px-5 py-2 text-left font-medium text-slate-400 dark:text-white/40">Incident #</th>
                <th className="px-5 py-2 text-left font-medium text-slate-400 dark:text-white/40">Type</th>
                <th className="px-5 py-2 text-left font-medium text-slate-400 dark:text-white/40">Location</th>
                <th className="px-5 py-2 text-left font-medium text-slate-400 dark:text-white/40">Alert Level</th>
                <th className="px-5 py-2 text-left font-medium text-slate-400 dark:text-white/40">Status</th>
                <th className="px-5 py-2 text-left font-medium text-slate-400 dark:text-white/40">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-400 dark:text-white/40">
                    No incidents match the current filters.
                  </td>
                </tr>
              )}
              {[...filtered]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((i) => (
                  <tr key={i.id} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                    <td className="px-5 py-2.5 font-medium text-slate-800 dark:text-white/85">{i.incident_number}</td>
                    <td className="px-5 py-2.5 text-slate-600 dark:text-white/70">{i.incident_type}</td>
                    <td className="px-5 py-2.5 text-slate-600 dark:text-white/70">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="shrink-0 text-slate-300 dark:text-white/25" /> {i.location}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge value={i.severity} />
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge value={i.status} />
                    </td>
                    <td className="px-5 py-2.5 text-slate-500 dark:text-white/50">
                      {new Date(i.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
