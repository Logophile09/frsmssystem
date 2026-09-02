import { crudRouter } from '../lib/crudFactory';

// Roster management: admin-only writes (parallel to Staff Accounts) --
// profile_id is deliberately excluded from writableFields, since linking
// a personnel row to a login account is handled by lib/personnelSync.ts,
// not by hand-editing this field through the generic CRUD form.
export default crudRouter({
  table: 'personnel',
  orderBy: 'full_name',
  ascending: true,
  adminWriteOnly: true,
  writableFields: ['employee_no', 'full_name', 'rank_title', 'phone', 'email', 'status', 'hire_date'],
});
