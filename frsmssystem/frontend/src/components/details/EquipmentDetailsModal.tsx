import { Wrench, Truck, Boxes } from 'lucide-react';
import Modal from '../Modal';
import Badge from '../Badge';
import { DetailHeader, Fact, FactGrid, RelatedTable, Section, formatDate, useRelated } from './DetailKit';

export interface EquipmentRecord {
  id: number;
  name: string;
  category: string;
  quantity: number;
  condition_status: string;
  vehicle_id: number | null;
  location: string | null;
  vehicles?: { unit_code: string } | null;
}

interface VehicleRow {
  id: number;
  unit_code: string;
  vehicle_type: string;
  plate_number: string;
  status: string;
  last_maintenance: string | null;
}

/** Read-only "full information" view for an equipment inventory item. */
export default function EquipmentDetailsModal({ item, onClose }: { item: EquipmentRecord; onClose: () => void }) {
  // The list endpoint only embeds the vehicle's unit_code, so fetch the
  // full vehicle record for the "assigned to" card.
  const vehicles = useRelated<VehicleRow>('/vehicles', (v) => v.id === item.vehicle_id, [item.vehicle_id]);
  const vehicle = vehicles?.[0] ?? null;

  // Everything stored in the same place (same vehicle, or station storage),
  // excluding this item -- answers "what else is with it?".
  const neighbours = useRelated<EquipmentRecord>(
    '/equipment',
    (e) => e.id !== item.id && (e.vehicle_id ?? null) === (item.vehicle_id ?? null),
    [item.id, item.vehicle_id],
  );

  const storedAt = item.vehicle_id ? (vehicle?.unit_code ?? item.vehicles?.unit_code ?? `Vehicle #${item.vehicle_id}`) : 'Station storage';

  return (
    <Modal title="Equipment Details" onClose={onClose} wide>
      <DetailHeader
        icon={Wrench}
        title={item.name}
        subtitle={item.category}
        badges={<Badge value={item.condition_status} />}
      />

      <Section icon={Boxes} title="Inventory">
        <FactGrid>
          <Fact label="Quantity">{item.quantity}</Fact>
          <Fact label="Condition">
            <span className="capitalize">{item.condition_status?.replace(/_/g, ' ')}</span>
          </Fact>
          <Fact label="Assigned to">{storedAt}</Fact>
          <Fact label="Storage location">{item.location || '—'}</Fact>
        </FactGrid>
      </Section>

      <Section icon={Truck} title="Assigned vehicle">
        {!item.vehicle_id ? (
          <p className="text-sm text-muted-foreground">
            Not carried on a vehicle. This item is kept in station storage.
          </p>
        ) : vehicles === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !vehicle ? (
          <p className="text-sm text-muted-foreground">The assigned vehicle could not be found.</p>
        ) : (
          <FactGrid>
            <Fact label="Unit">
              {vehicle.unit_code}
              <span className="ml-2 text-xs font-normal text-muted-foreground">{vehicle.vehicle_type}</span>
            </Fact>
            <Fact label="Status">
              <Badge value={vehicle.status} />
            </Fact>
            <Fact label="Plate number">{vehicle.plate_number}</Fact>
            <Fact label="Last maintenance">{formatDate(vehicle.last_maintenance)}</Fact>
          </FactGrid>
        )}
      </Section>

      <Section icon={Boxes} title={item.vehicle_id ? `Also on ${storedAt}` : 'Also in station storage'}>
        <RelatedTable
          rows={neighbours}
          emptyText="Nothing else is stored here."
          limit={6}
          columns={[
            { label: 'Item', render: (e) => <span className="font-medium">{e.name}</span> },
            { label: 'Category', render: (e) => e.category },
            { label: 'Qty', render: (e) => e.quantity, className: 'tabular-nums' },
            { label: 'Condition', render: (e) => <Badge value={e.condition_status} />, className: 'whitespace-nowrap' },
          ]}
        />
      </Section>
    </Modal>
  );
}
