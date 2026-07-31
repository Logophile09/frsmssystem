import { crudRouter } from '../lib/crudFactory';

export default crudRouter({
  table: 'certificates',
  select: '*, establishments(business_name)',
  orderBy: 'expiry_date',
  ascending: true,
});
