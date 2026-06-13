/**
 * Vercel Serverless Function - /api/period.js
 * Generates a bounded change-over-time analysis from sampled chronologies.
 */

import {
  ANTHROPIC_URL,
  MAX_PERIOD_YEARS,
  MODEL,
  PERIOD_MAX_TOKENS,
  historicalYearDistance,
  parseHistoricalYear,
} from './_lib/config.js';
import { buildPeriodPrompt } from './_lib/prompts.js';
import { enforceOrigin, enforceRateLimit } from './_lib/request.js';
import { getPeriodGrounding } from './_lib/wikipedia.js';
import {
  getRegionProfileForPeriod,
  setRegionProfileHeader,
} from './_lib/region-profiles.js';

export default async function handler(req, res) {
  if (!enforceOrigin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed - Use POST' });
  }
  if (!await enforceRateLimit(req, res, { scope: 'period', limit: 6 })) return;

  const startYear = parseHistoricalYear(req.body?.startYear);
  const endYear = parseHistoricalYear(req.body?.endYear);
  if (startYear === null || endYear === null || startYear >= endYear) {
    return res.status(400).json({ error: 'Invalid historical period.' });
  }
  const distance = historicalYearDistance(startYear, endYear);
  if (distance > MAX_PERIOD_YEARS - 1) {
    return res.status(400).json({
      error: `Historical periods may span at most ${MAX_PERIOD_YEARS} years.`,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server' });
  }

  const regionProfile = getRegionProfileForPeriod(startYear, endYear);
  setRegionProfileHeader(res, regionProfile);

  let groundingContext = '';
  try {
    const grounding = await getPeriodGrounding(startYear, endYear);
    groundingContext = grounding.context;
    res.setHeader?.('X-HistoryLens-Grounding', 'wikipedia');
    res.setHeader?.(
      'X-HistoryLens-Sources',
      encodeURIComponent(JSON.stringify(grounding.sources))
    );
  } catch (error) {
    console.error('[Period Grounding]', error.message);
    res.setHeader?.('X-HistoryLens-Grounding', 'model-only');
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
        messages: [{
          role: 'user',
          content: buildPeriodPrompt(
            startYear,
            endYear,
            groundingContext,
            regionProfile
          ),
        }],
        max_tokens: PERIOD_MAX_TOKENS,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Anthropic Period]', response.status, JSON.stringify(errorData));
      return res.status(response.status).json({
        error: errorData?.error?.message || errorData?.error || 'Period provider request failed',
      });
    }

    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('[Period API]', error);
    return res.status(500).json({ error: 'Period generation failed' });
  }
}
