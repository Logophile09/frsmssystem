import { crudRouter } from '../lib/crudFactory';

// Equipment inventory: admin-only writes, same reasoning as vehicles.ts.
export default crudRouter({
  table: 'equipment',
  select: '*, vehicles(unit_code)',
  orderBy: 'name',
  ascending: true,
  adminWriteOnly: true,
  writableFields: ['name', 'category', 'quantity', 'condition_status', 'vehicle_id', 'location'],
});
