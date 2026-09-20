import { useEffect, useState, type ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * Shared building blocks for the read-only "full information" modals that
 * open when you click a row on Vehicles, Equipment, Establishments,
 * Inspections, Certificates or Violations (via CrudPage's onRowClick).
 *
 * Visual language intentionally mirrors PersonnelDetailsModal and
 * IncidentDetailsModal so every details view in the app feels the same.
 */

// ---------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------

/** Date-only columns ("YYYY-MM-DD") are parsed as a *local* date so they never
 *  shift a day through UTC conversion. Full timestamps (e.g. created_at) go
 *  through the normal Date parser so they convert to the viewer's local time. */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** "Aug 5, 2026", or an em dash when empty/invalid. */
export function formatDate(value: string | null | undefined): string {
  const d = parseDate(value);
  return d ? d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

/** Whole days from today (local midnight) to the given date. Negative = past. */
export function daysFromToday(value: string | null | undefined): number | null {
  const d = parseDate(value);
  if (!d) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((d.getTime() - start.getTime()) / 86_400_000);
}

export type Tone = 'ok' | 'warn' | 'bad' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  ok: 'text-emerald-700 dark:text-emerald-300',
  warn: 'text-amber-700 dark:text-amber-300',
  bad: 'text-rose-700 dark:text-rose-300',
  neutral: 'text-muted-foreground',
};

/**
 * Human wording + colour for a due/expiry date. Each phrase is a template
 * with `{n}` standing in for "45 days", so callers control the grammar:
 *   { past: 'Expired {n} ago', today: 'Expires today', future: 'Expires in {n}' }
 *   { past: 'Overdue by {n}',  today: 'Due today',     future: 'Due in {n}' }
 */
export function dueInfo(
  value: string | null | undefined,
  opts: { past: string; today: string; future: string; warnWithinDays?: number },
): { text: string; tone: Tone } | null {
  const days = daysFromToday(value);
  if (days === null) return null;
  const span = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
  if (days < 0) return { text: opts.past.replace('{n}', span(-days)), tone: 'bad' };
  if (days === 0) return { text: opts.today, tone: 'warn' };
  return {
    text: opts.future.replace('{n}', span(days)),
    tone: days <= (opts.warnWithinDays ?? 30) ? 'warn' : 'ok',
  };
}

// ---------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------

/**
 * Loads a list endpoint and keeps only the rows matching `keep`.
 * Returns null while loading (so callers can show a loading state) and []
 * on failure. Filtering is client-side because the CRUD endpoints have no
 * query filters -- same trade-off PersonnelDetailsModal makes for
 * attendance, and these tables are station-sized.
 */
export function useRelated<T>(endpoint: string, keep: (row: T) => boolean, deps: unknown[]): T[] | null {
  const [rows, setRows] = useState<T[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setRows(null);
    api
      .get(endpoint)
      .then((all: T[]) => {
        if (!cancelled) setRows((all ?? []).filter(keep));
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...deps]);
  return rows;
}

// ---------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------

/** Title block at the top of a modal: icon tile, name, subtitle, badges. */
export function DetailHeader({
  icon: Icon,
  title,
  subtitle,
  badges,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badges?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={26} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="break-words font-display text-lg font-bold leading-snug text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {badges && <div className="mt-2 flex flex-wrap items-center gap-2">{badges}</div>}
      </div>
    </div>
  );
}

export function Section({
  icon: Icon,
  title,
  aside,
  children,
}: {
  icon: LucideIcon;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-primary/80">
          <Icon size={14} />
          {title}
        </h4>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function FactGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-x-6 gap-y-3.5 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>{children}</div>;
}

export function Fact({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  /** Span the full grid width (addresses, long text). */
  wide?: boolean;
}) {
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-full' : ''}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

/** A due/expiry line such as "Expires in 45 days", coloured by urgency. */
export function DueNote({ info }: { info: { text: string; tone: Tone } | null }) {
  if (!info) return null;
  return <p className={`mt-0.5 text-xs font-semibold ${TONE_CLASSES[info.tone]}`}>{info.text}</p>;
}

/** Free-text block (findings, descriptions) that keeps the author's line breaks. */
export function TextBlock({ value, emptyText }: { value: string | null | undefined; emptyText: string }) {
  if (!value?.trim()) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return <p className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground">{value}</p>;
}

// ---------------------------------------------------------------------
// Related-records table
// ---------------------------------------------------------------------

export interface RelatedColumn<T> {
  label: string;
  render: (row: T) => ReactNode;
  /** Extra classes for the cell, e.g. 'whitespace-nowrap'. */
  className?: string;
}

/**
 * Compact table of records related to the one being viewed. Handles the
 * loading and empty states so each modal only supplies rows + columns.
 * Caps at `limit` rows and says how many more exist.
 */
export function RelatedTable<T extends { id: number | string }>({
  rows,
  columns,
  emptyText,
  limit = 5,
}: {
  rows: T[] | null;
  columns: RelatedColumn<T>[];
  emptyText: string;
  limit?: number;
}) {
  if (rows === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Inbox size={15} className="shrink-0 opacity-70" />
        {emptyText}
      </div>
    );
  }
  const shown = rows.slice(0, limit);
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.label} className="whitespace-nowrap px-3 py-2 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.label} className={`px-3 py-2 ${c.className ?? ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > shown.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the latest {shown.length} of {rows.length}.
        </p>
      )}
    </>
  );
}

/** Small stat tile used for compliance summaries. */
export function StatTile({ label, value, tone = 'neutral' }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-display text-xl font-bold ${tone === 'neutral' ? 'text-foreground' : TONE_CLASSES[tone]}`}>
        {value}
      </p>
    </div>
  );
}
