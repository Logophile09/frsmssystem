import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Review queue, highest AI false-alarm score first.
router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .select('id, incident_number, incident_type, location, severity, ai_false_alarm_score, ai_false_alarm_label, ai_false_alarm_factors, false_alarm_review_status, created_at')
    .order('ai_false_alarm_score', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('incidents').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// confirm false / confirm real / reset to pending
router.post('/:id/review', async (req: AuthedRequest, res) => {
  const { decision } = req.body ?? {};
  if (!['confirmed_false', 'confirmed_real', 'pending'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be confirmed_false, confirmed_real, or pending' });
  }

  const { data, error } = await supabaseAdmin
    .from('incidents')
    .update({
      false_alarm_review_status: decision,
      false_alarm_reviewed_by: decision === 'pending' ? null : req.user?.id ?? null,
      false_alarm_reviewed_at: decision === 'pending' ? null : new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
