import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Flame,
  HardHat,
  Milestone,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import GridDots from '../components/GridDots';

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
  icon: Icon,
  accent,
  to,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  accent: 'emerald' | 'rose' | 'blue' | 'amber';
  to?: string;
}) {
  const valueColor: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-300',
    rose: 'text-rose-600 dark:text-rose-300',
    blue: 'text-navy-900 dark:text-slate-100',
    amber: 'text-amber-600 dark:text-amber-300',
  };
  const iconColor: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-300',
    rose: 'text-rose-600 dark:text-rose-300',
    blue: 'text-navy-700 dark:text-slate-200',
    amber: 'text-amber-600 dark:text-amber-300',
  };
  const cardClass =
    'group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none dark:backdrop-blur-sm dark:hover:border-white/20 dark:hover:bg-white/[0.06]';
  const content = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-transform duration-300 group-hover:scale-105 dark:bg-white/10">
        <Icon size={18} className={iconColor[accent]} />
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/45">{label}</p>
      <p className={`mt-1 text-4xl font-extrabold ${valueColor[accent]}`}>{value}</p>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={`${cardClass} cursor-pointer`}>
        {content}
      </Link>
    );
  }
  return <div className={cardClass}>{content}</div>;
}

// Curated links to public news coverage of Barangay Culiat. This is a static,
// manually-curated list (not a live feed) — see the "View all coverage" link
// for GMA News' full tracking page, which stays current on its own.
// (News photos are copyrighted by their publishers, so each item gets a
// simple topic icon here instead of a lifted photo from the source article.)
const CULIAT_NEWS: {
  date: string;
  source: string;
  title: string;
  blurb: string;
  url: string;
  topic: 'bridge' | 'fire' | 'construction';
}[] = [
  {
    date: 'Jul 28, 2026',
    source: 'Manila Times / DPWH',
    title: 'Culiat Bridge II reopens to light vehicles',
    blurb: 'The bridge reopened for light vehicles after repairs following the July 11 fire that damaged it.',
    url: 'https://www.manilatimes.net/2026/07/28/news/national/fire-hit-culiat-bridge-open-to-light-vehicles/2392323',
    topic: 'bridge',
  },
  {
    date: 'Jul 16, 2026',
    source: 'Quezon City Government',
    title: 'Clearing operations continue near Culiat Bridge',
    blurb: "QC's Department of Engineering is continuing clean-up work under the bridge following the fire.",
    url: 'https://quezoncity.gov.ph/clearing-operations-in-culiat-bridge-2/',
    topic: 'construction',
  },
  {
    date: 'Jan 28, 2026',
    source: 'GMA News',
    title: 'Fire hits residential area in Brgy. Culiat',
    blurb: 'An early-morning fire broke out in a residential area of the barangay and reached second alarm.',
    url: 'https://www.gmanetwork.com/news/topstories/metro/974401/fire-hits-residential-area-in-bgy-culiat-quezon-city/story/',
    topic: 'fire',
  },
];

const NEWS_TOPIC_STYLE: Record<string, { icon: LucideIcon; classes: string }> = {
  bridge: { icon: Milestone, classes: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  construction: { icon: HardHat, classes: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  fire: { icon: Flame, classes: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
};

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

  const firstName = (profile?.full_name ?? 'Officer').split(' ')[0];

  return (
    // Full-bleed hero panel — bleeds past <main>'s own padding (the negative
    // margins) then re-adds it inside, so the whole Dashboard route reads as
    // one continuous panel rather than white cards sitting on a light page.
    // Light mode: brand-red/navy gradient (echoes the landing page hero).
    // Dark mode: the navy-950 "command console" look.
    <div className="relative -m-4 overflow-hidden rounded-b-3xl bg-gradient-to-br from-leaf-700 via-leaf-800 to-navy-900 p-4 dark:from-navy-950 dark:via-navy-950 dark:to-navy-950 sm:-m-6 sm:rounded-3xl sm:p-7">
      <GridDots />

      <div className="relative">
        {/* Hero */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Barangay Culiat &middot; Fire &amp; Rescue &middot; Quezon City
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">Welcome, {firstName}.</h1>
            <p className="mt-1.5 text-sm text-white/50">
              {summary.activeIncidents} active incident{summary.activeIncidents === 1 ? '' : 's'}, {summary.availableVehicles} vehicle
              {summary.availableVehicles === 1 ? '' : 's'} available, {summary.onDutyPersonnel} personnel on duty.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowNotifications((s) => !s)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors duration-300 hover:bg-white/10 hover:text-white"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-2xl dark:border-white/10 dark:bg-navy-900">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/40">Notifications</p>
                  {notifications.length === 0 ? (
                    <p className="py-2 text-sm text-slate-400 dark:text-white/40">All clear — nothing needs attention.</p>
                  ) : (
                    <ul className="space-y-2">
                      {notifications.map((n, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-white/75">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/incidents"
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-leaf-700 shadow-sm transition-colors duration-300 hover:bg-white/90 dark:text-navy-950"
            >
              <Flame size={15} /> Report Incident
            </Link>
            <Link
              to="/incidents"
              className="hidden items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors duration-300 hover:bg-white/5 hover:text-white sm:flex"
            >
              View all incidents <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active Incidents" value={summary.activeIncidents} icon={AlertTriangle} accent="rose" to="/incidents" />
          <StatCard label="Critical & Unresolved" value={summary.criticalUnresolved} icon={Flame} accent="rose" to="/incidents" />
          <StatCard label="Vehicles Available" value={summary.availableVehicles} icon={Truck} accent="emerald" to="/vehicles" />
          <StatCard label="Personnel On Duty" value={summary.onDutyPersonnel} icon={Users} accent="amber" to="/personnel" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Recent incidents */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.05] xl:col-span-2">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <p className="text-sm font-semibold text-white">Recent Incidents</p>
              <Link to="/incidents" className="text-xs font-medium text-white/50 hover:text-white hover:underline">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5 text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="px-5 py-2 text-left font-medium text-white/40">Incident #</th>
                    <th className="px-5 py-2 text-left font-medium text-white/40">Type</th>
                    <th className="px-5 py-2 text-left font-medium text-white/40">Location</th>
                    <th className="px-5 py-2 text-left font-medium text-white/40">Alert Level</th>
                    <th className="px-5 py-2 text-left font-medium text-white/40">Status</th>
                    <th className="px-5 py-2 text-left font-medium text-white/40">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {summary.recentIncidents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-white/40">
                        No incidents yet.
                      </td>
                    </tr>
                  )}
                  {summary.recentIncidents.map((i) => (
                    <tr key={i.id} className="transition-colors duration-150 hover:bg-white/[0.04]">
                      <td className="px-5 py-2.5 font-medium text-white/85">{i.incident_number}</td>
                      <td className="px-5 py-2.5 text-white/70">{i.incident_type}</td>
                      <td className="px-5 py-2.5 text-white/70">{i.location}</td>
                      <td className="px-5 py-2.5">
                        <Badge value={i.severity} />
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge value={i.status} />
                      </td>
                      <td className="px-5 py-2.5 text-white/50">
                        {new Date(i.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fleet snapshot */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.05]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <p className="text-sm font-semibold text-white">Fleet Snapshot</p>
              <Link to="/vehicles" className="text-xs font-medium text-white/50 hover:text-white hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-white/5">
              {vehicles.length === 0 && <li className="px-5 py-6 text-center text-sm text-white/40">No vehicles yet.</li>}
              {vehicles.slice(0, 6).map((v) => (
                <li key={v.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-white/85">{v.unit_code}</p>
                    <p className="text-xs text-white/40">{v.vehicle_type}</p>
                  </div>
                  <Badge value={v.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Barangay Culiat news & updates */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.05]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold text-white">Barangay Culiat News &amp; Updates</p>
              <p className="text-xs text-white/40">Curated from public news coverage</p>
            </div>
            <a
              href="https://www.gmanetwork.com/news/tracking/barangayculiat/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white hover:underline"
            >
              View all coverage <ExternalLink size={12} />
            </a>
          </div>
          <ul className="divide-y divide-white/5">
            {CULIAT_NEWS.map((n) => {
              const { icon: TopicIcon, classes } = NEWS_TOPIC_STYLE[n.topic];
              return (
                <li key={n.url} className="px-5 py-3.5">
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${classes}`}>
                      <TopicIcon size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/85 group-hover:text-white">{n.title}</p>
                      <p className="mt-0.5 text-xs text-white/50">{n.blurb}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/35">
                        {n.source} &middot; {n.date}
                      </p>
                    </div>
                    <ExternalLink size={14} className="mt-0.5 shrink-0 text-white/25 group-hover:text-white/60" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}