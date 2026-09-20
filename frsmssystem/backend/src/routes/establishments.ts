import { crudRouter } from '../lib/crudFactory';

// Fire safety compliance data, entered/maintained by any active staff
// (inspectors), not admin-only -- this is day-to-day operational work.
export default crudRouter({
  table: 'establishments',
  orderBy: 'business_name',
  ascending: true,
  writableFields: [
    'business_name',
    'business_type',
    'owner_name',
    'barangay',
    'address',
    'occupancy_type',
    'storeys',
    'floor_area_sqm',
    'contact_number',
    'date_registered',
    'status',
  ],
});
