import { supabaseAdmin } from '../config/supabase';
import {
  DEFAULT_SCORE_THRESHOLDS,
  DEFAULT_SCORE_WEIGHTS,
  ScoreThresholds,
  ScoreWeights,
} from './falseAlarmScoring';

export interface AiSettings {
  weights: ScoreWeights;
  thresholds: ScoreThresholds;
  updatedBy: string | null;
  updatedAt: string | null;
}

const DEFAULTS: AiSettings = {
  weights: DEFAULT_SCORE_WEIGHTS,
  thresholds: DEFAULT_SCORE_THRESHOLDS,
  updatedBy: null,
  updatedAt: null,
};

// Short-lived in-process cache -- the weights change rarely (an admin
// tuning them in the "Train Your AI" panel) but every incident create/
// update reads them, so we don't want a DB round trip on every request.
let cached: AiSettings | null = null;
let cachedAt = 0;
const CACHE_MS = 15_000;

function mergeWeights(partial: Partial<ScoreWeights> | null | undefined): ScoreWeights {
  return { ...DEFAULT_SCORE_WEIGHTS, ...(partial ?? {}) };
}
function mergeThresholds(partial: Partial<ScoreThresholds> | null | undefined): ScoreThresholds {
  return { ...DEFAULT_SCORE_THRESHOLDS, ...(partial ?? {}) };
}

/**
 * Reads the active scoring weights/thresholds. Falls back to the
 * hard-coded defaults if the ai_settings table/row doesn't exist yet
 * (e.g. the migration hasn't been run) -- the AI module must never hard
 * fail just because tuning hasn't been set up.
 */
export async function getAiSettings(forceFresh = false): Promise<AiSettings> {
  if (!forceFresh && cached && Date.now() - cachedAt < CACHE_MS) return cached;

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_settings')
      .select('false_alarm_weights, false_alarm_thresholds, updated_by, updated_at')
      .eq('id', 1)
      .single();

    if (error || !data) {
      cached = DEFAULTS;
    } else {
      cached = {
        weights: mergeWeights(data.false_alarm_weights),
        thresholds: mergeThresholds(data.false_alarm_thresholds),
        updatedBy: data.updated_by ?? null,
        updatedAt: data.updated_at ?? null,
      };
    }
  } catch {
    cached = DEFAULTS;
  }
  cachedAt = Date.now();
  return cached;
}

export async function saveAiSettings(
  weights: ScoreWeights,
  thresholds: ScoreThresholds,
  updatedBy: string | null,
): Promise<AiSettings> {
  const { data, error } = await supabaseAdmin
    .from('ai_settings')
    .upsert({
      id: 1,
      false_alarm_weights: weights,
      false_alarm_thresholds: thresholds,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .select('false_alarm_weights, false_alarm_thresholds, updated_by, updated_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Could not save AI settings');
  }

  cached = {
    weights: mergeWeights(data.false_alarm_weights),
    thresholds: mergeThresholds(data.false_alarm_thresholds),
    updatedBy: data.updated_by ?? null,
    updatedAt: data.updated_at ?? null,
  };
  cachedAt = Date.now();
  return cached;
}

export async function resetAiSettings(updatedBy: string | null): Promise<AiSettings> {
  return saveAiSettings(DEFAULT_SCORE_WEIGHTS, DEFAULT_SCORE_THRESHOLDS, updatedBy);
}

const WEIGHT_KEYS: (keyof ScoreWeights)[] = [
  'anonymousCaller',
  'repeatedFalseAlarmLocation',
  'noSmokeSensorTrigger',
  'smokeSensorTriggered',
  'singleCaller',
  'multipleCallers',
  'nightTime',
  'firePersonnelConfirmedSmoke',
];
const THRESHOLD_KEYS: (keyof ScoreThresholds)[] = ['veryLikelyRealMax', 'needsReviewMax', 'likelyFalseMax'];

/** Validates a candidate weights/thresholds payload from the request body. Returns an error string, or null if valid. */
export function validateAiSettingsPayload(body: any): string | null {
  const weights = body?.weights;
  const thresholds = body?.thresholds;
  if (!weights || typeof weights !== 'object') return 'weights object is required';
  if (!thresholds || typeof thresholds !== 'object') return 'thresholds object is required';

  for (const key of WEIGHT_KEYS) {
    const v = weights[key];
    if (typeof v !== 'number' || Number.isNaN(v) || v < -100 || v > 100) {
      return `weights.${key} must be a number between -100 and 100`;
    }
  }
  for (const key of THRESHOLD_KEYS) {
    const v = thresholds[key];
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 100) {
      return `thresholds.${key} must be a number between 0 and 100`;
    }
  }
  if (!(thresholds.veryLikelyRealMax < thresholds.needsReviewMax && thresholds.needsReviewMax < thresholds.likelyFalseMax)) {
    return 'thresholds must be strictly increasing: veryLikelyRealMax < needsReviewMax < likelyFalseMax';
  }
  return null;
}
