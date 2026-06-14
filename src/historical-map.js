(function initHistoricalMap(global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const POSITIONS = {
    europe: { x: 515, y: 165, dx: -8, dy: -42 },
    asia: { x: 715, y: 220, dx: 12, dy: -45 },
    namerica: { x: 205, y: 205, dx: -6, dy: -44 },
    africa: { x: 520, y: 315, dx: 8, dy: 46 },
    mediterranean: { x: 535, y: 215, dx: -25, dy: -46 },
    west_south_asia: { x: 645, y: 245, dx: 15, dy: 48 },
    east_asia: { x: 790, y: 205, dx: 5, dy: -44 },
    americas_pacific: { x: 185, y: 270, dx: -12, dy: 48 },
    europe_mediterranean: { x: 535, y: 200, dx: -22, dy: -46 },
    islamic_world: { x: 625, y: 255, dx: 8, dy: 48 },
    south_east_asia: { x: 760, y: 260, dx: 10, dy: 48 },
    middle_south_asia: { x: 650, y: 255, dx: 8, dy: 48 },
    east_asia_pacific: { x: 790, y: 225, dx: 4, dy: -46 },
    americas: { x: 215, y: 235, dx: -8, dy: -45 },
  };

  const LAND_PATHS = [
    'M66 104 L91 76 127 65 161 72 184 64 222 76 249 96 279 106 294 130 281 150 259 153 242 177 219 184 205 209 185 220 165 212 150 192 124 184 105 162 78 154 69 132 Z',
    'M213 222 L239 231 263 252 279 282 274 312 292 337 280 371 261 402 244 431 230 405 220 370 207 346 197 312 188 283 194 252 Z',
    'M306 64 L336 47 371 54 385 76 368 101 339 109 312 93 Z',
    'M424 111 L451 91 485 87 508 101 531 96 558 109 583 126 579 146 554 157 532 151 516 169 491 166 475 180 451 171 439 149 420 139 Z',
    'M475 181 L505 173 539 183 564 207 574 239 564 275 552 314 532 357 509 387 488 360 477 326 459 301 450 265 458 228 Z',
    'M558 111 L596 92 644 91 680 81 721 94 753 89 795 104 837 105 875 126 920 144 935 169 916 188 879 194 858 215 820 220 798 239 764 245 743 265 704 253 675 237 649 222 623 203 598 184 577 158 Z',
    'M745 251 L763 258 779 280 768 296 750 284 737 266 Z',
    'M800 318 L829 299 861 304 885 321 913 330 924 354 907 377 875 384 844 374 816 382 795 360 Z',
    'M575 331 L588 340 590 366 579 384 568 365 Z',
    'M887 213 L897 205 904 216 897 235 888 229 Z',
  ];

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
    title.textContent = view.compare ? `${view.label} explorer` : 'Historical geography explorer';
    const guidance = document.createElement('p');
    guidance.className = 'historical-map-guidance';
    guidance.textContent = 'Select a region marker or a relationship arc to investigate the year spatially.';
    heading.append(eyebrow, title, guidance);

    const controlsWrap = document.createElement('div');
    controlsWrap.className = 'historical-map-controls-wrap';
    const controlsLabel = document.createElement('span');
    controlsLabel.className = 'historical-map-controls-label';
    controlsLabel.textContent = view.period ? 'Turning-point layer' : 'Event layer';
    const controls = document.createElement('div');
    controls.className = 'historical-map-controls';
    controls.setAttribute('aria-label', controlsLabel.textContent);
    controlsWrap.append(controlsLabel, controls);
    header.append(heading, controlsWrap);
    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'historical-map-body';
    const mapColumn = document.createElement('div');
    mapColumn.className = 'historical-map-column';
    const mapWrap = document.createElement('div');
    mapWrap.className = 'historical-map-canvas';
    const navigator = document.createElement('div');
    navigator.className = 'historical-map-navigator';
    const detail = document.createElement('aside');
    detail.className = 'historical-map-detail';
    detail.setAttribute('aria-live', 'polite');
    mapColumn.append(mapWrap, navigator);
    body.append(mapColumn, detail);
    panel.appendChild(body);

    const legend = document.createElement('div');
    legend.className = 'historical-map-legend';
    legend.append(
      legendItem('historical-map-legend-marker', 'Numbered markers are regional events'),
      legendItem('historical-map-legend-link', 'Arcs reveal cross-region relationships'),
      legendItem('historical-map-legend-map', 'Geography is contextual, not a border reconstruction')
    );
    panel.appendChild(legend);

    const mapped = getMappedRegions(view);
    const state = {
      eventIndex: 0,
      selectedRegionId: mapped[0]?.region.id || null,
      selectedTensionIndex: null,
    };
    const maxEvents = Math.max(1, ...mapped.map(item => item.data.events?.length || 0));
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
        state.eventIndex = index;
        state.selectedTensionIndex = null;
        controls.querySelectorAll('button').forEach((item, itemIndex) => {
          item.classList.toggle('active', itemIndex === index);
          item.setAttribute('aria-pressed', String(itemIndex === index));
        });
        drawScene();
      });
      controls.appendChild(button);
    }

    function drawScene() {
      drawMap(mapWrap, view, mapped, state, drawScene);
      renderNavigator(navigator, mapped, state, drawScene);
      renderDetail(detail, view, mapped, state, drawScene);
    }

    drawScene();
    return panel;
  }

  function drawMap(mapWrap, view, mapped, state, redraw) {
    mapWrap.innerHTML = '';
    const svg = svgElement('svg', {
      viewBox: '0 0 1000 480',
      role: 'img',
      'aria-label': `${view.label} interactive historical geography map`,
    });
    svg.classList.add('historical-map-svg');
    drawBaseMap(svg);
    drawConnections(svg, view, state, redraw);

    mapped.forEach((item, index) => {
      const event = selectedEvent(item, state.eventIndex);
      const position = item.position;
      const active = state.selectedTensionIndex === null
        && state.selectedRegionId === item.region.id;
      const group = svgElement('g', {
        class: `historical-map-node${active ? ' active' : ''}`,
        role: 'button',
        tabindex: '0',
        'aria-label': `${item.region.label}: ${event?.title || 'Regional analysis'}`,
        transform: `translate(${position.x} ${position.y})`,
      });
      const pulse = svgElement('circle', {
        r: '24',
        class: 'historical-map-node-pulse',
        fill: colorWithAlpha(item.region.color, 0.12),
        stroke: colorWithAlpha(item.region.color, 0.55),
      });
      const pin = svgElement('circle', {
        r: '14',
        class: 'historical-map-node-pin',
        fill: item.region.color,
      });
      const number = svgElement('text', {
        x: '0',
        y: '5',
        'text-anchor': 'middle',
        class: 'historical-map-node-number',
      });
      number.textContent = String(index + 1);
      const callout = buildCallout(item, position);
      group.append(pulse, pin, number, callout);
      const activate = () => {
        state.selectedRegionId = item.region.id;
        state.selectedTensionIndex = null;
        redraw();
      };
      group.addEventListener('click', activate);
      group.addEventListener('keydown', keyboardActivate(activate));
      svg.appendChild(group);
    });

    mapWrap.appendChild(svg);
  }

  function drawBaseMap(svg) {
    const ocean = svgElement('rect', {
      width: '1000',
      height: '480',
      class: 'historical-map-ocean',
    });
    svg.appendChild(ocean);

    const grid = svgElement('g', { class: 'historical-map-grid' });
    for (const y of [90, 165, 240, 315, 390]) {
      grid.appendChild(svgElement('path', { d: `M40 ${y} H960` }));
    }
    for (const x of [120, 280, 440, 600, 760, 920]) {
      grid.appendChild(svgElement('path', { d: `M${x} 35 Q${x - 35} 240 ${x} 445` }));
    }
    svg.appendChild(grid);

    const land = svgElement('g', { class: 'historical-map-land-group' });
    LAND_PATHS.forEach(path => land.appendChild(svgElement('path', {
      d: path,
      class: 'historical-map-land',
    })));
    svg.appendChild(land);

    const labels = [
      ['PACIFIC', 95, 285],
      ['ATLANTIC', 365, 270],
      ['INDIAN', 665, 340],
      ['PACIFIC', 895, 275],
    ];
    for (const [text, x, y] of labels) {
      const label = svgElement('text', {
        x: String(x),
        y: String(y),
        class: 'historical-map-ocean-label',
        'text-anchor': 'middle',
      });
      label.textContent = text;
      svg.appendChild(label);
    }
  }

  function drawConnections(svg, view, state, redraw) {
    (view.data.cross_region?.tensions || []).forEach((tension, index) => {
      const [fromId, toId] = tension.regions || [];
      const from = POSITIONS[fromId];
      const to = POSITIONS[toId];
      if (!from || !to) return;
      const group = svgElement('g', {
        class: `historical-map-connection${state.selectedTensionIndex === index ? ' active' : ''}`,
        role: 'button',
        tabindex: '0',
        'aria-label': `Relationship: ${regionLabel(view, fromId)} and ${regionLabel(view, toId)}`,
      });
      const hitArea = svgElement('path', {
        d: curvedPath(from, to),
        class: 'historical-map-link-hit',
      });
      const path = svgElement('path', {
        d: curvedPath(from, to),
        class: 'historical-map-link',
      });
      const midpoint = curveMidpoint(from, to);
      const badge = svgElement('circle', {
        cx: String(midpoint.x),
        cy: String(midpoint.y),
        r: '9',
        class: 'historical-map-link-badge',
      });
      const symbol = svgElement('text', {
        x: String(midpoint.x),
        y: String(midpoint.y + 4),
        'text-anchor': 'middle',
        class: 'historical-map-link-symbol',
      });
      symbol.textContent = '↔';
      group.append(hitArea, path, badge, symbol);
      const activate = () => {
        state.selectedTensionIndex = index;
        state.selectedRegionId = null;
        redraw();
      };
      group.addEventListener('click', activate);
      group.addEventListener('keydown', keyboardActivate(activate));
      svg.appendChild(group);
    });
  }

  function renderNavigator(container, mapped, state, redraw) {
    container.innerHTML = '';
    const intro = document.createElement('span');
    intro.className = 'historical-map-navigator-label';
    intro.textContent = 'Explore regions';
    container.appendChild(intro);

    mapped.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `historical-map-region-chip${
        state.selectedRegionId === item.region.id ? ' active' : ''
      }`;
      button.style.setProperty('--map-region-color', item.region.color);
      button.setAttribute('aria-pressed', String(state.selectedRegionId === item.region.id));
      const number = document.createElement('span');
      number.className = 'historical-map-region-chip-number';
      number.textContent = String(index + 1);
      const label = document.createElement('span');
      label.textContent = item.region.label;
      button.append(number, label);
      button.addEventListener('click', () => {
        state.selectedRegionId = item.region.id;
        state.selectedTensionIndex = null;
        redraw();
      });
      container.appendChild(button);
    });
  }

  function renderDetail(detail, view, mapped, state, redraw) {
    detail.innerHTML = '';
    if (state.selectedTensionIndex !== null) {
      renderRelationshipDetail(detail, view, state);
      return;
    }

    const itemIndex = Math.max(
      0,
      mapped.findIndex(candidate => candidate.region.id === state.selectedRegionId)
    );
    const item = mapped[itemIndex];
    if (!item) {
      detail.textContent = 'Map data will appear as regional analysis completes.';
      return;
    }
    const event = selectedEvent(item, state.eventIndex);
    const position = document.createElement('div');
    position.className = 'historical-map-detail-position';
    position.textContent = `Region ${itemIndex + 1} of ${mapped.length}`;
    const region = document.createElement('div');
    region.className = 'historical-map-detail-region';
    region.style.color = item.region.color;
    region.textContent = item.region.label;
    const stateBadge = document.createElement('div');
    stateBadge.className = 'historical-map-detail-state';
    stateBadge.textContent = item.data.state || 'Regional context';
    const title = document.createElement('h3');
    title.className = 'historical-map-detail-title';
    title.textContent = event?.title || item.data.thesis_headline || 'Regional analysis';
    const meta = document.createElement('div');
    meta.className = 'historical-map-detail-meta';
    meta.textContent = event?.year || '';
    const description = document.createElement('p');
    description.className = 'historical-map-detail-description';
    description.textContent = event?.description || item.data.thesis_argument || '';
    const insight = detailInsight(
      'Regional pattern',
      item.data.thesis_headline,
      item.data.thesis_argument
    );
    const significance = detailInsight(
      'Why it matters',
      '',
      item.data.significance
    );
    const actions = buildDetailActions(item, mapped, itemIndex, state, redraw);
    detail.append(position, region, stateBadge, title, meta, description);
    if (insight) detail.appendChild(insight);
    if (significance) detail.appendChild(significance);
    detail.appendChild(actions);
  }

  function renderRelationshipDetail(detail, view, state) {
    const tensions = view.data.cross_region?.tensions || [];
    const tension = tensions[state.selectedTensionIndex];
    if (!tension) return;
    const [fromId, toId] = tension.regions || [];
    const fromLabel = regionLabel(view, fromId);
    const toLabel = regionLabel(view, toId);
    const position = document.createElement('div');
    position.className = 'historical-map-detail-position';
    position.textContent = `Relationship ${state.selectedTensionIndex + 1} of ${tensions.length}`;
    const region = document.createElement('div');
    region.className = 'historical-map-detail-region is-relationship';
    region.textContent = 'Cross-region connection';
    const title = document.createElement('h3');
    title.className = 'historical-map-detail-title';
    title.textContent = `${fromLabel} ↔ ${toLabel}`;
    const description = document.createElement('p');
    description.className = 'historical-map-detail-description is-relationship';
    description.textContent = tension.note || 'These regions were linked by the wider historical system.';
    const contrast = detailInsight(
      'Wider pattern',
      '',
      view.data.cross_region?.contrast
    );
    detail.append(position, region, title, description);
    if (contrast) detail.appendChild(contrast);
  }

  function buildDetailActions(item, mapped, itemIndex, state, redraw) {
    const actions = document.createElement('div');
    actions.className = 'historical-map-detail-actions';
    const previous = detailButton('← Previous', itemIndex === 0, () => {
      state.selectedRegionId = mapped[itemIndex - 1].region.id;
      redraw();
    });
    const next = detailButton('Next →', itemIndex === mapped.length - 1, () => {
      state.selectedRegionId = mapped[itemIndex + 1].region.id;
      redraw();
    });
    const open = detailButton('Open full regional analysis', false, () => {
      const selector = `${item.cardSelector} .region-card[data-region="${item.region.id}"]`.trim();
      const card = document.querySelector(selector);
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card?.classList.add('map-highlight');
      setTimeout(() => card?.classList.remove('map-highlight'), 1600);
    });
    open.classList.add('is-primary');
    actions.append(previous, next, open);
    return actions;
  }

  function detailButton(label, disabled, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'historical-map-detail-action';
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener('click', onClick);
    return button;
  }

  function detailInsight(labelText, titleText, bodyText) {
    if (!titleText && !bodyText) return null;
    const insight = document.createElement('div');
    insight.className = 'historical-map-detail-insight';
    const label = document.createElement('div');
    label.className = 'historical-map-detail-insight-label';
    label.textContent = labelText;
    insight.appendChild(label);
    if (titleText) {
      const title = document.createElement('strong');
      title.textContent = titleText;
      insight.appendChild(title);
    }
    if (bodyText) {
      const body = document.createElement('p');
      body.textContent = bodyText;
      insight.appendChild(body);
    }
    return insight;
  }

  function buildCallout(item, position) {
    const group = svgElement('g', {
      class: 'historical-map-callout',
      transform: `translate(${position.dx} ${position.dy})`,
    });
    const label = shortLabel(item.region.label);
    const width = Math.max(72, Math.min(162, label.length * 7 + 24));
    const x = position.dx < 0 ? -width / 2 : 0;
    const rect = svgElement('rect', {
      x: String(x),
      y: '-14',
      width: String(width),
      height: '28',
      rx: '7',
    });
    const text = svgElement('text', {
      x: String(x + width / 2),
      y: '4',
      'text-anchor': 'middle',
    });
    text.textContent = label;
    group.append(rect, text);
    return group;
  }

  function legendItem(className, text) {
    const item = document.createElement('span');
    item.className = 'historical-map-legend-item';
    const symbol = document.createElement('i');
    symbol.className = className;
    item.append(symbol, document.createTextNode(text));
    return item;
  }

  function getMappedRegions(view) {
    return view.profile.regions
      .map(region => ({
        region,
        data: view.data.regions?.[region.id],
        position: POSITIONS[region.id],
        cardSelector: view.cardSelector || '',
      }))
      .filter(item => item.data && item.position);
  }

  function selectedEvent(item, eventIndex) {
    return item.data.events?.[eventIndex] || item.data.events?.[0];
  }

  function regionLabel(view, id) {
    return view.profile.regions.find(region => region.id === id)?.label || id;
  }

  function shortLabel(label) {
    return label
      .replace('West, Central & South Asia', 'West & South Asia')
      .replace('Middle East & South Asia', 'Middle & South Asia')
      .replace('Europe & Mediterranean', 'Europe & Med.')
      .replace('Mediterranean & Europe', 'Mediterranean');
  }

  function curvedPath(from, to) {
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - Math.max(42, Math.abs(from.x - to.x) * 0.12);
    return `M${from.x} ${from.y} Q${midX} ${midY} ${to.x} ${to.y}`;
  }

  function curveMidpoint(from, to) {
    const controlX = (from.x + to.x) / 2;
    const controlY = Math.min(from.y, to.y) - Math.max(42, Math.abs(from.x - to.x) * 0.12);
    return {
      x: 0.25 * from.x + 0.5 * controlX + 0.25 * to.x,
      y: 0.25 * from.y + 0.5 * controlY + 0.25 * to.y,
    };
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
