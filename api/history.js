/**
 * Vercel Serverless Function — /api/history.js
 * Proxies requests to Anthropic to secure the API key.
 */

// Keep function warm — reuse fetch across invocations
const anthropicUrl = 'https://api.anthropic.com/v1/messages';

export default async function handler(req, res) {
  // 1. Accept POST requests only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed — Use POST' });
  }

  // 2. Read API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server' });
  }

  // 3. Basic request validation (Hardening)
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request: Missing messages' });
  }

  // RULE: Before changing this limit, measure the real prompt in src/app.js first.
  // The historian prompt template (fetchHistory in app.js) is ~3,480 chars of
  // static text + a short year label (~8 chars). Total per request: ~3,490 chars.
  // Do NOT set a limit below 10,000 without re-measuring after any prompt change.
  // History: original limit of 5,000 blocked all requests (bug fixed in v1.0.2).
  const promptText = messages.map(m => m.content || '').join('');
  if (promptText.length < 100 || promptText.length > 50000) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    // 4. Forward the request to Anthropic
    const response = await fetch(anthropicUrl, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta':    'prompt-caching-2024-07-31',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // 5. Return the Anthropic response as-is
    return res.status(response.status).json(data);

  } catch (err) {
    // 5. Return clean JSON error for fetch failures
    console.error('[Vercel Backend]', err);
    return res.status(500).json({
      error: 'Backend fetch failed',
      message: err.message
    });
  }
}
