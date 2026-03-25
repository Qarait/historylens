/**
 * Vercel Serverless Function — /api/history.js
 * Proxies requests to Anthropic to secure the API key.
 */

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

  // Validate combined prompt length to prevent proxy abuse
  const promptText = messages.map(m => m.content || '').join('');
  if (promptText.length < 100 || promptText.length > 5000) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    // 4. Forward the request to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('STATUS:', response.status);
    console.log('RESPONSE:', JSON.stringify(data));

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
