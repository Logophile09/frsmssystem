import { crudRouter } from '../lib/crudFactory';

export default crudRouter({
  table: 'inspections',
  select: '*, establishments(business_name)',
  orderBy: 'inspection_date',
  ascending: false,
});
