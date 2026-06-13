(function initKeyEvents(global) {
  'use strict';

  const EVENTS_ENDPOINT = '/api/events';
  const cache = new Map();

  function renderControls(years, formatYear) {
    const output = document.getElementById('keyEventsOutput');
    output.innerHTML = '';
    output.className = years.length > 1 ? 'key-events-output is-compare' : 'key-events-output';

    for (const year of years) {
      const section = document.createElement('section');
      section.className = 'key-events-panel';
      section.dataset.year = String(year);

      const intro = document.createElement('div');
      intro.className = 'key-events-intro';
      const copy = document.createElement('div');

      const eyebrow = document.createElement('div');
      eyebrow.className = 'key-events-eyebrow';
      eyebrow.textContent = years.length > 1 ? formatYear(year) : 'Go Beyond the Dashboard';
      const title = document.createElement('h2');
      title.className = 'key-events-title';
      title.textContent = `7 Key Events of ${formatYear(year)}`;
      const description = document.createElement('p');
      description.className = 'key-events-description';
      description.textContent = 'Explore source-grounded events selected for lasting political, social, scientific, economic, or cultural impact.';
      copy.append(eyebrow, title, description);

      const button = document.createElement('button');
      button.className = 'key-events-btn';
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'View 7 Key Events';
      button.addEventListener('click', () => toggle(year, section, button, formatYear));

      intro.append(copy, button);
      section.appendChild(intro);

      const body = document.createElement('div');
      body.className = 'key-events-body';
      section.appendChild(body);
      output.appendChild(section);
    }
  }

  async function toggle(year, section, button, formatYear) {
    const body = section.querySelector('.key-events-body');
    if (section.classList.contains('open')) {
      section.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'View 7 Key Events';
      return;
    }

    section.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    button.textContent = 'Hide Key Events';

    if (cache.has(year)) {
      renderList(body, cache.get(year));
      return;
    }

    renderLoading(body, formatYear(year));
    button.disabled = true;
    try {
      const data = await fetchEvents(year);
      cache.set(year, data);
      renderList(body, data);
    } catch (error) {
      renderError(body, year, error, formatYear);
    } finally {
      button.disabled = false;
    }
  }

  async function fetchEvents(year) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(EVENTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ year }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data.events) || data.events.length !== 7) {
        throw new Error('Unexpected key events response');
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The request timed out.');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function renderLoading(container, yearLabel) {
    container.innerHTML = '';
    const loading = document.createElement('div');
    loading.className = 'key-events-loading';
    const spinner = document.createElement('span');
    spinner.className = 'key-events-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = `Checking historical sources for ${yearLabel}...`;
    loading.append(spinner, text);
    container.appendChild(loading);
  }

  function renderList(container, data) {
    container.innerHTML = '';
    const note = document.createElement('p');
    note.className = 'key-events-note';
    note.textContent = data.selection_note || 'Selected for historical consequence and geographic breadth.';
    container.appendChild(note);

    const list = document.createElement('ol');
    list.className = 'key-events-list';
    data.events.forEach((event, index) => list.appendChild(buildEventCard(event, index)));
    container.appendChild(list);

    if (data.grounding?.url) {
      const attribution = document.createElement('div');
      attribution.className = 'key-events-attribution';
      attribution.append('Chronology anchor: ');
      const link = document.createElement('a');
      link.href = data.grounding.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = data.grounding.name || 'Wikipedia contributors';
      attribution.append(link, '. Additional sources are discovery aids; inspect them before formal citation.');
      container.appendChild(attribution);
    }
  }

  function buildEventCard(event, index) {
    const item = document.createElement('li');
    item.className = 'key-event-card';
    const number = document.createElement('div');
    number.className = 'key-event-number';
    number.textContent = String(index + 1).padStart(2, '0');

    const content = document.createElement('div');
    content.className = 'key-event-content';
    const meta = document.createElement('div');
    meta.className = 'key-event-meta';
    for (const value of [event.date, event.location, event.category]) {
      if (!value) continue;
      const chip = document.createElement('span');
      chip.textContent = value;
      meta.appendChild(chip);
    }

    const title = document.createElement('h3');
    title.className = 'key-event-title';
    title.textContent = event.title || 'Untitled event';
    const summary = document.createElement('p');
    summary.className = 'key-event-summary';
    summary.textContent = event.summary || '';
    const significance = document.createElement('p');
    significance.className = 'key-event-significance';
    const label = document.createElement('strong');
    label.textContent = 'Why it mattered: ';
    significance.append(label, document.createTextNode(event.significance || ''));
    content.append(meta, title, summary, significance);

    const sources = [];
    if (event.source_url) {
      sources.push({
        title: event.source_title || 'Wikipedia',
        url: event.source_url,
        quality: 'reference',
        qualityLabel: 'Reference chronology',
      });
    }
    if (Array.isArray(event.sources)) sources.push(...event.sources);
    if (sources.length > 0) content.appendChild(buildSourceList(sources));

    item.append(number, content);
    return item;
  }

  function buildSourceList(sources) {
    const wrap = document.createElement('div');
    wrap.className = 'key-event-sources';
    const label = document.createElement('div');
    label.className = 'key-event-sources-label';
    label.textContent = 'Research sources';
    wrap.appendChild(label);

    const seen = new Set();
    for (const item of sources) {
      if (!item?.url || seen.has(item.url)) continue;
      seen.add(item.url);
      const row = document.createElement('div');
      row.className = 'key-event-source-row';

      const quality = document.createElement('span');
      quality.className = `source-quality source-quality-${item.quality || 'reference'}`;
      quality.textContent = item.qualityLabel || 'Reference';

      const source = document.createElement('a');
      source.className = 'key-event-source';
      source.href = item.url;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = item.title || item.publisher || 'Open source';

      row.append(quality, source);
      if (item.publicationYear) {
        const year = document.createElement('span');
        year.className = 'key-event-source-year';
        year.textContent = String(item.publicationYear);
        row.appendChild(year);
      }
      wrap.appendChild(row);
    }
    return wrap;
  }

  function renderError(container, year, error, formatYear) {
    container.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'key-events-error';
    const message = document.createElement('span');
    message.textContent = error.message || 'Could not load key events.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', async () => {
      renderLoading(container, formatYear(year));
      try {
        const data = await fetchEvents(year);
        cache.set(year, data);
        renderList(container, data);
      } catch (retryError) {
        renderError(container, year, retryError, formatYear);
      }
    });
    box.append(message, retry);
    container.appendChild(box);
  }

  global.HistoryLensKeyEvents = { renderControls };
})(window);
