import { crudRouter } from '../lib/crudFactory';

export default crudRouter({
  table: 'certificates',
  select: '*, establishments(business_name)',
  orderBy: 'expiry_date',
  ascending: true,
  writableFields: ['establishment_id', 'certificate_type', 'certificate_number', 'issue_date', 'expiry_date', 'status'],
});
