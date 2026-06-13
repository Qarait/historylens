const CROSSREF_API = 'https://api.crossref.org/works';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const REQUEST_TIMEOUT_MS = 3500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ITEMS = 160;
const cache = new Map();
const IGNORED_LINK_PATTERNS = [
  /^https?:\/\/id\.loc\.gov\/authorities\//i,
  /^https?:\/\/lccn\.loc\.gov\//i,
  /^https?:\/\/(?:dx\.)?doi\.org\//i,
];

const DOMAIN_RULES = [
  rule('Archive', 'archive', [
    'archives.gov', 'loc.gov', 'nationalarchives.gov.uk', 'archives.gov.uk',
    'archives-nationales.culture.gouv.fr', 'bundesarchiv.de', 'europeana.eu',
  ]),
  rule('Museum', 'museum', [
    'si.edu', 'britishmuseum.org', 'metmuseum.org', 'iwm.org.uk',
    'ushmm.org', 'louvre.fr', 'vam.ac.uk', 'moma.org',
  ]),
  rule('Primary / institutional', 'primary', [
    'un.org', 'who.int', 'nato.int', 'osce.org', 'icrc.org', 'europa.eu',
    'worldbank.org', 'imf.org', 'oecd.org', 'gov.uk', 'state.gov',
  ]),
  rule('Academic', 'academic', [
    'doi.org', 'jstor.org', 'muse.jhu.edu', 'cambridge.org',
    'academic.oup.com', 'tandfonline.com', 'springer.com', 'degruyter.com',
    'sagepub.com', 'sciencedirect.com', 'journals.uchicago.edu',
  ]),
  rule('Reference', 'reference', ['britannica.com']),
];

export async function enrichEventSources(events) {
  const enriched = await Promise.all(events.map(async event => ({
    ...event,
    sources: await getResearchSources(event.source_title, event.date),
  })));
  return enriched;
}

export async function getResearchSources(title, date = '') {
  const key = `${title}:${date}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return cached.sources;

  const [academic, authoritative] = await Promise.all([
    findCrossrefSource(title, date).catch(() => null),
    findAuthoritativeLinks(title).catch(() => []),
  ]);

  const sources = dedupeSources([
    ...authoritative,
    ...(academic ? [academic] : []),
  ]).slice(0, 3);

  if (cache.size >= MAX_CACHE_ITEMS) cache.delete(cache.keys().next().value);
  cache.set(key, { createdAt: Date.now(), sources });
  return sources;
}

export function classifySourceUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  for (const domainRule of DOMAIN_RULES) {
    if (domainRule.domains.some(domain => host === domain || host.endsWith(`.${domain}`))) {
      return {
        quality: domainRule.quality,
        qualityLabel: domainRule.label,
      };
    }
  }
  if (host.endsWith('.edu') || host.endsWith('.ac.uk') || host.endsWith('.ac.jp')) {
    return { quality: 'academic', qualityLabel: 'Academic' };
  }
  return null;
}

async function findCrossrefSource(title, date) {
  const url = new URL(CROSSREF_API);
  url.searchParams.set('query.bibliographic', `${title} ${date}`.trim());
  url.searchParams.set('rows', '5');
  url.searchParams.set(
    'select',
    'DOI,title,publisher,published,type,container-title,author,score'
  );
  url.searchParams.set('mailto', 'hello@historylens.app');

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'HistoryLens/1.7 (mailto:hello@historylens.app)',
    },
  });
  if (!response.ok) throw new Error(`Crossref ${response.status}`);
  const data = await response.json();
  const candidates = data?.message?.items || [];
  const queryTokens = meaningfulTokens(title);

  const best = candidates
    .map(item => ({ item, relevance: titleRelevance(item.title?.[0], queryTokens) }))
    .filter(candidate => candidate.item.DOI && candidate.relevance >= 0.55)
    .sort((a, b) =>
      b.relevance - a.relevance ||
      Number(b.item.score || 0) - Number(a.item.score || 0)
    )[0]?.item;
  if (!best) return null;

  return {
    title: best.title?.[0] || title,
    url: `https://doi.org/${best.DOI}`,
    publisher: best.publisher || best['container-title']?.[0] || 'Crossref member',
    publicationYear: best.published?.['date-parts']?.[0]?.[0] || null,
    quality: 'academic',
    qualityLabel: 'Academic',
  };
}

async function findAuthoritativeLinks(pageTitle) {
  const url = new URL(WIKIPEDIA_API);
  for (const [key, value] of Object.entries({
    action: 'parse',
    page: pageTitle,
    prop: 'externallinks',
    redirects: 1,
    format: 'json',
    formatversion: 2,
    origin: '*',
  })) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'HistoryLens/1.7 (https://github.com/Qarait/historylens)',
    },
  });
  if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
  const data = await response.json();
  const links = data?.parse?.externallinks || [];

  return links
    .map(link => {
      if (IGNORED_LINK_PATTERNS.some(pattern => pattern.test(link))) return null;
      const classification = classifySourceUrl(link);
      if (!classification) return null;
      return {
        title: sourceDisplayName(link),
        url: link,
        publisher: sourceDisplayName(link),
        ...classification,
      };
    })
    .filter(Boolean)
    .sort((a, b) => sourceRank(a.quality) - sourceRank(b.quality))
    .filter((source, index, all) =>
      all.findIndex(candidate => candidate.publisher === source.publisher) === index
    )
    .slice(0, 2);
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function meaningfulTokens(value) {
  const ignored = new Set([
    'a', 'an', 'and', 'at', 'in', 'of', 'on', 'the', 'to', 'war',
  ]);
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 3 && !ignored.has(token));
}

function titleRelevance(candidateTitle, queryTokens) {
  if (!candidateTitle || queryTokens.length === 0) return 0;
  const candidateTokens = new Set(meaningfulTokens(candidateTitle));
  const matches = queryTokens.filter(token => candidateTokens.has(token)).length;
  return matches / queryTokens.length;
}

function sourceDisplayName(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return 'Authoritative source';
  }
}

function dedupeSources(sources) {
  const seen = new Set();
  return sources.filter(source => {
    const key = source?.url?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceRank(quality) {
  return ['archive', 'museum', 'primary', 'academic', 'reference'].indexOf(quality);
}

function rule(label, quality, domains) {
  return { label, quality, domains };
}
