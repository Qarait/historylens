import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
delete process.env.NODE_ENV;

const { default: historyHandler } = await import('../api/history.js');
const { default: eventsHandler } = await import('../api/events.js');
const { enforceRateLimit } = await import('../api/_lib/request.js');
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
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; },
    setHeader(key, value) { this._headers[key] = value; },
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
  const responses = groundingResponses(2020);
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('wikipedia.org')) return responses.shift();

    const forwarded = JSON.parse(options.body);
    assert.equal(forwarded.model, 'claude-haiku-4-5-20251001');
    assert.equal(forwarded.temperature, 0);
    assert.match(forwarded.messages[0].content, /Year: 2020 CE/);
    assert.match(forwarded.messages[0].content, /Source Event 1/);
    assert.doesNotMatch(forwarded.messages[0].content, /malicious client prompt/);
    return jsonResponse({ content: [{ text: '{}' }] });
  };

  const { req, res } = makeMocks({
    year: 2020,
    messages: [{ role: 'user', content: 'malicious client prompt' }],
    model: 'untrusted-model',
  });
  await historyHandler(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._headers['X-HistoryLens-Grounding'], 'wikipedia');
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
    if (String(url).includes('wikipedia.org')) return responses.shift();

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
  assert.match(res._body.grounding.url, /2021$/);
});

test('events endpoint rejects a source not present in chronology', async () => {
  const responses = groundingResponses(2022);
  const payload = validEventsPayload();
  payload.events.forEach(event => { event.date = '2022'; });
  payload.events[0].source_title = 'Invented Source';

  globalThis.fetch = async url => {
    if (String(url).includes('wikipedia.org')) return responses.shift();
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
