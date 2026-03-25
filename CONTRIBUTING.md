# Contributing to HistoryLens

## Validation Rules

Three rules that prevent the class of bug that broke production in v1.0.2
(validation rejecting every real request):

### 1. Measure before you limit

The historian prompt is ~3,500 characters. Any server-side character limit
below that breaks the app silently.

**Before adding any validation limit to `api/history.js`, open `src/app.js`
and measure the actual size of the data the proxy will receive.**

```js
// Quick measurement — run in Node before writing a limit
const prompt = /* paste the full template string */;
console.log(prompt.length); // check this number first
```

### 2. Test your own happy path

Before any hardening code ships, run one real request through it.
If your own app cannot pass your own validation, the limit is wrong.

A unit test that only checks rejection cases is insufficient. The test suite
in `tests/api.test.js` includes a realistic 3,500-character payload for
exactly this reason — keep it passing on every change.

### 3. Changelog every validation change

Every change to a limit or validation rule in `api/history.js` requires a
`CHANGELOG.md` entry that states:

- What the limit is
- Why that number was chosen
- What data size it was measured against

If you have to write "limit: 5,000 characters" and your prompt is
3,500 characters, you will catch the mistake before it ships.

---

## Security

- The `ANTHROPIC_API_KEY` must never appear in client-side code.
  All AI calls go through `api/history.js`.
- All AI-generated text must go through `esc()` before any `innerHTML`
  insertion. See the XSS prevention notes in `README.md`.
