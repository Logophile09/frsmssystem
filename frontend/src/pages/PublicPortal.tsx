import React from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Phone,
  Flame,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  BookOpen,
  Info,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { demoCommunityAnnouncements } from '../lib/demoData';

export default function PublicPortal() {
  return (
    <div className="space-y-6">
      {/* Public Hub Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-800 via-slate-900 to-navy-950 p-6 text-white shadow-xl sm:p-8 dark:border-white/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md">
              <Globe size={13} className="text-slate-300" />
              Public Information Hub
            </span>
            <span className="text-xs text-slate-300">
              Barangay Culiat · Quezon City
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
            Barangay Culiat Fire &amp; Rescue Portal
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Official public safety portal. Access station hotlines, directory of fire officers, fire safety guidelines, and community advisories.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
            >
              <UserPlus size={14} /> Register as Resident
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
            >
              <LogIn size={14} /> Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Grid: Station Directory, Hotlines, Advisories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Station Directory & Fire Guidelines */}
        <div className="space-y-6 lg:col-span-2">
          {/* Station Directory Card */}
          <div className="surface-card p-5 sm:p-6">
            <h2 className="mb-1 font-display text-base font-bold text-foreground flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              Barangay Culiat Fire Station Directory
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Official headquarters and operational dispatch center
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <span className="font-bold text-foreground text-sm block">Station 1 — Central Substation</span>
                <p className="text-muted-foreground leading-relaxed">
                  Tandang Sora Ave. cor. Luzon Ave, Barangay Culiat, District 6, Quezon City
                </p>
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <Clock size={13} /> 24/7 Active Fire &amp; Rescue Dispatch
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <span className="font-bold text-foreground text-sm block">Station Officers in Charge</span>
                <div className="space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">Capt. Eduardo Morales:</strong> Station Commander</p>
                  <p><strong className="text-foreground">Kgd. Pedro Lim:</strong> Committee on Public Safety</p>
                  <p><strong className="text-foreground">FO2 Ramon Santos:</strong> Duty Watch Commander</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fire Prevention Guidelines */}
          <div className="surface-card p-5 sm:p-6">
            <h2 className="mb-1 font-display text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              Public Fire Safety Guidelines
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Basic safety rules mandated under RA 9514 (Fire Code of the Philippines)
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-border p-3.5 space-y-1">
                <h4 className="font-bold text-foreground">1. Electrical Fire Prevention</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Avoid running electrical cords under rugs. Replace frayed cords immediately and do not plug multiple high-wattage appliances into a single outlet.
                </p>
              </div>

              <div className="rounded-xl border border-border p-3.5 space-y-1">
                <h4 className="font-bold text-foreground">2. LPG Gas Safety</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Always check for gas leaks using a soap-water test on hose connections. Turn off the regulator valve when leaving the home or during night hours.
                </p>
              </div>

              <div className="rounded-xl border border-border p-3.5 space-y-1">
                <h4 className="font-bold text-foreground">3. Clear Egress Passages</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Keep doorways, stairwells, and alley exits free from boxes, motorcycles, and merchandise to allow rapid evacuation during an alarm.
                </p>
              </div>

              <div className="rounded-xl border border-border p-3.5 space-y-1">
                <h4 className="font-bold text-foreground">4. Reporting Fires Promptly</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Never hesitate to call emergency dispatch at the first smell of burning. Small fires can engulf an entire room in under 3 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Hotlines & Announcements */}
        <div className="space-y-6">
          {/* Emergency Hotlines Card */}
          <div className="rounded-3xl border border-rose-500/20 bg-rose-50/70 p-5 dark:border-rose-900/30 dark:bg-rose-950/20">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Phone size={18} className="animate-pulse" />
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">
                24/7 Emergency Hotlines
              </h3>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2 dark:border-rose-800/40">
                <span className="text-foreground/80 font-medium">Culiat Substation:</span>
                <a href="tel:89280000" className="font-extrabold text-rose-700 dark:text-rose-300 hover:underline">
                  (02) 8-928-0000
                </a>
              </div>
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2 dark:border-rose-800/40">
                <span className="text-foreground/80 font-medium">BFP QC Central:</span>
                <a href="tel:911" className="font-extrabold text-rose-700 dark:text-rose-300 hover:underline">
                  911 / (02) 8-372-8888
                </a>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-foreground/80 font-medium">Culiat Barangay Hall:</span>
                <span className="font-bold text-foreground">(02) 8-929-1234</span>
              </div>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="surface-card p-5">
            <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Info size={15} className="text-primary" />
              Public Advisories
            </h3>
            <div className="space-y-3">
              {demoCommunityAnnouncements.map((ann) => (
                <div key={ann.id} className="rounded-xl border border-border p-3 text-xs">
                  <div className="flex items-center justify-between text-[10.5px] font-semibold text-muted-foreground">
                    <span>{ann.author}</span>
                    <span>{ann.date}</span>
                  </div>
                  <h4 className="mt-1 font-bold text-foreground">{ann.title}</h4>
                  <p className="mt-1 text-muted-foreground leading-relaxed text-[11.5px]">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Resident Registration Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <h3 className="font-display text-sm font-bold text-emerald-900 dark:text-emerald-300">
              Are you a resident of Barangay Culiat?
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Create an account to submit fire safety certificate applications, schedule inspections, and receive localized emergency SMS notifications.
            </p>
            <Link
              to="/register"
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              Sign Up as Citizen Resident <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
