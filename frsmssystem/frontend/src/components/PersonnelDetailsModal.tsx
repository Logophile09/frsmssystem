import { useEffect, useState } from 'react';
import { Mail, Phone, Calendar, Hash, ShieldCheck, Clock, type LucideIcon } from 'lucide-react';
import Modal from './Modal';
import Badge from './Badge';
import Avatar from './Avatar';
import { api } from '../lib/api';

interface Personnel {
  id: number;
  employee_no: string;
  full_name: string;
  rank_title: string;
  phone: string;
  email: string;
  status: string;
  hire_date: string;
  profile_id: string | null;
}

interface AttendanceRecord {
  id: number;
  personnel_id: number;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  remarks: string | null;
}

/**
 * Read-only "full information" view opened by clicking a Personnel row
 * (see CrudPage's onRowClick). Separate from the Edit modal -- this is
 * for viewing everything about the person at a glance, including their
 * recent Attendance history, not for changing their roster fields.
 */
export default function PersonnelDetailsModal({ personnel, onClose }: { personnel: Personnel; onClose: () => void }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // GET /attendance has no server-side filter -- it's a roster-sized
    // table, so pulling everything and filtering to this person client-side
    // is fine rather than adding a query-param filter to crudFactory.
    api
      .get('/attendance')
      .then((rows: AttendanceRecord[]) => {
        if (cancelled) return;
        setAttendance(
          (rows ?? [])
            .filter((r) => r.personnel_id === personnel.id)
            .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
        );
      })
      .catch(() => {
        if (!cancelled) setAttendance([]);
      });
    return () => {
      cancelled = true;
    };
  }, [personnel.id]);

  return (
    <Modal title="Personnel Details" onClose={onClose} wide>
      <div className="flex items-start gap-4">
        <Avatar name={personnel.full_name} seed={personnel.employee_no} className="h-14 w-14 text-lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold text-foreground">{personnel.full_name}</h3>
          <p className="text-sm text-muted-foreground">{personnel.rank_title}</p>
          <div className="mt-2">
            <Badge value={personnel.status} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailRow icon={Hash} label="Employee No." value={personnel.employee_no} />
        <DetailRow icon={Calendar} label="Hire Date" value={personnel.hire_date} />
        <DetailRow icon={Phone} label="Phone" value={personnel.phone || '—'} />
        <DetailRow icon={Mail} label="Email" value={personnel.email || '—'} />
        <DetailRow
          icon={ShieldCheck}
          label="Portal Access"
          value={personnel.profile_id ? 'Linked account' : 'No login'}
        />
      </div>

      <div className="mt-6">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <Clock size={13} /> Recent Attendance
        </h4>
        {attendance === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : attendance.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance records yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Time In</th>
                  <th className="px-3 py-2 font-semibold">Time Out</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance.slice(0, 8).map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2">{a.attendance_date}</td>
                    <td className="px-3 py-2">{a.time_in ?? '—'}</td>
                    <td className="px-3 py-2">{a.time_out ?? '—'}</td>
                    <td className="px-3 py-2">
                      <Badge value={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
