import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { computeFalseAlarmScore } from '../lib/falseAlarmScoring';

const router = Router();
router.use(requireAuth);

const SELECT = `
  *,
  incident_personnel(personnel_id, personnel(id, full_name, rank_title)),
  incident_vehicles(vehicle_id, vehicles(id, unit_code, vehicle_type))
`;

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('incidents').select(SELECT).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('incidents').select(SELECT).eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

async function scoreForIncident(incident: {
  location: string;
  reported_at?: string | Date;
  is_anonymous_caller?: boolean;
  caller_count?: number;
  smoke_sensor_triggered?: boolean;
  fire_personnel_confirmed_smoke?: boolean;
}) {
  const { count } = await supabaseAdmin
    .from('incidents')
    .select('id', { count: 'exact', head: true })
    .eq('location', incident.location)
    .eq('false_alarm_review_status', 'confirmed_false');

  return computeFalseAlarmScore({
    isAnonymousCaller: incident.is_anonymous_caller ?? false,
    repeatedFalseAlarmLocation: (count ?? 0) > 0,
    smokeSensorTriggered: incident.smoke_sensor_triggered ?? false,
    callerCount: incident.caller_count ?? 1,
    firePersonnelConfirmedSmoke: incident.fire_personnel_confirmed_smoke ?? false,
    reported_at: incident.reported_at,
  });
}

router.post('/', async (req: AuthedRequest, res) => {
  const {
    incident_type,
    description,
    location,
    severity,
    personnel_ids,
    vehicle_ids,
    is_anonymous_caller,
    caller_count,
    smoke_sensor_triggered,
    fire_personnel_confirmed_smoke,
  } = req.body ?? {};
  if (!incident_type || !location || !severity) {
    return res.status(400).json({ error: 'incident_type, location, and severity are required' });
  }

  const incident_number = `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const scoring = await scoreForIncident({
    location,
    is_anonymous_caller: !!is_anonymous_caller,
    caller_count: caller_count ?? 1,
    smoke_sensor_triggered: !!smoke_sensor_triggered,
    fire_personnel_confirmed_smoke: !!fire_personnel_confirmed_smoke,
  });

  const { data: incident, error } = await supabaseAdmin
    .from('incidents')
    .insert({
      incident_number,
      incident_type,
      description: description ?? null,
      location,
      severity,
      status: 'reported',
      created_by: req.user?.id ?? null,
      is_anonymous_caller: !!is_anonymous_caller,
      caller_count: caller_count ?? 1,
      smoke_sensor_triggered: !!smoke_sensor_triggered,
      fire_personnel_confirmed_smoke: !!fire_personnel_confirmed_smoke,
      ai_false_alarm_score: scoring.score,
      ai_false_alarm_label: scoring.label,
      ai_false_alarm_factors: scoring.factors,
    })
    .select()
    .single();

  if (error || !incident) return res.status(400).json({ error: error?.message ?? 'Could not create incident' });

  if (Array.isArray(personnel_ids) && personnel_ids.length) {
    await supabaseAdmin
      .from('incident_personnel')
      .insert(personnel_ids.map((personnel_id: number) => ({ incident_id: incident.id, personnel_id })));
  }
  if (Array.isArray(vehicle_ids) && vehicle_ids.length) {
    await supabaseAdmin
      .from('incident_vehicles')
      .insert(vehicle_ids.map((vehicle_id: number) => ({ incident_id: incident.id, vehicle_id })));
    await supabaseAdmin.from('vehicles').update({ status: 'dispatched' }).in('id', vehicle_ids);
  }

  const { data: full } = await supabaseAdmin.from('incidents').select(SELECT).eq('id', incident.id).single();
  res.status(201).json(full);
});

router.put('/:id', async (req: AuthedRequest, res) => {
  const {
    incident_type,
    description,
    location,
    severity,
    status,
    personnel_ids,
    vehicle_ids,
    is_anonymous_caller,
    caller_count,
    smoke_sensor_triggered,
    fire_personnel_confirmed_smoke,
  } = req.body ?? {};
  const patch: Record<string, unknown> = {};
  if (incident_type) patch.incident_type = incident_type;
  if (description !== undefined) patch.description = description;
  if (location) patch.location = location;
  if (severity) patch.severity = severity;
  if (is_anonymous_caller !== undefined) patch.is_anonymous_caller = !!is_anonymous_caller;
  if (caller_count !== undefined) patch.caller_count = caller_count;
  if (smoke_sensor_triggered !== undefined) patch.smoke_sensor_triggered = !!smoke_sensor_triggered;
  if (fire_personnel_confirmed_smoke !== undefined) patch.fire_personnel_confirmed_smoke = !!fire_personnel_confirmed_smoke;
  if (status) {
    patch.status = status;
    if (status === 'resolved' || status === 'closed') patch.resolved_at = new Date().toISOString();
  }

  const scoringFieldsChanged =
    location ||
    is_anonymous_caller !== undefined ||
    caller_count !== undefined ||
    smoke_sensor_triggered !== undefined ||
    fire_personnel_confirmed_smoke !== undefined;

  if (scoringFieldsChanged) {
    const { data: existing } = await supabaseAdmin.from('incidents').select('*').eq('id', req.params.id).single();
    if (existing) {
      const scoring = await scoreForIncident({
        location: location ?? existing.location,
        reported_at: existing.created_at,
        is_anonymous_caller: is_anonymous_caller !== undefined ? !!is_anonymous_caller : existing.is_anonymous_caller,
        caller_count: caller_count !== undefined ? caller_count : existing.caller_count,
        smoke_sensor_triggered: smoke_sensor_triggered !== undefined ? !!smoke_sensor_triggered : existing.smoke_sensor_triggered,
        fire_personnel_confirmed_smoke:
          fire_personnel_confirmed_smoke !== undefined ? !!fire_personnel_confirmed_smoke : existing.fire_personnel_confirmed_smoke,
      });
      patch.ai_false_alarm_score = scoring.score;
      patch.ai_false_alarm_label = scoring.label;
      patch.ai_false_alarm_factors = scoring.factors;
    }
  }

  const { data, error } = await supabaseAdmin.from('incidents').update(patch).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });

  if (Array.isArray(personnel_ids)) {
    await supabaseAdmin.from('incident_personnel').delete().eq('incident_id', req.params.id);
    if (personnel_ids.length) {
      await supabaseAdmin
        .from('incident_personnel')
        .insert(personnel_ids.map((personnel_id: number) => ({ incident_id: Number(req.params.id), personnel_id })));
    }
  }
  if (Array.isArray(vehicle_ids)) {
    await supabaseAdmin.from('incident_vehicles').delete().eq('incident_id', req.params.id);
    if (vehicle_ids.length) {
      await supabaseAdmin
        .from('incident_vehicles')
        .insert(vehicle_ids.map((vehicle_id: number) => ({ incident_id: Number(req.params.id), vehicle_id })));
    }
  }

  const { data: full } = await supabaseAdmin.from('incidents').select(SELECT).eq('id', req.params.id).single();
  res.json(full);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('incidents').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

export default router;
