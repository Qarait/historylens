# Changelog

All notable changes to HistoryLens are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.6.0] - 2026-06-14

### Added
- Decade and custom-period analysis for ranges of up to 25 years.
- A three-stage Opening, Pivot, and Outcome arc for explaining change over time.
- Two ranked regional turning points using the adaptive region profile appropriate to the period.
- Shareable period URLs and notable-period shortcuts.
- Sampled chronology grounding from up to five representative years.

### Performance
- Each period uses one model request rather than one request per year.
- Period results are cached for the browser session and use a bounded 3,000-token response budget.

---

## [1.5.0] — 2026-06-13

### Added
- Era-aware region profiles for ancient, medieval, early-modern, and modern history.
- Historical region metadata shared through the existing API response headers.
- Compact context labels for adaptive single-year and mixed-era comparison results.

### Changed
- Pre-1801 results use five historically meaningful regions with two events each, reducing the total event budget from 12 to 10.
- Prompts now require global coverage and explicitly reject fixation on one conflict, country, or civilization.

---

## [1.4.0] — 2026-06-13

### Added
- Curated verified-year infrastructure with an API fast path that bypasses external retrieval and AI generation.
- A reviewed 2020 edition that explicitly includes the Second Nagorno-Karabakh War.
- Compact review metadata in the results attribution.

### Performance
- Curated responses use the existing response schema and streaming protocol, so no alternate rendering system or additional browser request is required.

---

## [1.3.0] — 2026-06-13

### Added
- On-demand event chronology checker for investigating events omitted from the selective dashboard.
- Deterministic chronology matching with no additional AI request, plus session caching in the browser.
- On-demand "7 Key Events" panels for single-year and comparison results.
- Globally balanced event selection with dates, locations, categories, summaries, and historical significance.
- A dedicated server-side `/api/events` endpoint with input validation, rate limiting, response validation, and browser session caching.
- Wikipedia year-chronology grounding with verified source links and attribution.
- Optional Upstash Redis rate limiting for coordination across Vercel instances.
- GitHub Actions CI with linting, HTML validation, unit tests, and Playwright browser tests.
- Separate frontend modules for API streaming and key-event rendering.

### Fixed
- Updated API tests from the retired Gemini request shape to the current Anthropic proxy contract.
- Prevented clients from supplying model names, token budgets, or historian prompts.
- Fixed a race where fast cached responses could be hidden by the previous-result animation.
- Replaced substring-based origin checks with exact hostname validation.
- Added keyboard and screen-reader state to the comparison toggle.

---

## [1.0.4] — 2026-03-26

### Removed
- Oceania region removed for v1.0 stability. The 5-region 
  schema was producing ~9,800 char responses causing 
  token truncation. 4-region schema produces ~7,800 chars,
  safely within 2800 token budget.
- Oceania planned for reintroduction in v1.1 with 
  dedicated token budget and testing.

### Changed  
- `CONFIG.maxTokens` reduced from 3500 to 2800 following 
  Oceania removal. Safe minimum for 4-region schema is 
  2500. Current value has 300 token headroom.

---

## [1.0.3] — 2026-03-25

### Changed
- `CONFIG.maxTokens` reduced from 4000 → 1800 (v1.0.3), then corrected
  to 2200 after 1800 caused schema truncation errors. The 5-region JSON
  schema (5 regions × 3 events + signals + cross-region + hook) requires
  at least 2200 tokens. **2200 is the confirmed minimum. Do not go below.**
- Added `anthropic-beta: prompt-caching-2024-07-31` header to reduce
  latency on repeated requests.
- Moved `anthropicUrl` to module level in `api/history.js`
  for warm invocation reuse.

### Note
- `maxTokens` was found at 4000 — origin unknown, likely
  changed during IDE debugging sessions without changelog
  entry. This is why CONTRIBUTING.md rule 3 exists.

---

## [1.0.2] — 2026-03-25

### Fixed
- Server-side prompt validation was rejecting all requests
  due to an incorrect 5,000 character limit. The historian
  prompt is ~3,500 characters. Limit corrected to 50,000.

---

## [1.0.1] — 2025-03

### Added
- **Secure Backend Proxy** — Vercel Serverless Function implementation for API key security.
- **Vercel Routing** — `vercel.json` configuration for unified routing.
- **Hardening** — Range validation (-3000 to 2024), UI concurrency locks, and Year 0 handling.

---

## [1.0.0] — 2025-01

### Added
- **Five-region coverage** — Europe, Asia, the Americas, Africa, and Oceania shown side by side for any year
- **Oceania included with honest sparse-data handling** — prompt instructs the model to acknowledge limited records rather than fabricate events; absence of written records is treated as historically meaningful
- **Analytical output layer** — each region produces a thesis headline (a verdict, not a description), a thesis argument, ranked events (1 primary + 2 secondary), notable figures, and a "Why it matters" conclusion
- **Event ranking system** — primary event receives distinct visual treatment (larger title, gold left border, gold background); secondary events are subordinate in size and colour
- **Global Signals readout** — five structured metrics per search: War Intensity, Political Fragmentation, Economic Pressure, Trade Activity, Ideological Tension; each value colour-coded (green/amber/red)
- **Cross-regional contrast block** — analytical statement connecting all regions, with three bilateral tension notes using colour-coded region dots
- **Landing hook** — four hardcoded example year snapshots cycle automatically on page load (1593, 1347, 1821, 1914), each showing a contrast sentence and the system metric; visible before any interaction
- **Comparison mode** — toggle to fetch two years in parallel and render them stacked for direct comparison
- **Exploration timeline** — horizontal timeline of explored years, persisted to localStorage, with chronological ordering and scroll-to-current behaviour
- **Saved comparisons** — one-click save of any two years in the timeline; persisted to localStorage; reloads in compare mode
- **Curated threads** — six pre-built thematic pathways (The Rise of Empires, World Religions Spread, The Age of Collision, Revolution & Nation, The Century of War, The Cold World Order) with per-year entry points
- **Surprise Me** — random year selection from a curated pool of 70+ historically significant years
- **API key error detection** — distinguishes 401/403 (key missing/invalid), 429 (rate limit), and malformed JSON with specific user-facing guidance
- **Feedback bar** — thumbs up/down accuracy rating and "Report details" mailto link after every result
- **Print stylesheet** — clean black-and-white output suitable for classroom handouts; hides all navigation and interactive chrome
- **Copy Summary** — one-click clipboard export of the full result as plain text, including thesis arguments and "Why it matters" text
- **Share link** — copies a `?year=YYYY` URL to clipboard for linking to a specific year
- **Scroll reveal** — landing sections animate in on scroll using IntersectionObserver
- **⌘K / Ctrl+K** — global keyboard shortcut to focus the year input
- **Mobile navigation** — hamburger drawer with all nav links; toggles between ☰ and ✕
- **Skeleton loading** — five shimmer cards during API fetch, replacing the previous spinner
- **Progress bar** — thin top-of-page bar during loading with eased fill animation
- **Session cache** — in-memory Map caches API responses for the session; repeat queries are instant

### Architecture
- Split into three files: `index.html` (structure), `src/styles.css` (all styles), `src/app.js` (all logic)
- `CONFIG` object centralises model name, token limit, API endpoint, cache flag, storage keys, and timing constants
- All AI-generated text enters the DOM via `textContent` or `esc()` — no raw AI output in `innerHTML`
- `boldNames()` operates on pre-escaped strings; only injects `<strong>` around a fixed allowlist of proper nouns
- `localStorage` reads/writes wrapped in try/catch for silent failure in private mode or on quota exceeded
- Prompt uses an explicit banned-word list and required-verb list to enforce analytical tone

### Prompt engineering
- Banned words: `ongoing`, `attempted`, `continued`, `various`, `numerous`, `significant`, `important`, `experienced`, `saw`, `witnessed`, `underwent`, `faced`, `played a role`, `attempted reforms`
- Required verbs: `triggered`, `consolidated`, `fractured`, `collapsed`, `accelerated`, `cemented`, `destabilized`, `expanded`, `contracted`, `eclipsed`, `redirected`, `dismantled`, `upended`, `reinforced`, `exposed`, `suppressed`, `entrenched`, `imposed`
- Event description enforces pattern: `[Subject] + [strong verb] + [object] + [consequence]`
- Hard constraint: exactly 1 primary + 2 secondary events per region; model cannot deviate

---

## Roadmap

### [1.1.0] — Planned
- [ ] Source citations alongside events (Wikipedia / Britannica links)
- [ ] Improved Oceania coverage for pre-contact periods

### [1.2.0] — Planned
- [ ] Teacher mode — discussion questions generated alongside the analysis
- [ ] Offline mode — pre-generated cache of the 50 most-searched years
- [ ] Export to PDF with structured layout (not just browser print)

### [Future]
- [ ] Expanded regions (Central Asia as a standalone region)
- [ ] Decade view — summarise a 10-year span rather than a single year
- [ ] Classroom accounts — save and share timelines across students
