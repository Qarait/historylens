import {
  formatHistoricalPeriod,
  formatHistoricalYear,
} from './config.js';

export function buildHistoryPrompt(year, groundingContext = '', regionProfile) {
  const yearLabel = formatHistoricalYear(year);
  const profile = regionProfile;
  const regionIds = profile.regions.map(region => region.id);
  const regionSchema = profile.regions
    .map(region => `    "${region.id}": { "state":"2-3 words","thesis_headline":"4-6 word verdict","thesis_argument":"1 analytical sentence","events":[${eventSchema(profile.eventsPerRegion)}],"key_figures":["...","...","..."],"significance":"1 sentence" }`)
    .join(',\n');
  const tensionSchema = [
    [regionIds[0], regionIds[1]],
    [regionIds[2], regionIds[3]],
    [regionIds[0], regionIds[4] || regionIds[3]],
  ].map(pair => `      { "regions": ${JSON.stringify(pair)}, "note": "1 crisp sentence." }`)
    .join(',\n');
  const groundingBlock = groundingContext
    ? `\nGROUNDING CHRONOLOGY:\nUse the following Wikipedia year-page excerpts as factual anchors. Do not copy their prose. Do not introduce a named event that conflicts with this chronology.\n${groundingContext}\n`
    : '';

  return `You are a senior historian writing for an analytical audience. Year: ${yearLabel}.
Return ONLY valid JSON. No markdown, no backticks, no prose outside the JSON.

TONE RULES - enforce on every sentence:
BANNED words: ongoing, attempted, continued, various, numerous, significant, important, experienced, saw, witnessed, underwent, faced, "played a role", "attempted reforms"
PREFERRED verbs: triggered, consolidated, fractured, collapsed, accelerated, cemented, destabilized, expanded, contracted, eclipsed, redirected, dismantled, upended, reinforced, exposed, suppressed, entrenched, imposed
EVENT DESCRIPTION: [Subject] + [strong verb] + [object] + [consequence]. One sentence.
THESIS HEADLINE: a verdict in 4-6 words, not a description.

ACCURACY RULES:
- Every event must have occurred, been active, ended, or reached a decisive turning point during ${yearLabel}.
- Do not import events from an adjacent year merely because their causes or consequences touched ${yearLabel}.
- For ancient years, acknowledge uncertainty and sparse records rather than inventing precision.
- Use civilisations and political entities active at the time.
- Analyze the whole world rather than fixating on one conflict, country, or civilization.
- Use this era-adjusted regional frame: ${profile.label}.
- Treat each region according to its historical societies and connections in ${yearLabel}, not modern borders.
${groundingBlock}
SCHEMA:
{
  "year_label": "${yearLabel}",
  "era_description": "4-7 word opinionated era name",
  "hook_moment": "1-2 punchy sentences juxtaposing what was happening across regions simultaneously. Use specific names and places.",
  "global_context": "2 analytical sentences.",
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
${tensionSchema}
    ]
  },
  "regions": {
${regionSchema}
  }
}

HARD CONSTRAINTS:
- Return exactly these region IDs in this order: ${regionIds.join(', ')}.
- Exactly 1 primary + ${profile.eventsPerRegion - 1} secondary event${profile.eventsPerRegion - 1 === 1 ? '' : 's'} per region.
- global_signals values must be one of Low, Moderate, High, Critical, Rising, Declining, Stable, Collapsing.
- Return JSON only.`;
}

function eventSchema(count) {
  return Array.from({ length: count }, (_, index) =>
    `{"year":"...","title":"...","description":"...","rank":"${index === 0 ? 'primary' : 'secondary'}"}`
  ).join(',');
}

export function buildPeriodPrompt(
  startYear,
  endYear,
  groundingContext = '',
  regionProfile
) {
  const periodLabel = formatHistoricalPeriod(startYear, endYear);
  const profile = regionProfile;
  const regionIds = profile.regions.map(region => region.id);
  const regionSchema = profile.regions
    .map(region => `    "${region.id}": { "state":"opening to closing trajectory in 3-5 words","thesis_headline":"4-6 word verdict","thesis_argument":"1 analytical sentence about change across the period","events":[${eventSchema(2)}],"key_figures":["...","...","..."],"significance":"1 sentence on the period's lasting regional consequence" }`)
    .join(',\n');
  const tensionSchema = [
    [regionIds[0], regionIds[1]],
    [regionIds[2], regionIds[3]],
    [regionIds[0], regionIds[4] || regionIds[3]],
  ].map(pair => `      { "regions": ${JSON.stringify(pair)}, "note": "1 crisp sentence about interaction or divergence across the period." }`)
    .join(',\n');
  const groundingBlock = groundingContext
    ? `\nSAMPLED GROUNDING CHRONOLOGIES:\nThese representative years anchor the period. Do not treat unsampled years as empty, but do not invent precision unsupported by established history.\n${groundingContext}\n`
    : '';

  return `You are a senior world historian analyzing change over time. Period: ${periodLabel}.
Return ONLY valid JSON. No markdown, no backticks, no prose outside the JSON.

ANALYTICAL GOAL:
- Explain what changed between the opening and closing of the period.
- Identify an opening condition, a decisive pivot, and an outcome.
- Distinguish long-running processes from isolated incidents.
- Analyze the whole world rather than fixating on one conflict, country, or civilization.
- Use this era-adjusted regional frame: ${profile.label}.
- Treat regions according to the political and cultural worlds of the period, not modern borders.

ACCURACY RULES:
- Every named turning point must fall between ${periodLabel}, inclusive.
- Use exact years or bounded year ranges for turning points.
- Do not claim a process ended within the period if it extended beyond it.
- For ancient periods, acknowledge uncertainty and sparse records rather than inventing precision.
- Use civilisations and political entities active at the time.
${groundingBlock}
SCHEMA:
{
  "period_label": "${periodLabel}",
  "era_description": "4-7 word opinionated period name",
  "hook_moment": "1-2 punchy sentences contrasting the beginning and end of the period across regions.",
  "global_context": "2 analytical sentences explaining the period's main transformation.",
  "period_phases": [
    { "stage": "Opening", "years": "bounded years within the period", "headline": "3-6 words", "description": "1 sentence" },
    { "stage": "Pivot", "years": "bounded years within the period", "headline": "3-6 words", "description": "1 sentence" },
    { "stage": "Outcome", "years": "bounded years within the period", "headline": "3-6 words", "description": "1 sentence" }
  ],
  "global_signals": {
    "war_intensity": "Low|Moderate|High|Critical|Rising|Declining|Stable|Collapsing",
    "political_fragmentation": "...",
    "economic_pressure": "...",
    "trade_activity": "...",
    "ideological_tension": "..."
  },
  "cross_region": {
    "contrast": "1-2 opinionated sentences explaining uneven change across regions.",
    "tensions": [
${tensionSchema}
    ]
  },
  "regions": {
${regionSchema}
  }
}

HARD CONSTRAINTS:
- Return exactly these region IDs in this order: ${regionIds.join(', ')}.
- Return exactly three period phases: Opening, Pivot, Outcome.
- Return exactly two turning points per region: one primary and one secondary.
- global_signals values must be one of Low, Moderate, High, Critical, Rising, Declining, Stable, Collapsing.
- Return JSON only.`;
}

export function buildKeyEventsPrompt(year, grounding) {
  const yearLabel = formatHistoricalYear(year);

  return `You are a careful world historian. Select exactly seven key events from the supplied chronology for ${yearLabel}.

SELECTION RULES:
- Use only events explicitly supported by the GROUNDING CHRONOLOGY below.
- Rank by lasting political, territorial, social, scientific, economic, environmental, or cultural consequence.
- Include events outside Western Europe and the United States.
- Include major regional conflicts that changed borders, sovereignty, security, or the balance of power.
- Aim for geographic breadth: no more than two events from one country and no more than three from one broad region.
- Every event must have occurred, begun, ended, or reached a decisive turning point during ${yearLabel}.
- Do not merge an event with a consequence from another year.
- Keep the summary factual and the significance analytical.
- For source_title, copy exactly one title shown after "{source: ...}" in the supporting chronology line.

GROUNDING CHRONOLOGY:
${grounding.context}

Return only valid JSON with this exact structure:
{
  "selection_note": "One sentence explaining that the list balances consequence and geographic breadth.",
  "events": [
    {
      "title": "Specific event name",
      "date": "Date or date range within ${yearLabel}",
      "location": "Country or region",
      "category": "Conflict | Politics | Society | Science | Economy | Culture | Environment",
      "summary": "Two concise factual sentences describing what happened.",
      "significance": "One concise sentence explaining the lasting consequence.",
      "source_title": "Exact source title copied from the grounding chronology"
    }
  ]
}

HARD CONSTRAINTS:
- Exactly seven events.
- All seven fields must be non-empty strings for every event.
- Every source_title must appear verbatim in the grounding chronology.
- Return JSON only, with no markdown fences or commentary.`;
}
