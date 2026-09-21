import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, requireAdmin, requireAuth } from '../middleware/auth';
import { getAiSettings, resetAiSettings, saveAiSettings, validateAiSettingsPayload } from '../lib/aiSettingsStore';

const router = Router();
router.use(requireAuth);

/**
 * GET /api/ai-settings/false-alarm-weights
 * Anyone signed in can VIEW the current weights (it's a transparency
 * feature -- dispatchers should be able to see how the model is tuned),
 * but only admins can change them (see PUT below).
 */
router.get('/false-alarm-weights', async (_req, res) => {
  const settings = await getAiSettings();
  res.json(settings);
});

/**
 * PUT /api/ai-settings/false-alarm-weights
 * Body: { weights: ScoreWeights, thresholds: ScoreThresholds }
 * Admin-only -- this is a station-wide model change, not a personal
 * preference. Every incident scored afterwards (see routes/incidents.ts)
 * picks up the new weights on its next read of getAiSettings().
 */
router.put('/false-alarm-weights', requireAdmin, async (req: AuthedRequest, res) => {
  const invalidReason = validateAiSettingsPayload(req.body);
  if (invalidReason) return res.status(400).json({ error: invalidReason });

  try {
    const saved = await saveAiSettings(req.body.weights, req.body.thresholds, req.user?.id ?? null);
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Could not save weights' });
  }
});

/** POST /api/ai-settings/false-alarm-weights/reset — restore factory defaults. Admin-only. */
router.post('/false-alarm-weights/reset', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const saved = await resetAiSettings(req.user?.id ?? null);
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Could not reset weights' });
  }
});

/**
 * GET /api/ai-settings/false-alarm-accuracy
 *
 * The feedback-loop half of "Train Your AI": for every incident a human
 * has actually reviewed (false_alarm_review_status is confirmed_false or
 * confirmed_real -- i.e. we know the ground truth), compares that
 * outcome against what the AI predicted at report time, and returns an
 * accuracy summary. This is what should move an admin to loosen/tighten
 * the weights -- e.g. a high false-negative rate (real fires the model
 * called "likely false") argues for lowering the "no smoke sensor" or
 * "single caller" weights.
 */
router.get('/false-alarm-accuracy', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .select('id, incident_number, location, ai_false_alarm_score, ai_false_alarm_label, false_alarm_review_status, false_alarm_reviewed_at, created_at')
    .in('false_alarm_review_status', ['confirmed_false', 'confirmed_real'])
    .order('false_alarm_reviewed_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const rows = data ?? [];
  const predictsFalse = (label: string) => label === 'likely_false' || label === 'confirmed_false';

  let truePositive = 0; // predicted false, actually false
  let trueNegative = 0; // predicted real, actually real
  let falsePositive = 0; // predicted false, actually real (AI would have wrongly closed a real incident)
  let falseNegative = 0; // predicted real, actually false (AI would have wrongly escalated a false alarm)

  const misses: typeof rows = [];

  for (const row of rows) {
    const predicted = predictsFalse(row.ai_false_alarm_label ?? '');
    const actual = row.false_alarm_review_status === 'confirmed_false';
    if (predicted && actual) truePositive++;
    else if (!predicted && !actual) trueNegative++;
    else if (predicted && !actual) {
      falsePositive++;
      misses.push(row);
    } else {
      falseNegative++;
      misses.push(row);
    }
  }

  const total = rows.length;
  const correct = truePositive + trueNegative;

  res.json({
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 1000) / 10 : null,
    confusionMatrix: { truePositive, trueNegative, falsePositive, falseNegative },
    recentMisses: misses.slice(0, 5).map((r) => ({
      id: r.id,
      incident_number: r.incident_number,
      location: r.location,
      ai_false_alarm_score: r.ai_false_alarm_score,
      ai_false_alarm_label: r.ai_false_alarm_label,
      false_alarm_review_status: r.false_alarm_review_status,
    })),
  });
});

export default router;
