import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { ClipboardCheck } from 'lucide-react';
import Badge from '../components/Badge';
import { api } from '../lib/api';

interface Inspection {
  id: number;
  establishment_id: number;
  inspection_type: string;
  inspection_date: string;
  inspector_name: string;
  status: string;
  findings_summary: string;
  next_inspection_due: string;
  establishments?: { business_name: string } | null;
}

export default function InspectionsPage() {
  const [establishmentOptions, setEstablishmentOptions] = useState<{ value: string | number; label: string }[]>([]);

  useEffect(() => {
    api
      .get('/establishments')
      .then((rows: { id: number; business_name: string }[]) => setEstablishmentOptions(rows.map((r) => ({ value: r.id, label: r.business_name }))))
      .catch(() => setEstablishmentOptions([]));
  }, []);

  return (
    <CrudPage<Inspection>
      title="Inspections"
      icon={ClipboardCheck}
      description="On-site fire safety inspection visits."
      endpoint="/inspections"
      columns={[
        { key: 'establishment', label: 'Establishment', render: (r) => r.establishments?.business_name ?? `#${r.establishment_id}` },
        { key: 'inspection_type', label: 'Type' },
        { key: 'inspection_date', label: 'Date' },
        { key: 'inspector_name', label: 'Inspector' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[
        { name: 'establishment_id', label: 'Establishment', type: 'select', options: establishmentOptions, required: true },
        { name: 'inspection_type', label: 'Inspection Type', type: 'select', options: ['Initial', 'Annual', 'Follow-up', 'Renewal', 'Complaint-based'], required: true },
        { name: 'inspection_date', label: 'Inspection Date', type: 'date', required: true },
        { name: 'inspector_name', label: 'Inspector Name', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Compliant', 'Non-Compliant', 'Pending', 'Scheduled'], required: true },
        { name: 'findings_summary', label: 'Findings Summary', type: 'textarea' },
        { name: 'next_inspection_due', label: 'Next Inspection Due', type: 'date' },
      ]}
      onBeforeSave={(values) => ({ ...values, establishment_id: Number(values.establishment_id) })}
    />
  );
}
