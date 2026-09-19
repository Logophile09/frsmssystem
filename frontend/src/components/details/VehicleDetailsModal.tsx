import { Truck, Wrench, Radio, Siren } from 'lucide-react';
import Modal from '../Modal';
import Badge from '../Badge';
import {
  DetailHeader,
  Fact,
  FactGrid,
  RelatedTable,
  Section,
  daysFromToday,
  formatDate,
  useRelated,
} from './DetailKit';

export interface VehicleRecord {
  id: number;
  unit_code: string;
  vehicle_type: string;
  plate_number: string;
  status: string;
  capacity: number | null;
  last_maintenance: string | null;
}

interface EquipmentRow {
  id: number;
  name: string;
  category: string;
  quantity: number;
  condition_status: string;
  vehicle_id: number | null;
}

interface GpsDeviceRow {
  id: number;
  device_code: string;
  status: string;
  last_ping_at: string | null;
  vehicle_id: number | null;
}

interface IncidentRow {
  id: number;
  incident_number: string;
  incident_type: string;
  location: string;
  status: string;
  created_at: string;
  incident_vehicles: { vehicle_id: number }[] | null;
}

function serviceAge(value: string | null): string {
  const days = daysFromToday(value);
  if (days === null) return 'No service on record';
  const ago = -days;
  if (ago <= 0) return 'Serviced today';
  if (ago < 60) return `${ago} day${ago === 1 ? '' : 's'} ago`;
  const months = Math.round(ago / 30);
  return `about ${months} months ago`;
}

function formatPing(value: string | null): string {
  if (!value) return 'No signal received yet';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Read-only "full information" view for a fleet vehicle. */
export default function VehicleDetailsModal({ vehicle, onClose }: { vehicle: VehicleRecord; onClose: () => void }) {
  const equipment = useRelated<EquipmentRow>('/equipment', (e) => e.vehicle_id === vehicle.id, [vehicle.id]);
  const devices = useRelated<GpsDeviceRow>('/gps/devices', (d) => d.vehicle_id === vehicle.id, [vehicle.id]);
  const dispatches = useRelated<IncidentRow>(
    '/incidents',
    (i) => (i.incident_vehicles ?? []).some((iv) => iv.vehicle_id === vehicle.id),
    [vehicle.id],
  );

  return (
    <Modal title="Vehicle Details" onClose={onClose} wide>
      <DetailHeader
        icon={Truck}
        title={vehicle.unit_code}
        subtitle={vehicle.vehicle_type}
        badges={<Badge value={vehicle.status} />}
      />

      <Section icon={Truck} title="Unit information">
        <FactGrid>
          <Fact label="Plate number">{vehicle.plate_number}</Fact>
          <Fact label="Crew capacity">{vehicle.capacity ? `${vehicle.capacity} personnel` : '—'}</Fact>
          <Fact label="Last maintenance">
            {formatDate(vehicle.last_maintenance)}
            <span className="ml-2 text-xs font-normal text-muted-foreground">{serviceAge(vehicle.last_maintenance)}</span>
          </Fact>
        </FactGrid>
      </Section>

      <Section icon={Radio} title="GPS tracker">
        {devices === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No GPS device is assigned to this vehicle.</p>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{d.device_code}</p>
                  <p className="text-xs text-muted-foreground">Last ping: {formatPing(d.last_ping_at)}</p>
                </div>
                <Badge value={d.status} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Wrench} title="Equipment on board" aside={equipment ? `${equipment.length} item type${equipment.length === 1 ? '' : 's'}` : undefined}>
        <RelatedTable
          rows={equipment}
          emptyText="No equipment is assigned to this vehicle."
          limit={8}
          columns={[
            { label: 'Item', render: (e) => <span className="font-medium">{e.name}</span> },
            { label: 'Category', render: (e) => e.category },
            { label: 'Qty', render: (e) => e.quantity, className: 'tabular-nums' },
            { label: 'Condition', render: (e) => <Badge value={e.condition_status} />, className: 'whitespace-nowrap' },
          ]}
        />
      </Section>

      <Section icon={Siren} title="Dispatch history">
        <RelatedTable
          rows={dispatches}
          emptyText="This vehicle has not been dispatched to any incident."
          columns={[
            {
              label: 'Incident',
              render: (i) => (
                <>
                  <span className="block font-medium">{i.incident_number}</span>
                  <span className="block text-xs capitalize text-muted-foreground">{i.incident_type?.replace(/_/g, ' ')}</span>
                </>
              ),
              className: 'whitespace-nowrap',
            },
            { label: 'Location', render: (i) => i.location },
            { label: 'Date', render: (i) => formatDate(i.created_at), className: 'whitespace-nowrap' },
            { label: 'Status', render: (i) => <Badge value={i.status} />, className: 'whitespace-nowrap' },
          ]}
        />
      </Section>
    </Modal>
  );
}
