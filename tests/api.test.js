import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
delete process.env.NODE_ENV;

const { default: historyHandler } = await import('../api/history.js');
const { default: periodHandler } = await import('../api/period.js');
const { default: eventsHandler } = await import('../api/events.js');
const { default: checkEventHandler } = await import('../api/check-event.js');
const { enforceRateLimit } = await import('../api/_lib/request.js');
const { getRegionProfile } = await import('../api/_lib/region-profiles.js');
const { sampleHistoricalYears } = await import('../api/_lib/wikipedia.js');
const { localizedMaxTokens, normalizeLanguage } = await import('../api/_lib/config.js');
const {
  buildHistoryPrompt,
  buildKeyEventsPrompt,
  buildPeriodPrompt,
} = await import('../api/_lib/prompts.js');
const {
  classifySourceUrl,
  getResearchSources,
} = await import('../api/_lib/scholarly-sources.js');
const originalFetch = globalThis.fetch;

function makeMocks(body, method = 'POST') {
  const req = {
    method,
    body,
    headers: {
      origin: 'http://localhost:3000',
      'x-forwarded-for': `${Math.random()}`,
    },
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    _chunks: [],
    _ended: false,
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; },
    setHeader(key, value) { this._headers[key] = value; },
    write(chunk) { this._chunks.push(String(chunk)); return true; },
    end() { this._ended = true; return this; },
  };
  return { req, res };
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function hasHostname(value, hostname) {
  try {
    return new URL(String(value)).hostname === hostname;
  } catch {
    return false;
  }
}

function groundingResponses(year = 2020) {
  const lines = Array.from({ length: 7 }, (_, index) =>
    `*[[January ${index + 1}]] - [[Source Event ${index + 1}]] changes the political landscape in region ${index + 1}.`
  ).join('\n');

  return [
    jsonResponse({
      parse: {
        title: String(year),
        sections: [{ index: '2', line: 'Events' }],
      },
    }),
    jsonResponse({
      parse: { wikitext: `=== January ===\n${lines}` },
    }),
  ];
}

function validEventsPayload() {
  return {
    selection_note: 'Selected for consequence and geographic breadth.',
    events: Array.from({ length: 7 }, (_, index) => ({
      title: `Event ${index + 1}`,
      date: '2020',
      location: `Region ${index + 1}`,
      category: 'Politics',
      summary: 'A factual summary of what happened. A second factual sentence.',
      significance: 'This changed the long-term political landscape.',
      source_title: `Source Event ${index + 1}`,
    })),
  };
}

function validPeriodPayload() {
  return {
    period_label: '1960-1969 CE',
    era_description: 'A Decade of Upheaval',
    hook_moment: 'The decade opened under rigid blocs and closed amid social revolt.',
    global_context: 'Decolonization and mass politics redistributed power. Technology compressed distance.',
    period_phases: [
      { stage: 'Opening', years: '1960-1962', headline: 'Old Orders Strain', description: 'Postwar systems came under pressure.' },
      { stage: 'Pivot', years: '1963-1967', headline: 'Movements Break Through', description: 'War and protest accelerated political change.' },
      { stage: 'Outcome', years: '1968-1969', headline: 'Authority Loses Ground', description: 'Revolt and reform altered the next decade.' },
    ],
    global_signals: {
      war_intensity: 'High',
      political_fragmentation: 'Rising',
      economic_pressure: 'Moderate',
      trade_activity: 'Rising',
      ideological_tension: 'Critical',
    },
    cross_region: {
      contrast: 'Decolonization expanded sovereignty while Cold War blocs constrained it.',
      tensions: [{ regions: ['europe', 'asia'], note: 'Ideological rivalry linked regional conflicts.' }],
    },
    regions: Object.fromEntries(['europe', 'asia', 'namerica', 'africa'].map(region => [
      region,
      {
        state: 'Constraint to challenge',
        thesis_headline: 'Authority Met Organized Resistance',
        thesis_argument: 'Institutions lost control as social movements widened political participation.',
        events: [
          { year: '1960-1963', title: `${region} opening shift`, description: 'An opening development changed regional power.', rank: 'primary' },
          { year: '1968-1969', title: `${region} closing shift`, description: 'A later development redirected the region.', rank: 'secondary' },
        ],
        key_figures: ['Figure One', 'Figure Two'],
        significance: 'The transformation shaped the following decade.',
      },
    ])),
  };
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  delete process.env.NODE_ENV;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('history endpoint owns prompt and model settings', async () => {
  const responses = groundingResponses(2021);
  globalThis.fetch = async (url, options = {}) => {
    if (hasHostname(url, 'en.wikipedia.org')) return responses.shift();

    const forwarded = JSON.parse(options.body);
    assert.equal(forwarded.model, 'claude-haiku-4-5-20251001');
    assert.equal(forwarded.temperature, 0);
    assert.match(forwarded.messages[0].content, /Year: 2021 CE/);
    assert.match(forwarded.messages[0].content, /Source Event 1/);
    assert.doesNotMatch(forwarded.messages[0].content, /malicious client prompt/);
    return jsonResponse({ content: [{ text: '{}' }] });
  };

  const { req, res } = makeMocks({
    year: 2021,
    messages: [{ role: 'user', content: 'malicious client prompt' }],
    model: 'untrusted-model',
  });
  await historyHandler(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._headers['X-HistoryLens-Grounding'], 'wikipedia');
});

test('language normalization only allows supported app languages', () => {
  assert.equal(localizedMaxTokens(100, 'en'), 100);
  assert.equal(localizedMaxTokens(100, 'ru'), 160);
  assert.equal(normalizeLanguage('ru'), 'ru');
  assert.equal(normalizeLanguage('RU'), 'ru');
  assert.equal(normalizeLanguage('ru-RU'), 'ru');
  assert.equal(normalizeLanguage('en-US'), 'en');
  assert.equal(normalizeLanguage('fr'), 'en');
  assert.equal(normalizeLanguage(null), 'en');
});

test('prompts can request natural Russian while preserving schema keys', () => {
  const profile = getRegionProfile(1885);
  const historyPrompt = buildHistoryPrompt(1885, '', profile, 'ru');
  const periodPrompt = buildPeriodPrompt(1914, 1918, '', profile, 'ru');
  const eventsPrompt = buildKeyEventsPrompt(2020, { context: '{source: Sample Event}' }, 'ru');

  assert.match(historyPrompt, /natural Russian/i);
  assert.match(historyPrompt, /JSON keys/i);
  assert.match(periodPrompt, /natural Russian/i);
  assert.match(eventsPrompt, /natural Russian/i);
  assert.match(eventsPrompt, /category.*requested language/i);
  assert.match(historyPrompt, /Never wrap JSON in markdown or code fences/i);
  assert.match(historyPrompt, /Keep Russian responses concise/i);
});

test('history endpoint forwards Russian language into the owned prompt', async () => {
  const responses = groundingResponses(2021);
  globalThis.fetch = async (url, options = {}) => {
    if (hasHostname(url, 'en.wikipedia.org')) return responses.shift();

    const forwarded = JSON.parse(options.body);
    assert.match(forwarded.messages[0].content, /natural Russian/i);
    assert.match(forwarded.messages[0].content, /Year: 2021 CE/);
    assert.ok(forwarded.max_tokens > 2800);
    return jsonResponse({ content: [{ text: '{}' }] });
  };

  const { req, res } = makeMocks({ year: 2021, language: 'ru' });
  await historyHandler(req, res);

  assert.equal(res._status, 200);
});
test('region profiles change at historical era boundaries', () => {
  assert.equal(getRegionProfile(500).id, 'ancient');
  assert.equal(getRegionProfile(501).id, 'medieval');
  assert.equal(getRegionProfile(1499).id, 'medieval');
  assert.equal(getRegionProfile(1500).id, 'early-modern');
  assert.equal(getRegionProfile(1800).id, 'early-modern');
  assert.equal(getRegionProfile(1801).id, 'modern');
});

test('ancient prompt uses era-adjusted global regions and a smaller event budget', async () => {
  const responses = groundingResponses(-44);
  globalThis.fetch = async (url, options = {}) => {
    if (hasHostname(url, 'en.wikipedia.org')) return responses.shift();
    const forwarded = JSON.parse(options.body);
    const prompt = forwarded.messages[0].content;
    assert.match(prompt, /Ancient world regions/);
    assert.match(prompt, /"mediterranean"/);
    assert.match(prompt, /"americas_pacific"/);
    assert.match(prompt, /Exactly 1 primary \+ 1 secondary event per region/);
    assert.match(prompt, /Analyze the whole world rather than fixating/);
    return jsonResponse({ content: [{ text: '{}' }] });
  };

  const { req, res } = makeMocks({ year: -44, stream: false });
  await historyHandler(req, res);

  const profile = JSON.parse(decodeURIComponent(res._headers['X-HistoryLens-Region-Profile']));
  assert.equal(profile.id, 'ancient');
  assert.equal(profile.regions.length, 5);
  assert.equal(res._status, 200);
});

test('period endpoint samples chronologies and owns the change-over-time prompt', async () => {
  const payload = validPeriodPayload();
  globalThis.fetch = async (url, options = {}) => {
    const value = String(url);
    if (hasHostname(value, 'en.wikipedia.org')) {
      if (value.includes('prop=sections')) {
        return jsonResponse({
          parse: { title: 'sample', sections: [{ index: '2', line: 'Events' }] },
        });
      }
      return jsonResponse({
        parse: {
          wikitext: '=== January ===\n* [[January 1]] - [[Sample Event]] changes the political landscape across regions.',
        },
      });
    }

    const forwarded = JSON.parse(options.body);
    assert.equal(forwarded.max_tokens, 3400);
    assert.match(forwarded.messages[0].content, /Period: 1960-1969 CE/);
    assert.match(forwarded.messages[0].content, /Opening, Pivot, Outcome/);
    assert.match(forwarded.messages[0].content, /Analyze the whole world rather than fixating/);
    assert.match(forwarded.messages[0].content, /exactly two objects/);
    assert.match(forwarded.messages[0].content, /Never use markdown fences/);
    return jsonResponse({ content: [{ text: JSON.stringify(payload) }] });
  };

  const { req, res } = makeMocks({ startYear: 1960, endYear: 1969 });
  await periodHandler(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._headers['X-HistoryLens-Grounding'], 'wikipedia');
  const sources = JSON.parse(decodeURIComponent(res._headers['X-HistoryLens-Sources']));
  assert.equal(sources.length, 5);
  const profile = JSON.parse(decodeURIComponent(res._headers['X-HistoryLens-Region-Profile']));
  assert.equal(profile.id, 'modern');
});

test('period sampling is bounded and handles the missing year zero', () => {
  assert.deepEqual(sampleHistoricalYears(1960, 1969), [1960, 1962, 1965, 1967, 1969]);
  assert.deepEqual(sampleHistoricalYears(-2, 2), [-2, -1, 1, 2]);
});

test('period endpoint rejects reversed and oversized ranges', async () => {
  const reversed = makeMocks({ startYear: 1969, endYear: 1960 });
  await periodHandler(reversed.req, reversed.res);
  assert.equal(reversed.res._status, 400);

  const oversized = makeMocks({ startYear: 1900, endYear: 1925 });
  await periodHandler(oversized.req, oversized.res);
  assert.equal(oversized.res._status, 400);
  assert.match(oversized.res._body.error, /at most 25 years/i);
});

test('curated 2020 returns without Anthropic or Wikipedia access', async () => {
  delete process.env.ANTHROPIC_API_KEY;
  globalThis.fetch = async () => {
    throw new Error('Curated years must not make external requests');
  };

  const { req, res } = makeMocks({ year: 2020, stream: false });
  await historyHandler(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._headers['X-HistoryLens-Curated'], 'true');
  assert.equal(res._headers['X-HistoryLens-Reviewed-At'], '2026-06-13');
  const data = JSON.parse(res._body.content[0].text);
  assert.equal(data.regions.asia.events[1].title, 'Second Nagorno-Karabakh War');
  assert.equal(Object.keys(data.regions).length, 4);
  for (const region of Object.values(data.regions)) {
    assert.equal(region.events.length, 3);
    assert.equal(region.events.filter(event => event.rank === 'primary').length, 1);
  }
});

test('curated 2020 preserves the browser streaming protocol', async () => {
  const { req, res } = makeMocks({ year: 2020, stream: true });
  await historyHandler(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._headers['Content-Type'], 'text/event-stream');
  assert.equal(res._ended, true);
  const line = res._chunks.join('').trim().replace(/^data:\s*/, '');
  const event = JSON.parse(line);
  const data = JSON.parse(event.delta.text);
  assert.equal(data.year_label, '2020 CE');
  assert.equal(data.regions.asia.events[1].title, 'Second Nagorno-Karabakh War');
});

test('history endpoint rejects invalid year and method', async () => {
  const invalid = makeMocks({ year: 0 });
  await historyHandler(invalid.req, invalid.res);
  assert.equal(invalid.res._status, 400);

  const get = makeMocks({}, 'GET');
  await historyHandler(get.req, get.res);
  assert.equal(get.res._status, 405);
});

test('events endpoint returns seven verified citations', async () => {
  const responses = groundingResponses(2021);
  const payload = validEventsPayload();
  payload.events.forEach(event => { event.date = '2021'; });

  globalThis.fetch = async (url, options = {}) => {
    const value = String(url);
    if (value.includes('prop=externallinks')) {
      return jsonResponse({
        parse: { externallinks: ['https://www.archives.gov/research/sample'] },
      });
    }
    if (hasHostname(value, 'en.wikipedia.org')) return responses.shift();
    if (hasHostname(value, 'api.crossref.org')) {
      const query = new URL(value).searchParams.get('query.bibliographic');
      const title = query.replace(/\s+2021$/, '');
      return jsonResponse({
        message: {
          items: [{
            DOI: '10.1234/history.test',
            title: [title],
            publisher: 'Historical Review',
            published: { 'date-parts': [[2024]] },
            score: 80,
          }],
        },
      });
    }

    const forwarded = JSON.parse(options.body);
    assert.match(forwarded.messages[0].content, /Use only events explicitly supported/);
    assert.match(forwarded.messages[0].content, /\{source: Source Event 1\}/);
    return jsonResponse({ content: [{ text: JSON.stringify(payload) }] });
  };

  const { req, res } = makeMocks({ year: 2021 });
  await eventsHandler(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._body.events.length, 7);
  assert.equal(res._headers['X-HistoryLens-Grounding'], 'wikipedia');
  assert.equal(
    res._body.events[0].source_url,
    'https://en.wikipedia.org/wiki/Source_Event_1'
  );
  assert.deepEqual(
    res._body.events[0].sources.map(source => source.quality),
    ['archive', 'academic']
  );
  assert.equal(res._body.grounding.qualityLabel, 'Reference chronology');
  assert.match(res._body.grounding.url, /2021$/);
});

test('source quality rules classify scholarly and authoritative domains', () => {
  assert.deepEqual(classifySourceUrl('https://www.archives.gov/research/test'), {
    quality: 'archive',
    qualityLabel: 'Archive',
  });
  assert.deepEqual(classifySourceUrl('https://history.ox.ac.uk/article'), {
    quality: 'academic',
    qualityLabel: 'Academic',
  });
  assert.deepEqual(classifySourceUrl('https://www.who.int/news/item'), {
    quality: 'primary',
    qualityLabel: 'Primary / institutional',
  });
  assert.equal(classifySourceUrl('https://example.com/blog'), null);
});

test('scholarly enrichment degrades cleanly when discovery is unavailable', async () => {
  globalThis.fetch = async () => {
    throw new Error('discovery unavailable');
  };
  const sources = await getResearchSources('Unique unavailable source test', '1999');
  assert.deepEqual(sources, []);
});

test('events endpoint rejects a source not present in chronology', async () => {
  const responses = groundingResponses(2022);
  const payload = validEventsPayload();
  payload.events.forEach(event => { event.date = '2022'; });
  payload.events[0].source_title = 'Invented Source';

  globalThis.fetch = async url => {
    if (hasHostname(url, 'en.wikipedia.org')) return responses.shift();
    return jsonResponse({ content: [{ text: JSON.stringify(payload) }] });
  };

  const { req, res } = makeMocks({ year: 2022 });
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await eventsHandler(req, res);
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Could not generate source-grounded key events');
});

test('events endpoint fails clearly when chronology is unavailable', async () => {
  globalThis.fetch = async () => jsonResponse({}, 503);
  const { req, res } = makeMocks({ year: 2023 });

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await eventsHandler(req, res);
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(res._status, 503);
  assert.match(res._body.error, /sources are temporarily unavailable/i);
});

test('event checker finds a chronology match without an AI request', async () => {
  const wikitext = [
    '=== September ===',
    '* [[September 27]] - The [[Second Nagorno-Karabakh War]] begins between Armenia and Azerbaijan.',
    '=== November ===',
    '* [[November 10]] - The [[2020 Nagorno-Karabakh ceasefire agreement]] ends major fighting.',
  ].join('\n');
  const responses = [
    jsonResponse({
      parse: {
        title: '2019',
        sections: [{ index: '2', line: 'Events' }],
      },
    }),
    jsonResponse({ parse: { wikitext } }),
  ];
  let fetchCount = 0;
  globalThis.fetch = async url => {
    fetchCount++;
    assert.match(String(url), /wikipedia\.org/);
    return responses.shift();
  };

  const { req, res } = makeMocks({ year: 2019, query: 'Nagorno-Karabakh War' });
  await checkEventHandler(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._body.found, true);
  assert.equal(res._body.matches[0].sourceTitle, 'Second Nagorno-Karabakh War');
  assert.match(res._body.matches[0].sourceUrl, /Second_Nagorno-Karabakh_War/);
  assert.equal(fetchCount, 2);
});

test('event checker validates query length', async () => {
  const { req, res } = makeMocks({ year: 2020, query: 'x' });
  await checkEventHandler(req, res);
  assert.equal(res._status, 400);
  assert.match(res._body.error, /between 3 and 120/i);
});

test('production origin validation rejects lookalike domains', async () => {
  process.env.NODE_ENV = 'production';
  const { req, res } = makeMocks({ year: 2020 });
  req.headers.origin = 'https://historylens.app.attacker.example';

  await historyHandler(req, res);
  assert.equal(res._status, 403);
});

test('rate limiter uses Redis when production credentials are configured', async () => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return jsonResponse([{ result: 13 }, { result: 1 }]);
  };

  const { req, res } = makeMocks({});
  const allowed = await enforceRateLimit(req, res, {
    scope: 'events',
    limit: 12,
  });

  assert.equal(allowed, false);
  assert.equal(res._status, 429);
  assert.equal(res._headers['X-RateLimit-Mode'], 'redis');
});
