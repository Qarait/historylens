import { formatHistoricalYear } from './config.js';

export function buildHistoryPrompt(year, groundingContext = '') {
  const yearLabel = formatHistoricalYear(year);
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
      { "regions": ["europe","asia"], "note": "1 crisp sentence." },
      { "regions": ["namerica","africa"], "note": "1 crisp sentence." },
      { "regions": ["europe","africa"], "note": "1 crisp sentence." }
    ]
  },
  "regions": {
    "europe": { "state":"2-3 words","thesis_headline":"4-6 word verdict","thesis_argument":"1 analytical sentence","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"1 sentence" },
    "asia": { "state":"...","thesis_headline":"...","thesis_argument":"...","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"..." },
    "namerica": { "state":"...","thesis_headline":"...","thesis_argument":"...","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"..." },
    "africa": { "state":"...","thesis_headline":"...","thesis_argument":"...","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"..." }
  }
}

HARD CONSTRAINTS:
- Exactly 1 primary + 2 secondary events per region.
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
