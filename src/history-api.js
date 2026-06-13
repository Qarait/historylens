(function initHistoryApi(global) {
  'use strict';

  const HISTORY_ENDPOINT = '/api/history';
  const REGION_IDS = ['europe', 'asia', 'namerica', 'africa', 'oceania'];

  async function fetchHistoryStream(year, callbacks) {
    const response = await requestHistory(year, true, 60000);
    callbacks.onGrounding?.(readGrounding(response));
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    const renderedKeys = new Set();
    const renderedRegions = new Set();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.substring(6));
          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullText += event.delta.text;
            processIncrementalText(fullText, renderedKeys, renderedRegions, callbacks);
          }
        } catch {
          // Ignore incomplete SSE lines and continue reading.
        }
      }
    }

    const finalData = finalizeParsing(fullText);
    validateSchema(finalData);
    callbacks.onComplete(finalData);
  }

  async function fetchHistory(year) {
    const response = await requestHistory(year, false, 45000);
    const apiData = await response.json();
    const rawContent = apiData.content?.[0]?.text;
    if (!rawContent) throw new Error('parse: Unrecognized response format');

    const parsed = finalizeParsing(rawContent);
    validateSchema(parsed);
    parsed.__grounding = readGrounding(response);
    return parsed;
  }

  async function requestHistory(year, stream, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(HISTORY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ year, stream }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API ${response.status}`);
      }
      return response;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('timeout');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function processIncrementalText(text, renderedKeys, renderedRegions, callbacks) {
    if (!renderedKeys.has('era_description')) {
      const match = text.match(/"era_description":\s*"([^"]+)"/);
      if (match) {
        callbacks.onHeader(match[1]);
        renderedKeys.add('era_description');
      }
    }

    const hookMatch = text.match(/"hook_moment":\s*"([^"]*)$|"hook_moment":\s*"([^"]*)"/);
    if (hookMatch) {
      callbacks.onHook(hookMatch[1] || hookMatch[2]);
      if (hookMatch[2] !== undefined) renderedKeys.add('hook_moment');
    }

    renderCompletedObject(text, 'global_context', renderedKeys, value => {
      if (typeof value === 'string') callbacks.onContext(value);
    }, true);
    renderCompletedObject(text, 'global_signals', renderedKeys, callbacks.onSignals);
    renderCompletedObject(text, 'cross_region', renderedKeys, callbacks.onCrossRegion);

    for (const regionId of REGION_IDS) {
      if (renderedRegions.has(regionId)) continue;
      const startIndex = text.indexOf(`"${regionId}":`);
      if (startIndex === -1) continue;
      const block = extractCompleteObject(text, startIndex);
      if (!block) continue;
      try {
        callbacks.onRegion(regionId, JSON.parse(block));
        renderedRegions.add(regionId);
      } catch {
        // Wait for more streamed data.
      }
    }
  }

  function renderCompletedObject(text, key, renderedKeys, callback, isString = false) {
    if (renderedKeys.has(key)) return;
    if (isString) {
      const match = text.match(new RegExp(`"${key}":\\s*"([^"]+)"`));
      if (!match) return;
      callback(match[1]);
      renderedKeys.add(key);
      return;
    }

    const startIndex = text.indexOf(`"${key}":`);
    if (startIndex === -1) return;
    const block = extractCompleteObject(text, startIndex);
    if (!block) return;
    try {
      callback(JSON.parse(block));
      renderedKeys.add(key);
    } catch {
      // Wait for more streamed data.
    }
  }

  function extractCompleteObject(text, startSearchIndex) {
    const openBraceIndex = text.indexOf('{', startSearchIndex);
    if (openBraceIndex === -1) return null;

    let braceCount = 0;
    let inString = false;
    let escaped = false;
    for (let index = openBraceIndex; index < text.length; index++) {
      const char = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{') braceCount++;
      else if (char === '}' && --braceCount === 0) {
        return text.substring(openBraceIndex, index + 1);
      }
    }
    return null;
  }

  function finalizeParsing(text) {
    const match = text?.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('parse: No JSON object found');
    try {
      return JSON.parse(match[0]);
    } catch {
      throw new Error('parse: Invalid JSON response');
    }
  }

  function validateSchema(data) {
    if (!data || typeof data !== 'object' || typeof data.era_description !== 'string') {
      throw new Error('schema');
    }
    for (const regionId of ['europe', 'asia', 'namerica', 'africa']) {
      const region = data.regions?.[regionId];
      if (!region || !Array.isArray(region.events) || region.events.length === 0) {
        throw new Error('schema');
      }
    }
  }

  function readGrounding(response) {
    if (response.headers.get('X-HistoryLens-Grounding') !== 'wikipedia') return null;
    const url = response.headers.get('X-HistoryLens-Source-Url');
    if (!url) return null;
    return {
      name: response.headers.get('X-HistoryLens-Source-Name') || 'Wikipedia contributors',
      url,
      curated: response.headers.get('X-HistoryLens-Curated') === 'true',
      reviewedAt: response.headers.get('X-HistoryLens-Reviewed-At') || '',
    };
  }

  global.HistoryLensApi = { fetchHistory, fetchHistoryStream };
})(window);
