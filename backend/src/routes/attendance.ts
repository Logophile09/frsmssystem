import { crudRouter } from '../lib/crudFactory';

export default crudRouter({
  table: 'attendance',
  select: '*, personnel(full_name, employee_no, rank_title)',
  orderBy: 'attendance_date',
  ascending: false,
});
