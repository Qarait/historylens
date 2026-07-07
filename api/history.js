/**
 * Vercel Serverless Function - /api/history.js
 * Owns the historian prompt and proxies a validated request to Anthropic.
 */

import {
  ANTHROPIC_URL,
  HISTORY_MAX_TOKENS,
  MODEL,
  localizedMaxTokens,
  normalizeLanguage,
  parseHistoricalYear,
} from './_lib/config.js';
import { buildHistoryPrompt } from './_lib/prompts.js';
import { enforceOrigin, enforceRateLimit } from './_lib/request.js';
import { getYearGrounding } from './_lib/wikipedia.js';
import { getCuratedYear } from './_data/curated-years.js';
import {
  getRegionProfile,
  setRegionProfileHeader,
} from './_lib/region-profiles.js';

export default async function handler(req, res) {
  if (!enforceOrigin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed - Use POST' });
  }
  if (!await enforceRateLimit(req, res, { scope: 'history', limit: 8 })) return;

  const year = parseHistoricalYear(req.body?.year);
  if (year === null) {
    return res.status(400).json({ error: 'Invalid historical year.' });
  }
  const stream = req.body?.stream === true;
  const language = normalizeLanguage(req.body?.language);
  const regionProfile = getRegionProfile(year);
  setRegionProfileHeader(res, regionProfile);
  const curated = getCuratedYear(year);
  if (curated && language === 'en') return sendCuratedResponse(res, curated, stream);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server' });
  }

  let groundingContext = '';
  try {
    const grounding = await getYearGrounding(year);
    groundingContext = grounding.context;
    res.setHeader?.('X-HistoryLens-Grounding', 'wikipedia');
    res.setHeader?.('X-HistoryLens-Source-Name', grounding.sourceName);
    res.setHeader?.('X-HistoryLens-Source-Url', grounding.yearPageUrl);
    res.setHeader?.('X-HistoryLens-Source-Quality', 'reference');
  } catch (error) {
    console.error('[History Grounding]', error.message);
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
          content: buildHistoryPrompt(year, groundingContext, regionProfile, language),
        }],
        max_tokens: localizedMaxTokens(HISTORY_MAX_TOKENS, language),
        temperature: 0,
        stream,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Anthropic History]', response.status, JSON.stringify(errorData));
      return res.status(response.status).json(normalizeProviderError(errorData));
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Content-Encoding', 'none');

      if (!response.body) throw new Error('No response body from Anthropic');
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      return res.end();
    }

    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('[History API]', error);
    return res.status(500).json({ error: 'History generation failed' });
  }
}

function sendCuratedResponse(res, curated, stream) {
  const text = JSON.stringify(curated.data);
  res.setHeader?.('X-HistoryLens-Grounding', 'wikipedia');
  res.setHeader?.('X-HistoryLens-Source-Name', curated.sourceName);
  res.setHeader?.('X-HistoryLens-Source-Url', curated.sourceUrl);
  res.setHeader?.('X-HistoryLens-Source-Quality', 'reviewed');
  res.setHeader?.('X-HistoryLens-Curated', 'true');
  res.setHeader?.('X-HistoryLens-Reviewed-At', curated.reviewedAt);
  res.setHeader?.('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');

  if (!stream) {
    return res.status(200).json({
      content: [{ type: 'text', text }],
      stop_reason: 'end_turn',
    });
  }

  res.status?.(200);
  res.setHeader?.('Content-Type', 'text/event-stream');
  res.setHeader?.('Content-Encoding', 'none');
  res.write(`data: ${JSON.stringify({
    type: 'content_block_delta',
    delta: { type: 'text_delta', text },
  })}\n\n`);
  return res.end();
}

function normalizeProviderError(data) {
  return {
    error: data?.error?.message || data?.error || 'History provider request failed',
  };
}
