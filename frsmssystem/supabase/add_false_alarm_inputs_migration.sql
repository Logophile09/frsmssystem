-- =====================================================================
-- FRSMS :: Add false-alarm scoring input columns to `incidents`
--
-- The app code (frontend/src/pages/Incidents.tsx,
-- backend/src/routes/incidents.ts) reads and writes these four
-- columns, but they were never added to schema.sql or any migration
-- file -- so Supabase's PostgREST schema cache doesn't know about
-- them and every insert/update on `incidents` involving them fails
-- with "Could not find the 'caller_count' column of 'incidents' in
-- the schema cache".
--
-- Run this ONCE in Supabase Studio -> SQL Editor.
-- =====================================================================

alter table incidents add column if not exists is_anonymous_caller boolean not null default false;
alter table incidents add column if not exists caller_count integer not null default 1;
alter table incidents add column if not exists smoke_sensor_triggered boolean not null default false;
alter table incidents add column if not exists fire_personnel_confirmed_smoke boolean not null default false;

-- PostgREST caches the schema; ask it to reload so the new columns
-- are visible immediately without waiting for the next auto-refresh.
notify pgrst, 'reload schema';
