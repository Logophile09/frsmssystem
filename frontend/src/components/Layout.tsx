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
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, isBackendUnreachable } from '../lib/api';
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-leaf-200 bg-white shadow-sm">
          <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight text-ink-900 dark:text-white">FRSMS</p>
          <p className="text-xs leading-tight text-ink-700 dark:text-slate-400">Fire &amp; Rescue Mgmt.</p>
        </div>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-ink-700 hover:bg-leaf-50 dark:text-slate-300 dark:hover:bg-white/5 md:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-leaf-600/70 dark:text-leaf-200/50">
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
                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-300 ease-out ${
                          isActive
                            ? 'bg-gradient-to-br from-leaf-500 to-leaf-700 text-white font-semibold shadow-md shadow-leaf-600/30'
                            : 'text-ink-900/80 hover:translate-x-0.5 hover:bg-leaf-50 hover:text-ink-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-leaf-200'
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
      <div className="border-t border-leaf-100 px-5 py-4 text-xs dark:border-leaf-400/15">
        <p className="font-bold text-ink-900 dark:text-white">{profile?.full_name ?? 'System Administrator'}</p>
        <button
          onClick={() => setConfirmingLogout(true)}
          className="text-ink-700 transition-colors duration-300 hover:text-leaf-700 dark:text-slate-400 dark:hover:text-leaf-300"
        >
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-leaf-50 dark:bg-navy-900">
      {/* Desktop sidebar — always visible at md+ */}
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

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-leaf-100 bg-white px-4 py-3 dark:border-leaf-400/10 dark:bg-navy-800 sm:px-6">
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg border border-leaf-100 p-2 text-ink-900 hover:bg-leaf-50 dark:border-leaf-400/15 dark:text-slate-300 dark:hover:bg-white/5 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="flex items-center gap-1.5 font-bold text-leaf-700 dark:text-slate-300">
              <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${online ? 'animate-pulse bg-leaf-500' : 'bg-rose-500'}`} />
              System {online ? 'Online' : 'Offline'}
            </span>
            <span className="hidden h-4 w-px bg-leaf-100 dark:bg-white/10 sm:block" />
            <span className="hidden text-ink-700 dark:text-slate-400 sm:inline">
              Active Incidents: <span className="font-bold text-ink-900 dark:text-slate-200">{activeIncidents ?? '—'}</span>
            </span>
            {(demoMode || !online) && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-amber-800 dark:bg-leaf-500/20 dark:text-leaf-300">
                Demo Data
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <button
              onClick={toggle}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg border border-leaf-100 px-3 py-1.5 text-sm text-ink-900 transition-colors duration-300 hover:bg-leaf-50 dark:border-leaf-400/15 dark:text-slate-300 dark:hover:bg-white/5"
            >
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-ink-900 dark:text-slate-100">{profile?.full_name ?? '—'}</p>
              <p className="text-xs capitalize text-ink-700 dark:text-slate-400">{profile?.role ?? ''}</p>
            </div>
            <button
              onClick={() => setConfirmingLogout(true)}
              className="rounded-lg border border-leaf-100 px-3 py-1.5 text-sm font-bold text-ink-900 transition-colors duration-300 hover:bg-leaf-50 dark:border-leaf-400/15 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 dark:bg-navy-900 sm:p-6">
          <div key={location.pathname} className="animate-page-in">
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
            <button
              onClick={() => setConfirmingLogout(false)}
              className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={confirmSignOut}
              disabled={loggingOut}
              className="rounded-lg bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {loggingOut ? 'Signing out…' : 'Yes, log out'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
