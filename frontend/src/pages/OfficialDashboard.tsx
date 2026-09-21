import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Building2,
  FileCheck,
  CheckCircle2,
  Send,
  Users,
  MapPin,
  TrendingUp,
  Clock,
  ChevronRight,
  Radio,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

interface EscalatedCase {
  id: number;
  case_number: string;
  title: string;
  purok: string;
  severity: string;
  status: string;
  reported_at: string;
  description: string;
  affected_families: number;
}

const INITIAL_ESCALATIONS: EscalatedCase[] = [
  {
    id: 1,
    case_number: 'ESC-2026-0042',
    title: 'Alert Level 3 Fire — Tandang Sora Commercial Strip',
    purok: 'Purok 4 · Commercial Zone',
    severity: '3',
    status: 'on_scene',
    reported_at: '45 mins ago',
    description: 'Structural commercial blaze spreading to adjacent rowhouses. 4 units deployed from Station 1. Evacuation of 25 families underway to Culiat Covered Court.',
    affected_families: 25,
  },
  {
    id: 2,
    case_number: 'ESC-2026-0039',
    title: 'LPG Storage Violation & Leak Alert',
    purok: 'Purok 2 · Dense Residential',
    severity: '2',
    status: 'reported',
    reported_at: '3 hours ago',
    description: 'Illegal bulk storage of 40+ refilled LPG cylinders in informal settlement area. BFP dispatched for hazard mitigation and temporary cordoning.',
    affected_families: 14,
  },
  {
    id: 3,
    case_number: 'ESC-2026-0035',
    title: 'Damaged Main Fire Hydrant & Water Pressure Drop',
    purok: 'Purok 3 near Luzon Ave',
    severity: '1',
    status: 'reported',
    reported_at: 'Yesterday',
    description: 'Vehicle collision damaged primary hydrant valve. Manila Water repair crew requested; station water tanker on standby for the zone.',
    affected_families: 0,
  },
];

const PUROK_STATS = [
  { purok: 'Purok 1', risk: 'Moderate', incidentsYtd: 28, compliance: '94%', hydrants: '6 active' },
  { purok: 'Purok 2', risk: 'High', incidentsYtd: 42, compliance: '81%', hydrants: '4 active' },
  { purok: 'Purok 3', risk: 'Low', incidentsYtd: 15, compliance: '97%', hydrants: '7 active' },
  { purok: 'Purok 4', risk: 'High', incidentsYtd: 49, compliance: '78%', hydrants: '5 active' },
  { purok: 'Purok 5', risk: 'Moderate', incidentsYtd: 22, compliance: '89%', hydrants: '5 active' },
  { purok: 'Purok 6', risk: 'Low', incidentsYtd: 12, compliance: '96%', hydrants: '4 active' },
];

export default function OfficialDashboard() {
  const { profile } = useAuth();
  const toast = useToast();
  const [escalations, setEscalations] = useState<EscalatedCase[]>(INITIAL_ESCALATIONS);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<'urgent' | 'warning' | 'info'>('urgent');

  // Clearances awaiting signature
  const [pendingClearances, setPendingClearances] = useState([
    { id: 101, ref: 'CL-2026-000347', name: 'Rosa Aquino - Bakery', purok: 'Purok 4', signed: false },
    { id: 102, ref: 'CL-2026-000348', name: 'Mario B. Tan - Hardware', purok: 'Purok 1', signed: false },
    { id: 103, ref: 'CL-2026-000349', name: 'Culiat Community Daycare', purok: 'Purok 3', signed: false },
  ]);

  function handleSignClearance(id: number, name: string) {
    setPendingClearances((prev) =>
      prev.map((c) => (c.id === id ? { ...c, signed: true } : c))
    );
    toast.success(`Barangay Fire Clearance for ${name} endorsed and signed.`);
  }

  function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    toast.success('Emergency public safety advisory broadcasted to Citizen Portal.');
    setBroadcastOpen(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
  }

  return (
    <div className="space-y-6">
      {/* Official Executive Header */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-950 p-6 text-white shadow-xl shadow-amber-950/20 sm:p-8">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md">
                <Award size={14} className="text-amber-200" />
                Barangay Executive &amp; Legislative Council
              </span>
              <span className="text-xs text-amber-200">
                Barangay Culiat · Public Safety Committee
              </span>
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {profile?.full_name ?? 'Kgd. Pedro Lim'}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-amber-100/90">
              Executive dashboard for community risk analytics, major incident escalations, fire clearance approvals, and emergency civic broadcasts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setBroadcastOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-amber-950 shadow-md transition-all hover:bg-amber-50 hover:scale-[1.02] active:scale-95"
            >
              <Radio size={15} className="text-rose-600 animate-pulse" />
              Issue Emergency Broadcast
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="surface-card p-4 sm:p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Escalations
            </span>
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {escalations.length} Cases
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Alert Level 3+ or hazardous</p>
        </div>

        <div className="surface-card p-4 sm:p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Clearance Queue
            </span>
            <FileCheck size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingClearances.filter((c) => !c.signed).length} Pending
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Awaiting council endorsement</p>
        </div>

        <div className="surface-card p-4 sm:p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Avg Response
            </span>
            <Clock size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            4.2 mins
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">Target &lt; 5.0 mins (Met)</p>
        </div>

        <div className="surface-card p-4 sm:p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Compliance Rate
            </span>
            <ShieldCheck size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            89.4%
          </p>
          <p className="mt-1 text-[11px] text-blue-600 font-semibold">412 inspected establishments</p>
        </div>
      </div>

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Escalated Cases & Purok Analytics */}
        <div className="space-y-6 lg:col-span-2">
          {/* Escalations Queue */}
          <div className="surface-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600">
                    <Flame size={15} />
                  </span>
                  High-Priority Incident Escalations
                </h2>
                <p className="text-xs text-muted-foreground">
                  Active incidents requiring Barangay Disaster Risk Council coordination and relief operations
                </p>
              </div>
              <span className="stat-chip">
                <span className="stat-chip-dot bg-rose-500 animate-ping" />
                Live Incident Oversight
              </span>
            </div>

            <div className="space-y-3.5">
              {escalations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 transition-all hover:bg-rose-50/60 dark:border-rose-900/30 dark:bg-rose-950/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                          {item.case_number}
                        </span>
                        <Badge value={item.severity} />
                        <Badge value={item.status} />
                      </div>
                      <h3 className="font-display text-sm font-bold text-foreground">
                        {item.title}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={13} className="shrink-0 text-rose-500" />
                        {item.purok} · <span className="font-semibold">{item.reported_at}</span>
                      </p>
                    </div>

                    {item.affected_families > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-extrabold text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                        <Users size={12} /> {item.affected_families} families displaced
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-rose-200/60 pt-2.5 dark:border-rose-900/30">
                    <span className="text-[11px] text-muted-foreground">
                      Station 1 Units on Scene · Barangay Tanod deployed
                    </span>
                    <button
                      onClick={() => toast.success(`Relief support activated for ${item.case_number}. Evacuation center informed.`)}
                      className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-colors"
                    >
                      Authorize Relief Center Support
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Localized Purok Risk Overview */}
          <div className="surface-card p-5 sm:p-6">
            <h2 className="mb-1 font-display text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Barangay Culiat — Purok Risk &amp; Hydrant Availability
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Zonal breakdown of incident density and commercial compliance to guide barangay safety ordinances
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="py-2.5 pl-3 text-left font-bold">Zone / Purok</th>
                    <th className="py-2.5 text-left font-bold">Fire Risk Index</th>
                    <th className="py-2.5 text-left font-bold">Incidents YTD</th>
                    <th className="py-2.5 text-left font-bold">Compliance</th>
                    <th className="py-2.5 pr-3 text-left font-bold">Hydrants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {PUROK_STATS.map((row) => (
                    <tr key={row.purok} className="hover:bg-accent/40 transition-colors">
                      <td className="py-2.5 pl-3 font-bold text-foreground">{row.purok}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                            row.risk === 'High'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : row.risk === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {row.risk}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{row.incidentsYtd}</td>
                      <td className="py-2.5 font-semibold text-foreground">{row.compliance}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{row.hydrants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Clearance Endorsements & Ordinances */}
        <div className="space-y-6">
          {/* Clearances Awaiting Official Endorsement */}
          <div className="surface-card p-5">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileCheck size={16} className="text-amber-600" />
                Clearance Endorsements
              </h3>
              <span className="text-[11px] font-bold text-amber-600">Action Required</span>
            </div>

            <div className="space-y-3">
              {pendingClearances.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-3 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary">{c.ref}</span>
                    <span className="text-muted-foreground text-[11px]">{c.purok}</span>
                  </div>
                  <p className="font-bold text-foreground text-sm">{c.name}</p>
                  <div className="flex justify-end pt-1">
                    {c.signed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 size={13} /> Endorsed &amp; Signed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSignClearance(c.id, c.name)}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition-colors shadow-sm"
                      >
                        Sign &amp; Endorse →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Public Safety Ordinances */}
          <div className="surface-card p-5">
            <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <FileText size={16} className="text-primary" />
              Barangay Safety Ordinances
            </h3>
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-3">
                <span className="font-bold text-foreground block">
                  Ordinance 2026-08 (Open Burning Prohibition)
                </span>
                <p className="mt-1 text-muted-foreground text-[11.5px]">
                  Imposes ₱2,500 fine for illegal garbage/yard burning along alleys and creek banks.
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <span className="font-bold text-foreground block">
                  Resolution 2025-14 (Hydrant Clearances)
                </span>
                <p className="mt-1 text-muted-foreground text-[11.5px]">
                  Requires 5-meter clear obstruction radius around all 31 barangay fire hydrants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Emergency Broadcast */}
      {broadcastOpen && (
        <Modal title="Broadcast Public Safety Advisory" onClose={() => setBroadcastOpen(false)}>
          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <p className="text-muted-foreground">
              This message will immediately broadcast across the Barangay Culiat Citizen Portal and display as an alert banner to all residents.
            </p>
            <div>
              <label className="field-label">Urgency Level</label>
              <select
                value={broadcastCategory}
                onChange={(e) => setBroadcastCategory(e.target.value as any)}
                className="field-input"
              >
                <option value="urgent">🚨 Critical Alert (Immediate Danger / Major Fire / Evacuation)</option>
                <option value="warning">⚠️ Safety Advisory (Weather Warning / Elevated Fire Risk)</option>
                <option value="info">ℹ️ General Information (Hydrant Works / Seminars)</option>
              </select>
            </div>
            <div>
              <label className="field-label">Advisory Headline *</label>
              <input
                required
                placeholder="e.g. HIGH FIRE RISK ALERT: Continuous Dry Heat in Zone B"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Advisory Content / Guidance *</label>
              <textarea
                required
                rows={4}
                placeholder="Specify precautions, affected puroks, evacuation centers, and emergency numbers..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="field-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex items-center gap-1.5">
                <Send size={14} /> Send Broadcast to Citizens
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
