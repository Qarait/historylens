import fs from 'node:fs';
import path from 'node:path';

// --- CONFIGURATION ---
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3-flash-preview';

const YEARS_TO_TEST = ['44 BCE', '476', '1066', '1347', '1453', '1593', '1776', '1914', '1945'];

if (!GEMINI_KEY) {
  console.error('❌ ERROR: Missing GEMINI_API_KEY environment variable.');
  process.exit(1);
}

// --- PROMPT TEMPLATE ---
function buildPrompt(yearLabel) {
  return `You are a senior historian writing for an analytical audience. Year: ${yearLabel}.
Return ONLY valid JSON. No markdown, no backticks, no prose outside the JSON.

TONE RULES — enforce on every sentence:
BANNED words: ongoing, attempted, continued, various, numerous, significant, important, experienced, saw, witnessed, underwent, faced, "played a role", "attempted reforms"
REQUIRED verbs: triggered, consolidated, fractured, collapsed, accelerated, cemented, destabilized, expanded, contracted, eclipsed, redirected, dismantled, upended, reinforced, exposed, suppressed, entrenched, imposed
EVENT DESCRIPTION: [Subject] + [strong verb] + [object] + [consequence]. 1 sentence.
THESIS HEADLINE: a verdict in 4-6 words, not a description.

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
    "africa":   { "state":"...","thesis_headline":"...","thesis_argument":"...","events":[{"year":"...","title":"...","description":"...","rank":"primary"},{"year":"...","title":"...","description":"...","rank":"secondary"},{"year":"...","title":"...","description":"...","rank":"secondary"}],"key_figures":["...","...","..."],"significance":"..." }
  }
}

HARD CONSTRAINTS:
- Exactly 1 primary + 2 secondary events per region.
- global_signals values: exactly one of Low, Moderate, High, Critical, Rising, Declining, Stable, Collapsing
- Ancient years: use civilisations active at that time.
- Event year may vary ±5 years if needed for accuracy.`;
}

// --- SCHEMA VALIDATOR & SCORING ---
function validateCompleteness(data) {
  let score = 0;
  let errors = [];
  
  // +1 Valid JSON (assumed if calling this function)
  score += 1;

  if (!data || typeof data !== 'object') {
    errors.push('Response is not a JSON object');
    return { valid: false, score, errors };
  }
  
  // Cross-region contrast (+1 if exists)
  if (data.cross_region && typeof data.cross_region.contrast === 'string' && data.cross_region.contrast.trim().length > 0) {
    score += 1;
  } else {
    errors.push('Missing/empty cross_region block');
  }

  let hasAllRegionsWith3Events = true;
  let hasStrongThesis = true;
  let hasPrimaryEvent = true;
  
  const requiredRegions = ['europe', 'asia', 'namerica', 'africa'];

  if (!data.regions) {
    errors.push('Missing regions block entirely');
    hasAllRegionsWith3Events = false;
    hasStrongThesis = false;
    hasPrimaryEvent = false;
  } else {
    const keys = Object.keys(data.regions);
    if (keys.includes('oceania')) {
      errors.push('CRITICAL: Oceania was found in the regions. Schema violates 4-region lock.');
      hasAllRegionsWith3Events = false;
    }
    if (keys.length !== 4) {
      errors.push(`Found ${keys.length} regions instead of 4.`);
      if (keys.length > 4) hasAllRegionsWith3Events = false; 
    }

    for (const r of requiredRegions) {
      const region = data.regions[r];
      if (!region) {
        errors.push(`Missing region: ${r}`);
        hasAllRegionsWith3Events = false;
        hasStrongThesis = false;
        hasPrimaryEvent = false;
        continue;
      }

      // Thesis Check (>20 chars min length)
      if (!region.thesis_argument || region.thesis_argument.trim().length < 20) {
        errors.push(`Region ${r} thesis missing or too short (${region.thesis_argument?.length || 0} chars)`);
        hasStrongThesis = false;
      }

      // Events Check
      if (!Array.isArray(region.events)) {
        errors.push(`Region ${r} missing events array`);
        hasAllRegionsWith3Events = false;
        hasPrimaryEvent = false;
        continue;
      }

      if (region.events.length !== 3) {
        errors.push(`Region ${r} does not have exactly 3 events (found ${region.events.length})`);
        hasAllRegionsWith3Events = false;
      }

      let primaryCount = 0;
      let secondaryCount = 0;
      const seenEvents = new Set();

      for (const e of region.events) {
        if (e.rank === 'primary') primaryCount++;
        if (e.rank === 'secondary') secondaryCount++;

        if (e.title) {
          if (seenEvents.has(e.title.toLowerCase())) {
            errors.push(`Region ${r} duplicate event title: ${e.title}`);
          }
          seenEvents.add(e.title.toLowerCase());
        }
      }

      if (primaryCount !== 1) {
        errors.push(`Region ${r} has ${primaryCount} primary events (expected 1)`);
        hasPrimaryEvent = false;
      }
      if (secondaryCount !== 2) {
        errors.push(`Region ${r} has ${secondaryCount} secondary events (expected 2)`);
        hasAllRegionsWith3Events = false;
      }
    }
  }

  // Assign remaining scores
  if (hasAllRegionsWith3Events) score += 1; 
  if (hasStrongThesis) score += 1;          
  if (hasPrimaryEvent) score += 1;          

  return { valid: errors.length === 0, score, errors };
}

// --- BENCHMARK FUNCTIONS ---

async function runGemini(prompt, thinkingLevel) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;
  const start = Date.now();
  let firstTokenTime = null;
  let fullText = "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: thinkingLevel.toUpperCase()
          }
        }
      })
    });

    clearTimeout(timeoutId);

    // Explicit HTTP error check!
    if (!response.ok) {
      const errText = await response.text();
      return { 
        ttft: 0, latency: Date.now() - start, 
        text: "", type: "HTTP/API error", 
        rawError: `Status ${response.status}: ${errText.substring(0, 150)}`
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!firstTokenTime) firstTokenTime = Date.now() - start;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (let line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.candidates && parsed.candidates[0].content && parsed.candidates[0].content.parts) {
              for (const part of parsed.candidates[0].content.parts) {
                if (part.text) fullText += part.text;
              }
            }
          } catch(e) {}
        }
      }
    }

    const totalLatency = Date.now() - start;
    if (!fullText) {
      return { ttft: firstTokenTime, latency: totalLatency, text: "", type: "Empty Response", rawError: null };
    }
    return { ttft: firstTokenTime, latency: totalLatency, text: fullText, type: "Success", rawError: null };

  } catch (err) {
    if (err.name === 'AbortError') {
      return { ttft: 0, latency: 90000, text: "", type: "Timeout", rawError: "Request aborted after 90 seconds" };
    }
    return { ttft: 0, latency: Date.now() - start, text: "", type: "HTTP/API error", rawError: err.message };
  }
}

// --- RUNNER ---

async function evaluateRun(result) {
  let score = 0;
  let valid = false;
  let errors = [];
  let failureType = result.type; // Extract HTTP/Timeout/Empty types

  if (result.type !== "Success") {
    errors.push(`[${result.type}] ${result.rawError || ''}`);
    return { ttft_ms: result.ttft, latency_ms: result.latency, score, perfect_schema: valid, errors, failureType };
  }

  // Parse JSON explicitly
  let parsed;
  try {
    parsed = JSON.parse(result.text);
  } catch (e) {
    failureType = "Malformed JSON";
    errors.push('JSON Parse Error');
    return { ttft_ms: result.ttft, latency_ms: result.latency, score, perfect_schema: valid, errors, failureType };
  }

  // Schema Validation explicitly
  const completeness = validateCompleteness(parsed);
  valid = completeness.valid;
  score = completeness.score;
  errors = completeness.errors;
  
  if (!valid && errors.length > 0) {
    failureType = "Schema Failure";
  }

  return { ttft_ms: result.ttft, latency_ms: result.latency, score, perfect_schema: valid, errors, failureType };
}


async function main() {
  console.log('=============================================');
  console.log(`HistoryLens Optimization Benchmark: ${GEMINI_MODEL}`);
  console.log('Testing thinking levels: "minimal" vs "low"');
  console.log('=============================================\n');

  const results = [];

  for (const year of YEARS_TO_TEST) {
    console.log(`[Testing Year]: ${year}...`);
    const prompt = buildPrompt(year);

    // 1. GEMINI MINIMAL
    const minimalRes = await runGemini(prompt, "minimal");
    const minimalEval = await evaluateRun(minimalRes);

    // 2. GEMINI LOW
    const lowRes = await runGemini(prompt, "low");
    const lowEval = await evaluateRun(lowRes);

    const report = {
      year,
      minimal: minimalEval,
      low: lowEval
    };
    results.push(report);

    // Detailed terminal output logging explicit failure classifications
    let minErrStr = minimalEval.errors.length > 0 ? ` [${minimalEval.failureType}] ${minimalEval.errors.slice(0, 2).join(' | ')}` : '';
    console.log(`  Minimal (Score: ${minimalEval.score}/5) -> TTFT: ${minimalEval.ttft_ms}ms | Total: ${minimalEval.latency_ms}ms${minErrStr ? '\n     ❌' + minErrStr : ''}`);

    let lowErrStr = lowEval.errors.length > 0 ? ` [${lowEval.failureType}] ${lowEval.errors.slice(0, 2).join(' | ')}` : '';
    console.log(`  Low     (Score: ${lowEval.score}/5) -> TTFT: ${lowEval.ttft_ms}ms | Total: ${lowEval.latency_ms}ms${lowErrStr ? '\n     ❌' + lowErrStr : ''}`);
        
    console.log('');
    // Cooldown
    await new Promise(r => setTimeout(r, 2000));
  }

  // Aggregates
  const agg = {
    minimal: {
      avg_latency: results.reduce((sum, r) => sum + r.minimal.latency_ms, 0) / results.length,
      avg_ttft: results.reduce((sum, r) => sum + r.minimal.ttft_ms, 0) / results.length,
      avg_score: results.reduce((sum, r) => sum + r.minimal.score, 0) / results.length,
      perfect_rate: (results.filter(r => r.minimal.perfect_schema).length / results.length) * 100
    },
    low: {
      avg_latency: results.reduce((sum, r) => sum + r.low.latency_ms, 0) / results.length,
      avg_ttft: results.reduce((sum, r) => sum + r.low.ttft_ms, 0) / results.length,
      avg_score: results.reduce((sum, r) => sum + r.low.score, 0) / results.length,
      perfect_rate: (results.filter(r => r.low.perfect_schema).length / results.length) * 100
    }
  };

  console.log('================ SUMMARY ================');
  console.log('Gemini 3 Flash (Thinking: "minimal")');
  console.log(`  Avg Score: ${Math.round(agg.minimal.avg_score * 10)/10} / 5  |  Perfect Runs: ${Math.round(agg.minimal.perfect_rate)}%`);
  console.log(`  Avg TTFT: ${Math.round(agg.minimal.avg_ttft)}ms  |  Avg Latency: ${Math.round(agg.minimal.avg_latency)}ms\n`);

  console.log('Gemini 3 Flash (Thinking: "low")');
  console.log(`  Avg Score: ${Math.round(agg.low.avg_score * 10)/10} / 5  |  Perfect Runs: ${Math.round(agg.low.perfect_rate)}%`);
  console.log(`  Avg TTFT: ${Math.round(agg.low.avg_ttft)}ms  |  Avg Latency: ${Math.round(agg.low.avg_latency)}ms\n`);

  const outputPath = path.join(process.cwd(), 'benchmark_results.json');
  fs.writeFileSync(outputPath, JSON.stringify({ summary: agg, results }, null, 2));
  console.log(`\n💾 Detailed results saved to ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal benchmark error:', err);
  process.exit(1);
});
