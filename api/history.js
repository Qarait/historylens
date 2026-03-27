/**
 * Vercel Serverless Function — /api/history.js
 * Proxies requests to Anthropic to secure the API key.
 */

// Keep function warm
const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';

export default async function handler(req, res) {
  // 1. Accept POST requests only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed — Use POST' });
  }

  // 2. Read API key from environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  // 3. Basic request validation (Hardening)
  const { payload, model } = req.body || {};
  if (!payload || !Array.isArray(payload.contents) || payload.contents.length === 0) {
    return res.status(400).json({ error: 'Invalid request: Missing contents' });
  }

  // RULE: Before changing this limit, measure the real prompt in src/app.js first.
  // The historian prompt template (fetchHistory in app.js) is ~3,480 chars of
  // static text + a short year label (~8 chars). Total per request: ~3,490 chars.
  // Do NOT set a limit below 10,000 without re-measuring after any prompt change.
  // History: original limit of 5,000 blocked all requests (bug fixed in v1.0.2).
  const promptText = payload.contents[0].parts.map(p => p.text || '').join('');
  if (promptText.length < 100 || promptText.length > 50000) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    // 4. Forward the request to Gemini API
    const targetModel = model || 'gemini-3-flash-preview';
    const requestUrl = `${baseUrl}${targetModel}:generateContent?key=${apiKey}`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status !== 200) {
      console.error('GEMINI ERROR:', response.status, JSON.stringify(data));
    }

    // 5. Return the Gemini response as-is
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
