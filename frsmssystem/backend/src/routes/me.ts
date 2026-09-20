import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.status === 'active') {
    await supabaseAdmin.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', req.user!.id);
  }
  res.json(req.user);
});

export default router;
