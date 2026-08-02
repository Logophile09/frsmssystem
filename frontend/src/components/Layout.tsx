import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Truck,
  Wrench,
  CalendarCheck,
  MapPin,
  ShieldAlert,
  Building2,
  ClipboardCheck,
  FileCheck,
  Ban,
  BarChart3,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, isBackendUnreachable } from '../lib/api';
import LiveClock from './LiveClock';

const NAV_GROUPS: {
  label: string;
  items: { to: string; label: string; icon: LucideIcon; adminOnly?: boolean }[];
}[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/incidents', label: 'Incidents & Dispatch', icon: AlertTriangle },
      { to: '/personnel', label: 'Personnel', icon: Users },
      { to: '/vehicles', label: 'Vehicles', icon: Truck },
      { to: '/equipment', label: 'Equipment', icon: Wrench },
      { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    ],
  },
  {
    label: 'IoT & AI',
    items: [
      { to: '/gps-tracker', label: 'GPS Tracker', icon: MapPin },
      { to: '/false-alarms', label: 'False Alarm Review', icon: ShieldAlert },
    ],
  },
  {
    label: 'Fire Safety Compliance',
    items: [
      { to: '/establishments', label: 'Establishments', icon: Building2 },
      { to: '/inspections', label: 'Inspections', icon: ClipboardCheck },
      { to: '/certificates', label: 'Certificates', icon: FileCheck },
      { to: '/violations', label: 'Violations', icon: Ban },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/staff-accounts', label: 'Staff Accounts', icon: UserCog, adminOnly: true },
    ],
  },
];

export default function Layout() {
  const { profile, signOut, demoMode } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const [activeIncidents, setActiveIncidents] = useState<number | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const summary = await api.get('/dashboard/summary');
        if (!cancelled) {
          setActiveIncidents(summary.activeIncidents ?? 0);
          setOnline(!isBackendUnreachable());
        }
      } catch {
        if (!cancelled) setOnline(false);
      }
    }
    poll();
    const id = setInterval(poll, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-ink-900">
      <aside className="hidden w-64 shrink-0 flex-col bg-ink-900 text-slate-200 md:flex">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white">
            <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">FRSMS</p>
            <p className="text-xs text-slate-400 leading-tight">Fire &amp; Rescue Mgmt.</p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items
                  .filter((item) => !item.adminOnly || profile?.role === 'admin')
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                              : 'text-slate-300 hover:translate-x-0.5 hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        <Icon size={16} className="shrink-0" />
                        {item.label}
                      </NavLink>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3 dark:border-white/10 dark:bg-ink-800">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className={`h-2 w-2 rounded-full ${online ? 'animate-pulse bg-emerald-500' : 'bg-rose-500'}`} />
              System {online ? 'Online' : 'Offline'}
            </span>
            <span className="hidden h-4 w-px bg-slate-200 dark:bg-white/10 sm:block" />
            <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">
              Active Incidents: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeIncidents ?? '—'}</span>
            </span>
            {(demoMode || !online) && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                Demo Data
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <button
              onClick={toggle}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-ink-900 dark:text-slate-100">{profile?.full_name ?? '—'}</p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{profile?.role ?? ''}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div key={location.pathname} className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
