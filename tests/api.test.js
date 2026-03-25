/**
 * tests/api.test.js
 *
 * Unit tests for api/history.js validation logic.
 * Uses Node's built-in test runner — no external dependencies.
 * Run with: node --test tests/api.test.js
 *
 * Strategy: import the handler directly and supply mock req/res objects.
 * For the one test that requires a valid prompt, globalThis.fetch is
 * stubbed so no real Anthropic call is made.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Minimal mock of Vercel's req/res objects.
 */
function makeMocks(body, method = 'POST') {
  const req = { method, body };
  const res = {
    _status: null,
    _body:   null,
    status(code) { this._status = code; return this; },
    json(data)   { this._body   = data; return this; },
  };
  return { req, res };
}

/**
 * Build a messages array with a single user message of exact `length` chars.
 */
function msgOf(length) {
  return [{ role: 'user', content: 'A'.repeat(length) }];
}

// Stub process.env.ANTHROPIC_API_KEY so the handler sees a key
process.env.ANTHROPIC_API_KEY = 'sk-test-stub';

// Import the handler (ESM)
const { default: handler } = await import('../api/history.js');

// ── Tests ─────────────────────────────────────────────────────────────────────

test('valid prompt (3500 chars) passes validation — NOT 400', async () => {
  // Stub fetch so no real HTTP call is made
  globalThis.fetch = async () => ({
    status: 200,
    json:   async () => ({ type: 'message', content: [] }),
  });

  const { req, res } = makeMocks({ messages: msgOf(3500) });
  await handler(req, res);

  assert.notEqual(res._status, 400, 'Should not be rejected with 400');
  assert.notEqual(res._status, 405, 'Should not be rejected with 405');
});

test('prompt too short (99 chars) is rejected with 400', async () => {
  const { req, res } = makeMocks({ messages: msgOf(99) });
  await handler(req, res);

  assert.equal(res._status, 400);
});

test('prompt too long (50001 chars) is rejected with 400', async () => {
  const { req, res } = makeMocks({ messages: msgOf(50001) });
  await handler(req, res);

  assert.equal(res._status, 400);
});

test('missing messages array is rejected with 400', async () => {
  const { req, res } = makeMocks({});
  await handler(req, res);

  assert.equal(res._status, 400);
});

test('GET request is rejected with 405', async () => {
  const { req, res } = makeMocks({}, 'GET');
  await handler(req, res);

  assert.equal(res._status, 405);
});
