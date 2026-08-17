import CrudPage from '../components/CrudPage';
import Badge from '../components/Badge';

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

export default function PersonnelPage() {
  return (
    <CrudPage<Personnel>
      title="Personnel"
      description="Roster with duty status."
      endpoint="/personnel"
      columns={[
        { key: 'employee_no', label: 'Employee No.' },
        { key: 'full_name', label: 'Name' },
        { key: 'rank_title', label: 'Rank' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'hire_date', label: 'Hire Date' },
        {
          key: 'profile_id',
          label: 'Portal Access',
          render: (r) =>
            r.profile_id ? (
              <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Linked account
              </span>
            ) : (
              <span className="text-slate-400">No login</span>
            ),
        },
      ]}
      fields={[
        { name: 'employee_no', label: 'Employee No.', type: 'text', required: true },
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'rank_title', label: 'Rank / Title', type: 'text', required: true },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'email', label: 'Email', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['on_duty', 'off_duty', 'on_leave'], required: true },
        { name: 'hire_date', label: 'Hire Date', type: 'date', required: true },
      ]}
    />
  );
}
