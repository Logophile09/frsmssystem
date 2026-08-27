import CrudPage from '../components/CrudPage';
import { Building2 } from 'lucide-react';
import Badge from '../components/Badge';
import { NEIGHBORS_OF_CULIAT } from '../lib/barangayRisk';

// FRSMS is Brgy. Culiat's fire sub-station -- Culiat is its actual
// jurisdiction, and the bordering barangays cover mutual-aid responses.
// Kept as a fixed list (like the Location field on Incidents & Dispatch)
// so establishments can't drift into barangays this station doesn't serve.
const BARANGAY_OPTIONS = ['Culiat', ...Array.from(NEIGHBORS_OF_CULIAT)];

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
      icon={Building2}
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
        { name: 'barangay', label: 'Barangay', type: 'select', options: BARANGAY_OPTIONS, required: true },
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
