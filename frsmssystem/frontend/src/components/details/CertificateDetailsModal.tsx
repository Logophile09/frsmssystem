import { FileCheck, CalendarClock, Printer } from 'lucide-react';
import Modal from '../Modal';
import Badge from '../Badge';
import EstablishmentSection, { useEstablishment } from './EstablishmentSection';
import { DetailHeader, DueNote, Fact, FactGrid, Section, dueInfo, formatDate, daysFromToday } from './DetailKit';

export interface CertificateRecord {
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

/** Share of the validity period already used, 0-100. */
function elapsedPercent(issue: string, expiry: string): number | null {
  const start = daysFromToday(issue);
  const end = daysFromToday(expiry);
  if (start === null || end === null || end <= start) return null;
  const pct = ((0 - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Read-only "full information" view for a certificate. `onPrint` receives the
 * certificate with the *full* establishment attached (owner, address, ...) --
 * the list endpoint only returns the business name, which is not enough for
 * the printable BFP certificate.
 */
export default function CertificateDetailsModal({
  certificate,
  onClose,
  onPrint,
}: {
  certificate: CertificateRecord;
  onClose: () => void;
  onPrint: (cert: CertificateRecord) => void;
}) {
  const { establishment, loading } = useEstablishment(certificate.establishment_id);

  const expiry = dueInfo(certificate.expiry_date, { past: 'Expired {n} ago', today: 'Expires today', future: 'Expires in {n}', warnWithinDays: 60 });
  const percent = elapsedPercent(certificate.issue_date, certificate.expiry_date);
  const barColour =
    expiry?.tone === 'bad' ? 'bg-rose-500' : expiry?.tone === 'warn' ? 'bg-amber-500' : 'bg-leaf-500';

  const name =
    establishment?.business_name ?? certificate.establishments?.business_name ?? `Establishment #${certificate.establishment_id}`;

  function handlePrint() {
    onPrint({
      ...certificate,
      establishments: establishment
        ? {
            business_name: establishment.business_name,
            owner_name: establishment.owner_name,
            address: establishment.address,
            barangay: establishment.barangay,
            occupancy_type: establishment.occupancy_type,
          }
        : certificate.establishments,
    });
  }

  return (
    <Modal title="Certificate Details" onClose={onClose} wide>
      <DetailHeader
        icon={FileCheck}
        title={certificate.certificate_number}
        subtitle={`${certificate.certificate_type} for ${name}`}
        badges={<Badge value={certificate.status} />}
      />

      <Section icon={CalendarClock} title="Validity">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Issued</p>
            <p className="font-semibold text-foreground">{formatDate(certificate.issue_date)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Expires</p>
            <p className="font-semibold text-foreground">{formatDate(certificate.expiry_date)}</p>
          </div>
        </div>
        {percent !== null && (
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-border"
            role="img"
            aria-label={`${Math.round(percent)} percent of the validity period has passed`}
          >
            <div className={`h-full rounded-full ${barColour}`} style={{ width: `${percent}%` }} />
          </div>
        )}
        <DueNote info={expiry} />
      </Section>

      <Section icon={FileCheck} title="Certificate">
        <FactGrid>
          <Fact label="Certificate number">{certificate.certificate_number}</Fact>
          <Fact label="Type">{certificate.certificate_type}</Fact>
        </FactGrid>
      </Section>

      <EstablishmentSection establishment={establishment} loading={loading} fallbackName={name} />

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-outline">
          Close
        </button>
        <button onClick={handlePrint} disabled={loading} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
          <Printer size={15} /> Print certificate
        </button>
      </div>
    </Modal>
  );
}
