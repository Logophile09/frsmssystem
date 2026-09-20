-- =====================================================================
-- FRSMS :: Add `caller_name` to `post_incident_reports`
--
-- Captures the name of the person who called in the incident, so the
-- post-incident report can record who reported it alongside response
-- time, outcome, casualties/damage, etc.
-- See backend/src/routes/postIncidentReports.ts and
-- frontend/src/pages/PostIncidentReport.tsx.
--
-- Run this ONCE in Supabase Studio -> SQL Editor on any project created
-- before this column was added to schema.sql.
-- =====================================================================

alter table post_incident_reports
  add column if not exists caller_name text;

-- PostgREST caches the schema; ask it to reload so the new column is
-- visible immediately without waiting for the next auto-refresh.
notify pgrst, 'reload schema';
