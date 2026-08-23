import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { FileCheck, Printer } from 'lucide-react';
import Badge from '../components/Badge';
import { api } from '../lib/api';
import PrintCertificateModal from '../components/PrintCertificateModal';

interface Certificate {
  id: number;
  establishment_id: number;
  certificate_type: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  establishments?: {
    business_name: string;
    owner_name?: string;
    address?: string;
    barangay?: string;
    occupancy_type?: string;
  } | null;
}

export default function CertificatesPage() {
  const [establishmentOptions, setEstablishmentOptions] = useState<{ value: string | number; label: string }[]>([]);
  const [printingCert, setPrintingCert] = useState<Certificate | null>(null);

  useEffect(() => {
    api
      .get('/establishments')
      .then((rows: { id: number; business_name: string }[]) => setEstablishmentOptions(rows.map((r) => ({ value: r.id, label: r.business_name }))))
      .catch(() => setEstablishmentOptions([]));
  }, []);

  return (
    <>
      <CrudPage<Certificate>
        title="Certificates"
        icon={FileCheck}
        description="FSIC / FSEC issuances and official compliance records."
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
        extraActions={(row) => (
          <button
            onClick={() => setPrintingCert(row)}
            title="Print Official BFP Certificate"
            className="btn-icon text-leaf-600 hover:text-leaf-700"
          >
            <Printer size={13} />
          </button>
        )}
        onBeforeSave={(values) => ({ ...values, establishment_id: Number(values.establishment_id) })}
      />

      {printingCert && (
        <PrintCertificateModal
          certificate={printingCert}
          onClose={() => setPrintingCert(null)}
        />
      )}
    </>
  );
}
