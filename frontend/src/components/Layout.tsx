import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LiveClock from './LiveClock';

const NAV_GROUPS: { label: string; items: { to: string; label: string; adminOnly?: boolean }[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard' }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/incidents', label: 'Incidents & Dispatch' },
      { to: '/personnel', label: 'Personnel' },
      { to: '/vehicles', label: 'Vehicles' },
      { to: '/equipment', label: 'Equipment' },
      { to: '/attendance', label: 'Attendance' },
    ],
  },
  {
    label: 'IoT & AI',
    items: [
      { to: '/gps-tracker', label: 'GPS Tracker' },
      { to: '/false-alarms', label: 'False Alarm Review' },
    ],
  },
  {
    label: 'Fire Safety Compliance',
    items: [
      { to: '/establishments', label: 'Establishments' },
      { to: '/inspections', label: 'Inspections' },
      { to: '/certificates', label: 'Certificates' },
      { to: '/violations', label: 'Violations' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/reports', label: 'Reports' },
      { to: '/staff-accounts', label: 'Staff Accounts', adminOnly: true },
    ],
  },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-ink-900">
      <aside className="hidden w-64 shrink-0 flex-col bg-ink-900 text-slate-200 md:flex">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
          <span className="text-xl">🚒</span>
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
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm transition ${
                          isActive ? 'bg-ember-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-white/10 dark:bg-ink-800">
          <div className="text-sm text-slate-500 dark:text-slate-400">Fire And Rescue Service Management System</div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <button
              onClick={toggle}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-ink-900 dark:text-slate-100">{profile?.full_name ?? '—'}</p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{profile?.role ?? ''}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
