import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  MapPin,
  Pencil,
  PhoneCall,
  ShieldAlert,
  Truck,
  UserX,
  Users,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import Modal from './Modal';
import Badge from './Badge';
import Avatar from './Avatar';

// Minimal shape needed by this modal. The Incidents page's own `Incident`
// interface satisfies it structurally, so no shared type has to be exported.
export interface IncidentDetails {
  id: number;
  incident_number: string;
  incident_type: string;
  description: string | null;
  location: string;
  severity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  is_anonymous_caller: boolean;
  caller_count: number;
  smoke_sensor_triggered: boolean;
  fire_personnel_confirmed_smoke: boolean;
  ai_false_alarm_score: number | null;
  ai_false_alarm_label: string | null;
  ai_false_alarm_factors: string[] | null;
  incident_personnel: { personnel_id: number; personnel: { id: number; full_name: string; rank_title: string } | null }[];
  incident_vehicles: { vehicle_id: number; vehicles: { id: number; unit_code: string; vehicle_type: string } | null }[];
}

const STATUS_FLOW = ['reported', 'dispatched', 'on_scene', 'resolved', 'closed'] as const;

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-muted/30 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-primary/80">
        <Icon size={14} />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  return (
    <ol className="flex items-start">
      {STATUS_FLOW.map((step, i) => {
        const done = currentIndex >= 0 && i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={`absolute left-[-50%] top-3 h-0.5 w-full ${i <= currentIndex ? 'bg-leaf-500' : 'bg-border'}`}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                done
                  ? 'border-leaf-500 bg-leaf-500 text-white'
                  : current
                    ? 'border-leaf-500 bg-card text-leaf-600 ring-4 ring-leaf-500/20'
                    : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {done ? <Check size={12} /> : i + 1}
            </span>
            <span
              className={`mt-1.5 text-[11px] capitalize leading-tight ${
                current ? 'font-extrabold text-foreground' : 'font-medium text-muted-foreground'
              }`}
            >
              {step.replace(/_/g, ' ')}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function IncidentDetailsModal({
  incident,
  onClose,
  onEdit,
}: {
  incident: IncidentDetails;
  onClose: () => void;
  onEdit: () => void;
}) {
  const created = new Date(incident.created_at);
  const end = incident.resolved_at ? new Date(incident.resolved_at) : new Date();
  const hasValidTimes = !isNaN(created.getTime()) && !isNaN(end.getTime());
  const isOpen = !incident.resolved_at && incident.status !== 'resolved' && incident.status !== 'closed';

  const personnel = incident.incident_personnel.filter((p) => p.personnel);
  const vehicles = incident.incident_vehicles.filter((v) => v.vehicles);
  const factors = incident.ai_false_alarm_factors ?? [];

  return (
    <Modal title={`Incident ${incident.incident_number}`} onClose={onClose} wide>
      <div className="space-y-4">
        {/* Summary header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold leading-tight text-foreground">{incident.incident_type}</p>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>{incident.location}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge value={incident.severity} />
            <Badge value={incident.status} />
          </div>
        </div>

        {/* Progress */}
        <Section icon={Radio} title="Response Progress">
          <StatusTimeline status={incident.status} />
        </Section>

        {/* Times */}
        <Section icon={Clock} title="Timeline">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Fact label="Reported">{formatDateTime(incident.created_at)}</Fact>
            <Fact label="Resolved">{formatDateTime(incident.resolved_at)}</Fact>
            <Fact label={isOpen ? 'Open For' : 'Time to Resolve'}>
              {hasValidTimes ? formatDuration(end.getTime() - created.getTime()) : '—'}
            </Fact>
          </div>
        </Section>

        {/* Description */}
        <Section icon={AlertTriangle} title="Description">
          {incident.description?.trim() ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{incident.description}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">No description was recorded for this incident.</p>
          )}
        </Section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Personnel */}
          <Section icon={Users} title={`Assigned Personnel (${personnel.length})`}>
            {personnel.length === 0 ? (
              <p className="flex items-center gap-2 text-sm italic text-muted-foreground">
                <UserX size={14} /> No personnel assigned yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {personnel.map(({ personnel_id, personnel: p }) => (
                  <li key={personnel_id} className="flex items-center gap-2.5">
                    <Avatar name={p!.full_name} className="h-8 w-8 text-[11px]" />
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-semibold text-foreground">{p!.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p!.rank_title}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Vehicles */}
          <Section icon={Truck} title={`Assigned Vehicles (${vehicles.length})`}>
            {vehicles.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">No vehicles dispatched yet.</p>
            ) : (
              <ul className="space-y-2">
                {vehicles.map(({ vehicle_id, vehicles: v }) => (
                  <li key={vehicle_id} className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Truck size={15} />
                    </span>
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-semibold text-foreground">{v!.unit_code}</p>
                      <p className="truncate text-xs text-muted-foreground">{v!.vehicle_type}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Caller info */}
        <Section icon={PhoneCall} title="Report Source">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label="Caller">{incident.is_anonymous_caller ? 'Anonymous' : 'Identified'}</Fact>
            <Fact label="Number of Callers">{incident.caller_count ?? 1}</Fact>
            <Fact label="IoT Smoke Sensor">{incident.smoke_sensor_triggered ? 'Triggered' : 'Not triggered'}</Fact>
            <Fact label="Smoke Confirmed by Personnel">{incident.fire_personnel_confirmed_smoke ? 'Yes' : 'No'}</Fact>
          </div>
        </Section>

        {/* AI false alarm */}
        <Section icon={ShieldAlert} title="AI False-Alarm Assessment">
          {incident.ai_false_alarm_score == null ? (
            <p className="text-sm italic text-muted-foreground">No AI score has been calculated for this incident.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-2xl font-black leading-none text-foreground">
                  {incident.ai_false_alarm_score}
                  <span className="text-sm font-bold text-muted-foreground">/100</span>
                </span>
                <Badge value={incident.ai_false_alarm_label} />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-leaf-500 to-rose-500"
                  style={{ width: `${Math.min(100, Math.max(0, incident.ai_false_alarm_score))}%` }}
                />
              </div>
              {factors.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  {factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-muted-foreground">
                Higher scores mean the report looks more likely to be a false alarm.
              </p>
            </div>
          )}
        </Section>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-outline">
          Close
        </button>
        <button onClick={onEdit} className="btn-primary">
          <Pencil size={14} /> Edit Incident
        </button>
      </div>
    </Modal>
  );
}
