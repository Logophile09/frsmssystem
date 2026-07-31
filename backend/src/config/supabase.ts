import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy backend/.env.example to backend/.env and fill in your project values.'
  );
}

// Service-role client: bypasses Row Level Security. Only ever used
// server-side, after the request has already been authenticated and
// authorized by the middleware in ./middleware/auth.ts.
export const supabaseAdmin = createClient(url ?? '', key ?? '', {
  auth: { autoRefreshToken: false, persistSession: false },
});
