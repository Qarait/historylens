/**
 * Vercel Serverless Function — /api/history.js
 * Proxies requests to Anthropic to secure the API key.
 */

const baseUrl = 'https://api.anthropic.com/v1/messages';

// In-memory Rate Limiter (Best-effort for serverless)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 6;              // Max requests per window

export default async function handler(req, res) {
  // 1. CORS & Origin Protection
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowedOrigin = 
    origin.includes('localhost') || 
    origin.includes('historylens.app') || 
    origin.includes('vercel.app');

  if (!isAllowedOrigin && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'CORS: Unauthorized origin' });
  }

  // 2. Accept POST requests only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed — Use POST' });
  }

  // 3. Simple Rate Limiting (IP-based)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > RATE_LIMIT_WINDOW) {
    userData.count = 1;
    userData.startTime = now;
  } else {
    userData.count++;
  }
  rateLimitMap.set(ip, userData);

  if (userData.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  // 4. Read API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server' });
  }

  // 5. Strict Input Validation (Hardening)
  const body = req.body || {};
  
  // Year validation
  const year = parseInt(body.year);
  if (isNaN(year) || year < -3000 || year > 2025) {
    return res.status(400).json({ error: 'Invalid year. Only -3000 to 2025 CE is supported.' });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request: Missing messages' });
  }

  const promptText = body.messages[0].content || '';
  if (promptText.length < 100 || promptText.length > 50000) {
    return res.status(400).json({ error: 'Invalid request: Prompt size out of bounds' });
  }

  try {
    // 6. Forward the request to Anthropic API
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: body.model || 'claude-3-haiku-20240307',
        messages: body.messages,
        max_tokens: body.max_tokens || 3000,
        stream: body.stream || false
      }),
    });

    if (response.status !== 200) {
      const errorData = await response.json();
      console.error('ANTHROPIC ERROR:', response.status, JSON.stringify(errorData));
      return res.status(response.status).json(errorData);
    }

    // 7. Handle streaming vs non-streaming
    if (body.stream) {
      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Content-Encoding', 'none'); 

      if (!response.body) throw new Error('No response body from Anthropic');

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      const data = await response.json();
      return res.status(200).json(data);
    }

  } catch (err) {
    console.error('[Vercel Backend]', err);
    return res.status(500).json({
      error: 'Backend fetch failed',
      message: err.message
    });
  }
}
