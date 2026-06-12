import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
delete process.env.NODE_ENV;

const { default: historyHandler } = await import('../api/history.js');
const { default: eventsHandler } = await import('../api/events.js');
const originalFetch = globalThis.fetch;

function makeMocks(body, method = 'POST') {
  const req = {
    method,
    body,
    headers: { origin: 'http://localhost:3000', 'x-forwarded-for': `${Math.random()}` },
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; },
    setHeader() {},
  };
  return { req, res };
}

function validHistoryBody(overrides = {}) {
  return {
    year: 2020,
    model: 'claude-haiku-4-5-20251001',
    messages: [{ role: 'user', content: 'A'.repeat(3500) }],
    max_tokens: 2800,
    ...overrides,
  };
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
    })),
  };
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  delete process.env.NODE_ENV;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('history proxy forwards a valid Anthropic request', async () => {
  globalThis.fetch = async (_url, options) => {
    const forwarded = JSON.parse(options.body);
    assert.equal(forwarded.messages[0].content.length, 3500);
    assert.equal(forwarded.max_tokens, 2800);
    return { status: 200, json: async () => ({ content: [{ text: '{}' }] }) };
  };

  const { req, res } = makeMocks(validHistoryBody());
  await historyHandler(req, res);
  assert.equal(res._status, 200);
});

test('history proxy rejects invalid prompt and method', async () => {
  const short = makeMocks(validHistoryBody({ messages: [{ role: 'user', content: 'short' }] }));
  await historyHandler(short.req, short.res);
  assert.equal(short.res._status, 400);

  const get = makeMocks({}, 'GET');
  await historyHandler(get.req, get.res);
  assert.equal(get.res._status, 405);
});

test('history proxy rejects an invalid year', async () => {
  const { req, res } = makeMocks(validHistoryBody({ year: 3000 }));
  await historyHandler(req, res);
  assert.equal(res._status, 400);
});

test('events endpoint returns exactly seven validated events', async () => {
  const payload = validEventsPayload();
  globalThis.fetch = async (_url, options) => {
    const forwarded = JSON.parse(options.body);
    assert.match(forwarded.messages[0].content, /exactly seven/i);
    assert.match(forwarded.messages[0].content, /territorial control/i);
    assert.match(forwarded.messages[0].content, /2019 CE and 2021 CE/i);
    assert.equal(forwarded.temperature, 0);
    return {
      ok: true,
      status: 200,
      json: async () => ({ content: [{ text: JSON.stringify(payload) }] }),
    };
  };

  const { req, res } = makeMocks({ year: 2020 });
  await eventsHandler(req, res);
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, payload);
});

test('events endpoint rejects year zero and non-POST requests', async () => {
  const zero = makeMocks({ year: 0 });
  await eventsHandler(zero.req, zero.res);
  assert.equal(zero.res._status, 400);

  const get = makeMocks({}, 'GET');
  await eventsHandler(get.req, get.res);
  assert.equal(get.res._status, 405);
});

test('events endpoint rejects malformed model output', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      content: [{ text: JSON.stringify({ selection_note: 'Incomplete', events: [] }) }],
    }),
  });

  const { req, res } = makeMocks({ year: 2020 });
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await eventsHandler(req, res);
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Could not generate key events');
});
