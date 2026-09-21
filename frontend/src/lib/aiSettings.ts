import { api } from './api';
import type { ScoreThresholds, ScoreWeights } from './falseAlarmScoring';

export interface AiSettingsResponse {
  weights: ScoreWeights;
  thresholds: ScoreThresholds;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface AiAccuracyResponse {
  total: number;
  correct: number;
  accuracy: number | null;
  confusionMatrix: {
    truePositive: number;
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
  };
  recentMisses: {
    id: number;
    incident_number: string;
    location: string;
    ai_false_alarm_score: number;
    ai_false_alarm_label: string;
    false_alarm_review_status: string;
  }[];
}

export const aiSettingsApi = {
  getWeights: (): Promise<AiSettingsResponse> => api.get('/ai-settings/false-alarm-weights'),
  saveWeights: (weights: ScoreWeights, thresholds: ScoreThresholds): Promise<AiSettingsResponse> =>
    api.put('/ai-settings/false-alarm-weights', { weights, thresholds }),
  resetWeights: (): Promise<AiSettingsResponse> => api.post('/ai-settings/false-alarm-weights/reset', {}),
  getAccuracy: (): Promise<AiAccuracyResponse> => api.get('/ai-settings/false-alarm-accuracy'),
};
