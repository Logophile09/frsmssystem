import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  HardHat,
  Award,
  Home,
  Globe,
  ChevronDown,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

interface RoleOption {
  role: UserRole;
  title: string;
  shortLabel: string;
  icon: LucideIcon;
  desc: string;
  badgeClass: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'super_admin',
    title: 'Super Admin',
    shortLabel: 'Super Admin',
    icon: ShieldCheck,
    desc: 'Full system-wide access, all modules & user accounts',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  },
  {
    role: 'admin',
    title: 'Admin',
    shortLabel: 'Admin',
    icon: Building2,
    desc: 'Station Commander · approvals, reports & operations',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
  },
  {
    role: 'staff',
    title: 'Staff',
    shortLabel: 'Staff',
    icon: HardHat,
    desc: 'Duty Firefighter / Dispatcher · operational queues & logs',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  },
  {
    role: 'brgy_official',
    title: 'Brgy Official',
    shortLabel: 'Official',
    icon: Award,
    desc: 'Barangay Council · executive analytics & escalations',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  {
    role: 'citizen',
    title: 'Citizen',
    shortLabel: 'Citizen',
    icon: Home,
    desc: 'Verified Resident · request tracking, hazard reports',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    role: 'non_citizen',
    title: 'Non-Citizen',
    shortLabel: 'Guest',
    icon: Globe,
    desc: 'Public Visitor · directory, hotlines & safety guides',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700',
  },
];

export default function RoleSwitcher() {
  const { profile, switchDemoRole } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentRole = profile?.role ?? 'super_admin';
  const activeNormalizedRole =
    currentRole === 'super admin'
      ? 'super_admin'
      : currentRole === 'user'
      ? 'staff'
      : (currentRole as UserRole);

  const activeOption =
    ROLES.find((r) => r.role === activeNormalizedRole) ?? ROLES[0];
  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${activeOption.badgeClass}`}
        title="Switch demo role to preview access levels"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-4 w-4 items-center justify-center">
          <ActiveIcon size={13} className="shrink-0" />
        </span>
        <span className="hidden sm:inline font-semibold">Role:</span>
        <span className="font-extrabold">{activeOption.shortLabel}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[1600] mt-2 w-72 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl transition-all dark:border-white/10 dark:bg-navy-950/95">
          <div className="border-b border-border/70 px-3 py-2 text-[10.5px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Switch Role (Preview)
          </div>
          <div className="mt-1 space-y-1">
            {ROLES.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.role === activeNormalizedRole;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => {
                    switchDemoRole(opt.role);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 ${
                    isSelected
                      ? 'bg-primary/10 text-foreground font-semibold dark:bg-white/10'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${opt.badgeClass}`}
                  >
                    <Icon size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {opt.title}
                      </span>
                      {isSelected && (
                        <Check size={13} className="text-primary" />
                      )}
                    </div>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
