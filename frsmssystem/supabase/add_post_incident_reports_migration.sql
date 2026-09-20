-- =====================================================================
-- FRSMS :: Add `post_incident_reports` table (Post-Incident Reporting
-- Module)
--
-- Adds a dedicated after-action report per incident -- response time,
-- outcome, casualties/damage, actions taken, lessons learned, and an
-- optional AI-assisted narrative (see backend/src/routes/ai.ts POST
-- /ai/post-incident-report and backend/src/routes/postIncidentReports.ts).
--
-- Run this ONCE in Supabase Studio -> SQL Editor on any project created
-- before this table was added to schema.sql.
-- =====================================================================

do $$ begin
  create type post_incident_report_status as enum ('draft', 'finalized');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type post_incident_outcome as enum (
    'extinguished', 'contained', 'rescued', 'treated_transported', 'false_alarm', 'other'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists post_incident_reports (
  id                        bigserial primary key,
  incident_id               bigint not null unique references incidents(id) on delete cascade,
  response_time_minutes     numeric,
  outcome                   post_incident_outcome not null default 'other',
  injuries_count            integer not null default 0,
  fatalities_count          integer not null default 0,
  property_damage_estimate  numeric,
  actions_taken             text,
  lessons_learned           text,
  narrative                 text,
  status                    post_incident_report_status not null default 'draft',
  prepared_by               uuid references profiles(id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_post_incident_reports_status on post_incident_reports(status);

alter table post_incident_reports enable row level security;

drop policy if exists "authenticated read post_incident_reports" on post_incident_reports;
create policy "authenticated read post_incident_reports" on post_incident_reports
  for select using (auth.role() = 'authenticated');

-- PostgREST caches the schema; ask it to reload so the new table is
-- visible immediately without waiting for the next auto-refresh.
notify pgrst, 'reload schema';
