import { crudRouter } from '../lib/crudFactory';

// Fleet inventory: admin-only writes (adding/retiring/reconfiguring a
// unit is a fleet-management decision, not day-to-day operational data).
export default crudRouter({
  table: 'vehicles',
  orderBy: 'unit_code',
  ascending: true,
  adminWriteOnly: true,
  writableFields: ['unit_code', 'vehicle_type', 'plate_number', 'status', 'capacity', 'last_maintenance'],
});
