import { crudRouter } from '../lib/crudFactory';

export default crudRouter({
  table: 'inspections',
  select: '*, establishments(business_name)',
  orderBy: 'inspection_date',
  ascending: false,
  writableFields: [
    'establishment_id',
    'inspection_type',
    'inspection_date',
    'inspector_name',
    'status',
    'findings_summary',
    'next_inspection_due',
  ],
});
