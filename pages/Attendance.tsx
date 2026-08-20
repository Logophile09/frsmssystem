import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { CalendarCheck } from 'lucide-react';
import Badge from '../components/Badge';
import { api } from '../lib/api';

interface Attendance {
  id: number;
  personnel_id: number;
  attendance_date: string;
  time_in: string;
  time_out: string;
  status: string;
  remarks: string;
  personnel?: { full_name: string; employee_no: string } | null;
}

export default function AttendancePage() {
  const [personnelOptions, setPersonnelOptions] = useState<{ value: string | number; label: string }[]>([]);

  useEffect(() => {
    api
      .get('/personnel')
      .then((p: { id: number; full_name: string; employee_no: string }[]) =>
        setPersonnelOptions(p.map((x) => ({ value: x.id, label: `${x.full_name} (${x.employee_no})` })))
      )
      .catch(() => setPersonnelOptions([]));
  }, []);

  return (
    <CrudPage<Attendance>
      title="Attendance"
      icon={CalendarCheck}
      description="Daily time-in/time-out per personnel."
      endpoint="/attendance"
      columns={[
        { key: 'personnel', label: 'Personnel', render: (r) => r.personnel?.full_name ?? `#${r.personnel_id}` },
        { key: 'attendance_date', label: 'Date' },
        { key: 'time_in', label: 'Time In' },
        { key: 'time_out', label: 'Time Out' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'remarks', label: 'Remarks' },
      ]}
      fields={[
        { name: 'personnel_id', label: 'Personnel', type: 'select', options: personnelOptions, required: true },
        { name: 'attendance_date', label: 'Date', type: 'date', required: true },
        { name: 'time_in', label: 'Time In', type: 'time' },
        { name: 'time_out', label: 'Time Out', type: 'time' },
        { name: 'status', label: 'Status', type: 'select', options: ['present', 'late', 'absent', 'on_leave'], required: true },
        { name: 'remarks', label: 'Remarks', type: 'text' },
      ]}
      onBeforeSave={(values) => ({
        ...values,
        personnel_id: Number(values.personnel_id),
        time_in: values.time_in || null,
        time_out: values.time_out || null,
      })}
    />
  );
}
