/**
 * Thin wrapper around the Anthropic Messages API.
 *
 * Used for two assistive (never autonomous) features, per the
 * human-in-the-loop principle the system is designed around:
 *
 *   1. Dispatch decision-tree analysis -- after the deterministic
 *      decision tree in dispatchRecommendation.ts resolves a
 *      recommendation, Claude is asked to read the same trace and
 *      write a short plain-language explanation for the dispatcher.
 *      It never changes the recommended units -- it only narrates the
 *      tree's own output.
 *   2. Incident log summarization -- condenses an incident's free-text
 *      description/timeline into a short paragraph for reports.
 *
 * Both endpoints degrade gracefully (return a clear error, not a crash)
 * if ANTHROPIC_API_KEY isn't configured, so the rest of the system
 * keeps working without it.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

export class ClaudeNotConfiguredError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not set on the backend -- AI-assist features are unavailable.');
    this.name = 'ClaudeNotConfiguredError';
  }
}

export async function callClaude(systemPrompt: string, userPrompt: string, maxTokens = 500): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ClaudeNotConfiguredError();

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Claude API request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('Claude API returned no text content');
  return text;
}
