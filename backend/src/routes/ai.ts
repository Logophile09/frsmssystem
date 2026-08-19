import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { callGroq, GroqNotConfiguredError } from '../lib/groqClient';

const router = Router();
router.use(requireAuth);

function handleGroqError(err: unknown, res: import('express').Response) {
  if (err instanceof GroqNotConfiguredError) {
    return res.status(503).json({ error: err.message });
  }
  // eslint-disable-next-line no-console
  console.error('[AI route] Groq API error:', err);
  return res.status(502).json({ error: 'AI-assist request failed. The decision tree / manual workflow is unaffected.' });
}

/**
 * POST /api/ai/dispatch-analysis
 *
 * Body: { input: DispatchInput, result: DispatchRecommendation }
 * (both objects as produced by frontend/src/lib/dispatchRecommendation.ts)
 *
 * The model never sees raw incident PII beyond what's already in the
 * decision-tree input/output, and it never picks the units itself -- it
 * reads the tree's own trace and explains it in plain language, plus
 * flags anything a dispatcher should double-check. The deterministic
 * decision tree result is always the source of truth for what gets
 * dispatched; this is a narration layer on top of it.
 */
router.post('/dispatch-analysis', async (req, res) => {
  const { input, result } = req.body ?? {};
  if (!input || !result) {
    return res.status(400).json({ error: 'input and result are required' });
  }

  const systemPrompt =
    'You are an assistive analysis layer inside a fire and rescue dispatch system. ' +
    'You are given the exact output of a deterministic decision-tree engine (never a black box) ' +
    'and asked to explain it in plain language for a human dispatcher, who retains full authority ' +
    'to override it. Be concise (3-5 sentences), operational, and flag anything worth double-checking ' +
    '(e.g. a fleet shortfall, borderline severity call, or missing information). ' +
    'Never invent units, personnel counts, or facts not present in the provided data.';

  const userPrompt = `Incident input:\n${JSON.stringify(input, null, 2)}\n\nDecision tree result:\n${JSON.stringify(result, null, 2)}`;

  try {
    const analysis = await callGroq(systemPrompt, userPrompt, 400);
    res.json({ analysis });
  } catch (err) {
    handleGroqError(err, res);
  }
});

/**
 * POST /api/ai/incident-summary
 *
 * Body: { incident_number, incident_type, location, severity, description,
 *         status, personnel?: string[], vehicles?: string[] }
 *
 * Automated processing of an emergency incident log into a short,
 * report-ready paragraph -- used on the Incidents / Reports pages.
 * Purely a drafting aid: nothing here is written back to the incident
 * record automatically, a human reviews and saves it.
 */
router.post('/incident-summary', async (req, res) => {
  const incident = req.body ?? {};
  if (!incident.incident_type || !incident.location) {
    return res.status(400).json({ error: 'At minimum incident_type and location are required' });
  }

  const systemPrompt =
    'You write concise, factual post-incident report summaries for a fire and rescue service ' +
    'management system, in the style of an official incident log entry. Use only the facts given -- ' +
    'do not speculate about cause, fault, or casualties beyond what is stated. Plain paragraph, ' +
    'no headers, 2-4 sentences, past tense.';

  const userPrompt = `Incident record:\n${JSON.stringify(incident, null, 2)}`;

  try {
    const summary = await callGroq(systemPrompt, userPrompt, 300);
    res.json({ summary });
  } catch (err) {
    handleGroqError(err, res);
  }
});

export default router;
