import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Ban,
  BarChart3,
  UserCog,
  CheckCircle2,
  ArrowRight,
  UserRound,
  UserPlus,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#ai', label: 'AI Technology' },
  { href: '#modules', label: 'Modules' },
  { href: '#about', label: 'About' },
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
  const [leaving, setLeaving] = useState(false);

  function goToLogin(e: MouseEvent) {
    e.preventDefault();
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => navigate('/login'), 380);
  }

  return (
    <div className="min-h-screen bg-white">
      <div
        className={`transition-all duration-500 ease-smooth ${
          leaving ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-navy-700/40 bg-navy-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-leaf-400 bg-white shadow-[0_0_14px_rgba(224,160,23,0.35)]">
              <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-bold uppercase tracking-widest text-leaf-400">Republic of the Philippines</p>
              <p className="font-display text-base font-bold text-white">Barangay Culiat</p>
              <p className="text-[11px] text-navy-200">Quezon City &middot; Emergency Response System</p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-navy-100 transition-colors duration-300 hover:text-leaf-300"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              onClick={goToLogin}
              className="hidden items-center gap-2 rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:border-leaf-400/50 hover:bg-white/10 sm:flex"
            >
              <UserRound size={15} /> Sign In
            </Link>
            <Link
              to="/login"
              onClick={goToLogin}
              className="flex items-center gap-2 rounded-lg bg-flagred-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-flagred-500/20 transition-colors duration-300 hover:bg-flagred-600"
            >
              <UserPlus size={15} /> Register
            </Link>
          </div>
        </div>

        {/* Hotline bar */}
        <div className="bg-flagred-500">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white">
            <Radio size={15} className="shrink-0" />
            24/7 Emergency Hotline: <span className="font-extrabold">911</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/station-photo.png')", backgroundPosition: 'center 30%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, rgba(10,18,30,0.97) 20%, rgba(10,18,30,0.85) 55%, rgba(10,18,30,0.6) 100%)',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-leaf-400/50 bg-leaf-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-leaf-300">
                Bagong Pilipinas
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/5 px-3 py-1 text-xs font-semibold text-white/90">
                <BrainCircuit size={13} /> AI-Enhanced Emergency Response
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              When seconds matter, <span className="text-leaf-300">we respond faster.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
              The official emergency response system of Barangay Culiat, Quezon City — connecting citizens
              with responders through an AI-powered platform under the Bagong Pilipinas governance agenda.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="tel:911"
                className="flex items-center gap-2 rounded-lg bg-flagred-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-flagred-500/25 transition-colors duration-300 hover:bg-flagred-600"
              >
                <Flame size={16} /> Report an Emergency
              </a>
              <Link
                to="/login"
              onClick={goToLogin}
                className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur transition-colors duration-300 hover:border-leaf-400/50 hover:bg-white/10"
              >
                <ShieldCheck size={16} /> Admin / Responder Login
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {['PWD-Accessible', 'Works Offline (PWA)', 'Real-Time GPS', 'Role-Based Security'].map((t) => (
                <span key={t} className="flex items-center gap-2 text-sm text-navy-100">
                  <CheckCircle2 size={15} className="text-leaf-400" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-4 border-leaf-400/80 bg-white shadow-[0_0_50px_rgba(224,160,23,0.25)] sm:h-64 sm:w-64">
              <img src="/barangay-culiat-seal.png" alt="Official seal of Barangay Culiat" className="h-full w-full object-cover" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-leaf-300">Official Seal</p>
            <p className="text-sm text-navy-200">Barangay Culiat &middot; Quezon City</p>
          </div>
        </div>

        {/* Flag-colored divider */}
        <div className="flex h-1.5 w-full">
          <div className="flex-1 bg-navy-500" />
          <div className="flex-1 bg-flagred-500" />
          <div className="flex-1 bg-leaf-400" />
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <s.icon size={26} className="shrink-0 text-flagred-500" />
              <div>
                <p className="font-display text-xl font-bold text-navy-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-flagred-500">Features</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-navy-900 sm:text-4xl">
            Everything a modern fire &amp; rescue station needs
          </h2>
          <p className="mt-3 text-slate-600">
            Built for the realities of barangay-level emergency response — fast, accountable, and easy to use
            under pressure.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-leaf-500/10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900">
                <f.icon size={20} className="text-leaf-400" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-navy-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-navy-950">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-leaf-300">How It Works</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              From the first call to close-out
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="font-display text-3xl font-bold text-leaf-400/70">{s.n}</p>
                <h3 className="mt-3 font-display text-base font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-200">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Technology */}
      <section id="ai" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-flagred-500">AI Technology</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-navy-900 sm:text-4xl">
              Smarter triage, fewer wasted trips
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
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
                <li key={t} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-leaf-500" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-navy-100 bg-navy-900 p-8 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-400/15">
                <BrainCircuit size={22} className="text-leaf-300" />
              </div>
              <p className="font-display text-lg font-bold text-white">False-Alarm Scoring Engine</p>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { label: 'Report credibility', pct: 92 },
                { label: 'Location plausibility', pct: 88 },
                { label: 'Caller history match', pct: 96 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-navy-200">
                    <span>{row.label}</span>
                    <span className="font-bold text-leaf-300">{row.pct}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-leaf-400 to-leaf-500" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-flagred-500">Modules</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-navy-900 sm:text-4xl">
              One system, every workflow
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {MODULES.map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <m.icon size={18} className="shrink-0 text-flagred-500" />
                <span className="text-sm font-semibold text-navy-900">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="relative overflow-hidden bg-navy-900">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-leaf-300">About</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Serving Barangay Culiat, District 6, Quezon City
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-navy-100">
            This platform was built for Barangay Culiat's fire and rescue station to bring live dispatch,
            unit tracking, fire-safety compliance, and reporting together under one roof — in service of the
            Bagong Pilipinas governance agenda.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              onClick={goToLogin}
              className="flex items-center gap-2 rounded-lg bg-leaf-400 px-6 py-3 text-sm font-bold text-navy-950 shadow-lg shadow-leaf-500/20 transition-colors duration-300 hover:bg-leaf-300"
            >
              Admin / Responder Login <ArrowRight size={16} />
            </Link>
            <a
              href="tel:911"
              className="flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors duration-300 hover:bg-white/10"
            >
              Call 911
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-leaf-400/50 bg-white">
              <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
            </div>
            <p className="text-xs text-navy-300">
              &copy; {new Date().getFullYear()} Barangay Culiat, Quezon City &mdash; Fire &amp; Rescue Service
              Management System
            </p>
          </div>
          <p className="text-xs text-navy-400">Bagong Pilipinas &middot; AI-Enhanced Emergency Response</p>
        </div>
      </footer>
      </div>

      {leaving && (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-navy-900 animate-page-in">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-leaf-400 bg-white shadow-[0_0_30px_rgba(206,17,38,0.4)]">
            <img src="/barangay-culiat-seal.png" alt="" className="h-full w-full object-cover" />
          </div>
          <p className="font-display text-lg font-semibold text-white">Taking you to sign in&hellip;</p>
        </div>
      )}
    </div>
  );
}
