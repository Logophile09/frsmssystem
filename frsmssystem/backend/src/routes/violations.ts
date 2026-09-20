import { crudRouter } from '../lib/crudFactory';

export default crudRouter({
  table: 'violations',
  select: '*, establishments(business_name)',
  orderBy: 'date_issued',
  ascending: false,
  writableFields: [
    'establishment_id',
    'inspection_id',
    'violation_code',
    'description',
    'severity',
    'date_issued',
    'compliance_deadline',
    'status',
  ],
});
