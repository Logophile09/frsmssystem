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
  /**
   * Whitelist of body fields a client is allowed to set on insert/update.
   * Anything else in req.body is dropped -- this is what stops a client
   * from smuggling extra columns (id, created_at, foreign keys the UI
   * never exposes, etc.) into an insert/update just because they exist
   * on the table. Every crudRouter call must supply this explicitly
   * (no "allow everything" default) so adding a sensitive column to a
   * table later doesn't silently become client-writable.
   */
  writableFields: string[];
  /**
   * Fields set from the server/request context rather than the client
   * body (e.g. "recorded_by: req.user.id"), applied only on create so a
   * client can't set or overwrite them via the request body. Wins over
   * anything with the same key in writableFields.
   */
  serverFields?: (req: AuthedRequest) => Record<string, unknown>;
}

/** Keeps only the whitelisted keys that are actually present in body. */
function pickWritable(body: unknown, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!body || typeof body !== 'object') return out;
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      out[field] = (body as Record<string, unknown>)[field];
    }
  }
  return out;
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
    const payload = { ...pickWritable(req.body, opts.writableFields), ...(opts.serverFields?.(req) ?? {}) };
    const { data, error } = await supabaseAdmin.from(opts.table).insert(payload).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  });

  router.put('/:id', async (req: AuthedRequest, res) => {
    if (opts.adminWriteOnly && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const payload = pickWritable(req.body, opts.writableFields);
    const { data, error } = await supabaseAdmin
      .from(opts.table)
      .update(payload)
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
