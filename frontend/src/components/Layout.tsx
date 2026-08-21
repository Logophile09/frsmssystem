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
  GitBranch,
  Building2,
  ClipboardCheck,
  FileCheck,
  Ban,
  BarChart3,
  UserCog,
  Menu,
  X,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, isBackendUnreachable } from '../lib/api';
import AmbientGlow from './AmbientGlow';
import LiveClock from './LiveClock';
import Modal from './Modal';

const NAV_GROUPS: {
  label: string;
  items: { to: string; label: string; icon: LucideIcon; adminOnly?: boolean }[];
}[] = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
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
      { to: '/dispatch-recommendation', label: 'Dispatch Recommendation', icon: GitBranch },
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

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Layout() {
  const { profile, signOut, demoMode } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const [activeIncidents, setActiveIncidents] = useState<number | null>(null);
  const [online, setOnline] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close the mobile drawer whenever the route changes (e.g. after tapping a nav link)
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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

  async function confirmSignOut() {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
      setConfirmingLogout(false);
    }
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 border-b border-leaf-100 px-5 py-5 dark:border-leaf-400/15">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-leaf-500/70 bg-white shadow-sm ring-4 ring-leaf-500/10 dark:border-leaf-200 dark:ring-leaf-400/10">
          <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white transition-colors duration-300 dark:border-navy-950 ${
              online ? 'bg-leaf-500' : 'bg-rose-500'
            }`}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold leading-tight tracking-tight text-ink-900 dark:text-white">FRSMS</p>
          <p className="truncate text-[11px] leading-tight text-ink-700 dark:text-slate-400">Fire &amp; Rescue Mgmt.</p>
        </div>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-ink-700 hover:bg-leaf-50 dark:text-slate-300 dark:hover:bg-white/5 md:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10.5px] font-extrabold uppercase tracking-widest text-leaf-600/70 dark:text-leaf-200/45">
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
                      end={item.to === '/dashboard'}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-2.5 rounded-full py-2 pl-3 pr-3.5 text-sm transition-all duration-300 ease-out ${
                          isActive
                            ? 'bg-gradient-to-br from-leaf-500 to-leaf-700 font-bold text-white shadow-md shadow-leaf-600/30'
                            : 'text-ink-700 hover:translate-x-0.5 hover:bg-leaf-50 hover:text-leaf-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-leaf-200'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                              isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-leaf-100 dark:group-hover:bg-white/10'
                            }`}
                          >
                            <Icon size={15} className="shrink-0" />
                          </span>
                          <span className="truncate">{item.label}</span>
                          {isActive && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden="true" />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-3 border-t border-leaf-100 px-4 py-4 dark:border-leaf-400/15">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-leaf-50/70 px-3 py-2.5 dark:bg-white/[0.04]">
          <div className="avatar-chip h-8 w-8 shrink-0 bg-flagred-500 text-[11px]">
            {initials(profile?.full_name ?? 'Demo Administrator')}
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-bold text-ink-900 dark:text-white">{profile?.full_name ?? 'System Administrator'}</p>
            <button
              onClick={() => setConfirmingLogout(true)}
              className="text-ink-700 transition-colors duration-300 hover:text-leaf-600 dark:text-slate-400 dark:hover:text-leaf-300"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-leaf-50 dark:bg-navy-900">
      {/* Desktop sidebar — always visible at md+. White in light mode,
          navy in dark mode, matching the header/content shell. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-leaf-100 bg-white text-ink-900 dark:border-leaf-400/15 dark:bg-navy-950 dark:text-slate-200 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — slide-in drawer below md */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[1500] md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-[1501] flex h-full w-72 max-w-[85vw] flex-col border-r border-leaf-100 bg-white text-ink-900 shadow-2xl dark:border-leaf-400/15 dark:bg-navy-950 dark:text-slate-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="app-canvas-texture flex min-h-screen flex-1 flex-col">
        <div className="px-4 pt-4 sm:px-6 sm:pt-6">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-leaf-400/10 dark:bg-navy-800/90 dark:shadow-none sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="rounded-lg border border-leaf-100 p-2 text-ink-900 hover:bg-leaf-50 dark:border-leaf-400/15 dark:text-slate-300 dark:hover:bg-white/5 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <span className="stat-chip">
                <span className={`stat-chip-dot transition-colors duration-300 ${online ? 'animate-pulse bg-leaf-500' : 'bg-rose-500'}`} />
                {online ? 'System Online' : 'System Offline'}
              </span>
              <span className="hidden stat-chip sm:flex">
                Active Incidents <span className="font-extrabold text-navy-900 dark:text-slate-100">{activeIncidents ?? '—'}</span>
              </span>
              {(demoMode || !online) && (
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-800 dark:bg-leaf-500/20 dark:text-leaf-300">
                  Demo Data
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <LiveClock />
              <span className="hidden h-6 w-px bg-leaf-100 dark:bg-white/10 sm:block" />
              <button
                onClick={toggle}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="btn-icon !h-9 !w-9"
                aria-label="Toggle theme"
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-tight text-ink-900 dark:text-slate-100">{profile?.full_name ?? 'Demo Administrator'}</p>
                <p className="text-xs capitalize leading-tight text-ink-700 dark:text-slate-400">{profile?.role ?? 'Admin'}</p>
              </div>
              <div className="avatar-chip h-9 w-9 bg-flagred-500 text-xs ring-flagred-100 dark:ring-flagred-500/20">
                {initials(profile?.full_name ?? 'Demo Administrator')}
              </div>
              <button onClick={() => setConfirmingLogout(true)} className="btn-outline !px-3 !py-1.5">
                Sign out
              </button>
            </div>
          </header>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div key={location.pathname} className="relative animate-page-in">
            <AmbientGlow />
            <Outlet />
          </div>
        </main>
      </div>

      {confirmingLogout && (
        <Modal title="Sign out?" onClose={() => setConfirmingLogout(false)}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to log out? You'll need to sign in again to access the dashboard.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setConfirmingLogout(false)} className="btn-outline">
              Cancel
            </button>
            <button onClick={confirmSignOut} disabled={loggingOut} className="btn-danger">
              {loggingOut ? 'Signing out…' : 'Yes, log out'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
