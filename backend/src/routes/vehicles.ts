import { crudRouter } from '../lib/crudFactory';

export default crudRouter({ table: 'vehicles', orderBy: 'unit_code', ascending: true });
