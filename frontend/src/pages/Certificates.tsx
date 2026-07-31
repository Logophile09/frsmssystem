import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import Badge from '../components/Badge';
import { api } from '../lib/api';

interface Certificate {
  id: number;
  establishment_id: number;
  certificate_type: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  establishments?: { business_name: string } | null;
}

export default function CertificatesPage() {
  const [establishmentOptions, setEstablishmentOptions] = useState<{ value: string | number; label: string }[]>([]);

  useEffect(() => {
    api
      .get('/establishments')
      .then((rows: { id: number; business_name: string }[]) => setEstablishmentOptions(rows.map((r) => ({ value: r.id, label: r.business_name }))))
      .catch(() => setEstablishmentOptions([]));
  }, []);

  return (
    <CrudPage<Certificate>
      title="Certificates"
      description="FSIC / FSEC issuances."
      endpoint="/certificates"
      columns={[
        { key: 'establishment', label: 'Establishment', render: (r) => r.establishments?.business_name ?? `#${r.establishment_id}` },
        { key: 'certificate_type', label: 'Type' },
        { key: 'certificate_number', label: 'Certificate No.' },
        { key: 'expiry_date', label: 'Expiry Date' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[
        { name: 'establishment_id', label: 'Establishment', type: 'select', options: establishmentOptions, required: true },
        { name: 'certificate_type', label: 'Certificate Type', type: 'select', options: ['FSIC-Business Permit', 'FSIC-Occupancy', 'FSEC'], required: true },
        { name: 'certificate_number', label: 'Certificate Number', type: 'text', required: true },
        { name: 'issue_date', label: 'Issue Date', type: 'date', required: true },
        { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Expired', 'Revoked'], required: true },
      ]}
      onBeforeSave={(values) => ({ ...values, establishment_id: Number(values.establishment_id) })}
    />
  );
}
