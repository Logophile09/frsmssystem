import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/summary', async (_req, res) => {
  const [
    { count: totalIncidents },
    { count: activeIncidents },
    { count: totalPersonnel },
    { count: onDutyPersonnel },
    { count: totalVehicles },
    { count: availableVehicles },
    { count: pendingReviews },
    { data: severityRows },
    { data: statusRows },
    { data: recentIncidents },
    { count: expiringCerts },
  ] = await Promise.all([
    supabaseAdmin.from('incidents').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('incidents').select('id', { count: 'exact', head: true }).in('status', ['reported', 'dispatched', 'on_scene']),
    supabaseAdmin.from('personnel').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('personnel').select('id', { count: 'exact', head: true }).eq('status', 'on_duty'),
    supabaseAdmin.from('vehicles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'available'),
    supabaseAdmin.from('incidents').select('id', { count: 'exact', head: true }).eq('false_alarm_review_status', 'pending').gte('ai_false_alarm_score', 65),
    supabaseAdmin.from('incidents').select('severity'),
    supabaseAdmin.from('incidents').select('status'),
    supabaseAdmin.from('incidents').select('id, incident_number, incident_type, location, severity, status, created_at').order('created_at', { ascending: false }).limit(6),
    supabaseAdmin
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Active')
      .lte('expiry_date', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)),
  ]);

  const tally = (rows: { [k: string]: string }[] | null, key: string) => {
    const out: Record<string, number> = {};
    (rows ?? []).forEach((r) => {
      out[r[key]] = (out[r[key]] ?? 0) + 1;
    });
    return out;
  };

  res.json({
    totalIncidents: totalIncidents ?? 0,
    activeIncidents: activeIncidents ?? 0,
    totalPersonnel: totalPersonnel ?? 0,
    onDutyPersonnel: onDutyPersonnel ?? 0,
    totalVehicles: totalVehicles ?? 0,
    availableVehicles: availableVehicles ?? 0,
    pendingFalseAlarmReviews: pendingReviews ?? 0,
    certificatesExpiringSoon: expiringCerts ?? 0,
    incidentsBySeverity: tally(severityRows as any, 'severity'),
    incidentsByStatus: tally(statusRows as any, 'status'),
    recentIncidents,
  });
});

export default router;
