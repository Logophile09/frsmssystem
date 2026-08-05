/**
 * Transparent, rule-based false-alarm scoring engine.
 *
 * Deliberately NOT a black-box ML model -- every point added or
 * subtracted is returned in `factors` so dispatch can see exactly why
 * an incident got the score it did.
 *
 * Rules (see False_Alarm_AI_Module_Notes.txt for the source spec):
 *   Anonymous Caller                +20
 *   Repeated False Alarm Location   +20
 *   No Smoke Sensor Trigger         +20
 *   Single Caller                   +15
 *   Night Time (10pm - 5am)         +10
 *   Multiple Callers                -20
 *   Smoke Sensor Triggered          -40
 *   Fire Personnel Confirm Smoke    -50
 *
 * Score runs 0-100:
 *   0  - 29  : Very Likely Real Fire
 *   30 - 49  : Needs Review
 *   50 - 69  : Likely False Alarm
 *   70 - 100 : Confirmed False Alarm
 */

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

export function computeFalseAlarmScore(input: ScoreInput): ScoreResult {
  let score = 0;
  const factors: string[] = [];

  const callerCount = input.callerCount ?? 1;

  if (input.isAnonymousCaller) {
    score += 20;
    factors.push('Anonymous caller: +20');
  }

  if (input.repeatedFalseAlarmLocation) {
    score += 20;
    factors.push('Repeated false alarm location: +20');
  }

  if (!input.smokeSensorTriggered) {
    score += 20;
    factors.push('No smoke sensor trigger: +20');
  } else {
    score -= 40;
    factors.push('Smoke sensor triggered: -40');
  }

  if (callerCount === 1) {
    score += 15;
    factors.push('Single caller: +15');
  } else if (callerCount > 1) {
    score -= 20;
    factors.push(`Multiple callers (${callerCount}): -20`);
  }

  const reportedAt = input.reported_at ? new Date(input.reported_at) : new Date();
  const hour = reportedAt.getHours();
  if (hour >= 22 || hour < 5) {
    score += 10;
    factors.push('Night time (10pm-5am): +10');
  }

  if (input.firePersonnelConfirmedSmoke) {
    score -= 50;
    factors.push('Fire personnel confirmed smoke: -50');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label: FalseAlarmLabel;
  if (score <= 29) label = 'very_likely_real';
  else if (score <= 49) label = 'needs_review';
  else if (score <= 69) label = 'likely_false';
  else label = 'confirmed_false';

  if (factors.length === 0) factors.push('No risk factors detected');

  return { score, label, factors };
}
