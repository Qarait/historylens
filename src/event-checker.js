(function initEventChecker(global) {
  'use strict';

  const ENDPOINT = '/api/check-event';
  const cache = new Map();
  const cacheKeyFor = (year, query) => `${getLanguage()}:${year}:${query.toLowerCase()}`;

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
      eyebrow.textContent = years.length > 1 ? formatYear(year) : t('eventCheck.eyebrow');
      const title = document.createElement('h2');
      title.className = 'event-check-title';
      title.textContent = t('eventCheck.title', { year: formatYear(year) });
      const description = document.createElement('p');
      description.className = 'event-check-description';
      description.textContent = t('eventCheck.description');
      heading.append(eyebrow, title, description);

      const form = document.createElement('form');
      form.className = 'event-check-form';
      const input = document.createElement('input');
      input.type = 'search';
      input.minLength = 3;
      input.maxLength = 120;
      input.required = true;
      input.placeholder = t('eventCheck.placeholder');
      input.setAttribute('aria-label', t('eventCheck.aria', { year: formatYear(year) }));
      const button = document.createElement('button');
      button.type = 'submit';
      button.textContent = t('eventCheck.button');
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
    const cacheKey = cacheKeyFor(year, query);

    button.disabled = true;
    button.textContent = t('eventCheck.checking');
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
      button.textContent = t('eventCheck.button');
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
        body: JSON.stringify({ year, query, language: getLanguage() }),
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
    container.textContent = t('eventCheck.loading');
  }

  function renderResult(container, data) {
    container.innerHTML = '';
    container.className = `event-check-result visible ${data.found ? 'found' : 'not-found'}`;

    const verdict = document.createElement('div');
    verdict.className = 'event-check-verdict';
    verdict.textContent = data.found ? t('eventCheck.found') : t('eventCheck.notFound');
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
        source.textContent = t('eventCheck.openSource', { title: match.sourceTitle });
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
    container.textContent = error.message || t('eventCheck.error');
  }


  function t(key, params) {
    return global.HistoryLensI18n?.t?.(key, params) || key;
  }

  function getLanguage() {
    return global.HistoryLensI18n?.getLanguage?.() || 'en';
  }
  global.HistoryLensEventChecker = { renderControls };
})(window);
