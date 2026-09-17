import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthBackgroundFX } from '../components/AuthBackgroundFX';
import {
  Flame,
  Radio,
  MapPin,
  ShieldCheck,
  BrainCircuit,
  Building2,
  Users,
  Truck,
  Wrench,
  CalendarCheck,
  ShieldAlert,
  GitBranch,
  ClipboardCheck,
  FileCheck,
  FileText,
  Ban,
  BarChart3,
  UserCog,
  CheckCircle2,
  ArrowRight,
  UserRound,
  UserPlus,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  LayoutGrid,
  Workflow,
  Blocks,
  Info,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#features', label: 'Features', icon: LayoutGrid },
  { href: '#how-it-works', label: 'How It Works', icon: Workflow },
  { href: '#ai', label: 'AI Technology', icon: BrainCircuit },
  { href: '#modules', label: 'Modules', icon: Blocks },
  { href: '#about', label: 'About', icon: Info },
];

const STATS = [
  { icon: Flame, value: '1,200+', label: 'Incidents Managed' },
  { icon: Radio, value: '4.2 min', label: 'Avg Response Time' },
  { icon: Users, value: '67,804', label: 'Residents (2020 Census)' },
  { icon: BrainCircuit, value: '96%', label: 'AI Accuracy' },
];

const FEATURES = [
  {
    icon: Radio,
    title: 'Live Dispatch',
    desc: 'Real-time incident intake and unit dispatch so responders roll out the moment a call comes in.',
  },
  {
    icon: MapPin,
    title: 'Real-Time GPS Tracking',
    desc: 'Track fire trucks and rescue units live on the map for faster, more coordinated response.',
  },
  {
    icon: BrainCircuit,
    title: 'AI False-Alarm Scoring',
    desc: 'Machine-assisted triage flags likely false alarms so crews focus on genuine emergencies.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Security',
    desc: 'Admins, dispatchers, and field personnel each get access scoped to what they need.',
  },
  {
    icon: Building2,
    title: 'Fire Safety Compliance',
    desc: 'Establishment inspections, certificates, and violations tracked end-to-end.',
  },
  {
    icon: CheckCircle2,
    title: 'Works Offline (PWA)',
    desc: 'Core functions stay usable even with unreliable connectivity in the field.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Report the Emergency',
    desc: 'A resident or sensor triggers a report — by call, app, or IoT device — with location captured automatically.',
  },
  {
    n: '02',
    title: 'AI Triage & Dispatch',
    desc: 'The system scores the report, routes it to the nearest available unit, and alerts responders instantly.',
  },
  {
    n: '03',
    title: 'Track in Real Time',
    desc: 'Dispatchers and command staff watch units move live on the GPS tracker until arrival.',
  },
  {
    n: '04',
    title: 'Close Out & Report',
    desc: 'Incidents are logged, reviewed, and rolled into compliance and performance reports.',
  },
];

const MODULES = [
  { icon: Flame, label: 'Incidents & Dispatch' },
  { icon: FileText, label: 'Post-Incident Reports' },
  { icon: Users, label: 'Personnel' },
  { icon: Truck, label: 'Vehicles' },
  { icon: Wrench, label: 'Equipment' },
  { icon: CalendarCheck, label: 'Attendance' },
  { icon: MapPin, label: 'GPS Tracker' },
  { icon: ShieldAlert, label: 'False Alarm Review' },
  { icon: GitBranch, label: 'Dispatch Recommendation' },
  { icon: Building2, label: 'Establishments' },
  { icon: ClipboardCheck, label: 'Inspections' },
  { icon: FileCheck, label: 'Certificates' },
  { icon: Ban, label: 'Violations' },
  { icon: BarChart3, label: 'Reports' },
  { icon: UserCog, label: 'Staff Accounts' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { session, demoMode } = useAuth();
  const { dark, toggle } = useTheme();
  const [leaving, setLeaving] = useState(false);
  const [activeSection, setActiveSection] = useState(NAV_LINKS[0].href.slice(1));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Supabase OAuth (Google/Facebook) redirects back to the site's root URL
  // after login, not to /login. If a session is already present when this
  // page loads -- e.g. right after that OAuth round-trip -- skip the
  // marketing page and go straight to the dashboard instead of stranding
  // the user here.
  
  useEffect(() => {
    if (session || demoMode) navigate('/dashboard', { replace: true });
  }, [session, demoMode, navigate]);

  // Highlight the nav item for whichever section is currently scrolled
  // into view, so the pill nav tracks the page the way a multi-page
  // "current page" indicator would.
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.slice(1));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function goToLogin(e: MouseEvent) {
    e.preventDefault();
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => navigate('/login'), 380);
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`transition-all duration-500 ease-smooth ${
          leaving ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-white shadow-[0_0_14px_rgba(224,160,23,0.35)]">
              <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Republic of the Philippines</p>
              <p className="font-display text-base font-bold text-foreground">Barangay Culiat</p>
              <p className="text-[11px] text-muted-foreground">Quezon City &middot; Emergency Response System</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1.5 lg:flex">
            {NAV_LINKS.map((l) => {
              const Icon = l.icon;
              const isActive = activeSection === l.href.slice(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {l.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={(e) => toggle(e)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
              className="btn-icon !h-10 !w-10"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              to="/login"
              onClick={goToLogin}
              className="hidden items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-accent sm:flex"
            >
              <UserRound size={15} /> Sign In
            </Link>
            <Link
              to="/register"
              className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl sm:flex"
            >
              <UserPlus size={15} /> Register
            </Link>
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="btn-icon !h-10 !w-10 lg:hidden"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down navigation drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-border bg-background/98 px-6 py-4 backdrop-blur-xl lg:hidden animate-page-in">
            <nav className="flex flex-col gap-1.5">
              {NAV_LINKS.map((l) => {
                const Icon = l.icon;
                const isActive = activeSection === l.href.slice(1);
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon size={16} /> {l.label}
                  </a>
                );
              })}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:hidden">
              <Link
                to="/login"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  goToLogin(e);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-accent"
              >
                <UserRound size={15} /> Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              >
                <UserPlus size={15} /> Register
              </Link>
            </div>
          </div>
        )}

        {/* Hotline bar */}
        <div className="bg-primary transition-colors duration-300">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-primary-foreground">
            <Radio size={15} className="shrink-0 animate-pulse" />
            24/7 Emergency Hotline: <a href="tel:911" className="font-extrabold underline underline-offset-2 hover:opacity-90">911</a>
          </div>
        </div>
      </header>

      {/* Hero — Seamlessly rendered in Light Mode and Dark Mode */}
      <section className="relative overflow-hidden bg-slate-50/70 transition-colors duration-500 dark:bg-navy-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 transition-opacity duration-500 dark:opacity-30"
          style={{ backgroundImage: "url('/station-photo.png')", backgroundPosition: 'center 30%' }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: dark
              ? 'linear-gradient(115deg, rgba(8,15,28,0.97) 20%, rgba(10,18,30,0.88) 55%, rgba(10,18,30,0.65) 100%)'
              : 'linear-gradient(115deg, rgba(255,255,255,0.95) 20%, rgba(248,250,252,0.75) 55%, rgba(240,253,244,0.45) 100%)',
          }}
        />
        {/* Ambient atmospheric drifting glow + particle embers */}
        <AuthBackgroundFX variant={dark ? 'dark' : 'light'} />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-700 transition-colors dark:border-leaf-400/50 dark:bg-leaf-400/10 dark:text-leaf-300">
                Bagong Pilipinas
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white/80 px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition-colors dark:border-white/25 dark:bg-white/5 dark:text-white/90">
                <BrainCircuit size={13} className="text-emerald-600 dark:text-leaf-300" /> AI-Enhanced Emergency Response
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight text-slate-950 transition-colors sm:text-5xl lg:text-6xl dark:text-white">
              When seconds matter, <span className="text-emerald-600 drop-shadow-sm dark:text-leaf-300">we respond faster.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 transition-colors sm:text-lg dark:text-navy-100">
              The official emergency response system of Barangay Culiat, Quezon City — connecting citizens
              with responders through an AI-powered platform under the Bagong Pilipinas governance agenda.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="tel:911"
                className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-xl hover:shadow-emerald-600/40"
              >
                <Phone size={16} className="transition-transform duration-300 group-hover:scale-110" /> Report an Emergency
              </a>
              <Link
                to="/login"
                onClick={goToLogin}
                className="flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white/90 px-5 py-3 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-leaf-400/50 dark:hover:bg-white/10"
              >
                <ShieldCheck size={16} /> Admin / Responder Login
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
              {['PWD-Accessible', 'Works Offline (PWA)', 'Real-Time GPS', 'Role-Based Security'].map((t) => (
                <span key={t} className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors dark:text-navy-100">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-leaf-400 shrink-0" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-500/80 bg-white shadow-[0_12px_45px_rgba(16,185,129,0.22)] transition-all duration-500 hover:scale-105 sm:h-64 sm:w-64 dark:border-leaf-400/80 dark:shadow-[0_0_55px_rgba(22,163,74,0.35)]">
              <img src="/barangay-culiat-seal.png" alt="Official seal of Barangay Culiat" className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-emerald-700 transition-colors dark:text-leaf-300">
              Official Seal
            </p>
            <p className="text-sm font-medium text-slate-600 transition-colors dark:text-navy-200">
              Barangay Culiat &middot; Quezon City
            </p>
          </div>
        </div>

        {/* Philippine Flag Divider (Royal Blue, Sun Red, Sun Yellow) */}
        <div className="flex h-1.5 w-full">
          <div className="flex-1 bg-[#0038a8]" title="Peace, truth and justice" />
          <div className="flex-1 bg-[#ce1126]" title="Patriotism and valor" />
          <div className="flex-1 bg-[#fcd116]" title="Sovereignty and freedom" />
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-slate-100/50 transition-colors duration-300 dark:bg-card/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-8 sm:grid-cols-4 sm:gap-6">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                <s.icon size={24} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-black tracking-tight text-foreground sm:text-2xl">{s.value}</p>
                <p className="truncate text-xs font-semibold text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Features</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Everything a modern fire &amp; rescue station needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for the realities of barangay-level emergency response — fast, accountable, and easy to use
            under pressure.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <f.icon size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-slate-100/40 transition-colors duration-300 dark:bg-card/25">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">How It Works</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              From the first call to close-out
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <p className="font-display text-3xl font-extrabold text-primary transition-transform duration-300 group-hover:scale-105">
                  {s.n}
                </p>
                <h3 className="mt-3 font-display text-base font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Technology */}
      <section id="ai" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">AI Technology</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Smarter triage, fewer wasted trips
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              An AI scoring model reviews incoming reports for signs of a false alarm — repeat callers, sensor
              patterns, and report details — so responders can prioritize genuine emergencies without slowing
              down the ones that matter.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                '96% scoring accuracy on historical incident data',
                'Flags likely false alarms for dispatcher review',
                'Learns from confirmed outcomes over time',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-foreground/90 font-medium">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>
          {/* Scoring Engine Console Preview — Beautiful across both Light and Dark themes */}
          <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-2xl backdrop-blur-xl transition-colors duration-300 dark:border-navy-800 dark:bg-navy-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-foreground">False-Alarm Scoring Engine</p>
                  <p className="text-xs text-muted-foreground">Active Triage Neural Model v2.4</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Live Analysis
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: 'Report credibility', pct: 92 },
                { label: 'Location plausibility', pct: 88 },
                { label: 'Caller history match', pct: 96 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>{row.label}</span>
                    <span className="font-bold text-primary">{row.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-leaf-400 dark:to-leaf-500 transition-all duration-500"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-y border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Modules</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              One system, every workflow
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {MODULES.map((m) => (
              <div
                key={m.label}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <m.icon size={18} />
                </div>
                <span className="text-sm font-semibold text-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="relative overflow-hidden bg-brand-surface">
        <AuthBackgroundFX variant={dark ? 'dark' : 'light'} />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-surface-muted">About</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-brand-surface-foreground sm:text-4xl">
            Serving Barangay Culiat, District 6, Quezon City
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-surface-foreground/80">
            This platform was built for Barangay Culiat's fire and rescue station to bring live dispatch,
            unit tracking, fire-safety compliance, and reporting together under one roof — in service of the
            Bagong Pilipinas governance agenda.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              onClick={goToLogin}
              className="flex items-center gap-2 rounded-lg bg-background px-6 py-3 text-sm font-bold text-foreground shadow-lg transition-colors duration-300 hover:bg-background/90"
            >
              Admin / Responder Login <ArrowRight size={16} />
            </Link>
            <a
              href="tel:911"
              className="flex items-center gap-2 rounded-lg border border-brand-surface-foreground/25 px-6 py-3 text-sm font-bold text-brand-surface-foreground transition-colors duration-300 hover:bg-brand-surface-foreground/10"
            >
              Call 911
            </a>
          </div>

          {/* Barangay Office contact card */}
          <div className="mx-auto mt-14 max-w-md rounded-2xl border border-brand-surface-foreground/15 bg-brand-surface-foreground/5 p-6 text-left">
            <p className="font-display text-lg font-bold uppercase tracking-wide text-brand-surface-foreground">Barangay Office</p>

            <div className="mt-4 space-y-2.5">
              <a
                href="tel:09625821531"
                className="flex items-center gap-3 rounded-xl bg-brand-surface-foreground/90 px-4 py-3 text-sm font-bold text-brand-surface transition-colors duration-300 hover:bg-brand-surface-foreground"
              >
                <Phone size={16} className="shrink-0 text-primary" /> 0962-582-1531
              </a>
              <a
                href="mailto:brgy.culiat@yahoo.com"
                className="flex items-center gap-3 rounded-xl border border-brand-surface-foreground/15 bg-brand-surface-foreground/5 px-4 py-3 text-sm font-semibold text-brand-surface-foreground transition-colors duration-300 hover:bg-brand-surface-foreground/10"
              >
                <Mail size={16} className="shrink-0 text-brand-surface-muted" /> brgy.culiat@yahoo.com
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-1 pt-1 text-sm font-semibold text-brand-surface-muted transition-colors duration-300 hover:text-brand-surface-foreground"
              >
                <MessageCircle size={16} className="shrink-0" /> Facebook page
              </a>
            </div>

            <div className="mt-4 space-y-2 border-t border-brand-surface-foreground/15 pt-4">
              <div className="flex items-start gap-2.5 text-sm text-brand-surface-foreground/85">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-surface-foreground/60" />
                <span>467 Tandang Sora Ave, Quezon City, 1128 Metro Manila</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-brand-surface-foreground/85">
                <Clock size={16} className="mt-0.5 shrink-0 text-brand-surface-foreground/60" />
                <span>Monday &ndash; Friday, 8:00 AM &ndash; 5:00 PM</span>
              </div>
            </div>

            <a
              href="tel:911"
              className="mt-4 flex items-center gap-2.5 border-t border-brand-surface-foreground/15 pt-4 text-sm font-bold text-brand-surface-muted transition-colors duration-300 hover:text-brand-surface-foreground"
            >
              <Phone size={16} className="shrink-0" /> Emergency 911
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-footer py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-primary/50 bg-white">
              <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
            </div>
            <p className="text-xs text-footer-muted">
              &copy; {new Date().getFullYear()} Barangay Culiat, Quezon City &mdash; Fire &amp; Rescue Service
              Management System
            </p>
          </div>
          <p className="text-xs text-footer-muted">Bagong Pilipinas &middot; AI-Enhanced Emergency Response</p>
        </div>
      </footer>
      </div>

      {leaving && (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-background animate-page-in">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-white shadow-[0_0_30px_rgba(22,163,74,0.35)]">
            <img src="/barangay-culiat-seal.png" alt="" className="h-full w-full object-cover" />
          </div>
          <p className="font-display text-lg font-semibold text-foreground">Taking you to sign in&hellip;</p>
        </div>
      )}
    </div>
  );
}
