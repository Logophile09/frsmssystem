import { Building2, FileCheck, ClipboardCheck, Ban, ShieldCheck } from 'lucide-react';
import Modal from '../Modal';
import Badge from '../Badge';
import {
  DetailHeader,
  Fact,
  FactGrid,
  RelatedTable,
  Section,
  StatTile,
  daysFromToday,
  formatDate,
  useRelated,
} from './DetailKit';

export interface EstablishmentRecord {
  id: number;
  business_name: string;
  business_type: string;
  owner_name: string;
  barangay: string;
  address: string;
  occupancy_type: string;
  storeys: number | null;
  floor_area_sqm: number | null;
  contact_number: string | null;
  date_registered: string;
  status: string;
}

interface CertificateRow {
  id: number;
  establishment_id: number;
  certificate_type: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
}

interface InspectionRow {
  id: number;
  establishment_id: number;
  inspection_type: string;
  inspection_date: string;
  inspector_name: string;
  status: string;
}

interface ViolationRow {
  id: number;
  establishment_id: number;
  violation_code: string;
  severity: string;
  compliance_deadline: string;
  status: string;
}

const byDateDesc = <T,>(get: (row: T) => string) => (a: T, b: T) => get(b).localeCompare(get(a));

/** Read-only "full information" view for an establishment, including its
 *  compliance history across certificates, inspections and violations. */
export default function EstablishmentDetailsModal({
  establishment,
  onClose,
}: {
  establishment: EstablishmentRecord;
  onClose: () => void;
}) {
  const id = establishment.id;
  const certificates = useRelated<CertificateRow>('/certificates', (c) => c.establishment_id === id, [id]);
  const inspections = useRelated<InspectionRow>('/inspections', (i) => i.establishment_id === id, [id]);
  const violations = useRelated<ViolationRow>('/violations', (v) => v.establishment_id === id, [id]);

  const sortedCerts = certificates && [...certificates].sort(byDateDesc((c) => c.expiry_date));
  const sortedInspections = inspections && [...inspections].sort(byDateDesc((i) => i.inspection_date));
  const sortedViolations = violations && [...violations].sort(byDateDesc((v) => v.compliance_deadline));

  // Summary tiles
  const validCerts = certificates?.filter((c) => c.status === 'Active' && (daysFromToday(c.expiry_date) ?? -1) >= 0).length;
  const openViolations = violations?.filter((v) => v.status !== 'Resolved').length;
  const lastResult = sortedInspections?.find((i) => i.status === 'Compliant' || i.status === 'Non-Compliant');

  return (
    <Modal title="Establishment Details" onClose={onClose} wide>
      <DetailHeader
        icon={Building2}
        title={establishment.business_name}
        subtitle={establishment.business_type}
        badges={<Badge value={establishment.status} />}
      />

      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        <StatTile
          label="Valid certificates"
          value={validCerts ?? '…'}
          tone={validCerts === undefined ? 'neutral' : validCerts > 0 ? 'ok' : 'warn'}
        />
        <StatTile
          label="Open violations"
          value={openViolations ?? '…'}
          tone={openViolations === undefined ? 'neutral' : openViolations > 0 ? 'bad' : 'ok'}
        />
        <StatTile
          label="Last inspection"
          value={
            sortedInspections === null ? '…' : lastResult ? <Badge value={lastResult.status} /> : <span className="text-base text-muted-foreground">None yet</span>
          }
        />
      </div>

      <Section icon={ShieldCheck} title="Profile">
        <FactGrid>
          <Fact label="Owner">{establishment.owner_name}</Fact>
          <Fact label="Contact number">{establishment.contact_number || '—'}</Fact>
          <Fact label="Address" wide>
            {establishment.address}
          </Fact>
          <Fact label="Barangay">{establishment.barangay}</Fact>
          <Fact label="Occupancy type">{establishment.occupancy_type}</Fact>
          <Fact label="Storeys">{establishment.storeys ?? '—'}</Fact>
          <Fact label="Floor area">
            {establishment.floor_area_sqm != null ? `${Number(establishment.floor_area_sqm).toLocaleString('en-PH')} sqm` : '—'}
          </Fact>
          <Fact label="Date registered">{formatDate(establishment.date_registered)}</Fact>
        </FactGrid>
      </Section>

      <Section icon={FileCheck} title="Certificates">
        <RelatedTable
          rows={sortedCerts}
          emptyText="No certificates have been issued to this establishment."
          columns={[
            { label: 'Type', render: (c) => c.certificate_type },
            { label: 'Number', render: (c) => <span className="font-medium">{c.certificate_number}</span>, className: 'whitespace-nowrap' },
            { label: 'Expires', render: (c) => formatDate(c.expiry_date), className: 'whitespace-nowrap' },
            { label: 'Status', render: (c) => <Badge value={c.status} />, className: 'whitespace-nowrap' },
          ]}
        />
      </Section>

      <Section icon={ClipboardCheck} title="Inspections">
        <RelatedTable
          rows={sortedInspections}
          emptyText="This establishment has not been inspected yet."
          columns={[
            { label: 'Date', render: (i) => formatDate(i.inspection_date), className: 'whitespace-nowrap' },
            { label: 'Type', render: (i) => i.inspection_type },
            { label: 'Inspector', render: (i) => i.inspector_name },
            { label: 'Status', render: (i) => <Badge value={i.status} />, className: 'whitespace-nowrap' },
          ]}
        />
      </Section>

      <Section icon={Ban} title="Violations">
        <RelatedTable
          rows={sortedViolations}
          emptyText="No violations have been recorded."
          columns={[
            { label: 'Code', render: (v) => <span className="font-medium">{v.violation_code}</span>, className: 'whitespace-nowrap' },
            { label: 'Severity', render: (v) => <Badge value={v.severity} />, className: 'whitespace-nowrap' },
            { label: 'Deadline', render: (v) => formatDate(v.compliance_deadline), className: 'whitespace-nowrap' },
            { label: 'Status', render: (v) => <Badge value={v.status} />, className: 'whitespace-nowrap' },
          ]}
        />
      </Section>
    </Modal>
  );
}
