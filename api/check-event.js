/**
 * Vercel Serverless Function - /api/check-event.js
 * Searches a year chronology for a user-supplied event without another AI call.
 */

import { formatHistoricalYear, parseHistoricalYear } from './_lib/config.js';
import { enforceOrigin, enforceRateLimit } from './_lib/request.js';
import { findChronologyMatches, getYearGrounding } from './_lib/wikipedia.js';

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 120;

export default async function handler(req, res) {
  if (!enforceOrigin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed - Use POST' });
  }
  if (!await enforceRateLimit(req, res, { scope: 'event-check', limit: 30 })) return;

  const year = parseHistoricalYear(req.body?.year);
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (year === null) {
    return res.status(400).json({ error: 'Invalid historical year.' });
  }
  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: 'Enter an event name between 3 and 120 characters.' });
  }

  try {
    const grounding = await getYearGrounding(year);
    const matches = findChronologyMatches(grounding.entries, query);
    const found = matches.length > 0;

    res.setHeader?.('X-HistoryLens-Grounding', 'wikipedia');
    return res.status(200).json({
      query,
      year_label: formatHistoricalYear(year),
      found,
      matches,
      explanation: found
        ? 'This event appears in the year chronology. The main dashboard is selective, so source inclusion does not guarantee placement in its regional cards.'
        : 'No close match was found in this year chronology. This does not prove the event did not happen; try another name or verify it with a specialist source.',
      grounding: {
        name: grounding.sourceName,
        url: grounding.yearPageUrl,
      },
    });
  } catch (error) {
    console.error('[Event Check API]', error);
    return res.status(503).json({
      error: 'Historical sources are temporarily unavailable. Please try again.',
    });
  }
}
