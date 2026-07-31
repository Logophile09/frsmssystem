import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, requireAuth } from '../middleware/auth';

interface CrudOptions {
  table: string;
  /** columns to order results by, default 'id' */
  orderBy?: string;
  ascending?: boolean;
  /** postgrest select string for GET routes, e.g. to embed relations */
  select?: string;
  /** admin-only for write operations (create/update/delete) */
  adminWriteOnly?: boolean;
}

/**
 * Builds a standard REST router: GET /, GET /:id, POST /, PUT /:id,
 * DELETE /:id -- all backed by a single Supabase table. Used for the
 * modules that don't need bespoke logic beyond plain CRUD (personnel,
 * vehicles, equipment, attendance, establishments, inspections,
 * certificates, violations).
 */
export function crudRouter(opts: CrudOptions): Router {
  const router = Router();
  const select = opts.select ?? '*';
  const orderBy = opts.orderBy ?? 'id';
  const ascending = opts.ascending ?? false;

  router.use(requireAuth);

  router.get('/', async (req: AuthedRequest, res) => {
    const { data, error } = await supabaseAdmin
      .from(opts.table)
      .select(select)
      .order(orderBy, { ascending });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  router.get('/:id', async (req: AuthedRequest, res) => {
    const { data, error } = await supabaseAdmin
      .from(opts.table)
      .select(select)
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: error.message });
    res.json(data);
  });

  router.post('/', async (req: AuthedRequest, res) => {
    if (opts.adminWriteOnly && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { data, error } = await supabaseAdmin.from(opts.table).insert(req.body).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  });

  router.put('/:id', async (req: AuthedRequest, res) => {
    if (opts.adminWriteOnly && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { data, error } = await supabaseAdmin
      .from(opts.table)
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  router.delete('/:id', async (req: AuthedRequest, res) => {
    if (opts.adminWriteOnly && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { error } = await supabaseAdmin.from(opts.table).delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.status(204).end();
  });

  return router;
}
