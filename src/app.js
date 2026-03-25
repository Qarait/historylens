/**
 * HistoryLens — app.js
 *
 * Architecture notes:
 *  - CONFIG centralises all tunable values (model, timing, storage keys)
 *  - DOM manipulation uses textContent / createElement to prevent XSS;
 *    innerHTML is only used for static, author-controlled template strings
 *    (never for user input or AI-generated text injected without escaping)
 *  - AI output is always sanitised through esc() before any DOM insertion
 *  - boldNames() works on pre-escaped strings and only injects known safe tags
 *  - localStorage is wrapped so quota / private-mode errors are silent
 */

'use strict';

/* ── CONFIG ─────────────────────────────────────────────────────────────── */
/*
 * SETUP: Replace 'YOUR_API_KEY_HERE' below with your Anthropic API key.
 * Get a free key at: https://console.anthropic.com
 *
 * For production / school deployment, move the API call to a backend proxy
 * (Vercel Edge Function, Cloudflare Worker, etc.) so the key is never
 * exposed in client-side code. See README.md for details.
 */
const CONFIG = {
  model:              'claude-haiku-4-5-20251001',
  maxTokens:          2200,
  apiEndpoint:        '/api/history',
  hookCycleInterval:  5000,   // ms between landing hook rotations
  loadingMsgInterval: 2800,   // ms between loading status messages
  cacheEnabled:       true,   // in-memory cache for session
  storageKeyTimeline: 'hl_timeline_v1',
  storageKeyComps:    'hl_saved_comps_v1',
  minYear:            -3000,
  maxYear:            2024,
};

/* ── REGION DEFINITIONS ──────────────────────────────────────────────────── */
const REGIONS = [
  { id: 'europe',   label: 'Europe',       sub: 'Western & Eastern Europe',        icon: '🏰' },
  { id: 'asia',     label: 'Asia',          sub: 'East, South & Middle East',       icon: '🏯' },
  { id: 'namerica', label: 'The Americas',  sub: 'North, Central & South America',  icon: '🦅' },
  { id: 'africa',   label: 'Africa',        sub: 'Sub-Saharan & North Africa',      icon: '🌍' },
  { id: 'oceania',  label: 'Oceania',       sub: 'Pacific, Australia & New Zealand',icon: '🌊' },
];

/* ── STATIC CONTENT ──────────────────────────────────────────────────────── */
const LOADING_MSGS = [
  'Analyzing global patterns…',
  'Mapping regional developments…',
  'Identifying primary events…',
  'Detecting cross-regional signals…',
  'Structuring the global analysis…',
];

const SIGNAL_LABELS = {
  war_intensity:           'War Intensity',
  political_fragmentation: 'Political Fragmentation',
  economic_pressure:       'Economic Pressure',
  trade_activity:          'Trade Activity',
  ideological_tension:     'Ideological Tension',
};

/**
 * Hardcoded landing hook examples.
 * contrast strings are HTML — they only contain <strong> tags with static text.
 * They do NOT include any user input or API output so innerHTML is safe here.
 */
const HOOK_EXAMPLES = [
  {
    year:     1593,
    label:    '1593 CE',
    era:      'The Age of Empire & Exploration',
    contrast: 'While <strong>Europe</strong> fractured under religious war, <strong>Mughal India</strong> reached its administrative peak — and the <strong>Americas</strong> remained under accelerating colonial extraction.',
    metric:   { label: 'Global Stability: Uneven', cls: 'mixed' },
    regions:  [
      { id: 'europe',   state: 'Fragmented'       },
      { id: 'asia',     state: 'Consolidated'      },
      { id: 'namerica', state: 'Colonial pressure' },
      { id: 'africa',   state: 'Trade expansion'   },
    ],
  },
  {
    year:     1347,
    label:    '1347 CE',
    era:      'The Black Death Arrives',
    contrast: 'The plague that <strong>Europe</strong> called the end of the world was already decimating populations across <strong>Central Asia</strong> — carried west along the same trade routes that had connected civilizations for centuries.',
    metric:   { label: 'Global Stability: Collapsing', cls: 'unstable' },
    regions:  [
      { id: 'europe',   state: 'Catastrophic decline' },
      { id: 'asia',     state: 'Origin epicenter'      },
      { id: 'namerica', state: 'Untouched'             },
      { id: 'africa',   state: 'Partially exposed'     },
    ],
  },
  {
    year:     1821,
    label:    '1821 CE',
    era:      'The Age of Revolution',
    contrast: 'As <strong>Latin America</strong> dismantled Spanish colonial rule across an entire continent, <strong>Ottoman</strong> power contracted in the Balkans — and <strong>Qing China</strong> faced early signs of the internal pressure that would fracture it within decades.',
    metric:   { label: 'Political Fragmentation: Rising', cls: 'mixed' },
    regions:  [
      { id: 'europe',   state: 'Post-Napoleon instability' },
      { id: 'asia',     state: 'Declining empires'         },
      { id: 'namerica', state: 'Independence wave'         },
      { id: 'africa',   state: 'Pre-colonial peak'         },
    ],
  },
  {
    year:     1914,
    label:    '1914 CE',
    era:      'The World on the Brink',
    contrast: 'A single assassination in <strong>Sarajevo</strong> triggered every alliance Europe had built — while <strong>Japan</strong> expanded quietly in the Pacific and <strong>Africa</strong> remained almost entirely under colonial rule it had no voice in dismantling.',
    metric:   { label: 'War Intensity: Critical', cls: 'unstable' },
    regions:  [
      { id: 'europe',   state: 'Alliance collapse'       },
      { id: 'asia',     state: 'Imperial expansion'      },
      { id: 'namerica', state: 'Neutral, watching'       },
      { id: 'africa',   state: 'Colonized — no agency'   },
    ],
  },
];

const THREADS = [
  { name: 'The Rise of Empires',    desc: 'Ancient world power consolidation',       color: 't-red',  years: [-550, -323, -221, -44, 79, 220]         },
  { name: 'World Religions Spread', desc: 'Faith reshapes civilizations',             color: 't-gold', years: [33, 570, 622, 800, 1054, 1517]          },
  { name: 'The Age of Collision',   desc: 'When hemispheres crashed into each other', color: 't-blue', years: [1405, 1453, 1492, 1521, 1588, 1648]     },
  { name: 'Revolution & Nation',    desc: 'The world remade by popular sovereignty',  color: 't-teal', years: [1776, 1789, 1804, 1821, 1848, 1871]     },
  { name: 'The Century of War',     desc: 'How the modern world broke and rebuilt',   color: 't-red',  years: [1905, 1914, 1929, 1939, 1945, 1948]     },
  { name: 'The Cold World Order',   desc: 'Power, ideology, and proxy conflict',      color: 't-blue', years: [1948, 1957, 1963, 1969, 1979, 1989]     },
];

const SURPRISE_POOL = [
  -3000,-2500,-2000,-1500,-1000,-800,-500,-400,-323,-264,-221,-149,-44,
  79,105,220,313,410,476,570,618,711,793,800,900,1066,1095,1187,1206,
  1215,1258,1347,1368,1405,1431,1453,1492,1517,1543,1588,1618,1648,
  1687,1688,1776,1789,1804,1815,1821,1848,1853,1865,1869,1871,1884,
  1898,1905,1914,1917,1929,1939,1945,1948,1957,1963,1969,1989,1991,2001,2008,
];

/* ── STATE ───────────────────────────────────────────────────────────────── */
const cache          = new Map();       // year (int) → parsed API response
const searchHistory  = [];              // [{ year, era }]
let compareMode      = false;
let loadingActive     = false;
let loadingTimer     = null;
let progressTimer    = null;
let currentYear      = null;
let hookIndex        = 0;
let hookTimer        = null;
let slowWarningTimer = null;

let timelineYears    = loadStorage(CONFIG.storageKeyTimeline, []);
let savedComparisons = loadStorage(CONFIG.storageKeyComps,    []);

/* ── STORAGE HELPERS ─────────────────────────────────────────────────────── */
function loadStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — fail silently
  }
}

/* ── XSS-SAFE DOM HELPERS ────────────────────────────────────────────────── */
/**
 * Escape a value for use inside innerHTML.
 * All AI-generated text must pass through this before DOM insertion.
 */
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Bold known region/empire names in hook text.
 * Input MUST already be escaped via esc() before calling this.
 * Only injects <strong> tags with the original matched text — no user data.
 */
function boldNames(escapedStr) {
  const KNOWN_NAMES = [
    'Europe','Asia','Africa','Americas','Ming China','Ottoman','Columbus',
    'Rome','Roman','Han China','Mongol','British','French','Spanish',
    'Portuguese','Byzantine','Aztec','Inca','Mughal','Safavid','Polynesian',
    'Sarajevo','Latin America','Qing China','Central Asia',
  ];
  let result = escapedStr;
  for (const name of KNOWN_NAMES) {
    // The string is already escaped, so we match the escaped version
    const escapedName = esc(name);
    result = result.replace(
      new RegExp(`\\b${escapedName}\\b`, 'g'),
      `<strong>${escapedName}</strong>`
    );
  }
  return result;
}

/* ── INITIALISATION ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Year inputs
  document.getElementById('yearInput')
    .addEventListener('keydown', e => { if (e.key === 'Enter') explore(); });
  document.getElementById('yearInput2')
    .addEventListener('keydown', e => { if (e.key === 'Enter') explore(); });

  // Search and utility buttons
  document.getElementById('searchBtn')       .addEventListener('click',  explore);
  document.getElementById('surpriseBtn')     .addEventListener('click',  surpriseMe);
  document.getElementById('btnPrint')        .addEventListener('click',  doPrint);
  document.getElementById('btnCopy')         .addEventListener('click',  doCopy);
  document.getElementById('btnHistory')      .addEventListener('click',  toggleHistory);
  document.getElementById('btnShare')        .addEventListener('click',  shareUrl);
  document.getElementById('fbPos')           .addEventListener('click',  () => submitFeedback('positive'));
  document.getElementById('fbNeg')           .addEventListener('click',  () => submitFeedback('negative'));
  document.getElementById('btnReport')       .addEventListener('click',  reportIssue);
  document.getElementById('btnSaveComp')     .addEventListener('click',  saveComparison);
  document.getElementById('btnClearTimeline').addEventListener('click',  clearTimeline);
  document.getElementById('exampleCta1453')  .addEventListener('click',  () => setYear(1453));
  document.getElementById('footerPrint')     .addEventListener('click',  e => { e.preventDefault(); doPrint(); });

  // Compare toggle
  document.getElementById('compareTrack').addEventListener('click', toggleCompare);

  // Mobile menu
  document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileNav);

  // Mobile nav links — close drawer on navigation
  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // Era buttons — use data-year, no onclick attributes
  document.querySelectorAll('.era-btn').forEach(btn => {
    const year = parseInt(btn.dataset.year, 10);
    btn.addEventListener('click', () => setYear(year));
  });

  // ⌘K / Ctrl+K — focus year input from anywhere
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('yearInput');
      input.focus();
      input.select();
    }
  });

  // Scroll reveal — observe .reveal elements
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Landing hook
  startHookCycle();

  // Threads
  renderThreads();

  // Restore persisted timeline
  if (timelineYears.length > 0) {
    renderTimeline(null);
    document.getElementById('timelinePanel').classList.add('visible');
  }

  // URL param — ?year=1821
  const params = new URLSearchParams(location.search);
  const urlYear = parseInt(params.get('year'), 10);
  if (urlYear && !isNaN(urlYear)) {
    document.getElementById('yearInput').value = urlYear;
    explore();
  }
});

/* ── MOBILE NAV ──────────────────────────────────────────────────────────── */
function toggleMobileNav() {
  const nav  = document.getElementById('mobileNav');
  const btn  = document.getElementById('mobileMenuBtn');
  const open = nav.classList.toggle('open');
  btn.textContent = open ? '✕' : '☰';
  btn.setAttribute('aria-expanded', String(open));
}

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  const btn = document.getElementById('mobileMenuBtn');
  btn.textContent = '☰';
  btn.setAttribute('aria-expanded', 'false');
}

/* ── COMPARE TOGGLE ──────────────────────────────────────────────────────── */
function toggleCompare() {
  compareMode = !compareMode;
  document.getElementById('compareTrack').classList.toggle('on', compareMode);
  document.getElementById('compareRow').classList.toggle('visible', compareMode);
  document.getElementById('searchBtn').textContent = compareMode ? 'Explore Comparison' : 'Explore →';
  if (compareMode) document.getElementById('yearInput2').focus();
}

/* ── YEAR HELPERS ────────────────────────────────────────────────────────── */
/** Format year as "1821 CE" or "44 BCE" */
function formatYear(year) {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

/* ── QUICK NAV ───────────────────────────────────────────────────────────── */
function setYear(year) {
  document.getElementById('yearInput').value = year;

  // Highlight the matching era button by data-year attribute
  document.querySelectorAll('.era-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.year, 10) === year);
  });

  explore();
}

/* ── SURPRISE ME ─────────────────────────────────────────────────────────── */
function surpriseMe() {
  const year = SURPRISE_POOL[Math.floor(Math.random() * SURPRISE_POOL.length)];
  document.getElementById('yearInput').value = year;
  showToast(`🎲 Jumping to ${formatYear(year)}…`);
  setTimeout(() => setYear(year), 400);
}

/* ── LANDING HOOK ────────────────────────────────────────────────────────── */
function renderLandingHook(index) {
  const ex = HOOK_EXAMPLES[index];

  // Safe: textContent for plain text fields
  document.getElementById('lhYear').textContent = ex.label;
  document.getElementById('lhEra').textContent  = ex.era;

  // contrast is static author HTML (only <strong> tags with hardcoded names)
  document.getElementById('lhContrast').innerHTML = ex.contrast;

  // Metric
  const metricEl = document.getElementById('lhMetric');
  metricEl.className = `lh-metric ${ex.metric.cls}`;
  document.getElementById('lhMetricText').textContent = ex.metric.label;

  // Region chips — built safely with textContent
  const regionsEl = document.getElementById('lhRegions');
  regionsEl.innerHTML = '';
  for (const r of ex.regions) {
    const chip  = document.createElement('span');
    chip.className = `lh-region-chip ${r.id}`;

    const name  = document.createElement('span');
    name.textContent = r.id === 'namerica' ? 'Americas' : r.id.charAt(0).toUpperCase() + r.id.slice(1);
    chip.appendChild(name);

    const state = document.createElement('span');
    state.className   = 'lh-region-state';
    state.textContent = ` — ${r.state}`;
    chip.appendChild(state);

    regionsEl.appendChild(chip);
  }

  // Try button
  document.getElementById('lhTryBtn').onclick = () => setYear(ex.year);

  // Dots
  const dotsEl = document.getElementById('lhDots');
  dotsEl.innerHTML = '';
  HOOK_EXAMPLES.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = `lh-dot${i === index ? ' active' : ''}`;
    dot.addEventListener('click', () => jumpHook(i));
    dotsEl.appendChild(dot);
  });
}

function jumpHook(index) {
  hookIndex = index;
  clearInterval(hookTimer);
  renderLandingHook(hookIndex);
  hookTimer = setInterval(cycleHook, CONFIG.hookCycleInterval);
}

function cycleHook() {
  hookIndex = (hookIndex + 1) % HOOK_EXAMPLES.length;
  renderLandingHook(hookIndex);
}

function startHookCycle() {
  renderLandingHook(0);
  hookTimer = setInterval(cycleHook, CONFIG.hookCycleInterval);
}

/* ── EXPLORE (main entry) ────────────────────────────────────────────────── */
async function explore() {
  const raw  = document.getElementById('yearInput').value.trim();
  const year = parseInt(raw, 10);

  if (!raw || isNaN(year)) {
    showError('Please enter a valid year (e.g. 1821).');
    return;
  }

  // Stress Test Fix: Range Validation
  if (year < CONFIG.minYear || year > CONFIG.maxYear) {
    showError(`Please enter a year between ${CONFIG.minYear} BCE and ${CONFIG.maxYear} CE.`);
    return;
  }

  // Stress Test Fix: Year 0
  if (year === 0) {
    showError('Year 0 does not exist in the historian\'s calendar. Try 1 BCE or 1 CE.');
    return;
  }

  // Stress Test Fix: Concurrency Guard
  if (loadingActive) return;

  hideError();
  hideResults();
  document.getElementById('apiKeyNotice').classList.remove('visible');
  document.getElementById('searchBtn').disabled = true;
  currentYear = year;

  try {
    if (compareMode) {
      const raw2  = document.getElementById('yearInput2').value.trim();
      const year2 = parseInt(raw2);
      if (!raw2 || isNaN(year2)) {
        showError('Please enter a second year to compare.');
        return;
      }
      await exploreCompare(year, year2);
    } else {
      await exploreSingle(year);
    }
  } finally {
    document.getElementById('searchBtn').disabled = false;
  }
}

async function exploreSingle(year) {
  if (CONFIG.cacheEnabled && cache.has(year)) {
    renderSingle(year, cache.get(year));
    return;
  }

  showLoading();
  try {
    const data = await fetchHistory(year);
    if (CONFIG.cacheEnabled) cache.set(year, data);
    addToSearchHistory(year, data.era_description || '');
    renderSingle(year, data);
  } catch (err) {
    handleFetchError(err);
  } finally {
    hideLoading();
  }
}

async function exploreCompare(year1, year2) {
  const need1 = !cache.has(year1);
  const need2 = !cache.has(year2);
  if (need1 || need2) showLoading();

  try {
    const [data1, data2] = await Promise.all([
      need1 ? fetchHistory(year1) : Promise.resolve(cache.get(year1)),
      need2 ? fetchHistory(year2) : Promise.resolve(cache.get(year2)),
    ]);
    if (need1) { cache.set(year1, data1); addToSearchHistory(year1, data1.era_description || ''); }
    if (need2) { cache.set(year2, data2); addToSearchHistory(year2, data2.era_description || ''); }
    renderCompare(year1, data1, year2, data2);
  } catch (err) {
    handleFetchError(err);
  } finally {
    hideLoading();
  }
}

/**
 * Validates that the AI response matches the expected structure.
 * Prevents UI crashes from incomplete or malformed JSON.
 */
function validateSchema(data) {
  if (!data || typeof data !== 'object') throw new Error('schema');
  if (typeof data.era_description !== 'string') throw new Error('schema');
  
  const requiredRegions = ['europe', 'asia', 'namerica', 'africa', 'oceania'];
  if (!data.regions || typeof data.regions !== 'object') throw new Error('schema');
  
  for (const rid of requiredRegions) {
    const r = data.regions[rid];
    if (!r || !Array.isArray(r.events) || r.events.length === 0) {
      throw new Error('schema');
    }
  }
  return true;
}

function handleFetchError(err) {
  const msg = err.message || '';
  if (msg.includes('401') || msg.includes('403')) {
    showError('Authentication failed. Check your API key.');
    document.getElementById('apiKeyNotice').classList.add('visible');
  } else if (msg.includes('404')) {
    showError('API endpoint not found. If running locally, please use "vercel dev" instead of a static server.');
  } else if (msg.includes('429')) {
    showError('Rate limit reached. Please wait a moment and try again.');
  } else if (msg.includes('timeout')) {
    showError('The request timed out. Please try again — the API may be busy.');
  } else if (msg.includes('parse') || msg.includes('schema')) {
    showError('Received unexpected data format. Please try again.');
  } else {
    showError('Could not load data. Ensure "vercel dev" is running and your API key is configured.');
  }
  console.error('[HistoryLens]', err);
}

/* ── API ─────────────────────────────────────────────────────────────────── */
async function fetchHistory(year) {
  const yearLabel = formatYear(year);

  const prompt = `You are a senior historian writing for an analytical audience. Year: ${yearLabel}.
Return ONLY valid JSON. No markdown, no backticks, no prose outside the JSON.

TONE RULES — enforce on every sentence:
BANNED words: ongoing, attempted, continued, various, numerous, significant, important, experienced, saw, witnessed, underwent, faced, "played a role", "attempted reforms"
REQUIRED verbs: triggered, consolidated, fractured, collapsed, accelerated, cemented, destabilized, expanded, contracted, eclipsed, redirected, dismantled, upended, reinforced, exposed, suppressed, entrenched, imposed
EVENT DESCRIPTION: [Subject] + [strong verb] + [object] + [consequence]. 1 sentence.
THESIS HEADLINE: a verdict in 4-6 words, not a description.
OCEANIA: If records are sparse, state that honestly. Never fabricate. Use: "Limited recorded large-scale political developments in this period — [brief honest note on what was present]"

SCHEMA:
{
  "year_label": "${yearLabel}",
  "era_description": "4-7 word opinionated era name",
  "hook_moment": "1-2 punchy sentences juxtaposing what was happening across regions simultaneously. Use specific names and places.",
  "global_context": "2 sentences using required verbs.",
  "global_signals": {
    "war_intensity": "Low|Moderate|High|Critical|Rising|Declining|Stable|Collapsing",
    "political_fragmentation": "...",
    "economic_pressure": "...",
    "trade_activity": "...",
    "ideological_tension": "..."
  },
  "cross_region": {
    "contrast": "1-2 opinionated sentences contrasting regions.",
    "tensions": [
      { "regions": ["europe","asia"],    "note": "1 crisp sentence." },
      { "regions": ["namerica","africa"],"note": "1 crisp sentence." },
      { "regions": ["europe","africa"],  "note": "1 crisp sentence." }
    ]
  },
  "regions": {
    "europe":   { "state":"2-3 words","thesis_headline":"4-6 word verdict","thesis_argument":"1 analytical sentence","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"1 sentence" },
    "asia":     { "state":"...","thesis_headline":"...","thesis_argument":"...","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"..." },
    "namerica": { "state":"...","thesis_headline":"...","thesis_argument":"...","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"..." },
    "africa":   { "state":"...","thesis_headline":"...","thesis_argument":"...","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"..." },
    "oceania":  { "state":"...","thesis_headline":"...","thesis_argument":"...","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"..." }
  }
}

HARD CONSTRAINTS:
- Exactly 1 primary + 2 secondary events per region.
- global_signals values: exactly one of Low, Moderate, High, Critical, Rising, Declining, Stable, Collapsing
- Ancient years: use civilisations active at that time.
- Event year may vary ±5 years if needed for accuracy.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(CONFIG.apiEndpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        model:      CONFIG.model,
        max_tokens: CONFIG.maxTokens,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const apiData = await response.json();
    const rawContent = apiData.content.map(block => block.text || '').join('');
    
    const match = rawContent.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('parse: No JSON object found');
    }

    try {
      const parsed = JSON.parse(match[0]);
      validateSchema(parsed);
      return parsed;
    } catch (e) {
      if (e.message === 'schema') throw e;
      throw new Error('parse: invalid JSON structure');
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('timeout');
    throw err;
  }
}

/* ── RENDER — SINGLE YEAR ────────────────────────────────────────────────── */
function renderSingle(year, data) {
  // Safe: textContent for all AI-generated plain text
  document.getElementById('resultsYear').textContent = formatYear(year);
  document.getElementById('resultsEra').textContent  = data.era_description || '';

  // Hook moment — uses boldNames on pre-escaped text
  const hookEl = document.getElementById('hookMoment');
  if (data.hook_moment) {
    document.getElementById('hookText').innerHTML = boldNames(esc(data.hook_moment));
    hookEl.classList.add('visible');
  } else {
    hookEl.classList.remove('visible');
  }

  if (data.global_context) {
    document.getElementById('globalContextText').textContent = data.global_context;
    document.getElementById('globalContext').classList.add('visible');
  }

  renderSignals(data.global_signals);

  const output = document.getElementById('regionsOutput');
  output.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'regions-grid';
  for (const region of REGIONS) {
    const regionData = data.regions?.[region.id];
    if (regionData) grid.appendChild(buildCard(region, regionData));
  }
  output.appendChild(grid);

  if (data.cross_region) {
    output.appendChild(buildCrossRegionBlock(data.cross_region));
  }

  // Show feedback bar and reset its state
  const feedbackBar = document.getElementById('feedbackBar');
  feedbackBar.style.display = 'flex';
  document.getElementById('fbPos').className = 'feedback-btn';
  document.getElementById('fbNeg').className = 'feedback-btn';

  addToTimeline(year, data.era_description || '');

  document.getElementById('results').classList.add('active');
  window.scrollTo({ top: document.getElementById('results').offsetTop - 80, behavior: 'smooth' });
}

/* ── RENDER — COMPARE ────────────────────────────────────────────────────── */
function renderCompare(year1, data1, year2, data2) {
  document.getElementById('resultsYear').textContent = `${formatYear(year1)} vs ${formatYear(year2)}`;
  document.getElementById('resultsEra').textContent  = `${data1.era_description || ''} · ${data2.era_description || ''}`;
  document.getElementById('globalContext').classList.remove('visible');
  document.getElementById('hookMoment').classList.remove('visible');

  const output = document.getElementById('regionsOutput');
  output.innerHTML = '';

  const wrapper = document.createElement('div');
  for (const { year, data } of [{ year: year1, data: data1 }, { year: year2, data: data2 }]) {
    const block = document.createElement('div');
    block.className = 'compare-block';

    const label = document.createElement('div');
    label.className = 'compare-year-label';
    label.textContent = formatYear(year);
    block.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'regions-grid compare-regions-grid';
    for (const region of REGIONS) {
      const regionData = data.regions?.[region.id];
      if (regionData) grid.appendChild(buildCard(region, regionData));
    }
    block.appendChild(grid);
    wrapper.appendChild(block);
  }
  output.appendChild(wrapper);

  addToTimeline(year1, data1.era_description || '');
  addToTimeline(year2, data2.era_description || '');

  document.getElementById('results').classList.add('active');
  window.scrollTo({ top: document.getElementById('results').offsetTop - 80, behavior: 'smooth' });
}

/* ── CARD BUILDER ────────────────────────────────────────────────────────── */
/**
 * Builds a region card entirely with DOM methods.
 * All AI text goes through esc() before innerHTML, or uses textContent directly.
 */
function buildCard(region, rd) {
  const card = document.createElement('article');
  card.className = 'region-card';
  card.dataset.region = region.id;

  // Header
  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <div class="region-icon-wrap" aria-hidden="true">${region.icon}</div>
    <div>
      <div class="region-name">${esc(region.label)}</div>
      <div class="region-sub">${esc(region.sub)}</div>
    </div>`;
  card.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';

  // State label
  if (rd.state) {
    const stateEl = document.createElement('div');
    stateEl.className = 'state-label';
    stateEl.textContent = rd.state;
    body.appendChild(stateEl);
  }

  // Thesis block
  if (rd.thesis_headline || rd.thesis_argument) {
    const thesis = document.createElement('div');
    thesis.className = 'thesis-block';
    if (rd.thesis_headline) {
      const hl = document.createElement('div');
      hl.className = 'thesis-headline';
      hl.textContent = `"${rd.thesis_headline}"`;
      thesis.appendChild(hl);
    }
    if (rd.thesis_argument) {
      const arg = document.createElement('div');
      arg.className = 'thesis-argument';
      arg.textContent = rd.thesis_argument;
      thesis.appendChild(arg);
    }
    body.appendChild(thesis);
  }

  // Events
  const eventsSection = document.createElement('div');
  const evTitle = document.createElement('div');
  evTitle.className = 'section-title';
  evTitle.textContent = 'Key Events';
  eventsSection.appendChild(evTitle);

  const list = document.createElement('ul');
  list.className = 'events-list';
  (rd.events || []).forEach((ev, i) => {
    const isPrimary = ev.rank === 'primary' || i === 0;
    const item = document.createElement('li');
    item.className = `event-item ${isPrimary ? 'is-primary' : 'is-secondary'}`;

    if (isPrimary) {
      const top = document.createElement('div');
      top.className = 'primary-top';
      top.innerHTML = `<span class="event-year">${esc(String(ev.year))}</span><span class="event-rank primary">⭐ Primary</span>`;
      item.appendChild(top);

      const title = document.createElement('div');
      title.className = 'event-title';
      title.textContent = ev.title;
      item.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'event-desc';
      desc.textContent = ev.description;
      item.appendChild(desc);
    } else {
      const yearBadge = document.createElement('span');
      yearBadge.className = 'event-year';
      yearBadge.textContent = String(ev.year);

      const content = document.createElement('div');
      const rank = document.createElement('div');
      rank.className = 'event-rank secondary';
      rank.textContent = '· Supporting';

      const title = document.createElement('div');
      title.className = 'event-title';
      title.textContent = ev.title;

      const desc = document.createElement('div');
      desc.className = 'event-desc';
      desc.textContent = ev.description;

      content.appendChild(rank);
      content.appendChild(title);
      content.appendChild(desc);
      item.appendChild(yearBadge);
      item.appendChild(content);
    }

    list.appendChild(item);
  });
  eventsSection.appendChild(list);
  body.appendChild(eventsSection);

  // Key figures
  if (rd.key_figures?.length) {
    const figSection = document.createElement('div');
    const figTitle = document.createElement('div');
    figTitle.className = 'section-title';
    figTitle.textContent = 'Notable Figures';
    figSection.appendChild(figTitle);

    const row = document.createElement('div');
    row.className = 'figures-row';
    for (const name of rd.key_figures) {
      const chip = document.createElement('span');
      chip.className = 'figure-chip';
      chip.textContent = `👤 ${name}`;
      row.appendChild(chip);
    }
    figSection.appendChild(row);
    body.appendChild(figSection);
  }

  // Why it matters
  if (rd.significance) {
    const why = document.createElement('div');
    why.className = 'why-matters';

    const whyLabel = document.createElement('div');
    whyLabel.className = 'why-matters-label';
    whyLabel.textContent = 'Why it matters';
    why.appendChild(whyLabel);

    const whyText = document.createElement('div');
    whyText.className = 'why-matters-text';
    whyText.textContent = rd.significance;
    why.appendChild(whyText);

    body.appendChild(why);
  }

  card.appendChild(body);
  return card;
}

/* ── CROSS-REGION BLOCK ──────────────────────────────────────────────────── */
function buildCrossRegionBlock(crossData) {
  const REGION_CLASS = { europe: 'europe', asia: 'asia', namerica: 'namerica', africa: 'africa', oceania: 'oceania' };

  const block = document.createElement('div');
  block.className = 'cross-region-block';

  const header = document.createElement('div');
  header.className = 'cross-region-header';
  header.innerHTML = `
    <span class="cross-region-title">🌍 Global Contrast</span>
    <span class="cross-region-pill">Cross-Regional Analysis</span>`;
  block.appendChild(header);

  const body = document.createElement('div');
  body.className = 'cross-region-body';
  body.textContent = crossData.contrast || '';
  block.appendChild(body);

  if (crossData.tensions?.length) {
    const tensions = document.createElement('div');
    tensions.className = 'cross-tensions';
    for (const t of crossData.tensions) {
      const item = document.createElement('div');
      item.className = 'tension-item';

      const dots = document.createElement('div');
      dots.className = 'tension-regions';
      for (const regionId of (t.regions || [])) {
        const dot = document.createElement('span');
        dot.className = `tension-dot ${REGION_CLASS[regionId] || ''}`;
        dot.title = regionId;
        dots.appendChild(dot);
      }
      item.appendChild(dots);

      const note = document.createElement('span');
      note.textContent = t.note || '';
      item.appendChild(note);

      tensions.appendChild(item);
    }
    block.appendChild(tensions);
  }

  return block;
}

/* ── SIGNALS ─────────────────────────────────────────────────────────────── */
function renderSignals(signals) {
  const bar   = document.getElementById('signalsBar');
  const items = document.getElementById('signalsItems');

  if (!signals) {
    bar.classList.remove('visible');
    return;
  }

  items.innerHTML = '';
  for (const [key, label] of Object.entries(SIGNAL_LABELS)) {
    const val = signals[key] || '—';
    const cls = val.toLowerCase().replace(/\s+/g, '');

    const item = document.createElement('div');
    item.className = 'signal-item';
    item.innerHTML = `<span class="signal-name">${esc(label)}:</span><span class="signal-value ${esc(cls)}">${esc(val)}</span>`;
    items.appendChild(item);
  }
  bar.classList.add('visible');
}

/* ── FEEDBACK ────────────────────────────────────────────────────────────── */
function submitFeedback(type) {
  document.getElementById('fbPos').className = `feedback-btn${type === 'positive' ? ' active-pos' : ''}`;
  document.getElementById('fbNeg').className = `feedback-btn${type === 'negative' ? ' active-neg' : ''}`;
  const msg = type === 'positive'
    ? '✅ Thanks — glad it was accurate!'
    : '⚠ Thanks for flagging. Consider verifying with primary sources.';
  showToast(msg);
}

function reportIssue() {
  const year    = currentYear ? formatYear(currentYear) : 'unknown year';
  const subject = encodeURIComponent(`HistoryLens — Accuracy issue for ${year}`);
  const body    = encodeURIComponent(`Year explored: ${year}\n\nIssue description:\n\n`);
  window.open(`mailto:hello@historylens.app?subject=${subject}&body=${body}`);
}

/* ── THREADS ─────────────────────────────────────────────────────────────── */
function renderThreads() {
  const grid = document.getElementById('threadsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  THREADS.forEach((thread, threadIndex) => {
    const card = document.createElement('div');
    card.className = `thread-card ${thread.color}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', () => startThread(threadIndex));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') startThread(threadIndex); });

    const name = document.createElement('div');
    name.className = 'thread-name';
    name.textContent = thread.name;

    const desc = document.createElement('div');
    desc.className = 'thread-desc';
    desc.textContent = thread.desc;

    const years = document.createElement('div');
    years.className = 'thread-years';
    for (const year of thread.years) {
      const pip = document.createElement('span');
      pip.className = 'thread-year-pip';
      pip.textContent = formatYear(year);
      pip.addEventListener('click', e => { e.stopPropagation(); setYear(year); });
      years.appendChild(pip);
    }

    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(years);
    grid.appendChild(card);
  });
}

function startThread(index) {
  const thread = THREADS[index];
  if (!thread) return;
  setYear(thread.years[0]);
  showToast(`📖 ${thread.name} — starting at ${formatYear(thread.years[0])}`);
}

/* ── TIMELINE MEMORY ─────────────────────────────────────────────────────── */
function addToTimeline(year, era) {
  if (timelineYears.find(t => t.year === year)) {
    renderTimeline(year);
    return;
  }
  timelineYears.push({ year, era });
  timelineYears.sort((a, b) => a.year - b.year);
  saveStorage(CONFIG.storageKeyTimeline, timelineYears);
  renderTimeline(year);
}

function renderTimeline(currentYr) {
  const panel = document.getElementById('timelinePanel');
  const track = document.getElementById('timelineTrack');

  if (!timelineYears.length) {
    panel.classList.remove('visible');
    return;
  }
  panel.classList.add('visible');
  track.innerHTML = '';

  for (const t of timelineYears) {
    const isCurrent = t.year === currentYr;
    const eraShort  = t.era.length > 22 ? t.era.slice(0, 22) + '…' : t.era;

    const node = document.createElement('div');
    node.className = `timeline-node${isCurrent ? ' current' : ''}`;
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.addEventListener('click', () => setYear(t.year));
    node.addEventListener('keydown', e => { if (e.key === 'Enter') setYear(t.year); });

    const dot     = document.createElement('div');  dot.className = 'timeline-dot';
    const yearEl  = document.createElement('div');  yearEl.className = 'timeline-node-year'; yearEl.textContent = formatYear(t.year);
    const eraEl   = document.createElement('div');  eraEl.className = 'timeline-node-era';  eraEl.textContent  = eraShort;

    node.appendChild(dot);
    node.appendChild(yearEl);
    node.appendChild(eraEl);
    track.appendChild(node);
  }

  // Scroll current into view
  setTimeout(() => {
    const current = track.querySelector('.current');
    if (current) current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, 100);

  renderSavedComparisons();
}

function clearTimeline() {
  timelineYears    = [];
  savedComparisons = [];
  saveStorage(CONFIG.storageKeyTimeline, []);
  saveStorage(CONFIG.storageKeyComps,    []);
  document.getElementById('timelinePanel').classList.remove('visible');
  showToast('Timeline cleared.');
}

function saveComparison() {
  if (!currentYear) return;
  const others = timelineYears.filter(t => t.year !== currentYear);
  if (!others.length) { showToast('Explore at least 2 years first.'); return; }

  const closest = others.reduce((a, b) =>
    Math.abs(b.year - currentYear) < Math.abs(a.year - currentYear) ? b : a
  );

  const exists = savedComparisons.find(c =>
    (c.y1 === currentYear && c.y2 === closest.year) ||
    (c.y1 === closest.year && c.y2 === currentYear)
  );
  if (exists) { showToast('Already saved!'); return; }

  const currentEra = timelineYears.find(t => t.year === currentYear)?.era || '';
  savedComparisons.unshift({ y1: currentYear, y2: closest.year, e1: currentEra, e2: closest.era });
  saveStorage(CONFIG.storageKeyComps, savedComparisons);
  renderSavedComparisons();
  showToast(`✅ Saved: ${formatYear(currentYear)} vs ${formatYear(closest.year)}`);
}

function renderSavedComparisons() {
  const wrap = document.getElementById('savedComparisons');
  const list = document.getElementById('savedCompList');

  if (!savedComparisons.length) {
    wrap.classList.remove('visible');
    return;
  }
  wrap.classList.add('visible');
  list.innerHTML = '';

  savedComparisons.forEach((comp, index) => {
    const chip = document.createElement('div');
    chip.className = 'saved-comp-chip';
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.addEventListener('click', () => loadSavedComparison(index));
    chip.addEventListener('keydown', e => { if (e.key === 'Enter') loadSavedComparison(index); });

    chip.innerHTML = `${esc(formatYear(comp.y1))} <span class="vs">vs</span> ${esc(formatYear(comp.y2))}`;

    const del = document.createElement('span');
    del.className = 'saved-comp-del';
    del.textContent = '✕';
    del.addEventListener('click', e => { e.stopPropagation(); deleteSavedComparison(index); });
    chip.appendChild(del);

    list.appendChild(chip);
  });
}

function loadSavedComparison(index) {
  const comp = savedComparisons[index];
  if (!comp) return;
  document.getElementById('yearInput').value  = comp.y1;
  document.getElementById('yearInput2').value = comp.y2;
  if (!compareMode) toggleCompare();
  explore();
}

function deleteSavedComparison(index) {
  savedComparisons.splice(index, 1);
  saveStorage(CONFIG.storageKeyComps, savedComparisons);
  renderSavedComparisons();
}

/* ── SEARCH HISTORY (for sidebar / copy) ─────────────────────────────────── */
function addToSearchHistory(year, era) {
  if (searchHistory.find(h => h.year === year)) return;
  searchHistory.unshift({ year, era });
  if (searchHistory.length > 20) searchHistory.pop();
}

function toggleHistory() {
  showToast('Use the timeline below to revisit explored years.');
}

/* ── TOOLBAR ─────────────────────────────────────────────────────────────── */
function doPrint() {
  window.print();
}

function doCopy() {
  const yearText = document.getElementById('resultsYear').textContent;
  const eraText  = document.getElementById('resultsEra').textContent;
  const ctxText  = document.getElementById('globalContextText').textContent;

  let output = `HistoryLens — ${yearText}\n${eraText}\n\n`;
  if (ctxText) output += `Global Context:\n${ctxText}\n\n`;

  document.querySelectorAll('.region-card').forEach(card => {
    const name   = card.querySelector('.region-name')?.textContent  || '';
    const thesis = card.querySelector('.thesis-argument')?.textContent || '';
    output += `${name}\n${thesis}\n`;

    card.querySelectorAll('.event-item').forEach(ev => {
      const year  = ev.querySelector('.event-year')?.textContent   || '';
      const title = ev.querySelector('.event-title')?.textContent  || '';
      const desc  = ev.querySelector('.event-desc')?.textContent   || '';
      output += `  • [${year}] ${title} — ${desc}\n`;
    });

    const why = card.querySelector('.why-matters-text')?.textContent || '';
    if (why) output += `  Why it matters: ${why}\n`;
    output += '\n';
  });

  output += 'Generated by HistoryLens · Verify with primary sources.';

  navigator.clipboard.writeText(output)
    .then(() => showToast('📋 Summary copied to clipboard!'))
    .catch(() => showToast('Could not copy — please copy manually.'));
}

function shareUrl() {
  if (!currentYear) return;
  const url = `${location.origin}${location.pathname}?year=${currentYear}`;
  navigator.clipboard.writeText(url)
    .then(() => showToast('🔗 Link copied!'))
    .catch(() => showToast('Could not copy link.'));
}

/* ── PROGRESS BAR ────────────────────────────────────────────────────────── */
function startProgress() {
  const bar = document.getElementById('progressBar');
  bar.style.width = '0%';
  bar.classList.add('active');
  let width = 0;
  progressTimer = setInterval(() => {
    width = Math.min(width + (100 - width) * 0.06, 88);
    bar.style.width = `${width}%`;
  }, 300);
}

function finishProgress() {
  clearInterval(progressTimer);
  const bar = document.getElementById('progressBar');
  bar.style.width = '100%';
  setTimeout(() => {
    bar.classList.remove('active');
    bar.style.width = '0%';
  }, 500);
}

/* ── LOADING UI ──────────────────────────────────────────────────────────── */
function showLoading() {
  loadingActive = true;
  document.getElementById('loadingSection').classList.add('active');
  document.getElementById('searchBtn').classList.add('loading');
  document.getElementById('searchBtn').disabled = true;
  document.getElementById('surpriseBtn').disabled = true;
  startProgress();

  let msgIndex = 0;
  const statusEl = document.getElementById('loadingStatus');
  statusEl.textContent = LOADING_MSGS[0];

  loadingTimer = setInterval(() => {
    msgIndex = (msgIndex + 1) % LOADING_MSGS.length;
    statusEl.textContent = LOADING_MSGS[msgIndex];
  }, CONFIG.loadingMsgInterval);

  slowWarningTimer = setTimeout(() => {
    clearInterval(loadingTimer);
    statusEl.textContent = 'Taking longer than usual — the API may be busy.';
  }, 10000);

  document.getElementById('loadingSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideLoading() {
  loadingActive = false;
  clearInterval(loadingTimer);
  clearTimeout(slowWarningTimer);
  finishProgress();
  document.getElementById('loadingSection').classList.remove('active');
  document.getElementById('searchBtn').classList.remove('loading');
  document.getElementById('searchBtn').disabled = false;
  document.getElementById('surpriseBtn').disabled = false;
}

/* ── RESULTS HELPERS ─────────────────────────────────────────────────────── */
function showError(msg) {
  document.getElementById('errorText').textContent = msg;
  document.getElementById('errorBox').classList.add('active');
}

function hideError() {
  document.getElementById('errorBox').classList.remove('active');
}

function hideResults() {
  const results = document.getElementById('results');
  results.classList.add('fading');
  setTimeout(() => {
    results.classList.remove('active', 'fading');
    document.getElementById('globalContext').classList.remove('visible');
    document.getElementById('signalsBar').classList.remove('visible');
    document.getElementById('hookMoment').classList.remove('visible');
    document.getElementById('feedbackBar').style.display = 'none';
  }, 200);
}

/* ── TOAST ───────────────────────────────────────────────────────────────── */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}
