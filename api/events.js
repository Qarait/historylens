/**
 * Vercel Serverless Function - /api/events.js
 * Generates seven source-grounded key events for a validated year.
 */

import {
  ANTHROPIC_URL,
  EVENTS_MAX_TOKENS,
  MODEL,
  parseHistoricalYear,
} from './_lib/config.js';
import { buildKeyEventsPrompt } from './_lib/prompts.js';
import { enforceOrigin, enforceRateLimit } from './_lib/request.js';
import { getYearGrounding, wikipediaArticleUrl } from './_lib/wikipedia.js';

export default async function handler(req, res) {
  if (!enforceOrigin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed - Use POST' });
  }
  if (!await enforceRateLimit(req, res, { scope: 'events', limit: 12 })) return;

  const year = parseHistoricalYear(req.body?.year);
  if (year === null) {
    return res.status(400).json({ error: 'Invalid historical year.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server' });
  }

  let grounding;
  try {
    grounding = await getYearGrounding(year);
    res.setHeader?.('X-HistoryLens-Grounding', 'wikipedia');
    res.setHeader?.('X-HistoryLens-Source-Name', grounding.sourceName);
    res.setHeader?.('X-HistoryLens-Source-Url', grounding.yearPageUrl);
  } catch (error) {
    console.error('[Events Grounding]', error);
    return res.status(503).json({
      error: 'Historical sources are temporarily unavailable. Please try again.',
    });
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
        max_tokens: EVENTS_MAX_TOKENS,
        temperature: 0,
        messages: [{ role: 'user', content: buildKeyEventsPrompt(year, grounding) }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData?.error?.message || errorData?.error || 'Event provider request failed',
      });
    }

    const apiData = await response.json();
    const rawContent = apiData.content?.[0]?.text || '';
    const match = rawContent.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found');

    const parsed = JSON.parse(match[0]);
    validateEventsResponse(parsed, grounding.allowedTitles);
    parsed.events = parsed.events.map(event => ({
      ...event,
      source_url: wikipediaArticleUrl(event.source_title),
    }));
    parsed.grounding = {
      name: grounding.sourceName,
      url: grounding.yearPageUrl,
    };

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('[Events API]', error);
    return res.status(500).json({ error: 'Could not generate source-grounded key events' });
  }
}

function validateEventsResponse(data, allowedTitles) {
  if (!data || typeof data !== 'object' || typeof data.selection_note !== 'string') {
    throw new Error('Invalid events response');
  }
  if (!Array.isArray(data.events) || data.events.length !== 7) {
    throw new Error('Expected exactly seven events');
  }

  const requiredFields = [
    'title', 'date', 'location', 'category', 'summary', 'significance', 'source_title',
  ];
  for (const event of data.events) {
    for (const field of requiredFields) {
      if (typeof event?.[field] !== 'string' || event[field].trim() === '') {
        throw new Error(`Invalid event field: ${field}`);
      }
    }
    if (!allowedTitles.has(event.source_title)) {
      throw new Error(`Unverified event source: ${event.source_title}`);
    }
  }
}
