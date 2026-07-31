import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import Badge from '../components/Badge';
import { api } from '../lib/api';

interface Equipment {
  id: number;
  name: string;
  category: string;
  quantity: number;
  condition_status: string;
  vehicle_id: number | null;
  location: string;
  vehicles?: { unit_code: string } | null;
}

export default function EquipmentPage() {
  const [vehicleOptions, setVehicleOptions] = useState<{ value: string | number; label: string }[]>([]);

  useEffect(() => {
    api
      .get('/vehicles')
      .then((vehicles: { id: number; unit_code: string }[]) =>
        setVehicleOptions([{ value: '', label: 'Station storage (no vehicle)' }, ...vehicles.map((v) => ({ value: v.id, label: v.unit_code }))])
      )
      .catch(() => setVehicleOptions([]));
  }, []);

  return (
    <CrudPage<Equipment>
      title="Equipment"
      description="Inventory linked to vehicles or station storage."
      endpoint="/equipment"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'quantity', label: 'Qty' },
        { key: 'condition_status', label: 'Condition', render: (r) => <Badge value={r.condition_status} /> },
        { key: 'vehicle', label: 'Assigned To', render: (r) => r.vehicles?.unit_code ?? 'Station storage' },
        { key: 'location', label: 'Location' },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'category', label: 'Category', type: 'text', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'condition_status', label: 'Condition', type: 'select', options: ['good', 'fair', 'poor', 'damaged'], required: true },
        { name: 'vehicle_id', label: 'Assigned Vehicle', type: 'select', options: vehicleOptions },
        { name: 'location', label: 'Location', type: 'text' },
      ]}
      onBeforeSave={(values) => ({ ...values, vehicle_id: values.vehicle_id ? Number(values.vehicle_id) : null })}
    />
  );
}
