(function initEventChecker(global) {
  'use strict';

  const ENDPOINT = '/api/check-event';
  const cache = new Map();

  function renderControls(years, formatYear) {
    const output = document.getElementById('eventCheckOutput');
    output.innerHTML = '';
    output.className = years.length > 1 ? 'event-check-output is-compare' : 'event-check-output';

    for (const year of years) {
      const panel = document.createElement('section');
      panel.className = 'event-check-panel';

      const heading = document.createElement('div');
      heading.className = 'event-check-heading';
      const eyebrow = document.createElement('div');
      eyebrow.className = 'event-check-eyebrow';
      eyebrow.textContent = years.length > 1 ? formatYear(year) : 'Missing Something?';
      const title = document.createElement('h2');
      title.className = 'event-check-title';
      title.textContent = `Check an Event in ${formatYear(year)}`;
      const description = document.createElement('p');
      description.className = 'event-check-description';
      description.textContent = 'Search the source chronology to see whether an event belongs to this year.';
      heading.append(eyebrow, title, description);

      const form = document.createElement('form');
      form.className = 'event-check-form';
      const input = document.createElement('input');
      input.type = 'search';
      input.minLength = 3;
      input.maxLength = 120;
      input.required = true;
      input.placeholder = 'e.g. Nagorno-Karabakh War';
      input.setAttribute('aria-label', `Event to check in ${formatYear(year)}`);
      const button = document.createElement('button');
      button.type = 'submit';
      button.textContent = 'Check chronology';
      form.append(input, button);

      const result = document.createElement('div');
      result.className = 'event-check-result';
      result.setAttribute('aria-live', 'polite');
      form.addEventListener('submit', event => {
        event.preventDefault();
        checkEvent(year, input.value, button, result);
      });

      panel.append(heading, form, result);
      output.appendChild(panel);
    }
  }

  async function checkEvent(year, rawQuery, button, result) {
    const query = rawQuery.trim();
    if (query.length < 3) return;
    const cacheKey = `${year}:${query.toLowerCase()}`;

    button.disabled = true;
    button.textContent = 'Checking...';
    renderLoading(result);
    try {
      let data = cache.get(cacheKey);
      if (!data) {
        data = await fetchResult(year, query);
        cache.set(cacheKey, data);
      }
      renderResult(result, data);
    } catch (error) {
      renderError(result, error);
    } finally {
      button.disabled = false;
      button.textContent = 'Check chronology';
    }
  }

  async function fetchResult(year, query) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ year, query }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `API ${response.status}`);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The source check timed out.');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function renderLoading(container) {
    container.innerHTML = '';
    container.className = 'event-check-result visible loading';
    container.textContent = 'Searching the year chronology...';
  }

  function renderResult(container, data) {
    container.innerHTML = '';
    container.className = `event-check-result visible ${data.found ? 'found' : 'not-found'}`;

    const verdict = document.createElement('div');
    verdict.className = 'event-check-verdict';
    verdict.textContent = data.found ? 'Found in chronology' : 'No close match found';
    container.appendChild(verdict);

    if (data.found) {
      for (const match of data.matches) {
        const item = document.createElement('article');
        item.className = 'event-check-match';
        const title = document.createElement('h3');
        title.textContent = match.sourceTitle;
        const excerpt = document.createElement('p');
        excerpt.textContent = match.excerpt;
        const source = document.createElement('a');
        source.href = match.sourceUrl;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
        source.textContent = `Open source: ${match.sourceTitle}`;
        item.append(title, excerpt, source);
        container.appendChild(item);
      }
    }

    const explanation = document.createElement('p');
    explanation.className = 'event-check-explanation';
    explanation.textContent = data.explanation;
    container.appendChild(explanation);
  }

  function renderError(container, error) {
    container.innerHTML = '';
    container.className = 'event-check-result visible error';
    container.textContent = error.message || 'Could not check this event.';
  }

  global.HistoryLensEventChecker = { renderControls };
})(window);
