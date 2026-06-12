/**
 * Vercel Serverless Function - /api/events.js
 * Generates seven globally balanced key events for a validated year.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MIN_YEAR = -3000;
const MAX_YEAR = 2026;
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 6;
const rateLimitMap = new Map();

export default async function handler(req, res) {
  const headers = req.headers || {};
  const origin = headers.origin || headers.referer || '';
  const isAllowedOrigin =
    origin.includes('localhost') ||
    origin.includes('historylens.app') ||
    origin.includes('historylens-psi.vercel.app');

  if (!isAllowedOrigin && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'CORS: Unauthorized origin' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed - Use POST' });
  }

  const year = Number.parseInt(req.body?.year, 10);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR || year === 0) {
    return res.status(400).json({ error: 'Invalid year. Use -3000 to 2026, excluding year 0.' });
  }

  const ip = headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server' });
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2400,
        temperature: 0,
        messages: [{ role: 'user', content: getKeyEventsPrompt(year) }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const apiData = await response.json();
    const rawContent = apiData.content?.[0]?.text || '';
    const match = rawContent.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found');

    const parsed = JSON.parse(match[0]);
    validateEventsResponse(parsed);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[Vercel Events]', err);
    return res.status(500).json({ error: 'Could not generate key events' });
  }
}

function getKeyEventsPrompt(year) {
  const yearLabel = year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  const previousYear = year === 1 ? '1 BCE' : year < 0
    ? `${Math.abs(year + 1)} BCE`
    : `${year - 1} CE`;
  const nextYear = year === -1 ? '1 CE' : year < 0
    ? `${Math.abs(year - 1)} BCE`
    : `${year + 1} CE`;

  return `You are a careful world historian. Identify exactly seven key events or developments that occurred during ${yearLabel}.

SELECTION RULES:
- Rank by lasting political, territorial, social, scientific, economic, environmental, or cultural consequence.
- Include events outside Western Europe and the United States. Do not equate global significance with English-language media attention.
- For modern years, prioritize wars, ceasefires, revolutions, disasters, discoveries, and policy changes that altered territorial control or regional power.
- Include a major regional conflict when it materially changed borders, sovereignty, security, or the balance of power, even if it received less global coverage.
- Aim for geographic breadth. Use no more than two events from one country and no more than three from one broad region.
- Every event must have occurred, begun, ended, or reached a decisive turning point during ${yearLabel}.
- Exclude events from adjacent years, especially ${previousYear} and ${nextYear}. Do not merge a ${yearLabel} precursor with an event or consequence that actually occurred in another year.
- Before returning the JSON, silently verify the historical year of every event title. If the exact year is uncertain, replace the event.
- Distinguish confirmed fact from interpretation. Do not invent dates, casualties, quotations, or citations.
- Keep the summary factual and the significance analytical.

Return only valid JSON with this exact structure:
{
  "selection_note": "One sentence explaining that the list balances consequence and geographic breadth.",
  "events": [
    {
      "title": "Specific event name",
      "date": "Date or date range within ${yearLabel}",
      "location": "Country or region",
      "category": "Conflict | Politics | Society | Science | Economy | Culture | Environment",
      "summary": "Two concise factual sentences describing what happened.",
      "significance": "One concise sentence explaining the lasting consequence."
    }
  ]
}

HARD CONSTRAINTS:
- Exactly seven events.
- All six fields must be non-empty strings for every event.
- Return JSON only, with no markdown fences or commentary.`;
}

function validateEventsResponse(data) {
  if (!data || typeof data !== 'object' || typeof data.selection_note !== 'string') {
    throw new Error('Invalid events response');
  }
  if (!Array.isArray(data.events) || data.events.length !== 7) {
    throw new Error('Expected exactly seven events');
  }

  const requiredFields = ['title', 'date', 'location', 'category', 'summary', 'significance'];
  for (const event of data.events) {
    for (const field of requiredFields) {
      if (typeof event?.[field] !== 'string' || event[field].trim() === '') {
        throw new Error(`Invalid event field: ${field}`);
      }
    }
  }
}
