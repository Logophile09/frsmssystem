import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  FileCheck,
  Phone,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  ChevronRight,
  ExternalLink,
  Plus,
  Send,
  Download,
  Info,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { demoCitizenRequests, demoCommunityAnnouncements, CitizenRequest } from '../lib/demoData';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

export default function CitizenDashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<CitizenRequest[]>(demoCitizenRequests);
  const [reportingHazard, setReportingHazard] = useState(false);
  const [requestingInspection, setRequestingInspection] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CitizenRequest | null>(null);

  // Form states
  const [hazardForm, setHazardForm] = useState({
    type: 'Smoke / Open Burning',
    location: '',
    description: '',
    contact: '0917-555-0192',
  });
  const [inspectionForm, setInspectionForm] = useState({
    type: 'Fire Safety Inspection Certificate (FSIC)',
    establishment: '',
    address: '',
    purpose: 'Business Permit Renewal',
  });

  function handleCreateHazard(e: React.FormEvent) {
    e.preventDefault();
    const newReq: CitizenRequest = {
      id: Date.now(),
      ref_number: `HAZ-2026-00${Math.floor(1000 + Math.random() * 9000)}`,
      type: hazardForm.type,
      applicant_name: profile?.full_name ?? 'Juan dela Cruz',
      address: hazardForm.location || 'Purok 3, Culiat',
      contact: hazardForm.contact,
      status: 'pending',
      step: 1,
      date_filed: 'Today',
      target_date: 'Within 24 hours',
      notes: hazardForm.description || 'Reported by resident via Citizen Portal.',
    };
    setRequests([newReq, ...requests]);
    setReportingHazard(false);
    setHazardForm({ type: 'Smoke / Open Burning', location: '', description: '', contact: '0917-555-0192' });
  }

  function handleCreateInspection(e: React.FormEvent) {
    e.preventDefault();
    const newReq: CitizenRequest = {
      id: Date.now(),
      ref_number: `FSIC-2026-00${Math.floor(1000 + Math.random() * 9000)}`,
      type: inspectionForm.type,
      applicant_name: profile?.full_name ?? 'Juan dela Cruz',
      address: inspectionForm.address || 'Purok 3, Culiat',
      contact: '0917-555-0192',
      status: 'pending',
      step: 1,
      date_filed: 'Today',
      target_date: 'Within 5 business days',
      notes: `${inspectionForm.establishment} · Purpose: ${inspectionForm.purpose}`,
    };
    setRequests([newReq, ...requests]);
    setRequestingInspection(false);
  }

  const stepsList = [
    'Submitted',
    'Docs Verified',
    'Inspection Scheduled',
    'Official Approval',
    'Certificate Issued',
  ];

  return (
    <div className="space-y-6">
      {/* Citizen Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/90 via-emerald-700 to-teal-900 p-6 text-white shadow-xl shadow-emerald-950/20 sm:p-8">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md">
                <ShieldCheck size={14} className="text-emerald-200" />
                Verified Resident
              </span>
              <span className="text-xs text-emerald-200">
                Barangay Culiat · Quezon City
              </span>
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Kumusta, {profile?.full_name ?? 'Juan dela Cruz'} 👋
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-emerald-100/90">
              Welcome to the Barangay Culiat Fire &amp; Rescue Citizen Portal. Submit emergency reports, request fire safety inspections, and track certification clearances in real time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setReportingHazard(true)}
              className="flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-rose-900/40 transition-all hover:bg-rose-500 hover:scale-[1.02] active:scale-95"
            >
              <Flame size={15} />
              Report Fire / Hazard
            </button>
            <button
              onClick={() => setRequestingInspection(true)}
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-emerald-900 shadow-md transition-all hover:bg-emerald-50 hover:scale-[1.02] active:scale-95"
            >
              <Plus size={15} />
              Request FSIC / Clearance
            </button>
            <a
              href="tel:89280000"
              className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              title="Call Station Hotline 8-928-0000"
            >
              <Phone size={14} />
              <span>Hotline 8-928-0000</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Grid: Request Tracker & Community Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Active Request Tracking */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tracker Card */}
          <div className="surface-card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  My Active Applications &amp; Reports
                </h2>
                <p className="text-xs text-muted-foreground">
                  Live multi-step progress tracking for your clearances and hazard tickets
                </p>
              </div>
              <span className="stat-chip">
                <span className="stat-chip-dot bg-leaf-500 animate-pulse" />
                {requests.length} Total Requests
              </span>
            </div>

            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40 hover:bg-card dark:bg-card/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {req.ref_number}
                        </span>
                        <Badge value={req.status} />
                      </div>
                      <h3 className="font-display text-sm font-bold text-foreground">
                        {req.type}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={13} className="shrink-0 text-muted-foreground/70" />
                        {req.address}
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-muted-foreground">Filed: </span>
                      <span className="font-semibold text-foreground">{req.date_filed}</span>
                      {req.target_date && (
                        <p className="text-[11px] text-primary font-medium">
                          Est. completion: {req.target_date}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Multi-step progress timeline */}
                  <div className="mt-4 border-t border-border/60 pt-3">
                    <p className="mb-2 text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Status Timeline (Step {req.step} of 5)
                    </p>
                    <div className="relative flex items-center justify-between">
                      {/* Connecting line */}
                      <div className="absolute left-2 right-2 top-3 h-0.5 bg-border -z-0" />
                      <div
                        className="absolute left-2 top-3 h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
                        style={{ width: `${((req.step - 1) / (stepsList.length - 1)) * 96}%` }}
                      />

                      {stepsList.map((stepName, idx) => {
                        const isCompleted = idx + 1 < req.step;
                        const isCurrent = idx + 1 === req.step;
                        return (
                          <div
                            key={stepName}
                            className="relative z-10 flex flex-col items-center text-center"
                          >
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isCurrent
                                  ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md scale-110'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`mt-1.5 hidden sm:block text-[9.5px] font-semibold ${
                                isCurrent
                                  ? 'text-primary font-bold'
                                  : isCompleted
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {stepName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes / Action */}
                  {req.notes && (
                    <div className="mt-3.5 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                      <p className="line-clamp-1 italic">{req.notes}</p>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="ml-3 shrink-0 font-bold text-primary hover:underline"
                      >
                        View Details →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Barangay Culiat Emergency Evacuation Points & Hydrants */}
          <div className="surface-card p-5 sm:p-6">
            <h2 className="mb-1 font-display text-base font-bold text-foreground">
              📍 Designated Barangay Assembly &amp; Evacuation Points
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Pre-identified safe zones in Barangay Culiat in case of community fires or disaster evacuations
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-3.5">
                <span className="inline-block rounded-md bg-emerald-100 p-1.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Building2 size={16} />
                </span>
                <h4 className="mt-2 text-xs font-bold text-foreground">
                  Culiat Covered Court
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Purok 1 · Primary Emergency Relief Center &amp; Triage
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5">
                <span className="inline-block rounded-md bg-blue-100 p-1.5 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <Building2 size={16} />
                </span>
                <h4 className="mt-2 text-xs font-bold text-foreground">
                  Culiat High School Grounds
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Tandang Sora Ave · Secondary Evacuation Zone
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5">
                <span className="inline-block rounded-md bg-amber-100 p-1.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <MapPin size={16} />
                </span>
                <h4 className="mt-2 text-xs font-bold text-foreground">
                  Zone B Multi-Purpose Plaza
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Near Creek · Rapid assembly &amp; fire truck staging
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Announcements & Important Numbers */}
        <div className="space-y-6">
          {/* Emergency Hotlines Card */}
          <div className="rounded-3xl border border-rose-500/20 bg-rose-50/70 p-5 dark:border-rose-900/30 dark:bg-rose-950/20">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Phone size={18} className="animate-pulse" />
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">
                Emergency Hotlines
              </h3>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2 dark:border-rose-800/40">
                <span className="text-foreground/80 font-medium">Culiat Fire Substation:</span>
                <a href="tel:89280000" className="font-extrabold text-rose-700 dark:text-rose-300 hover:underline">
                  (02) 8-928-0000
                </a>
              </div>
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2 dark:border-rose-800/40">
                <span className="text-foreground/80 font-medium">BFP Quezon City Central:</span>
                <a href="tel:911" className="font-extrabold text-rose-700 dark:text-rose-300 hover:underline">
                  911 / (02) 8-372-8888
                </a>
              </div>
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2 dark:border-rose-800/40">
                <span className="text-foreground/80 font-medium">Barangay Culiat Hall:</span>
                <span className="font-bold text-foreground">(02) 8-929-1234</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-foreground/80 font-medium">QC Disaster Risk (QC DRRMO):</span>
                <span className="font-bold text-foreground">122</span>
              </div>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="surface-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Bell size={15} className="text-primary" />
                Community Advisories
              </h3>
              <span className="text-[11px] text-muted-foreground">Culiat Station</span>
            </div>
            <div className="space-y-3">
              {demoCommunityAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className={`rounded-xl border p-3 text-xs ${
                    ann.category === 'urgent'
                      ? 'border-rose-300 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[10.5px] font-semibold text-muted-foreground">
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

          {/* Fire Safety Checklist Tips */}
          <div className="surface-card p-5">
            <h3 className="font-display text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600" />
              Resident Fire Safety Checklist
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                Ensure 2kg or 5kg Dry Chemical fire extinguisher is readily accessible.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                Avoid octopus electrical connections &amp; overloaded wall adapters.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                Keep LPG tanks upright and inspect hose regulator clamps quarterly.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                Know your family escape route leading to the nearest Barangay street.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Report Hazard */}
      {reportingHazard && (
        <Modal title="Report Fire Hazard or Smoke Alert" onClose={() => setReportingHazard(false)}>
          <form onSubmit={handleCreateHazard} className="space-y-4">
            <div>
              <label className="field-label">Hazard Category *</label>
              <select
                value={hazardForm.type}
                onChange={(e) => setHazardForm({ ...hazardForm, type: e.target.value })}
                className="field-input"
              >
                <option value="Smoke / Open Burning">Smoke / Open Burning (Illegal Waste)</option>
                <option value="Electrical Sparks / Dangling Wires">Electrical Sparks / Dangling Wires</option>
                <option value="Blocked Fire Hydrant">Blocked Fire Hydrant / Obstruction</option>
                <option value="Flammable Chemical Storage">Improper Chemical Storage</option>
                <option value="Active Fire Emergency">Active Fire Emergency (Requires Immediate 911)</option>
              </select>
            </div>
            <div>
              <label className="field-label">Location / Landmark *</label>
              <input
                required
                placeholder="e.g. Near Purok 3 Alley, Tandang Sora Ext."
                value={hazardForm.location}
                onChange={(e) => setHazardForm({ ...hazardForm, location: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Details / Observations</label>
              <textarea
                rows={3}
                placeholder="Describe what you see, approximate severity, or nearby structures..."
                value={hazardForm.description}
                onChange={(e) => setHazardForm({ ...hazardForm, description: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Contact Number (for responder verification)</label>
              <input
                value={hazardForm.contact}
                onChange={(e) => setHazardForm({ ...hazardForm, contact: e.target.value })}
                className="field-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingHazard(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn-danger flex items-center gap-1.5">
                <Send size={14} /> Submit Report
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Request Inspection */}
      {requestingInspection && (
        <Modal title="Request Fire Safety Inspection / Clearance" onClose={() => setRequestingInspection(false)}>
          <form onSubmit={handleCreateInspection} className="space-y-4">
            <div>
              <label className="field-label">Application Type *</label>
              <select
                value={inspectionForm.type}
                onChange={(e) => setInspectionForm({ ...inspectionForm, type: e.target.value })}
                className="field-input"
              >
                <option value="Fire Safety Inspection Certificate (FSIC)">
                  Fire Safety Inspection Certificate (FSIC - Business)
                </option>
                <option value="Residential Fire Safety Inspection">
                  Residential Fire Safety Inspection
                </option>
                <option value="Barangay Fire Clearance Endorsement">
                  Barangay Fire Clearance Endorsement
                </option>
                <option value="Occupancy Fire Safety Verification">
                  Occupancy Fire Safety Verification
                </option>
              </select>
            </div>
            <div>
              <label className="field-label">Establishment / Property Name *</label>
              <input
                required
                placeholder="e.g. Dela Cruz Grocery / Residence"
                value={inspectionForm.establishment}
                onChange={(e) => setInspectionForm({ ...inspectionForm, establishment: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Address in Barangay Culiat *</label>
              <input
                required
                placeholder="e.g. Block 4 Lot 12, Purok 3"
                value={inspectionForm.address}
                onChange={(e) => setInspectionForm({ ...inspectionForm, address: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Purpose of Request</label>
              <input
                value={inspectionForm.purpose}
                onChange={(e) => setInspectionForm({ ...inspectionForm, purpose: e.target.value })}
                className="field-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestingInspection(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex items-center gap-1.5">
                <FileCheck size={14} /> Submit Application
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Request Detail */}
      {selectedRequest && (
        <Modal title={`Application: ${selectedRequest.ref_number}`} onClose={() => setSelectedRequest(null)}>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-bold text-sm text-foreground">{selectedRequest.type}</p>
              </div>
              <Badge value={selectedRequest.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Applicant:</span>
                <p className="font-semibold text-foreground">{selectedRequest.applicant_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Contact:</span>
                <p className="font-semibold text-foreground">{selectedRequest.contact}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date Filed:</span>
                <p className="font-semibold text-foreground">{selectedRequest.date_filed}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Target Date:</span>
                <p className="font-semibold text-foreground">{selectedRequest.target_date ?? '—'}</p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Address:</span>
              <p className="font-semibold text-foreground">{selectedRequest.address}</p>
            </div>
            {selectedRequest.notes && (
              <div className="rounded-xl bg-muted/60 p-3">
                <span className="font-bold text-foreground">Status Notes:</span>
                <p className="mt-1 text-muted-foreground">{selectedRequest.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="btn-outline"
              >
                Close
              </button>
              {selectedRequest.status === 'issued' && (
                <button
                  type="button"
                  onClick={() => alert(`Downloading certificate ${selectedRequest.ref_number}.pdf`)}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <Download size={14} /> Download Certificate (PDF)
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
