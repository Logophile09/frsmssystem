import { crudRouter } from '../lib/crudFactory';

export default crudRouter({ table: 'establishments', orderBy: 'business_name', ascending: true });
