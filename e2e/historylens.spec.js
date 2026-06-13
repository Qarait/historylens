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
  })),
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/history', async route => {
    const requestBody = route.request().postDataJSON();
    expect(Object.keys(requestBody).sort()).toEqual(['stream', 'year']);
    expect(requestBody.year).toBe(2020);

    const text = JSON.stringify(historyData);
    if (requestBody.stream) {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'X-HistoryLens-Grounding': 'wikipedia',
          'X-HistoryLens-Source-Name': 'Wikipedia contributors',
          'X-HistoryLens-Source-Url': 'https://en.wikipedia.org/wiki/2020',
        },
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
      body: JSON.stringify({ content: [{ text }] }),
    });
  });

  await page.route('**/api/events', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(eventsData),
  }));
});

test('explores a year and shows cited key events', async ({ page }) => {
  await page.goto('/');
  await page.locator('#yearInput').fill('2020');
  await page.locator('#searchBtn').click();

  await expect(page.locator('.region-card')).toHaveCount(4);
  await expect(page.locator('#historyGrounding')).toContainText('Wikipedia contributors');
  await page.locator('.key-events-btn').click();
  await expect(page.locator('.key-event-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Second Nagorno-Karabakh War' })).toBeVisible();
  await expect(page.locator('.key-event-source').first()).toBeVisible();
  await expect(page.locator('.key-events-attribution')).toContainText('Wikipedia contributors');
});

test('keeps the key events panel usable on a narrow viewport', async ({ page }) => {
  await page.goto('/');
  await page.locator('#yearInput').fill('2020');
  await page.locator('#searchBtn').click();
  await page.locator('.key-events-btn').click();
  await expect(page.locator('.key-event-card')).toHaveCount(7);

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasOverflow).toBe(false);
});
