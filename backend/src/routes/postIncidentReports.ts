import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Embeds the parent incident plus who filed the report, so the frontend
// never has to make a second round trip to show a report in context.
const SELECT = `
  *,
  incidents(id, incident_number, incident_type, location, severity, status, created_at, resolved_at),
  profiles:prepared_by(id, full_name)
`;

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('post_incident_reports')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Incidents that don't have a report yet -- drives the "needs a report"
// list on the Post-Incident Reporting page. Only incidents that have
// actually been responded to (resolved/closed) are eligible.
router.get('/pending', async (_req, res) => {
  const { data: reported, error: reportedError } = await supabaseAdmin.from('post_incident_reports').select('incident_id');
  if (reportedError) return res.status(400).json({ error: reportedError.message });
  const reportedIds = (reported ?? []).map((r: { incident_id: number }) => r.incident_id);

  let query = supabaseAdmin
    .from('incidents')
    .select('id, incident_number, incident_type, location, severity, status, created_at, resolved_at')
    .in('status', ['resolved', 'closed'])
    .order('resolved_at', { ascending: false });
  if (reportedIds.length) query = query.not('id', 'in', `(${reportedIds.join(',')})`);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('post_incident_reports').select(SELECT).eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

router.get('/by-incident/:incidentId', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('post_incident_reports').select(SELECT).eq('incident_id', req.params.incidentId).maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req: AuthedRequest, res) => {
  const {
    incident_id,
    response_time_minutes,
    outcome,
    injuries_count,
    fatalities_count,
    property_damage_estimate,
    actions_taken,
    lessons_learned,
    narrative,
    status,
  } = req.body ?? {};

  if (!incident_id) {
    return res.status(400).json({ error: 'incident_id is required' });
  }

  const { data, error } = await supabaseAdmin
    .from('post_incident_reports')
    .insert({
      incident_id,
      response_time_minutes: response_time_minutes ?? null,
      outcome: outcome ?? 'other',
      injuries_count: injuries_count ?? 0,
      fatalities_count: fatalities_count ?? 0,
      property_damage_estimate: property_damage_estimate ?? null,
      actions_taken: actions_taken ?? null,
      lessons_learned: lessons_learned ?? null,
      narrative: narrative ?? null,
      status: status ?? 'draft',
      prepared_by: req.user?.id ?? null,
    })
    .select(SELECT)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req: AuthedRequest, res) => {
  const {
    response_time_minutes,
    outcome,
    injuries_count,
    fatalities_count,
    property_damage_estimate,
    actions_taken,
    lessons_learned,
    narrative,
    status,
  } = req.body ?? {};

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (response_time_minutes !== undefined) patch.response_time_minutes = response_time_minutes;
  if (outcome !== undefined) patch.outcome = outcome;
  if (injuries_count !== undefined) patch.injuries_count = injuries_count;
  if (fatalities_count !== undefined) patch.fatalities_count = fatalities_count;
  if (property_damage_estimate !== undefined) patch.property_damage_estimate = property_damage_estimate;
  if (actions_taken !== undefined) patch.actions_taken = actions_taken;
  if (lessons_learned !== undefined) patch.lessons_learned = lessons_learned;
  if (narrative !== undefined) patch.narrative = narrative;
  if (status !== undefined) patch.status = status;

  const { data, error } = await supabaseAdmin.from('post_incident_reports').update(patch).eq('id', req.params.id).select(SELECT).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('post_incident_reports').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

export default router;
