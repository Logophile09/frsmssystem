const COLORS: Record<string, string> = {
  // generic
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  inactive: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  Inactive: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  disabled: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  // personnel
  on_duty: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  off_duty: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  on_leave: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  // vehicles
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  dispatched: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  out_of_service: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  // equipment condition
  good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  fair: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  poor: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  damaged: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  // incidents
  reported: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  on_scene: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  closed: 'bg-slate-300 text-slate-800 dark:bg-white/15 dark:text-slate-200',
  '1': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  '2': 'bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300',
  '3': 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  '4': 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  '5': 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  // attendance
  present: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  late: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  absent: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  // compliance
  Compliant: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  'Non-Compliant': 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  Scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  Expired: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  Revoked: 'bg-slate-300 text-slate-800 dark:bg-white/15 dark:text-slate-200',
  Open: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  Resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  Overdue: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  Minor: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  Major: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  Critical: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  // gps / false alarm
  online: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  offline: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  signal_lost: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  likely_real: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  uncertain: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  likely_false: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  confirmed_false: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  confirmed_real: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
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
  if (!value) return <span className="text-slate-400 dark:text-slate-500">—</span>;
  const classes = COLORS[value] ?? 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300';
  const label = LABELS[value] ?? value.replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize leading-none ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06] ${classes}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
