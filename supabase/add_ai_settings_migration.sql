-- AI Training & Personalization module: a single tunable-weights row for
-- the false-alarm scoring engine (backend/src/lib/falseAlarmScoring.ts).
-- Singleton table (id is always 1) -- there is exactly one active weight
-- set for the whole station, editable by admins via the "Train Your AI"
-- panel on the Dashboard (PUT /api/ai-settings/false-alarm-weights).

create table if not exists ai_settings (
  id                    smallint primary key default 1 check (id = 1),
  false_alarm_weights   jsonb not null,
  false_alarm_thresholds jsonb not null,
  updated_by            uuid references profiles(id) on delete set null,
  updated_at            timestamptz not null default now()
);

insert into ai_settings (id, false_alarm_weights, false_alarm_thresholds)
values (
  1,
  '{
    "anonymousCaller": 20,
    "repeatedFalseAlarmLocation": 20,
    "noSmokeSensorTrigger": 20,
    "smokeSensorTriggered": -40,
    "singleCaller": 15,
    "multipleCallers": -20,
    "nightTime": 10,
    "firePersonnelConfirmedSmoke": -50
  }'::jsonb,
  '{
    "veryLikelyRealMax": 29,
    "needsReviewMax": 49,
    "likelyFalseMax": 69
  }'::jsonb
)
on conflict (id) do nothing;
