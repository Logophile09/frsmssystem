/**
 * Transparent, rule-based false-alarm scoring engine.
 *
 * Deliberately NOT a black-box ML model -- every point added or
 * subtracted is returned in `factors` so dispatch can see exactly why
 * an incident got the score it did.
 *
 * The weights below are the DEFAULTS. They are also the only "model
 * parameters" this engine has, and they are user-tunable at runtime via
 * the "Train Your AI" panel (frontend/src/components/TrainYourAiPanel.tsx)
 * and the /api/ai-settings/false-alarm-weights endpoint -- see
 * backend/src/routes/aiSettings.ts and backend/src/lib/aiSettingsStore.ts.
 * Nothing here becomes a black box just because it's adjustable: every
 * weight change is still a plain arithmetic rule, and every score still
 * comes back with the exact factors that produced it.
 *
 * Base rules (see False_Alarm_AI_Module_Notes.txt for the source spec):
 *   Anonymous Caller                +20
 *   Repeated False Alarm Location   +20
 *   No Smoke Sensor Trigger         +20
 *   Single Caller                   +15
 *   Night Time (10pm - 5am)         +10
 *   Multiple Callers                -20
 *   Smoke Sensor Triggered          -40
 *   Fire Personnel Confirm Smoke    -50
 *
 * Score runs 0-100, split into four bands by `thresholds`:
 *   0  - veryLikelyRealMax  : Very Likely Real Fire
 *   ..  - needsReviewMax    : Needs Review
 *   ..  - likelyFalseMax    : Likely False Alarm
 *   ..  - 100               : Confirmed False Alarm
 */

export interface ScoreWeights {
  anonymousCaller: number;
  repeatedFalseAlarmLocation: number;
  noSmokeSensorTrigger: number;
  smokeSensorTriggered: number;
  singleCaller: number;
  multipleCallers: number;
  nightTime: number;
  firePersonnelConfirmedSmoke: number;
}

export interface ScoreThresholds {
  /** Scores 0..this (inclusive) are "very_likely_real" */
  veryLikelyRealMax: number;
  /** Scores above veryLikelyRealMax, up to this, are "needs_review" */
  needsReviewMax: number;
  /** Scores above needsReviewMax, up to this, are "likely_false"; above it, "confirmed_false" */
  likelyFalseMax: number;
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  anonymousCaller: 20,
  repeatedFalseAlarmLocation: 20,
  noSmokeSensorTrigger: 20,
  smokeSensorTriggered: -40,
  singleCaller: 15,
  multipleCallers: -20,
  nightTime: 10,
  firePersonnelConfirmedSmoke: -50,
};

export const DEFAULT_SCORE_THRESHOLDS: ScoreThresholds = {
  veryLikelyRealMax: 29,
  needsReviewMax: 49,
  likelyFalseMax: 69,
};

export interface ScoreInput {
  /** Caller did not give / could not be verified with a name+number */
  isAnonymousCaller?: boolean;
  /** This location has one or more prior CONFIRMED false alarms */
  repeatedFalseAlarmLocation?: boolean;
  /** IoT smoke sensor at the location fired */
  smokeSensorTriggered?: boolean;
  /** How many separate people called this incident in */
  callerCount?: number;
  /** Fire personnel on-scene / dispatch have visually confirmed smoke */
  firePersonnelConfirmedSmoke?: boolean;
  reported_at?: string | Date;
}

export type FalseAlarmLabel = 'very_likely_real' | 'needs_review' | 'likely_false' | 'confirmed_false';

export interface ScoreResult {
  score: number;
  label: FalseAlarmLabel;
  factors: string[];
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function computeFalseAlarmScore(
  input: ScoreInput,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
  thresholds: ScoreThresholds = DEFAULT_SCORE_THRESHOLDS,
): ScoreResult {
  let score = 0;
  const factors: string[] = [];

  const callerCount = input.callerCount ?? 1;

  if (input.isAnonymousCaller) {
    score += weights.anonymousCaller;
    factors.push(`Anonymous caller: ${signed(weights.anonymousCaller)}`);
  }

  if (input.repeatedFalseAlarmLocation) {
    score += weights.repeatedFalseAlarmLocation;
    factors.push(`Repeated false alarm location: ${signed(weights.repeatedFalseAlarmLocation)}`);
  }

  if (!input.smokeSensorTriggered) {
    score += weights.noSmokeSensorTrigger;
    factors.push(`No smoke sensor trigger: ${signed(weights.noSmokeSensorTrigger)}`);
  } else {
    score += weights.smokeSensorTriggered;
    factors.push(`Smoke sensor triggered: ${signed(weights.smokeSensorTriggered)}`);
  }

  if (callerCount === 1) {
    score += weights.singleCaller;
    factors.push(`Single caller: ${signed(weights.singleCaller)}`);
  } else if (callerCount > 1) {
    score += weights.multipleCallers;
    factors.push(`Multiple callers (${callerCount}): ${signed(weights.multipleCallers)}`);
  }

  const reportedAt = input.reported_at ? new Date(input.reported_at) : new Date();
  const hour = reportedAt.getHours();
  if (hour >= 22 || hour < 5) {
    score += weights.nightTime;
    factors.push(`Night time (10pm-5am): ${signed(weights.nightTime)}`);
  }

  if (input.firePersonnelConfirmedSmoke) {
    score += weights.firePersonnelConfirmedSmoke;
    factors.push(`Fire personnel confirmed smoke: ${signed(weights.firePersonnelConfirmedSmoke)}`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label: FalseAlarmLabel;
  if (score <= thresholds.veryLikelyRealMax) label = 'very_likely_real';
  else if (score <= thresholds.needsReviewMax) label = 'needs_review';
  else if (score <= thresholds.likelyFalseMax) label = 'likely_false';
  else label = 'confirmed_false';

  if (factors.length === 0) factors.push('No risk factors detected');

  return { score, label, factors };
}
