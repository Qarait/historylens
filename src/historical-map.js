(function initHistoricalMap(global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const POSITIONS = {
    europe: [535, 145],
    asia: [720, 205],
    namerica: [205, 190],
    africa: [525, 300],
    mediterranean: [545, 205],
    west_south_asia: [660, 235],
    east_asia: [790, 190],
    americas_pacific: [185, 260],
    europe_mediterranean: [545, 190],
    islamic_world: [625, 245],
    south_east_asia: [750, 230],
    middle_south_asia: [650, 245],
    east_asia_pacific: [790, 215],
    americas: [215, 235],
  };

  function render(container, views) {
    container.innerHTML = '';
    container.className = views.length > 1
      ? 'historical-map-output is-compare'
      : 'historical-map-output';
    for (const view of views) container.appendChild(buildPanel(view));
  }

  function buildPanel(view) {
    const panel = document.createElement('section');
    panel.className = 'historical-map-panel';
    panel.dataset.mapLabel = view.label;

    const header = document.createElement('div');
    header.className = 'historical-map-header';
    const heading = document.createElement('div');
    const eyebrow = document.createElement('div');
    eyebrow.className = 'historical-map-eyebrow';
    eyebrow.textContent = view.period ? 'Change Across Space' : 'Events Across Space';
    const title = document.createElement('h2');
    title.className = 'historical-map-title';
    title.textContent = viewsTitle(view);
    heading.append(eyebrow, title);

    const controls = document.createElement('div');
    controls.className = 'historical-map-controls';
    const maxEvents = Math.max(
      1,
      ...view.profile.regions.map(region => view.data.regions?.[region.id]?.events?.length || 0)
    );
    const labels = view.period
      ? ['Defining shift', 'Supporting shift']
      : ['Primary', 'Supporting 1', 'Supporting 2'];
    for (let index = 0; index < maxEvents; index++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `historical-map-control${index === 0 ? ' active' : ''}`;
      button.textContent = labels[index] || `Event ${index + 1}`;
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        controls.querySelectorAll('button').forEach((item, itemIndex) => {
          item.classList.toggle('active', itemIndex === index);
          item.setAttribute('aria-pressed', String(itemIndex === index));
        });
        drawMap(mapWrap, detail, view, index);
      });
      controls.appendChild(button);
    }
    header.append(heading, controls);
    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'historical-map-body';
    const mapWrap = document.createElement('div');
    mapWrap.className = 'historical-map-canvas';
    const detail = document.createElement('aside');
    detail.className = 'historical-map-detail';
    body.append(mapWrap, detail);
    panel.appendChild(body);

    const note = document.createElement('p');
    note.className = 'historical-map-note';
    note.textContent = 'Analytical region map. Nodes and links show event geography and historical relationships, not reconstructed territorial borders.';
    panel.appendChild(note);

    drawMap(mapWrap, detail, view, 0);
    return panel;
  }

  function drawMap(mapWrap, detail, view, eventIndex) {
    mapWrap.innerHTML = '';
    const svg = svgElement('svg', {
      viewBox: '0 0 1000 480',
      role: 'img',
      'aria-label': `${view.label} historical event map`,
    });
    svg.classList.add('historical-map-svg');
    drawBaseMap(svg);
    drawConnections(svg, view);

    const mapped = view.profile.regions
      .map(region => ({
        region,
        data: view.data.regions?.[region.id],
        position: POSITIONS[region.id],
        cardSelector: view.cardSelector || '',
      }))
      .filter(item => item.data && item.position);

    mapped.forEach((item, index) => {
      const [x, y] = item.position;
      const event = item.data.events?.[eventIndex] || item.data.events?.[0];
      const group = svgElement('g', {
        class: `historical-map-node${index === 0 ? ' active' : ''}`,
        role: 'button',
        tabindex: '0',
        'aria-label': `${item.region.label}: ${event?.title || 'Regional analysis'}`,
        transform: `translate(${x} ${y})`,
      });
      const halo = svgElement('circle', {
        r: '25',
        fill: colorWithAlpha(item.region.color, 0.16),
        stroke: item.region.color,
        'stroke-width': '1',
      });
      const core = svgElement('circle', {
        r: '8',
        fill: item.region.color,
      });
      const label = svgElement('text', {
        x: '0',
        y: '42',
        'text-anchor': 'middle',
        class: 'historical-map-node-label',
      });
      label.textContent = shortLabel(item.region.label);
      group.append(halo, core, label);
      group.addEventListener('click', () => selectNode(svg, detail, item, event));
      group.addEventListener('keydown', keyboardActivate(() =>
        selectNode(svg, detail, item, event)
      ));
      svg.appendChild(group);
    });

    mapWrap.appendChild(svg);
    if (mapped[0]) {
      const event = mapped[0].data.events?.[eventIndex] || mapped[0].data.events?.[0];
      renderDetail(detail, mapped[0], event);
    } else {
      detail.textContent = 'Map data will appear as regional analysis completes.';
    }
  }

  function drawBaseMap(svg) {
    const land = [
      'M93 105 L150 72 235 82 286 125 258 177 205 194 170 241 122 216 103 165 Z',
      'M255 258 L302 275 326 338 302 420 266 390 242 322 Z',
      'M438 101 L505 78 580 102 610 148 568 177 516 166 472 189 442 157 Z',
      'M495 197 L560 190 606 234 584 333 536 395 497 346 474 265 Z',
      'M596 102 L690 83 820 105 910 153 892 220 815 238 750 278 684 252 622 198 Z',
      'M810 326 L862 303 912 331 895 378 842 390 804 357 Z',
    ];
    for (const path of land) {
      svg.appendChild(svgElement('path', {
        d: path,
        class: 'historical-map-land',
      }));
    }
    svg.appendChild(svgElement('path', {
      d: 'M40 240 H960',
      class: 'historical-map-equator',
    }));
  }

  function drawConnections(svg, view) {
    for (const tension of view.data.cross_region?.tensions || []) {
      const [fromId, toId] = tension.regions || [];
      const from = POSITIONS[fromId];
      const to = POSITIONS[toId];
      if (!from || !to) continue;
      const path = svgElement('path', {
        d: curvedPath(from, to),
        class: 'historical-map-link',
      });
      const title = svgElement('title');
      title.textContent = tension.note || `${fromId} and ${toId}`;
      path.appendChild(title);
      svg.appendChild(path);
    }
  }

  function selectNode(svg, detail, item, event) {
    svg.querySelectorAll('.historical-map-node').forEach(node =>
      node.classList.remove('active')
    );
    const active = [...svg.querySelectorAll('.historical-map-node')]
      .find(node => node.getAttribute('aria-label')?.startsWith(`${item.region.label}:`));
    active?.classList.add('active');
    renderDetail(detail, item, event);
  }

  function renderDetail(detail, item, event) {
    detail.innerHTML = '';
    const region = document.createElement('div');
    region.className = 'historical-map-detail-region';
    region.style.color = item.region.color;
    region.textContent = item.region.label;
    const title = document.createElement('h3');
    title.className = 'historical-map-detail-title';
    title.textContent = event?.title || item.data.thesis_headline || 'Regional analysis';
    const meta = document.createElement('div');
    meta.className = 'historical-map-detail-meta';
    meta.textContent = event?.year || item.data.state || '';
    const description = document.createElement('p');
    description.className = 'historical-map-detail-description';
    description.textContent = event?.description || item.data.thesis_argument || '';
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'historical-map-detail-action';
    action.textContent = 'Open regional analysis';
    action.addEventListener('click', () => {
      const selector = `${item.cardSelector} .region-card[data-region="${item.region.id}"]`.trim();
      const card = document.querySelector(selector);
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card?.classList.add('map-highlight');
      setTimeout(() => card?.classList.remove('map-highlight'), 1600);
    });
    detail.append(region, title, meta, description, action);
  }

  function viewsTitle(view) {
    return view.compare
      ? `${view.label} map`
      : 'Historical activity map';
  }

  function shortLabel(label) {
    return label
      .replace('West, Central & South Asia', 'West & South Asia')
      .replace('Middle East & South Asia', 'Middle & South Asia')
      .replace('Europe & Mediterranean', 'Europe & Med.')
      .replace('Americas & Pacific', 'Americas & Pacific');
  }

  function curvedPath(from, to) {
    const midX = (from[0] + to[0]) / 2;
    const midY = Math.min(from[1], to[1]) - 45;
    return `M${from[0]} ${from[1]} Q${midX} ${midY} ${to[0]} ${to[1]}`;
  }

  function colorWithAlpha(hex, alpha) {
    const value = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return `rgba(201,168,76,${alpha})`;
    const number = Number.parseInt(value, 16);
    return `rgba(${number >> 16},${(number >> 8) & 255},${number & 255},${alpha})`;
  }

  function keyboardActivate(callback) {
    return event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      callback();
    };
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    return element;
  }

  global.HistoryLensHistoricalMap = { render };
})(window);
