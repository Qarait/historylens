import { expect, test } from '@playwright/test';

const historyData = {
  year_label: '2020 CE',
  era_description: 'A World Under Pressure',
  hook_moment: 'A pandemic reshaped daily life while regional conflicts altered borders.',
  global_context: 'The pandemic destabilized economies. Political pressure accelerated across regions.',
  global_signals: {
    war_intensity: 'High',
    political_fragmentation: 'Rising',
    economic_pressure: 'Critical',
    trade_activity: 'Declining',
    ideological_tension: 'High',
  },
  cross_region: {
    contrast: 'A shared health emergency produced sharply different political responses.',
    tensions: [{ regions: ['europe', 'asia'], note: 'Supply chains exposed mutual dependence.' }],
  },
  regions: Object.fromEntries(
    ['europe', 'asia', 'namerica', 'africa'].map(region => [
      region,
      {
        state: 'Under pressure',
        thesis_headline: 'Crisis Reordered Priorities',
        thesis_argument: 'The pandemic redirected political and economic capacity.',
        events: [
          { year: '2020', title: `${region} primary event`, description: 'A major event altered regional priorities.', rank: 'primary' },
          { year: '2020', title: `${region} secondary event`, description: 'A second development reinforced the shift.', rank: 'secondary' },
          { year: '2020', title: `${region} third event`, description: 'A third development exposed structural pressure.', rank: 'secondary' },
        ],
        key_figures: ['Figure One', 'Figure Two'],
        significance: 'The effects persisted beyond the year.',
      },
    ])
  ),
};

const eventsData = {
  selection_note: 'Selected for consequence and geographic breadth.',
  grounding: {
    name: 'Wikipedia contributors',
    url: 'https://en.wikipedia.org/wiki/2020',
    quality: 'reference',
    qualityLabel: 'Reference chronology',
  },
  events: Array.from({ length: 7 }, (_, index) => ({
    title: index === 0 ? 'Second Nagorno-Karabakh War' : `Key event ${index + 1}`,
    date: '2020',
    location: `Region ${index + 1}`,
    category: index === 0 ? 'Conflict' : 'Politics',
    summary: 'A factual account of the event and its immediate outcome.',
    significance: 'The event produced lasting consequences.',
    source_title: index === 0 ? 'Second Nagorno-Karabakh War' : `Source Event ${index + 1}`,
    source_url: `https://en.wikipedia.org/wiki/Source_Event_${index + 1}`,
    sources: [{
      title: index === 0 ? 'Academic study of the Second Nagorno-Karabakh War' : `Academic study ${index + 1}`,
      url: `https://doi.org/10.1234/history.${index + 1}`,
      publisher: 'Historical Review',
      publicationYear: 2024,
      quality: 'academic',
      qualityLabel: 'Academic',
    }],
  })),
};

const modernProfile = {
  id: 'modern',
  label: 'Modern continental regions',
  regions: [
    { id: 'europe', label: 'Europe', sub: 'Western & Eastern Europe', icon: 'E', color: '#c0392b' },
    { id: 'asia', label: 'Asia', sub: 'East, South, Central Asia & Middle East', icon: 'A', color: '#16a085' },
    { id: 'namerica', label: 'The Americas', sub: 'North, Central & South America', icon: 'W', color: '#2980b9' },
    { id: 'africa', label: 'Africa', sub: 'Sub-Saharan & North Africa', icon: 'A', color: '#d4ac0d' },
  ],
};

const ancientProfile = {
  id: 'ancient',
  label: 'Ancient world regions',
  regions: [
    { id: 'mediterranean', label: 'Mediterranean & Europe', sub: 'Rome, Greece, and neighboring societies', icon: 'M', color: '#c0392b' },
    { id: 'west_south_asia', label: 'West, Central & South Asia', sub: 'Persia, the steppe, and India', icon: 'W', color: '#16a085' },
    { id: 'east_asia', label: 'East Asia', sub: 'China, Korea, and Japan', icon: 'E', color: '#2980b9' },
    { id: 'africa', label: 'Africa', sub: 'African societies', icon: 'A', color: '#d4ac0d' },
    { id: 'americas_pacific', label: 'Americas & Pacific', sub: 'American and Pacific societies', icon: 'P', color: '#8e6bbd' },
  ],
};

function historyFor(year, profile) {
  const eventsPerRegion = profile.id === 'modern' ? 3 : 2;
  return {
    ...historyData,
    year_label: year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`,
    regions: Object.fromEntries(profile.regions.map(region => [
      region.id,
      {
        state: 'Historically active',
        thesis_headline: 'Power Shifted Across Networks',
        thesis_argument: 'Political and economic systems changed across this historical zone.',
        events: Array.from({ length: eventsPerRegion }, (_, index) => ({
          year: String(Math.abs(year)),
          title: `${region.label} event ${index + 1}`,
          description: 'A grounded development altered regional power and exchange.',
          rank: index === 0 ? 'primary' : 'secondary',
        })),
        key_figures: ['Figure One', 'Figure Two'],
        significance: 'The effects reshaped the wider historical system.',
      },
    ])),
  };
}

function periodFor(startYear, endYear, profile) {
  return {
    period_label: `${startYear}-${endYear} CE`,
    era_description: 'A Period of Structural Change',
    hook_moment: 'The period opened under established orders and closed after power shifted across regions.',
    global_context: 'Political movements and economic pressures changed the global balance. Regional outcomes diverged.',
    period_phases: [
      { stage: 'Opening', years: String(startYear), headline: 'Old Orders Hold', description: 'Established systems defined the opening conditions.' },
      { stage: 'Pivot', years: `${startYear + 2}-${endYear - 1}`, headline: 'Pressure Breaks Through', description: 'A cluster of turning points accelerated change.' },
      { stage: 'Outcome', years: String(endYear), headline: 'A New Balance Emerges', description: 'The period closed with altered institutions and alliances.' },
    ],
    global_signals: historyData.global_signals,
    cross_region: historyData.cross_region,
    regions: Object.fromEntries(profile.regions.map(region => [
      region.id,
      {
        state: 'Stability to disruption',
        thesis_headline: 'Power Shifted Across Institutions',
        thesis_argument: 'The region moved from inherited constraints toward a changed political order.',
        events: [
          { year: String(startYear), title: `${region.label} opening shift`, description: 'An opening development shaped the regional trajectory.', rank: 'primary' },
          { year: String(endYear), title: `${region.label} outcome`, description: 'A closing development revealed the period result.', rank: 'secondary' },
        ],
        key_figures: ['Figure One', 'Figure Two'],
        significance: 'The period redirected the region beyond its closing year.',
      },
    ])),
  };
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/history', async route => {
    const requestBody = route.request().postDataJSON();
    expect(Object.keys(requestBody).sort()).toEqual(['stream', 'year']);

    const profile = requestBody.year <= 500 ? ancientProfile : modernProfile;
    const responseData = historyFor(requestBody.year, profile);
    const text = JSON.stringify(responseData);
    const historyHeaders = {
      'X-HistoryLens-Grounding': 'wikipedia',
      'X-HistoryLens-Source-Name': 'Wikipedia contributors',
      'X-HistoryLens-Source-Url': `https://en.wikipedia.org/wiki/${requestBody.year}`,
      'X-HistoryLens-Source-Quality': requestBody.year === 2020 ? 'reviewed' : 'reference',
      'X-HistoryLens-Region-Profile': encodeURIComponent(JSON.stringify(profile)),
      ...(requestBody.year === 2020 ? {
        'X-HistoryLens-Curated': 'true',
        'X-HistoryLens-Reviewed-At': '2026-06-13',
      } : {}),
    };
    if (requestBody.stream) {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: historyHeaders,
        body: `data: ${JSON.stringify({
          type: 'content_block_delta',
          delta: { type: 'text_delta', text },
        })}\n\n`,
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: historyHeaders,
      body: JSON.stringify({ content: [{ text }] }),
    });
  });

  await page.route('**/api/period', async route => {
    const requestBody = route.request().postDataJSON();
    expect(Object.keys(requestBody).sort()).toEqual(['endYear', 'startYear']);
    const midpoint = Math.trunc((requestBody.startYear + requestBody.endYear) / 2);
    const profile = midpoint <= 500 ? ancientProfile : modernProfile;
    const responseData = periodFor(requestBody.startYear, requestBody.endYear, profile);
    const sources = [requestBody.startYear, midpoint, requestBody.endYear].map(year => ({
      name: String(year),
      url: `https://en.wikipedia.org/wiki/${year}`,
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'X-HistoryLens-Grounding': 'wikipedia',
        'X-HistoryLens-Sources': encodeURIComponent(JSON.stringify(sources)),
        'X-HistoryLens-Region-Profile': encodeURIComponent(JSON.stringify(profile)),
      },
      body: JSON.stringify({ content: [{ text: JSON.stringify(responseData) }] }),
    });
  });

  await page.route('**/api/events', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(eventsData),
  }));

  await page.route('**/api/check-event', async route => {
    const requestBody = route.request().postDataJSON();
    expect(Object.keys(requestBody).sort()).toEqual(['query', 'year']);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        query: requestBody.query,
        year_label: '2020 CE',
        found: true,
        matches: [{
          month: 'September',
          excerpt: 'The Second Nagorno-Karabakh War begins between Armenia and Azerbaijan.',
          sourceTitle: 'Second Nagorno-Karabakh War',
          sourceUrl: 'https://en.wikipedia.org/wiki/Second_Nagorno-Karabakh_War',
        }],
        explanation: 'This event appears in the year chronology. The main dashboard is selective.',
        grounding: {
          name: 'Wikipedia contributors',
          url: 'https://en.wikipedia.org/wiki/2020',
        },
      }),
    });
  });
});

test('explores a year and shows cited key events', async ({ page }) => {
  await page.goto('/');
  await page.locator('#yearInput').fill('2020');
  await page.locator('#searchBtn').click();

  await expect(page.locator('.region-card')).toHaveCount(4);
  await expect(page.locator('.curated-badge')).toContainText('reviewed 2026-06-13');
  await expect(page.locator('#historyGrounding')).toContainText('Wikipedia contributors');
  await expect(page.locator('#historyGrounding .source-quality')).toContainText('Reviewed edition');
  await expect(page.locator('.historical-map-panel')).toHaveCount(1);
  await expect(page.locator('.historical-map-node')).toHaveCount(4);
  await expect(page.locator('.historical-map-control')).toHaveText([
    'Primary',
    'Supporting 1',
    'Supporting 2',
  ]);
  await page.locator('.historical-map-node[aria-label^="Asia:"] .historical-map-node-pin').click();
  await expect(page.locator('.historical-map-detail-region')).toHaveText('Asia');
  await expect(page.locator('.historical-map-detail-title')).toHaveText('Asia event 1');
  await expect(page.locator('.historical-map-region-chip')).toHaveCount(4);
  await expect(page.locator('.historical-map-region-chip.active')).toContainText('Asia');
  await page.locator('.historical-map-connection .historical-map-link-badge').click();
  await expect(page.locator('.historical-map-detail-region')).toHaveText('Cross-region connection');
  await expect(page.locator('.historical-map-detail-title')).toHaveText('Europe ↔ Asia');
  await page.locator('.historical-map-region-chip').filter({ hasText: 'Asia' }).click();
  await page.locator('.historical-map-detail-action.is-primary').click();
  await expect(page.locator('.region-card[data-region="asia"]')).toHaveClass(/map-highlight/);
  await page.locator('.key-events-btn').click();
  await expect(page.locator('.key-event-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Second Nagorno-Karabakh War' })).toBeVisible();
  await expect(page.locator('.key-event-source').first()).toBeVisible();
  await expect(page.locator('.key-event-card').first().locator('.source-quality')).toHaveText([
    'Reference chronology',
    'Academic',
  ]);
  await expect(page.locator('.key-events-attribution')).toContainText('Wikipedia contributors');

  await page.locator('.event-check-form input').fill('Nagorno-Karabakh War');
  await page.locator('.event-check-form button').click();
  await expect(page.locator('.event-check-verdict')).toHaveText('Found in chronology');
  await expect(page.locator('.event-check-match')).toContainText('Second Nagorno-Karabakh War');
});

test('keeps the key events panel usable on a narrow viewport', async ({ page }) => {
  await page.goto('/');
  await page.locator('#yearInput').fill('2020');
  await page.locator('#searchBtn').click();
  await page.locator('.key-events-btn').click();
  await expect(page.locator('.key-event-card')).toHaveCount(7);
  await page.locator('.event-check-form input').fill('Nagorno-Karabakh War');
  await page.locator('.event-check-form button').click();
  await expect(page.locator('.event-check-match')).toBeVisible();

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasOverflow).toBe(false);
});

test('compares a curated year with a generated year', async ({ page }) => {
  await page.goto('/');
  await page.locator('#compareTrack').click();
  await page.locator('#yearInput').fill('2020');
  await page.locator('#yearInput2').fill('2021');
  await page.locator('#searchBtn').click();

  await expect(page.locator('.compare-block')).toHaveCount(2);
  await expect(page.locator('.region-card')).toHaveCount(8);
  await expect(page.locator('.historical-map-panel')).toHaveCount(2);
  await expect(page.locator('.historical-map-node')).toHaveCount(8);
  await expect(page.locator('.curated-badge')).toHaveCount(1);
  await expect(page.locator('#historyGrounding a')).toHaveCount(2);
});

test('uses era-adjusted regions for an ancient year', async ({ page }) => {
  await page.goto('/');
  await page.locator('#yearInput').fill('-44');
  await page.locator('#searchBtn').click();

  await expect(page.locator('.region-card')).toHaveCount(5);
  await expect(page.locator('.region-name')).toHaveText([
    'Mediterranean & Europe',
    'West, Central & South Asia',
    'East Asia',
    'Africa',
    'Americas & Pacific',
  ]);
  await expect(page.locator('#regionProfileNote')).toContainText('Ancient world regions');
  await expect(page.locator('.event-item')).toHaveCount(10);
  await expect(page.locator('.historical-map-node')).toHaveCount(5);
  await expect(page.locator('.historical-map-control')).toHaveText([
    'Primary',
    'Supporting 1',
  ]);
});

test('compares ancient and modern region systems without overflow', async ({ page }) => {
  await page.goto('/');
  await page.locator('#compareTrack').click();
  await page.locator('#yearInput').fill('-44');
  await page.locator('#yearInput2').fill('2020');
  await page.locator('#searchBtn').click();

  await expect(page.locator('.compare-block')).toHaveCount(2);
  await expect(page.locator('.region-card')).toHaveCount(9);
  await expect(page.locator('.compare-region-profile')).toHaveText([
    'Ancient world regions',
    'Modern continental regions',
  ]);
  await expect(page.locator('.historical-map-panel')).toHaveCount(2);
  await expect(page.locator('.historical-map-node')).toHaveCount(9);
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasOverflow).toBe(false);
});

test('explores a decade as a change-over-time view', async ({ page }) => {
  await page.goto('/');
  await page.locator('#periodModeBtn').click();
  await page.locator('#periodStartInput').fill('1960');
  await page.locator('#periodEndInput').fill('1969');
  await page.locator('#periodSearchBtn').click();

  await expect(page.locator('#resultsYear')).toHaveText('1960-1969 CE');
  await expect(page.locator('.period-phase')).toHaveCount(3);
  await expect(page.locator('.period-phase-stage')).toHaveText(['Opening', 'Pivot', 'Outcome']);
  await expect(page.locator('.region-card')).toHaveCount(4);
  await expect(page.locator('.event-item')).toHaveCount(8);
  await expect(page.locator('.events-list').locator('..').locator('.section-title')).toHaveText([
    'Key Turning Points',
    'Key Turning Points',
    'Key Turning Points',
    'Key Turning Points',
  ]);
  await expect(page.locator('#historyGrounding a')).toHaveCount(3);
  await expect(page.locator('.historical-map-panel')).toHaveCount(1);
  await expect(page.locator('.historical-map-node')).toHaveCount(4);
  await expect(page.locator('.historical-map-control')).toHaveText([
    'Defining shift',
    'Supporting shift',
  ]);
  await expect(page).toHaveURL(/start=1960&end=1969/);
  await expect(page.locator('#keyEventsOutput')).toBeEmpty();
});

test('uses adaptive regions for an ancient period on mobile without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?start=-44&end=-31');

  await expect(page.locator('.period-phase')).toHaveCount(3);
  await expect(page.locator('.region-card')).toHaveCount(5);
  await expect(page.locator('.event-item')).toHaveCount(10);
  await expect(page.locator('#regionProfileNote')).toContainText('Ancient world regions');
  await expect(page.locator('.historical-map-node')).toHaveCount(5);
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasOverflow).toBe(false);
});

test('rejects a period longer than 25 years before making a request', async ({ page }) => {
  let periodRequests = 0;
  await page.route('**/api/period', route => {
    periodRequests++;
    return route.continue();
  });
  await page.goto('/');
  await page.locator('#periodModeBtn').click();
  await page.locator('#periodStartInput').fill('1900');
  await page.locator('#periodEndInput').fill('1925');
  await page.locator('#periodSearchBtn').click();

  await expect(page.locator('#errorBox')).toContainText('at most 25 years');
  expect(periodRequests).toBe(0);
});
