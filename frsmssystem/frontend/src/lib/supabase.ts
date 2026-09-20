import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy frontend/.env.example to frontend/.env.local and fill in your project values.');
}

// The frontend only ever talks to Supabase for Auth (login/session).
// All data reads/writes go through the Express REST API instead, which
// holds the service-role key -- the browser never gets that key.
export const supabase = createClient(url, anonKey);
