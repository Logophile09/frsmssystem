import { Building2 } from 'lucide-react';
import Badge from '../Badge';
import { Fact, FactGrid, Section, useRelated } from './DetailKit';
import type { EstablishmentRecord } from './EstablishmentDetailsModal';

/**
 * Loads the full establishment record for a given id. The compliance list
 * endpoints only embed business_name, so this fills in owner, address, etc.
 * Returns { establishment, loading } -- establishment is null when it
 * can't be found (e.g. deleted).
 */
export function useEstablishment(establishmentId: number) {
  const rows = useRelated<EstablishmentRecord>('/establishments', (e) => e.id === establishmentId, [establishmentId]);
  return { establishment: rows?.[0] ?? null, loading: rows === null };
}

/** "Establishment" card shown inside the Inspection / Certificate / Violation modals. */
export default function EstablishmentSection({
  establishment,
  loading,
  fallbackName,
}: {
  establishment: EstablishmentRecord | null;
  loading: boolean;
  /** Name from the list row, shown if the full record can't be loaded. */
  fallbackName?: string;
}) {
  return (
    <Section icon={Building2} title="Establishment">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !establishment ? (
        <p className="text-sm text-muted-foreground">
          {fallbackName ? `${fallbackName} — ` : ''}full details are unavailable. The establishment may have been removed.
        </p>
      ) : (
        <FactGrid>
          <Fact label="Business name">
            {establishment.business_name}
            <span className="ml-2 text-xs font-normal text-muted-foreground">{establishment.business_type}</span>
          </Fact>
          <Fact label="Status">
            <Badge value={establishment.status} />
          </Fact>
          <Fact label="Owner">{establishment.owner_name}</Fact>
          <Fact label="Contact number">{establishment.contact_number || '—'}</Fact>
          <Fact label="Address" wide>
            {establishment.address}
          </Fact>
          <Fact label="Barangay">{establishment.barangay}</Fact>
          <Fact label="Occupancy type">{establishment.occupancy_type}</Fact>
        </FactGrid>
      )}
    </Section>
  );
}
