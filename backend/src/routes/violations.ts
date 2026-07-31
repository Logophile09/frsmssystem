import { crudRouter } from '../lib/crudFactory';

export default crudRouter({
  table: 'violations',
  select: '*, establishments(business_name)',
  orderBy: 'date_issued',
  ascending: false,
});
