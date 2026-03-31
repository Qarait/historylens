/**
 * Vercel Serverless Function — /api/history.js
 * Proxies requests to Groq to secure the API key.
 */

const baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(req, res) {
  // 1. Accept POST requests only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed — Use POST' });
  }

  // 2. Read API key from environment
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API key not configured on server' });
  }

  // 3. Basic request validation (Hardening)
  const body = req.body || {};
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request: Missing messages' });
  }

  const promptText = body.messages[0].content || '';
  if (promptText.length < 100 || promptText.length > 50000) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    // 4. Forward the request to Groq API
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.status !== 200) {
      console.error('GROQ ERROR:', response.status, JSON.stringify(data));
    }

    // 5. Return the Groq response as-is
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
