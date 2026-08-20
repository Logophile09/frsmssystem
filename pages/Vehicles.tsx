import CrudPage from '../components/CrudPage';
import { Truck } from 'lucide-react';
import Badge from '../components/Badge';

interface Vehicle {
  id: number;
  unit_code: string;
  vehicle_type: string;
  plate_number: string;
  status: string;
  capacity: number;
  last_maintenance: string;
}

export default function VehiclesPage() {
  return (
    <CrudPage<Vehicle>
      title="Vehicles"
      icon={Truck}
      description="Fleet with maintenance/status tracking."
      endpoint="/vehicles"
      columns={[
        { key: 'unit_code', label: 'Unit Code' },
        { key: 'vehicle_type', label: 'Type' },
        { key: 'plate_number', label: 'Plate No.' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'capacity', label: 'Capacity' },
        { key: 'last_maintenance', label: 'Last Maintenance' },
      ]}
      fields={[
        { name: 'unit_code', label: 'Unit Code', type: 'text', required: true },
        { name: 'vehicle_type', label: 'Vehicle Type', type: 'text', required: true },
        { name: 'plate_number', label: 'Plate Number', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['available', 'dispatched', 'maintenance', 'out_of_service'], required: true },
        { name: 'capacity', label: 'Capacity', type: 'number' },
        { name: 'last_maintenance', label: 'Last Maintenance', type: 'date' },
      ]}
    />
  );
}
