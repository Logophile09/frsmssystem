import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ExternalLink } from 'lucide-react';
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
  accent,
}: {
  label: string;
  value: ReactNode;
  icon?: string;
  accent: 'emerald' | 'rose' | 'blue' | 'amber';
}) {
  const valueColor: Record<string, string> = {
    emerald: 'text-leaf-700 dark:text-leaf-300',
    rose: 'text-rose-600 dark:text-rose-400',
    blue: 'text-ink-900 dark:text-slate-100',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="rounded-2xl border border-leaf-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-leaf-200 hover:shadow-lg dark:border-white/10 dark:bg-ink-800">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-leaf-600/70 dark:text-slate-400">{label}</p>
      <p className={`mt-2.5 text-4xl font-extrabold ${valueColor[accent]}`}>{value}</p>
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

// Curated links to public news coverage of Barangay Culiat. This is a static,
// manually-curated list (not a live feed) — see the "View all coverage" link
// for GMA News' full tracking page, which stays current on its own.
const CULIAT_NEWS = [
  {
    date: 'Jul 28, 2026',
    source: 'Manila Times / DPWH',
    title: 'Culiat Bridge II reopens to light vehicles',
    blurb: 'The bridge reopened for light vehicles after repairs following the July 11 fire that damaged it.',
    url: 'https://www.manilatimes.net/2026/07/28/news/national/fire-hit-culiat-bridge-open-to-light-vehicles/2392323',
  },
  {
    date: 'Jul 16, 2026',
    source: 'Quezon City Government',
    title: 'Clearing operations continue near Culiat Bridge',
    blurb: "QC's Department of Engineering is continuing clean-up work under the bridge following the fire.",
    url: 'https://quezoncity.gov.ph/clearing-operations-in-culiat-bridge-2/',
  },
  {
    date: 'Jan 28, 2026',
    source: 'GMA News',
    title: 'Fire hits residential area in Brgy. Culiat',
    blurb: 'An early-morning fire broke out in a residential area of the barangay and reached second alarm.',
    url: 'https://www.gmanetwork.com/news/topstories/metro/974401/fire-hits-residential-area-in-bgy-culiat-quezon-city/story/',
  },
];

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setShowProfileMenu(false);
    }
  }

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

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu((s) => !s)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf-600 text-sm font-bold text-navy-950 transition-transform duration-200 hover:scale-105"
              aria-label="Account menu"
            >
              {initials(profile?.full_name ?? '?')}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-leaf-400/10 dark:bg-navy-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{profile?.full_name ?? 'Unknown user'}</p>
                <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{profile?.role ?? ''}</p>
                {profile?.email && (
                  <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">{profile.email}</p>
                )}
                <div className="my-2 h-px bg-slate-100 dark:bg-white/10" />
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-rose-600 transition-colors duration-200 hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
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
        <div className="rounded-2xl border border-leaf-100 bg-white shadow-sm dark:border-leaf-400/10 dark:bg-navy-800 xl:col-span-2">
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
                  <th className="px-5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Alert Level</th>
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
        <div className="rounded-2xl border border-leaf-100 bg-white shadow-sm dark:border-leaf-400/10 dark:bg-navy-800">
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

      {/* Barangay Culiat news & updates */}
      <div className="mt-6 rounded-2xl border border-leaf-100 bg-white shadow-sm dark:border-leaf-400/10 dark:bg-navy-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Barangay Culiat News &amp; Updates</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Curated from public news coverage</p>
          </div>
          <a
            href="https://www.gmanetwork.com/news/tracking/barangayculiat/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-leaf-600 hover:underline"
          >
            View all coverage <ExternalLink size={12} />
          </a>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {CULIAT_NEWS.map((n) => (
            <li key={n.url} className="px-5 py-3.5">
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 group-hover:text-leaf-600 dark:text-slate-200 dark:group-hover:text-leaf-300">
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{n.blurb}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {n.source} &middot; {n.date}
                  </p>
                </div>
                <ExternalLink size={14} className="mt-0.5 shrink-0 text-slate-300 group-hover:text-leaf-500" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
