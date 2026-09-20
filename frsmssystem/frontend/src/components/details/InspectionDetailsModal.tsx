import { ClipboardCheck, FileText, Ban } from 'lucide-react';
import Modal from '../Modal';
import Badge from '../Badge';
import EstablishmentSection, { useEstablishment } from './EstablishmentSection';
import {
  DetailHeader,
  DueNote,
  Fact,
  FactGrid,
  RelatedTable,
  Section,
  TextBlock,
  dueInfo,
  formatDate,
  useRelated,
} from './DetailKit';

export interface InspectionRecord {
  id: number;
  establishment_id: number;
  inspection_type: string;
  inspection_date: string;
  inspector_name: string;
  status: string;
  findings_summary: string | null;
  next_inspection_due: string | null;
  establishments?: { business_name: string } | null;
}

interface ViolationRow {
  id: number;
  inspection_id: number | null;
  violation_code: string;
  description: string;
  severity: string;
  compliance_deadline: string;
  status: string;
}

/** Read-only "full information" view for an inspection visit. */
export default function InspectionDetailsModal({
  inspection,
  onClose,
}: {
  inspection: InspectionRecord;
  onClose: () => void;
}) {
  const { establishment, loading } = useEstablishment(inspection.establishment_id);
  const violations = useRelated<ViolationRow>('/violations', (v) => v.inspection_id === inspection.id, [inspection.id]);

  const name = establishment?.business_name ?? inspection.establishments?.business_name ?? `Establishment #${inspection.establishment_id}`;
  const nextDue = dueInfo(inspection.next_inspection_due, { past: 'Overdue by {n}', today: 'Due today', future: 'Due in {n}', warnWithinDays: 30 });

  return (
    <Modal title="Inspection Details" onClose={onClose} wide>
      <DetailHeader
        icon={ClipboardCheck}
        title={name}
        subtitle={`${inspection.inspection_type} inspection on ${formatDate(inspection.inspection_date)}`}
        badges={<Badge value={inspection.status} />}
      />

      <Section icon={ClipboardCheck} title="Visit">
        <FactGrid>
          <Fact label="Inspection type">{inspection.inspection_type}</Fact>
          <Fact label="Inspection date">{formatDate(inspection.inspection_date)}</Fact>
          <Fact label="Inspector">{inspection.inspector_name}</Fact>
          <Fact label="Next inspection due">
            {formatDate(inspection.next_inspection_due)}
            {inspection.next_inspection_due && <DueNote info={nextDue} />}
          </Fact>
        </FactGrid>
      </Section>

      <Section icon={FileText} title="Findings">
        <TextBlock value={inspection.findings_summary} emptyText="No findings were recorded for this inspection." />
      </Section>

      <EstablishmentSection establishment={establishment} loading={loading} fallbackName={name} />

      <Section icon={Ban} title="Violations raised">
        <RelatedTable
          rows={violations}
          emptyText="No violations were issued from this inspection."
          columns={[
            { label: 'Code', render: (v) => <span className="font-medium">{v.violation_code}</span>, className: 'whitespace-nowrap' },
            { label: 'Description', render: (v) => v.description },
            { label: 'Severity', render: (v) => <Badge value={v.severity} />, className: 'whitespace-nowrap' },
            { label: 'Deadline', render: (v) => formatDate(v.compliance_deadline), className: 'whitespace-nowrap' },
            { label: 'Status', render: (v) => <Badge value={v.status} />, className: 'whitespace-nowrap' },
          ]}
        />
      </Section>
    </Modal>
  );
}
