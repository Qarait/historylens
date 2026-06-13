import { wikipediaYearTitle } from './config.js';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_SNIPPETS = 72;
const MAX_CONTEXT_CHARS = 36000;
const cache = new Map();

export async function getYearGrounding(year) {
  const cached = cache.get(year);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return cached.value;

  const pageTitle = wikipediaYearTitle(year);
  const sections = await mediaWikiRequest({
    action: 'parse',
    page: pageTitle,
    prop: 'sections',
  });
  const eventsSection = sections?.parse?.sections?.find(section =>
    /^events?$/i.test(section.line?.trim())
  );
  if (!eventsSection) throw new Error(`No Events section found for ${pageTitle}`);

  const sectionData = await mediaWikiRequest({
    action: 'parse',
    page: pageTitle,
    prop: 'wikitext',
    section: eventsSection.index,
  });
  const rawWikitext = sectionData?.parse?.wikitext;
  const wikitext = typeof rawWikitext === 'string' ? rawWikitext : rawWikitext?.['*'];
  if (!wikitext) throw new Error(`No chronology found for ${pageTitle}`);

  const candidates = parseEventCandidates(wikitext);
  const selected = selectGroundingSnippets(candidates);
  const allowedTitles = new Set(selected.flatMap(item => item.sourceTitles));
  const context = selected
    .map(item => `${item.month ? `${item.month}: ` : ''}${item.text}`)
    .join('\n')
    .slice(0, MAX_CONTEXT_CHARS);

  const value = {
    context,
    allowedTitles,
    yearPageTitle: pageTitle,
    yearPageUrl: wikipediaArticleUrl(pageTitle),
    sourceName: 'Wikipedia contributors',
  };
  cache.set(year, { createdAt: Date.now(), value });
  return value;
}

export function wikipediaArticleUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function parseEventCandidates(wikitext) {
  const lines = wikitext.split(/\r?\n/);
  const candidates = [];
  let month = '';

  for (const rawLine of lines) {
    const heading = rawLine.match(/^={3,}\s*([^=]+?)\s*={3,}$/);
    if (heading) {
      month = heading[1].trim();
      continue;
    }
    if (!rawLine.startsWith('*')) continue;

    const sourceTitles = [];
    let text = stripReferences(rawLine);
    text = text.replace(/\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]+))?\]\]/g, (_match, target, label) => {
      const title = target.trim();
      const visibleLabel = label?.trim() || title;
      if (isCitationTitle(title)) {
        sourceTitles.push(title);
        return `${visibleLabel} {source: ${title}}`;
      }
      return visibleLabel;
    });
    text = stripTemplates(text)
      .replace(/^\*+\s*/, '')
      .replace(/&ndash;|&mdash;/g, '-')
      .replace(/&nbsp;/g, ' ')
      .replace(/''+/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length < 35 || sourceTitles.length === 0) continue;
    candidates.push({
      month,
      text,
      sourceTitles: [...new Set(sourceTitles)],
      score: scoreCandidate(text),
    });
  }
  return candidates;
}

function isCitationTitle(title) {
  if (!title || title.startsWith('File:') || title.startsWith('Category:')) return false;
  if (/^\d{1,4}$/.test(title)) return false;
  if (/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}$/i.test(title)) {
    return false;
  }
  return true;
}

function stripReferences(text) {
  return text
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref\b[^>]*\/>/gi, '');
}

function stripTemplates(text) {
  let result = text;
  for (let pass = 0; pass < 8; pass++) {
    const next = result.replace(/\{\{[^{}]*\}\}/g, '');
    if (next === result) break;
    result = next;
  }
  return result;
}

function scoreCandidate(text) {
  const highImpact = [
    'war', 'invasion', 'ceasefire', 'treaty', 'election', 'revolution', 'coup',
    'pandemic', 'outbreak', 'earthquake', 'explosion', 'disaster', 'assassination',
    'independence', 'annex', 'collapse', 'protest', 'agreement', 'law', 'launch',
    'discovery', 'crisis', 'attack', 'conflict', 'peace', 'referendum',
  ];
  const lower = text.toLowerCase();
  return highImpact.reduce((score, term) => score + (lower.includes(term) ? 3 : 0), 0)
    + Math.min(4, Math.floor(text.length / 140));
}

function selectGroundingSnippets(candidates) {
  const byMonth = new Map();
  for (const candidate of candidates) {
    const key = candidate.month || 'General';
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(candidate);
  }

  const selected = [];
  for (const monthCandidates of byMonth.values()) {
    monthCandidates.sort((a, b) => b.score - a.score);
    selected.push(...monthCandidates.slice(0, 8));
  }

  return selected
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SNIPPETS);
}

async function mediaWikiRequest(params) {
  const url = new URL(WIKIPEDIA_API);
  for (const [key, value] of Object.entries({
    ...params,
    format: 'json',
    formatversion: 2,
    origin: '*',
  })) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HistoryLens/1.2 (https://github.com/Qarait/historylens)',
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
  return response.json();
}
