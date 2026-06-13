export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const MODEL = 'claude-haiku-4-5-20251001';
export const MIN_YEAR = -3000;
export const MAX_YEAR = 2026;
export const HISTORY_MAX_TOKENS = 2800;
export const EVENTS_MAX_TOKENS = 2400;

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

export function wikipediaYearTitle(year) {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year === 1) return 'AD 1';
  return String(year);
}
