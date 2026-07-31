/**
 * Transparent, rule-based false-alarm scoring engine.
 *
 * Deliberately NOT a black-box ML model -- every point added or
 * subtracted is returned in `factors` so dispatch can see exactly why
 * an incident got the score it did. Score runs 0-100:
 *   0   = almost certainly a real incident
 *   100 = almost certainly a false alarm
 */

export interface ScoreInput {
  incident_type: string;
  description: string | null;
  location: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  reported_at?: string | Date;
  /** count of this location's incidents previously confirmed false */
  priorFalseAlarmsAtLocation?: number;
}

export interface ScoreResult {
  score: number;
  label: 'likely_real' | 'uncertain' | 'likely_false';
  factors: string[];
}

const FALSE_ALARM_KEYWORDS: Array<[RegExp, number, string]> = [
  [/false alarm/i, 25, "Description mentions 'false alarm'"],
  [/\btest\b/i, 20, "Description mentions a system 'test'"],
  [/\bdrill\b/i, 20, "Description mentions a 'drill'"],
  [/accidental/i, 15, "Description mentions 'accidental' trigger"],
  [/no (visible )?fire/i, 15, 'Description notes no fire found on arrival'],
  [/smoke detector|smoke alarm/i, 10, 'Triggered by a smoke detector/alarm, unconfirmed'],
  [/malfunction/i, 12, 'Description mentions equipment malfunction'],
];

const REAL_INCIDENT_KEYWORDS: Array<[RegExp, number, string]> = [
  [/trapped/i, -20, "Description mentions occupants 'trapped'"],
  [/casualt(y|ies)/i, -25, 'Description mentions casualties'],
  [/collapsed?/i, -20, 'Description mentions structural collapse'],
  [/injured|injury/i, -15, 'Description mentions injuries'],
  [/explosion/i, -20, 'Description mentions an explosion'],
  [/fully involved/i, -20, "Description says building is 'fully involved'"],
  [/spreading/i, -15, 'Description mentions fire spreading'],
];

const SEVERITY_ADJUSTMENT: Record<ScoreInput['severity'], number> = {
  critical: -25,
  high: -15,
  moderate: -5,
  low: 10,
};

export function computeFalseAlarmScore(input: ScoreInput): ScoreResult {
  let score = 50;
  const factors: string[] = ['Base score: 50'];

  const severityAdj = SEVERITY_ADJUSTMENT[input.severity] ?? 0;
  if (severityAdj !== 0) {
    score += severityAdj;
    factors.push(`Severity "${input.severity}": ${severityAdj > 0 ? '+' : ''}${severityAdj}`);
  }

  const description = input.description ?? '';
  for (const [pattern, points, label] of FALSE_ALARM_KEYWORDS) {
    if (pattern.test(description)) {
      score += points;
      factors.push(`${label}: +${points}`);
    }
  }
  for (const [pattern, points, label] of REAL_INCIDENT_KEYWORDS) {
    if (pattern.test(description)) {
      score += points;
      factors.push(`${label}: ${points}`);
    }
  }

  const reportedAt = input.reported_at ? new Date(input.reported_at) : new Date();
  const hour = reportedAt.getHours();
  if (hour >= 22 || hour < 5) {
    score += 8;
    factors.push('Reported overnight (10pm-5am), higher historical false-alarm rate: +8');
  }

  const priorFalse = Math.min(input.priorFalseAlarmsAtLocation ?? 0, 3);
  if (priorFalse > 0) {
    const points = priorFalse * 10;
    score += points;
    factors.push(`${priorFalse} prior confirmed false alarm(s) at this location: +${points}`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label: ScoreResult['label'] = 'uncertain';
  if (score >= 65) label = 'likely_false';
  else if (score <= 35) label = 'likely_real';

  return { score, label, factors };
}
