(function initPeriodApi(global) {
  'use strict';

  const PERIOD_ENDPOINT = '/api/period';
  const DEFAULT_REGIONS = [
    { id: 'europe', label: 'Europe', sub: 'Western & Eastern Europe', icon: 'E', color: '#c0392b' },
    { id: 'asia', label: 'Asia', sub: 'East, South, Central Asia & Middle East', icon: 'A', color: '#16a085' },
    { id: 'namerica', label: 'The Americas', sub: 'North, Central & South America', icon: 'W', color: '#2980b9' },
    { id: 'africa', label: 'Africa', sub: 'Sub-Saharan & North Africa', icon: 'A', color: '#d4ac0d' },
  ];

  async function fetchPeriod(startYear, endYear) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(PERIOD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ startYear, endYear }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API ${response.status}`);
      }

      const apiData = await response.json();
      const rawContent = apiData.content?.[0]?.text;
      if (!rawContent) throw new Error('parse: Unrecognized response format');
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('parse: No JSON object found');

      let parsed;
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error('parse: Invalid JSON response');
      }

      const profile = readRegionProfile(response);
      validateSchema(parsed, profile.regions.map(region => region.id));
      parsed.__regionProfile = profile;
      parsed.__grounding = readGrounding(response);
      return parsed;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('timeout');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function validateSchema(data, regionIds) {
    if (
      !data ||
      typeof data.era_description !== 'string' ||
      !Array.isArray(data.period_phases) ||
      data.period_phases.length !== 3
    ) {
      throw new Error('schema');
    }
    for (const regionId of regionIds) {
      const region = data.regions?.[regionId];
      if (!region || !Array.isArray(region.events) || region.events.length !== 2) {
        throw new Error('schema');
      }
    }
  }

  function readGrounding(response) {
    if (response.headers.get('X-HistoryLens-Grounding') !== 'wikipedia') return [];
    const encoded = response.headers.get('X-HistoryLens-Sources');
    if (!encoded) return [];
    try {
      return JSON.parse(decodeURIComponent(encoded)).map(source => ({
        name: source.name,
        url: source.url,
        quality: source.quality || 'reference',
        qualityLabel: source.qualityLabel || 'Reference chronology',
      }));
    } catch {
      return [];
    }
  }

  function readRegionProfile(response) {
    const encoded = response.headers.get('X-HistoryLens-Region-Profile');
    if (!encoded) {
      return { id: 'modern', label: 'Modern continental regions', regions: DEFAULT_REGIONS };
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(encoded));
      if (!Array.isArray(parsed.regions) || parsed.regions.length < 4) {
        throw new Error('Invalid profile');
      }
      return parsed;
    } catch {
      return { id: 'modern', label: 'Modern continental regions', regions: DEFAULT_REGIONS };
    }
  }

  global.HistoryLensPeriodApi = { fetchPeriod };
})(window);
