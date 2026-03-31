/**
 * Vercel Serverless Function — /api/history.js
 * Proxies requests to Anthropic to secure the API key.
 */

const baseUrl = 'https://api.anthropic.com/v1/messages';

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
  const body = req.body || {};
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request: Missing messages' });
  }

  const promptText = body.messages[0].content || '';
  if (promptText.length < 100 || promptText.length > 50000) {
    return res.status(400).json({ error: 'Invalid request: Prompt size out of bounds' });
  }

  try {
    // 4. Forward the request to Anthropic API
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
    });

    if (response.status !== 200) {
      const errorData = await response.json();
      console.error('ANTHROPIC ERROR:', response.status, JSON.stringify(errorData));
      return res.status(response.status).json(errorData);
    }

    // 5. Handle streaming vs non-streaming
    if (body.stream) {
      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Content-Encoding', 'none'); // Disable compression for real-time

      if (!response.body) throw new Error('No response body from Anthropic');

      // Forward chunks from Anthropic directly to client
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Write chunk directly to response
        res.write(value);
      }
      res.end();
    } else {
      // Standard JSON response
      const data = await response.json();
      return res.status(200).json(data);
    }

  } catch (err) {
    // 6. Return clean JSON error for fetch failures
    console.error('[Vercel Backend]', err);
    return res.status(500).json({
      error: 'Backend fetch failed',
      message: err.message
    });
  }
}
