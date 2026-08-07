const COLORS: Record<string, string> = {
  // generic
  active: 'bg-emerald-100 text-emerald-800',
  Active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-200 text-slate-700',
  Inactive: 'bg-slate-200 text-slate-700',
  disabled: 'bg-slate-200 text-slate-700',
  // personnel
  on_duty: 'bg-emerald-100 text-emerald-800',
  off_duty: 'bg-slate-200 text-slate-700',
  on_leave: 'bg-amber-100 text-amber-800',
  // vehicles
  available: 'bg-emerald-100 text-emerald-800',
  dispatched: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-amber-100 text-amber-800',
  out_of_service: 'bg-rose-100 text-rose-800',
  // equipment condition
  good: 'bg-emerald-100 text-emerald-800',
  fair: 'bg-amber-100 text-amber-800',
  poor: 'bg-orange-100 text-orange-800',
  damaged: 'bg-rose-100 text-rose-800',
  // incidents
  reported: 'bg-slate-200 text-slate-700',
  on_scene: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-300 text-slate-800',
  '1': 'bg-emerald-100 text-emerald-800',
  '2': 'bg-lime-100 text-lime-800',
  '3': 'bg-amber-100 text-amber-800',
  '4': 'bg-orange-100 text-orange-800',
  '5': 'bg-rose-100 text-rose-800',
  // attendance
  present: 'bg-emerald-100 text-emerald-800',
  late: 'bg-amber-100 text-amber-800',
  absent: 'bg-rose-100 text-rose-800',
  // compliance
  Compliant: 'bg-emerald-100 text-emerald-800',
  'Non-Compliant': 'bg-rose-100 text-rose-800',
  Pending: 'bg-amber-100 text-amber-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  Expired: 'bg-rose-100 text-rose-800',
  Revoked: 'bg-slate-300 text-slate-800',
  Open: 'bg-rose-100 text-rose-800',
  Resolved: 'bg-emerald-100 text-emerald-800',
  Overdue: 'bg-orange-100 text-orange-800',
  Minor: 'bg-amber-100 text-amber-800',
  Major: 'bg-orange-100 text-orange-800',
  Critical: 'bg-rose-100 text-rose-800',
  // gps / false alarm
  online: 'bg-emerald-100 text-emerald-800',
  offline: 'bg-slate-200 text-slate-700',
  signal_lost: 'bg-rose-100 text-rose-800',
  likely_real: 'bg-rose-100 text-rose-800',
  uncertain: 'bg-amber-100 text-amber-800',
  likely_false: 'bg-emerald-100 text-emerald-800',
  confirmed_false: 'bg-emerald-100 text-emerald-800',
  confirmed_real: 'bg-rose-100 text-rose-800',
};

// Values that need custom display text instead of the raw stored value.
const LABELS: Record<string, string> = {
  '1': 'Alert Level 1',
  '2': 'Alert Level 2',
  '3': 'Alert Level 3',
  '4': 'Alert Level 4',
  '5': 'Alert Level 5',
};

export default function Badge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const classes = COLORS[value] ?? 'bg-slate-200 text-slate-700';
  const label = LABELS[value] ?? value.replace(/_/g, ' ');
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {label}
    </span>
  );
}
