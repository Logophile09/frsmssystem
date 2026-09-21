import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const TREND_DAYS = 14;

router.get('/summary', async (_req, res) => {
  const trendStart = new Date(Date.now() - (TREND_DAYS - 1) * 86400000);
  trendStart.setHours(0, 0, 0, 0);

  const [
    { count: totalIncidents },
    { count: activeIncidents },
    { count: criticalUnresolved },
    { count: totalPersonnel },
    { count: onDutyPersonnel },
    { count: totalVehicles },
    { count: availableVehicles },
    { count: pendingReviews },
    { data: severityRows },
    { data: statusRows },
    { data: recentIncidents },
    { count: expiringCerts },
    { data: gpsIssues },
    { data: resolvedRows },
    { data: trendRows },
    { data: reviewedRows },
  ] = await Promise.all([
    supabaseAdmin.from('incidents').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('incidents').select('id', { count: 'exact', head: true }).in('status', ['reported', 'dispatched', 'on_scene']),
    supabaseAdmin
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .in('severity', ['4', '5'])
      .in('status', ['reported', 'dispatched', 'on_scene']),
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
    supabaseAdmin.from('gps_devices').select('device_code, status').neq('status', 'online'),
    // Response-time KPI: every incident that has actually been closed out.
    supabaseAdmin.from('incidents').select('created_at, resolved_at').in('status', ['resolved', 'closed']).not('resolved_at', 'is', null),
    // Incident-volume trend: last TREND_DAYS days, for the dashboard sparkline.
    supabaseAdmin.from('incidents').select('created_at').gte('created_at', trendStart.toISOString()),
    // AI false-alarm accuracy KPI: incidents a human has actually reviewed.
    supabaseAdmin
      .from('incidents')
      .select('ai_false_alarm_label, false_alarm_review_status')
      .in('false_alarm_review_status', ['confirmed_false', 'confirmed_real']),
  ]);

  const tally = (rows: { [k: string]: string }[] | null, key: string) => {
    const out: Record<string, number> = {};
    (rows ?? []).forEach((r) => {
      out[r[key]] = (out[r[key]] ?? 0) + 1;
    });
    return out;
  };

  // Average minutes from report to resolution, across resolved/closed incidents.
  const resolutionDurations = (resolvedRows ?? [])
    .map((r: any) => (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 60000)
    .filter((mins: number) => Number.isFinite(mins) && mins >= 0);
  const avgResponseMinutes =
    resolutionDurations.length > 0
      ? Math.round((resolutionDurations.reduce((a: number, b: number) => a + b, 0) / resolutionDurations.length) * 10) / 10
      : null;
  const resolutionRate = (totalIncidents ?? 0) > 0 ? Math.round(((resolvedRows?.length ?? 0) / (totalIncidents ?? 1)) * 1000) / 10 : null;

  // 14-day incident-volume trend, zero-filled for days with no reports.
  const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
  const trendCounts: Record<string, number> = {};
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart.getTime() + i * 86400000);
    trendCounts[d.toISOString().slice(0, 10)] = 0;
  }
  (trendRows ?? []).forEach((r: any) => {
    const key = dayKey(r.created_at);
    if (key in trendCounts) trendCounts[key] += 1;
  });
  const incidentsTrend = Object.entries(trendCounts).map(([date, count]) => ({ date, count }));

  // AI false-alarm accuracy, against the incidents a human has actually reviewed.
  const predictsFalse = (label: string) => label === 'likely_false' || label === 'confirmed_false';
  const reviewed = reviewedRows ?? [];
  const aiCorrect = reviewed.filter(
    (r: any) => predictsFalse(r.ai_false_alarm_label ?? '') === (r.false_alarm_review_status === 'confirmed_false'),
  ).length;
  const aiAccuracy = {
    reviewedCount: reviewed.length,
    accuracy: reviewed.length > 0 ? Math.round((aiCorrect / reviewed.length) * 1000) / 10 : null,
  };

  res.json({
    totalIncidents: totalIncidents ?? 0,
    activeIncidents: activeIncidents ?? 0,
    criticalUnresolved: criticalUnresolved ?? 0,
    totalPersonnel: totalPersonnel ?? 0,
    onDutyPersonnel: onDutyPersonnel ?? 0,
    totalVehicles: totalVehicles ?? 0,
    availableVehicles: availableVehicles ?? 0,
    pendingFalseAlarmReviews: pendingReviews ?? 0,
    certificatesExpiringSoon: expiringCerts ?? 0,
    incidentsBySeverity: tally(severityRows as any, 'severity'),
    incidentsByStatus: tally(statusRows as any, 'status'),
    recentIncidents,
    gpsIssues: gpsIssues ?? [],
    avgResponseMinutes,
    resolutionRate,
    incidentsTrend,
    aiAccuracy,
  });
});

export default router;
