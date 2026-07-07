export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const MODEL = 'claude-haiku-4-5-20251001';
export const MIN_YEAR = -3000;
export const MAX_YEAR = 2026;
export const HISTORY_MAX_TOKENS = 2800;
export const PERIOD_MAX_TOKENS = 3400;
export const EVENTS_MAX_TOKENS = 2400;
export const MAX_PERIOD_YEARS = 25;
export const SUPPORTED_LANGUAGES = new Set(['en', 'ru']);

export function normalizeLanguage(value) {
  if (typeof value !== 'string') return 'en';
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.has(base) ? base : 'en';
}

export function localizedMaxTokens(baseTokens, language) {
  return normalizeLanguage(language) === 'ru' ? Math.ceil(baseTokens * 1.6) : baseTokens;
}

export function parseHistoricalYear(value) {
  const year = Number.parseInt(value, 10);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR || year === 0) {
    return null;
  }
  return year;
}

export function formatHistoricalYear(year) {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

export function historicalYearDistance(startYear, endYear) {
  const rawDistance = endYear - startYear;
  return startYear < 0 && endYear > 0 ? rawDistance - 1 : rawDistance;
}

export function formatHistoricalPeriod(startYear, endYear) {
  if (startYear < 0 && endYear < 0) {
    return `${Math.abs(startYear)}-${Math.abs(endYear)} BCE`;
  }
  if (startYear > 0 && endYear > 0) {
    return `${startYear}-${endYear} CE`;
  }
  return `${formatHistoricalYear(startYear)}-${formatHistoricalYear(endYear)}`;
}

export function wikipediaYearTitle(year) {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year === 1) return 'AD 1';
  return String(year);
}
