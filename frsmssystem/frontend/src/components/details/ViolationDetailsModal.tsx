import { Ban, FileText, ClipboardCheck, CalendarClock } from 'lucide-react';
import Modal from '../Modal';
import Badge from '../Badge';
import EstablishmentSection, { useEstablishment } from './EstablishmentSection';
import {
  DetailHeader,
  DueNote,
  Fact,
  FactGrid,
  Section,
  TextBlock,
  dueInfo,
  formatDate,
  useRelated,
} from './DetailKit';

export interface ViolationRecord {
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

interface InspectionRow {
  id: number;
  inspection_type: string;
  inspection_date: string;
  inspector_name: string;
  status: string;
  findings_summary: string | null;
}

/** Read-only "full information" view for a violation. */
export default function ViolationDetailsModal({
  violation,
  onClose,
}: {
  violation: ViolationRecord;
  onClose: () => void;
}) {
  const { establishment, loading } = useEstablishment(violation.establishment_id);
  const inspections = useRelated<InspectionRow>(
    '/inspections',
    (i) => violation.inspection_id !== null && i.id === violation.inspection_id,
    [violation.inspection_id],
  );
  const inspection = inspections?.[0] ?? null;

  const name = establishment?.business_name ?? violation.establishments?.business_name ?? `Establishment #${violation.establishment_id}`;
  // A countdown only means something while the violation is still unresolved.
  const deadline =
    violation.status === 'Resolved'
      ? null
      : dueInfo(violation.compliance_deadline, { past: 'Overdue by {n}', today: 'Due today', future: 'Due in {n}', warnWithinDays: 14 });

  return (
    <Modal title="Violation Details" onClose={onClose} wide>
      <DetailHeader
        icon={Ban}
        title={violation.violation_code}
        subtitle={name}
        badges={
          <>
            <Badge value={violation.severity} />
            <Badge value={violation.status} />
          </>
        }
      />

      <Section icon={FileText} title="Description">
        <TextBlock value={violation.description} emptyText="No description was provided." />
      </Section>

      <Section icon={CalendarClock} title="Timeline">
        <FactGrid>
          <Fact label="Date issued">{formatDate(violation.date_issued)}</Fact>
          <Fact label="Compliance deadline">
            {formatDate(violation.compliance_deadline)}
            <DueNote info={deadline} />
          </Fact>
        </FactGrid>
      </Section>

      <EstablishmentSection establishment={establishment} loading={loading} fallbackName={name} />

      <Section icon={ClipboardCheck} title="Raised during inspection">
        {violation.inspection_id === null ? (
          <p className="text-sm text-muted-foreground">This violation is not linked to an inspection.</p>
        ) : inspections === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !inspection ? (
          <p className="text-sm text-muted-foreground">The linked inspection could not be found.</p>
        ) : (
          <div className="space-y-3">
            <FactGrid>
              <Fact label="Inspection type">{inspection.inspection_type}</Fact>
              <Fact label="Inspection date">{formatDate(inspection.inspection_date)}</Fact>
              <Fact label="Inspector">{inspection.inspector_name}</Fact>
              <Fact label="Result">
                <Badge value={inspection.status} />
              </Fact>
            </FactGrid>
            {inspection.findings_summary && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Findings</p>
                <div className="mt-0.5">
                  <TextBlock value={inspection.findings_summary} emptyText="" />
                </div>
              </div>
            )}
          </div>
        )}
      </Section>
    </Modal>
  );
}
