(function initPerspectiveMode(global) {
  'use strict';

  const LENSES = {
    state: {
      label: 'State & power',
      description: 'Foregrounds institutions, authority, conflict, diplomacy, and changes in political control.',
      question: label => `How did power operate and change in ${label}?`,
      missing: 'This lens can understate everyday experience, informal power, and people outside governing institutions.',
    },
    society: {
      label: 'Society & lived experience',
      description: 'Asks how large developments affected communities, social groups, mobility, safety, and daily life.',
      question: label => `Who experienced the changes in ${label}, and how might outcomes have differed across society?`,
      missing: 'The dashboard rarely contains testimony, demographic detail, or evidence separated by class, gender, age, or community.',
    },
    economy: {
      label: 'Economy & exchange',
      description: 'Emphasizes resources, labor, trade, production, infrastructure, and material pressures.',
      question: label => `Which material pressures and networks shaped developments in ${label}?`,
      missing: 'Economic framing can obscure belief, identity, coercion, and choices that cannot be reduced to material incentives.',
    },
    ideas: {
      label: 'Ideas & culture',
      description: 'Examines belief, ideology, knowledge, identity, cultural authority, and the language used to justify action.',
      question: label => `Which ideas and identities shaped how people understood ${label}?`,
      missing: 'Named figures and official ideologies do not represent every belief or cultural tradition within a region.',
    },
    source: {
      label: 'Source-critical',
      description: 'Tests who produced the available evidence, what kind of claim it supports, and where corroboration is still needed.',
      question: label => `How securely can the interpretation of ${label} be supported by the evidence shown here?`,
      missing: 'A chronology can confirm occurrence and sequence, but it cannot by itself prove causation, experience, or historical meaning.',
    },
  };

  const ECONOMIC_TERMS = /\b(econom|trade|labor|labour|market|resource|supply|production|financial|tax|land|food|wealth|industry|infrastructure)\w*/i;
  const IDEA_TERMS = /\b(ideolog|relig|belief|culture|identity|education|knowledge|national|reform|intellectual)\w*/i;

  let root = null;
  let context = null;
  let open = false;
  let selectedLens = 'state';
  let selectedVantage = 'all';

  function configure(container, nextContext) {
    root = container;
    context = nextContext;
    const entries = context ? collectEntries(context) : [];
    if (selectedVantage !== 'all' && !entries.some(entry => entry.id === selectedVantage)) {
      selectedVantage = 'all';
    }
    root.innerHTML = '';
    root.className = 'perspective-mode-output';
    updateButton();
    if (open && context) render();
  }

  function toggle() {
    if (!context || !root) return;
    open = !open;
    if (open && document.getElementById('btnTeacher')?.getAttribute('aria-pressed') === 'true') {
      global.HistoryLensTeacherMode?.toggle();
    }
    updateButton();
    if (open) {
      render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      root.innerHTML = '';
      root.classList.remove('visible');
    }
  }

  function reset(container) {
    root = container || root;
    context = null;
    open = false;
    selectedVantage = 'all';
    if (root) {
      root.innerHTML = '';
      root.className = 'perspective-mode-output';
    }
    updateButton();
  }

  function updateButton() {
    const button = document.getElementById('btnPerspective');
    if (!button) return;
    button.disabled = !context;
    button.classList.toggle('active', open && !!context);
    button.setAttribute('aria-pressed', String(open && !!context));
  }

  function render() {
    const model = buildModel(context);
    root.innerHTML = '';
    root.className = 'perspective-mode-output visible';

    const panel = document.createElement('section');
    panel.className = 'perspective-mode-panel';
    panel.setAttribute('aria-label', `Perspective analysis for ${model.label}`);

    const header = document.createElement('div');
    header.className = 'perspective-mode-header';
    const heading = document.createElement('div');
    const eyebrow = document.createElement('div');
    eyebrow.className = 'perspective-mode-eyebrow';
    eyebrow.textContent = 'Perspective Mode';
    const title = document.createElement('h2');
    title.className = 'perspective-mode-title';
    title.textContent = `${model.label} Perspective Lab`;
    const description = document.createElement('p');
    description.className = 'perspective-mode-description';
    description.textContent = 'Change the analytical lens, not the facts. These are inquiry frames generated locally from the evidence already on this page, not simulated national or community voices.';
    heading.append(eyebrow, title, description);

    const controls = document.createElement('div');
    controls.className = 'perspective-mode-controls';
    controls.append(
      selectControl(
        'Analytical lens',
        'perspectiveLens',
        Object.entries(LENSES).map(([value, lens]) => [value, lens.label]),
        selectedLens,
        value => {
          selectedLens = value;
          render();
        }
      ),
      selectControl(
        'Starting vantage',
        'perspectiveVantage',
        [['all', 'Compare all regions'], ...model.entries.map(entry => [entry.id, entry.label])],
        selectedVantage,
        value => {
          selectedVantage = value;
          render();
        }
      )
    );
    header.append(heading, controls);
    panel.appendChild(header);

    const guide = document.createElement('div');
    guide.className = 'perspective-mode-guide';
    guide.append(
      guideCard('What this lens foregrounds', model.lens.description),
      guideCard('Inquiry question', model.focusQuestion),
      guideCard('What may disappear', model.lens.missing)
    );
    panel.appendChild(guide);

    const notice = document.createElement('p');
    notice.className = 'perspective-mode-notice';
    notice.textContent = selectedVantage === 'all'
      ? 'All regions remain visible. Compare how the same lens produces different questions from different bodies of evidence.'
      : `Starting from ${model.vantageLabel} changes the order of attention, not the underlying record or the status of the evidence.`;
    panel.appendChild(notice);

    const grid = document.createElement('div');
    grid.className = 'perspective-mode-grid';
    for (const entry of model.entries) {
      grid.appendChild(buildPerspectiveCard(entry, model.lens, entry.id === selectedVantage));
    }
    panel.appendChild(grid);

    if (model.relationships.length > 0) {
      const relationships = document.createElement('section');
      relationships.className = 'perspective-mode-relationships';
      const relationshipTitle = document.createElement('h3');
      relationshipTitle.textContent = 'Cross-perspective checks';
      const list = document.createElement('ul');
      for (const relationship of model.relationships.slice(0, 4)) {
        const item = document.createElement('li');
        item.textContent = relationship;
        list.appendChild(item);
      }
      relationships.append(relationshipTitle, list);
      panel.appendChild(relationships);
    }

    const footer = document.createElement('div');
    footer.className = 'perspective-mode-footer';
    const evidence = document.createElement('p');
    evidence.className = 'perspective-mode-evidence-note';
    evidence.textContent = model.evidenceNote;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'perspective-mode-copy';
    copy.textContent = 'Copy inquiry guide';
    copy.addEventListener('click', () => copyGuide(model));
    footer.append(evidence, copy);
    panel.appendChild(footer);

    root.appendChild(panel);
  }

  function buildModel(nextContext) {
    const entries = collectEntries(nextContext);
    const lens = LENSES[selectedLens];
    const label = nextContext.views.map(view => view.label).join(' vs ');
    const vantage = entries.find(entry => entry.id === selectedVantage);
    const orderedEntries = vantage
      ? [vantage, ...entries.filter(entry => entry.id !== vantage.id)]
      : entries;
    return {
      label,
      lens,
      entries: orderedEntries,
      vantageLabel: vantage?.label || 'all regions',
      focusQuestion: lens.question(vantage?.label || label),
      relationships: collectRelationships(nextContext, selectedLens),
      evidenceNote: evidenceGuidance(nextContext),
    };
  }

  function collectEntries(nextContext) {
    const isCompare = nextContext.mode === 'compare';
    return nextContext.views.flatMap((view, viewIndex) =>
      view.profile.regions
        .map(region => {
          const data = view.data.regions?.[region.id];
          if (!data) return null;
          return {
            id: `${viewIndex}:${region.id}`,
            label: isCompare ? `${region.label} (${view.label})` : region.label,
            regionLabel: region.label,
            viewLabel: view.label,
            data,
            viewData: view.data,
            grounding: normalizeGrounding(view.data.__grounding),
          };
        })
        .filter(Boolean)
    );
  }

  function buildPerspectiveCard(entry, lens, isVantage) {
    const card = document.createElement('article');
    card.className = `perspective-mode-card${isVantage ? ' is-vantage' : ''}`;
    const header = document.createElement('div');
    header.className = 'perspective-mode-card-header';
    const region = document.createElement('div');
    region.className = 'perspective-mode-region';
    region.textContent = entry.label;
    const status = document.createElement('span');
    status.className = 'perspective-mode-status';
    status.textContent = isVantage ? 'Starting vantage' : lens.label;
    header.append(region, status);

    const question = document.createElement('h3');
    question.textContent = regionalQuestion(entry, selectedLens);
    const evidenceLabel = document.createElement('div');
    evidenceLabel.className = 'perspective-mode-card-label';
    evidenceLabel.textContent = 'Evidence on this page';
    const evidenceList = document.createElement('ul');
    evidenceList.className = 'perspective-mode-evidence-list';
    for (const evidence of evidenceFor(entry, selectedLens)) {
      const item = document.createElement('li');
      item.textContent = evidence;
      evidenceList.appendChild(item);
    }
    const nextLabel = document.createElement('div');
    nextLabel.className = 'perspective-mode-card-label';
    nextLabel.textContent = 'Evidence still needed';
    const next = document.createElement('p');
    next.className = 'perspective-mode-next';
    next.textContent = missingEvidence(selectedLens);
    card.append(header, question, evidenceLabel, evidenceList, nextLabel, next);
    return card;
  }

  function regionalQuestion(entry, lensId) {
    const questions = {
      state: `Which institutions or actors controlled the choices described for ${entry.regionLabel}, and who could challenge them?`,
      society: `How might the developments in ${entry.regionLabel} have been experienced differently across communities and social groups?`,
      economy: `Which resources, labor systems, or exchange networks could explain the pressures visible in ${entry.regionLabel}?`,
      ideas: `Which beliefs, identities, or knowledge systems made the developments in ${entry.regionLabel} meaningful or legitimate?`,
      source: `Which claims about ${entry.regionLabel} are factual chronology, and which are interpretation requiring broader corroboration?`,
    };
    return questions[lensId];
  }

  function evidenceFor(entry, lensId) {
    const events = entry.data.events || [];
    const eventTexts = events.map(event => `${event.title}: ${event.description}`).filter(Boolean);
    const allTexts = [
      entry.data.thesis_argument,
      entry.data.significance,
      entry.viewData.global_context,
      ...eventTexts,
    ].filter(Boolean);

    if (lensId === 'state') {
      return compact([
        entry.data.state ? `Regional state: ${entry.data.state}` : '',
        entry.data.thesis_argument,
        eventTexts[0],
      ]);
    }
    if (lensId === 'society') {
      return compact([eventTexts[0], eventTexts[1], entry.data.significance]);
    }
    if (lensId === 'economy') {
      const matches = allTexts.filter(text => ECONOMIC_TERMS.test(text));
      return compact([...matches, eventTexts[0], entry.viewData.global_context]);
    }
    if (lensId === 'ideas') {
      const matches = allTexts.filter(text => IDEA_TERMS.test(text));
      const figures = (entry.data.key_figures || []).length
        ? `Named figures: ${entry.data.key_figures.join(', ')}`
        : '';
      return compact([...matches, figures, entry.data.thesis_argument]);
    }
    const sources = entry.grounding.map(item =>
      `Chronology source: ${item.name || 'Unnamed source'}${item.qualityLabel ? ` (${item.qualityLabel})` : ''}`
    );
    return compact([
      ...sources,
      entry.data.thesis_argument ? `Dashboard interpretation: ${entry.data.thesis_argument}` : '',
      events[0] ? `Chronology claim to verify: ${events[0].title}` : '',
    ]);
  }

  function collectRelationships(nextContext, lensId) {
    const prefix = {
      state: 'Power check',
      society: 'Experience check',
      economy: 'Network check',
      ideas: 'Framing check',
      source: 'Corroboration check',
    }[lensId];
    return nextContext.views.flatMap(view => {
      const regionMap = new Map(view.profile.regions.map(region => [region.id, region.label]));
      return (view.data.cross_region?.tensions || []).map(tension => {
        const labels = (tension.regions || []).map(id => regionMap.get(id) || id).join(' and ');
        return `${prefix}: ${labels}${nextContext.mode === 'compare' ? ` in ${view.label}` : ''} - ${tension.note}`;
      });
    });
  }

  function normalizeGrounding(grounding) {
    return (Array.isArray(grounding) ? grounding : [grounding]).filter(Boolean);
  }

  function evidenceGuidance(nextContext) {
    const sources = new Map();
    for (const view of nextContext.views) {
      for (const source of normalizeGrounding(view.data.__grounding)) {
        sources.set(source.url || source.name, source);
      }
    }
    return sources.size
      ? `Evidence boundary: ${sources.size} chronology source${sources.size === 1 ? '' : 's'} ground the timeline shown above. The lens questions are interpretive prompts; verify them with primary accounts and specialist scholarship before treating them as conclusions.`
      : 'Evidence boundary: the lens questions are interpretive prompts. Add primary accounts and specialist scholarship before treating them as conclusions.';
  }

  function missingEvidence(lensId) {
    return {
      state: 'Official records from competing institutions, diplomatic correspondence, law, and evidence from groups outside formal authority.',
      society: 'Firsthand accounts, oral histories, demographic evidence, and records that distinguish experiences within the region.',
      economy: 'Prices, wages, production, trade flows, taxation, landholding, and material evidence across more than one social group.',
      ideas: 'Texts, images, rituals, education records, and competing voices showing how ideas were received rather than only proclaimed.',
      source: 'Independent chronologies, primary sources from more than one position, authorship context, and specialist historiographical debate.',
    }[lensId];
  }

  function selectControl(labelText, id, options, selected, onChange) {
    const label = document.createElement('label');
    label.className = 'perspective-mode-select';
    label.htmlFor = id;
    const text = document.createElement('span');
    text.textContent = labelText;
    const select = document.createElement('select');
    select.id = id;
    for (const [value, optionLabel] of options) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = optionLabel;
      option.selected = value === selected;
      select.appendChild(option);
    }
    select.addEventListener('change', event => onChange(event.target.value));
    label.append(text, select);
    return label;
  }

  function guideCard(labelText, value) {
    const card = document.createElement('article');
    card.className = 'perspective-mode-guide-card';
    const label = document.createElement('div');
    label.className = 'perspective-mode-guide-label';
    label.textContent = labelText;
    const text = document.createElement('p');
    text.textContent = value;
    card.append(label, text);
    return card;
  }

  function compact(items) {
    return [...new Set(items.filter(Boolean))].slice(0, 3);
  }

  function copyGuide(model) {
    const lines = [
      `${model.label} Perspective Lab`,
      `Lens: ${model.lens.label}`,
      `Starting vantage: ${model.vantageLabel}`,
      '',
      `Inquiry question: ${model.focusQuestion}`,
      `Lens definition: ${model.lens.description}`,
      `Possible blind spot: ${model.lens.missing}`,
      '',
      ...model.entries.flatMap(entry => [
        entry.label,
        regionalQuestion(entry, selectedLens),
        ...evidenceFor(entry, selectedLens).map(item => `- Evidence on page: ${item}`),
        `- Evidence still needed: ${missingEvidence(selectedLens)}`,
        '',
      ]),
      ...model.relationships.map(item => `Cross-perspective check: ${item}`),
      '',
      model.evidenceNote,
      'Generated by HistoryLens Perspective Mode. These prompts do not represent the voice of any nation, community, or individual.',
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showMessage('Perspective inquiry guide copied.'))
      .catch(() => showMessage('Could not copy the inquiry guide.'));
  }

  function showMessage(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  global.HistoryLensPerspectiveMode = { configure, toggle, reset };
})(window);
