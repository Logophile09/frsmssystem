import { crudRouter } from '../lib/crudFactory';

// Staff log their own/roster attendance day-to-day -- not admin-only.
// recorded_by is set server-side from the authenticated user (like
// incidents.ts does for created_by), not read from the request body,
// so a client can't attribute a record to someone else.
export default crudRouter({
  table: 'attendance',
  select: '*, personnel(full_name, employee_no, rank_title)',
  orderBy: 'attendance_date',
  ascending: false,
  writableFields: ['personnel_id', 'attendance_date', 'time_in', 'time_out', 'status', 'remarks'],
  serverFields: (req) => ({ recorded_by: req.user?.id ?? null }),
});
