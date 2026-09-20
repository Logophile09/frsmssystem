/**
 * Thin wrapper around the Groq API (OpenAI-compatible chat completions).
 *
 * Used for two assistive (never autonomous) features, per the
 * human-in-the-loop principle the system is designed around:
 *
 *   1. Dispatch decision-tree analysis -- after the deterministic
 *      decision tree in dispatchRecommendation.ts resolves a
 *      recommendation, the model is asked to read the same trace and
 *      write a short plain-language explanation for the dispatcher.
 *      It never changes the recommended units -- it only narrates the
 *      tree's own output.
 *   2. Incident log summarization -- condenses an incident's free-text
 *      description/timeline into a short paragraph for reports.
 *
 * Both endpoints degrade gracefully (return a clear error, not a crash)
 * if GROQ_API_KEY isn't configured, so the rest of the system keeps
 * working without it.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Overridable via GROQ_MODEL so this can be swapped (e.g. for a smaller/
// faster or larger/higher-quality Groq-hosted model) without a code change.
// openai/gpt-oss-120b is Groq's current recommended production model (their
// prior default, llama-3.3-70b-versatile, was deprecated by Groq in June
// 2026 and fully shut down mid-August 2026 -- see
// https://console.groq.com/docs/deprecations).
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export class GroqNotConfiguredError extends Error {
  constructor() {
    super('GROQ_API_KEY is not set on the backend -- AI-assist features are unavailable.');
    this.name = 'GroqNotConfiguredError';
  }
}

export async function callGroq(systemPrompt: string, userPrompt: string, maxTokens = 500): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqNotConfiguredError();

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_completion_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Groq API request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) throw new Error('Groq API returned no text content');
  return text;
}
