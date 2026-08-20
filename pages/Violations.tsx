import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { Ban } from 'lucide-react';
import Badge from '../components/Badge';
import { api } from '../lib/api';

interface Violation {
  id: number;
  establishment_id: number;
  inspection_id: number | null;
  violation_code: string;
  description: string;
  severity: string;
  date_issued: string;
  compliance_deadline: string;
  status: string;
  establishments?: { business_name: string } | null;
}

export default function ViolationsPage() {
  const [establishmentOptions, setEstablishmentOptions] = useState<{ value: string | number; label: string }[]>([]);

  useEffect(() => {
    api
      .get('/establishments')
      .then((rows: { id: number; business_name: string }[]) => setEstablishmentOptions(rows.map((r) => ({ value: r.id, label: r.business_name }))))
      .catch(() => setEstablishmentOptions([]));
  }, []);

  return (
    <CrudPage<Violation>
      title="Violations"
      icon={Ban}
      description="Deficiencies raised during inspections."
      endpoint="/violations"
      columns={[
        { key: 'establishment', label: 'Establishment', render: (r) => r.establishments?.business_name ?? `#${r.establishment_id}` },
        { key: 'violation_code', label: 'Code' },
        { key: 'severity', label: 'Severity', render: (r) => <Badge value={r.severity} /> },
        { key: 'compliance_deadline', label: 'Deadline' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[
        { name: 'establishment_id', label: 'Establishment', type: 'select', options: establishmentOptions, required: true },
        { name: 'violation_code', label: 'Violation Code', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'severity', label: 'Severity', type: 'select', options: ['Minor', 'Major', 'Critical'], required: true },
        { name: 'date_issued', label: 'Date Issued', type: 'date', required: true },
        { name: 'compliance_deadline', label: 'Compliance Deadline', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Resolved', 'Overdue'], required: true },
      ]}
      onBeforeSave={(values) => ({ ...values, establishment_id: Number(values.establishment_id) })}
    />
  );
}
