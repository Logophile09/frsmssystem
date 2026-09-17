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
  FileText,
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
import { useOnlinePresence } from '../hooks/useOnlinePresence';
import { useRevealOnScroll } from '../hooks/use-reveal';
import { api, isBackendUnreachable } from '../lib/api';
import AmbientGlow from './AmbientGlow';
import LiveClock from './LiveClock';
import Modal from './Modal';
import Avatar from './Avatar';

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
      { to: '/post-incident-reports', label: 'Post-Incident Reports', icon: FileText },
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

export default function Layout() {
  const { profile, signOut, demoMode } = useAuth();
  const { dark, toggle } = useTheme();
  const { onlineUsers, onlineCount } = useOnlinePresence();
  const location = useLocation();
  const [activeIncidents, setActiveIncidents] = useState<number | null>(null);
  const [online, setOnline] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useRevealOnScroll();

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
      {/* Ambient red glow behind the nav modules (Dashboard -> Staff Accounts).
          -z-10 within the relative aside paints above the aside's own solid
          background but below the nav rows/header/footer, so it reads as a
          soft red haze behind the module list rather than covering it. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-16 top-16 h-56 w-56 rounded-full bg-destructive/25 blur-3xl animate-glow-drift-a animate-glow-pulse dark:bg-destructive/20" />
        <div className="absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-destructive/20 blur-3xl animate-glow-drift-b dark:bg-destructive/20" />
        <div className="absolute -left-10 bottom-24 h-48 w-48 rounded-full bg-destructive/15 blur-3xl animate-glow-drift-a dark:bg-destructive/15" />
      </div>
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/70 bg-card shadow-sm ring-4 ring-primary/10">
          <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card transition-colors duration-300 ${
              online ? 'bg-leaf-500' : 'bg-rose-500'
            }`}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold leading-tight tracking-tight text-foreground">FRSMS</p>
          <p className="truncate text-[11px] leading-tight text-muted-foreground">Fire &amp; Rescue Mgmt.</p>
        </div>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-accent md:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10.5px] font-extrabold uppercase tracking-widest text-primary/70">
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
                            ? 'bg-gradient-to-br from-leaf-500 to-leaf-700 font-bold text-white shadow-md shadow-primary/30'
                            : 'text-muted-foreground hover:translate-x-0.5 hover:bg-accent hover:text-primary'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                              isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-accent'
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
      <div className="flex items-center gap-3 border-t border-border px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-muted/60 px-3 py-2.5">
          <Avatar
            name={profile?.full_name ?? 'Demo Administrator'}
            avatarUrl={profile?.avatar_url}
            className="h-8 w-8 text-[11px]"
          />
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-bold text-foreground">{profile?.full_name ?? 'System Administrator'}</p>
            <button
              onClick={() => setConfirmingLogout(true)}
              className="text-muted-foreground transition-colors duration-300 hover:text-primary"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative flex min-h-screen bg-background transition-colors duration-300 dark:bg-navy-950">
      {/* System-wide ambient background glow covering entire viewport behind all surfaces */}
      <AmbientGlow position="fixed" variant="system" showEmbers interactive />

      {/* Desktop sidebar — frosted glass backdrop with subtle border */}
      <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-card/80 text-foreground backdrop-blur-md md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — slide-in drawer below md */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[1500] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-[1501] flex h-full w-72 max-w-[85vw] flex-col overflow-hidden border-r border-border bg-card/95 text-foreground shadow-2xl backdrop-blur-md">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="app-canvas-texture flex min-h-screen flex-1 flex-col">
        <div className="px-4 pt-4 sm:px-6 sm:pt-6">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur-md transition-all duration-300 dark:shadow-none sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="rounded-lg border border-border p-2 text-foreground hover:bg-accent md:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <span className="stat-chip">
                <span className={`stat-chip-dot transition-colors duration-300 ${online ? 'animate-pulse bg-leaf-500' : 'bg-rose-500'}`} />
                {online ? 'System Online' : 'System Offline'}
              </span>
              <span className="hidden stat-chip sm:flex">
                Active Incidents <span className="font-extrabold text-foreground">{activeIncidents ?? '—'}</span>
              </span>
              {!demoMode && (
                <span
                  className="hidden stat-chip sm:flex"
                  title={onlineUsers.length ? onlineUsers.map((u) => u.full_name).join(', ') : 'No other staff online right now'}
                >
                  <span className="stat-chip-dot animate-pulse bg-leaf-500" />
                  Staff Online <span className="font-extrabold text-foreground">{onlineCount}</span>
                </span>
              )}
              {(demoMode || !online) && (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Demo Data
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <LiveClock />
              <span className="hidden h-6 w-px bg-border sm:block" />
              <button
                onClick={(e) => toggle(e)}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="btn-icon !h-9 !w-9"
                aria-label="Toggle theme"
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-tight text-foreground">{profile?.full_name ?? 'Demo Administrator'}</p>
                <p className="text-xs capitalize leading-tight text-muted-foreground">{profile?.role ?? 'Admin'}</p>
              </div>
              <Avatar
                name={profile?.full_name ?? 'Demo Administrator'}
                avatarUrl={profile?.avatar_url}
                className="h-9 w-9 text-xs"
              />
              <button onClick={() => setConfirmingLogout(true)} className="btn-outline !px-3 !py-1.5">
                Sign out
              </button>
            </div>
          </header>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div key={location.pathname} className="relative animate-page-in">
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
