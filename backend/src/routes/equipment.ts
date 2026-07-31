import { crudRouter } from '../lib/crudFactory';

export default crudRouter({ table: 'equipment', select: '*, vehicles(unit_code)', orderBy: 'name', ascending: true });
