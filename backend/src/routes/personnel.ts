import { crudRouter } from '../lib/crudFactory';

export default crudRouter({ table: 'personnel', orderBy: 'full_name', ascending: true });
