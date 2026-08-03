import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';

interface Summary {
  totalIncidents: number;
  activeIncidents: number;
  criticalUnresolved: number;
  totalPersonnel: number;
  onDutyPersonnel: number;
  totalVehicles: number;
  availableVehicles: number;
  pendingFalseAlarmReviews: number;
  certificatesExpiringSoon: number;
  incidentsBySeverity: Record<string, number>;
  incidentsByStatus: Record<string, number>;
  recentIncidents: {
    id: number;
    incident_number: string;
    incident_type: string;
    location: string;
    severity: string;
    status: string;
    created_at: string;
  }[];
  gpsIssues: { device_code: string; status: string }[];
}

interface Vehicle {
  id: number;
  unit_code: string;
  vehicle_type: string;
  status: string;
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  icon: string;
  accent: 'emerald' | 'rose' | 'blue' | 'amber';
}) {
  const accents: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-ink-800">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg ${accents[accent]}`}>
        {icon}
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/vehicles')])
      .then(([s, v]) => {
        setSummary(s);
        setVehicles(v ?? []);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>;
  if (!summary) return <div className="text-slate-400">Loading dashboard…</div>;

  const notifications = [
    ...summary.gpsIssues.map((g) => ({ text: `GPS signal ${g.status.replace('_', ' ')}: ${g.device_code}` })),
    ...(summary.pendingFalseAlarmReviews > 0
      ? [{ text: `${summary.pendingFalseAlarmReviews} incident(s) awaiting false-alarm review` }]
      : []),
    ...(summary.certificatesExpiringSoon > 0
      ? [{ text: `${summary.certificatesExpiringSoon} certificate(s) expiring within 30 days` }]
      : []),
  ];

  return (
    <div>
      {/* Page header strip */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-leaf-600">
            FRSMS / Dashboard &middot; {summary.activeIncidents} Active
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time snapshot of incidents, fleet, and personnel readiness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications((s) => !s)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-leaf-600 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-leaf-300"
            >
              <Bell size={19} />
              {notifications.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-leaf-400/10 dark:bg-navy-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Notifications
                </p>
                {notifications.length === 0 ? (
                  <p className="py-2 text-sm text-slate-400">All clear — nothing needs attention.</p>
                ) : (
                  <ul className="space-y-2">
                    {notifications.map((n, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {n.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf-600 text-sm font-bold text-navy-950">
            {initials(profile?.full_name ?? '?')}
          </div>

          <Link
            to="/incidents"
            className="rounded-lg bg-gradient-to-r from-leaf-400 to-leaf-600 px-4 py-2 text-sm font-semibold text-navy-950 shadow-sm transition-all duration-300 hover:from-leaf-300 hover:to-leaf-500"
          >
            + Report Incident
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Incidents" value={summary.activeIncidents} icon="⚠️" accent="rose" />
        <StatCard label="Critical & Unresolved" value={summary.criticalUnresolved} icon="🔥" accent="rose" />
        <StatCard label="Vehicles Available" value={summary.availableVehicles} icon="🚒" accent="emerald" />
        <StatCard label="Personnel On Duty" value={summary.onDutyPersonnel} icon="👥" accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent incidents */}
        <div className="rounded-xl border border-leaf-100 bg-white shadow-sm dark:border-leaf-400/10 dark:bg-navy-800 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Incidents</p>
            <Link to="/incidents" className="text-xs font-medium text-leaf-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/10">
              <thead className="bg-leaf-50/60 dark:bg-white/5">
                <tr>
                  <th className="px-5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Incident #</th>
                  <th className="px-5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Type</th>
                  <th className="px-5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Location</th>
                  <th className="px-5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Severity</th>
                  <th className="px-5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {summary.recentIncidents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                      No incidents yet.
                    </td>
                  </tr>
                )}
                {summary.recentIncidents.map((i) => (
                  <tr key={i.id} className="hover:bg-leaf-50/40 dark:hover:bg-white/5">
                    <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-300">{i.incident_number}</td>
                    <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">{i.incident_type}</td>
                    <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">{i.location}</td>
                    <td className="px-5 py-2.5">
                      <Badge value={i.severity} />
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge value={i.status} />
                    </td>
                    <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">
                      {new Date(i.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet snapshot */}
        <div className="rounded-xl border border-leaf-100 bg-white shadow-sm dark:border-leaf-400/10 dark:bg-navy-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Fleet Snapshot</p>
            <Link to="/vehicles" className="text-xs font-medium text-leaf-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {vehicles.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-400">No vehicles yet.</li>}
            {vehicles.slice(0, 6).map((v) => (
              <li key={v.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{v.unit_code}</p>
                  <p className="text-xs text-slate-400">{v.vehicle_type}</p>
                </div>
                <Badge value={v.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
