import CrudPage from '../components/CrudPage';
import Badge from '../components/Badge';

interface Establishment {
  id: number;
  business_name: string;
  business_type: string;
  owner_name: string;
  barangay: string;
  address: string;
  occupancy_type: string;
  storeys: number;
  floor_area_sqm: number;
  contact_number: string;
  date_registered: string;
  status: string;
}

export default function EstablishmentsPage() {
  return (
    <CrudPage<Establishment>
      title="Establishments"
      description="Buildings and businesses subject to fire safety rules."
      endpoint="/establishments"
      columns={[
        { key: 'business_name', label: 'Business Name' },
        { key: 'business_type', label: 'Type' },
        { key: 'barangay', label: 'Barangay' },
        { key: 'occupancy_type', label: 'Occupancy' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[
        { name: 'business_name', label: 'Business Name', type: 'text', required: true },
        { name: 'business_type', label: 'Business Type', type: 'text', required: true },
        { name: 'owner_name', label: 'Owner Name', type: 'text', required: true },
        { name: 'barangay', label: 'Barangay', type: 'text', required: true },
        { name: 'address', label: 'Address', type: 'text', required: true },
        { name: 'occupancy_type', label: 'Occupancy Type', type: 'text', required: true },
        { name: 'storeys', label: 'Storeys', type: 'number' },
        { name: 'floor_area_sqm', label: 'Floor Area (sqm)', type: 'number', step: '0.01' },
        { name: 'contact_number', label: 'Contact Number', type: 'text' },
        { name: 'date_registered', label: 'Date Registered', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
      ]}
    />
  );
}
