(function initTeacherMode(global) {
  'use strict';

  const GRADE_BANDS = {
    middle: {
      label: 'Middle school',
      objective: label =>
        `Students will identify major developments in ${label} and explain one connection between regions using evidence.`,
      skill: 'Identify, compare, and support a claim with evidence.',
    },
    high: {
      label: 'High school',
      objective: label =>
        `Students will analyze how simultaneous developments in ${label} reveal regional differences, shared pressures, and historical consequences.`,
      skill: 'Analyze causation, comparison, and historical significance.',
    },
    advanced: {
      label: 'Advanced',
      objective: label =>
        `Students will evaluate the comparative interpretation of ${label}, testing its regional emphasis, causal claims, and evidentiary limits.`,
      skill: 'Evaluate interpretation, evidence, and historiographical framing.',
    },
  };

  const LESSON_LENGTHS = {
    20: [
      ['Launch', '3 min', 'Read the global context and predict which region changed most.'],
      ['Evidence scan', '10 min', 'Pairs inspect two regional cards and select one event from each as evidence.'],
      ['Exit claim', '7 min', 'Write a one-sentence comparison using because, while, or therefore.'],
    ],
    45: [
      ['Launch', '5 min', 'Use the hook and map to generate one question about the historical moment.'],
      ['Regional teams', '10 min', 'Assign each group a region to identify its central claim and strongest evidence.'],
      ['Cross-region inquiry', '15 min', 'Groups compare findings and examine one relationship arc or global contrast.'],
      ['Whole-class synthesis', '10 min', 'Build a shared claim about the most consequential pattern.'],
      ['Exit ticket', '5 min', 'Answer the essential question with two pieces of evidence.'],
    ],
    60: [
      ['Launch', '8 min', 'Annotate the hook, global context, and unfamiliar vocabulary.'],
      ['Source orientation', '12 min', 'Review evidence labels and distinguish chronology, interpretation, and supporting research.'],
      ['Regional investigation', '20 min', 'Teams analyze events, figures, significance, and omitted perspectives.'],
      ['Structured discussion', '15 min', 'Debate which region or relationship best explains the wider historical pattern.'],
      ['Exit ticket', '5 min', 'Revise an initial claim after hearing evidence from another region.'],
    ],
  };

  let root = null;
  let context = null;
  let open = false;
  let gradeBand = 'high';
  let lessonLength = 45;

  function configure(container, nextContext) {
    root = container;
    context = nextContext;
    root.innerHTML = '';
    root.className = 'teacher-mode-output';
    const button = document.getElementById('btnTeacher');
    if (button) {
      button.disabled = !context;
      button.classList.toggle('active', open && !!context);
      button.setAttribute('aria-pressed', String(open && !!context));
    }
    if (open && context) render();
  }

  function toggle() {
    if (!context || !root) return;
    open = !open;
    if (open && document.getElementById('btnPerspective')?.getAttribute('aria-pressed') === 'true') {
      global.HistoryLensPerspectiveMode?.toggle();
    }
    const button = document.getElementById('btnTeacher');
    button?.classList.toggle('active', open);
    button?.setAttribute('aria-pressed', String(open));
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
    if (root) {
      root.innerHTML = '';
      root.className = 'teacher-mode-output';
    }
    const button = document.getElementById('btnTeacher');
    if (button) {
      button.disabled = true;
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    }
  }

  function render() {
    const kit = buildKit(context, gradeBand, lessonLength);
    root.innerHTML = '';
    root.className = 'teacher-mode-output visible';

    const panel = document.createElement('section');
    panel.className = 'teacher-mode-panel';
    panel.setAttribute('aria-label', `Teacher classroom kit for ${kit.label}`);

    const header = document.createElement('div');
    header.className = 'teacher-mode-header';
    const heading = document.createElement('div');
    const eyebrow = document.createElement('div');
    eyebrow.className = 'teacher-mode-eyebrow';
    eyebrow.textContent = 'Teacher Mode';
    const title = document.createElement('h2');
    title.className = 'teacher-mode-title';
    title.textContent = `${kit.label} Classroom Kit`;
    const description = document.createElement('p');
    description.className = 'teacher-mode-description';
    description.textContent = 'Generated locally from the grounded analysis already on this page. Review and adapt before instruction.';
    heading.append(eyebrow, title, description);

    const controls = document.createElement('div');
    controls.className = 'teacher-mode-controls';
    controls.append(
      selectControl('Grade band', 'teacherGradeBand', [
        ['middle', 'Middle school'],
        ['high', 'High school'],
        ['advanced', 'Advanced'],
      ], gradeBand, value => {
        gradeBand = value;
        render();
      }),
      selectControl('Lesson length', 'teacherLessonLength', [
        ['20', '20 minutes'],
        ['45', '45 minutes'],
        ['60', '60 minutes'],
      ], String(lessonLength), value => {
        lessonLength = Number(value);
        render();
      })
    );
    header.append(heading, controls);
    panel.appendChild(header);

    const overview = document.createElement('div');
    overview.className = 'teacher-mode-overview';
    overview.append(
      overviewCard('Learning objective', kit.objective),
      overviewCard('Historical thinking skill', kit.skill),
      overviewCard('Essential question', kit.essentialQuestion)
    );
    panel.appendChild(overview);

    const main = document.createElement('div');
    main.className = 'teacher-mode-grid';
    main.append(
      contentSection('Lesson sequence', buildLessonSequence(kit.lesson)),
      contentSection('Discussion prompts', orderedList(kit.discussion, 'teacher-mode-prompts')),
      contentSection('Vocabulary', buildVocabulary(kit.vocabulary)),
      contentSection('Quick check', buildQuickCheck(kit.quickCheck))
    );
    panel.appendChild(main);

    const footer = document.createElement('div');
    footer.className = 'teacher-mode-footer';
    const sourceNote = document.createElement('p');
    sourceNote.className = 'teacher-mode-source-note';
    sourceNote.textContent = kit.sourceNote;
    const actions = document.createElement('div');
    actions.className = 'teacher-mode-actions';
    const copy = actionButton('Copy classroom kit', () => copyKit(kit));
    const print = actionButton('Print classroom kit', printKit);
    print.classList.add('is-primary');
    actions.append(copy, print);
    footer.append(sourceNote, actions);
    panel.appendChild(footer);

    root.appendChild(panel);
  }

  function buildKit(nextContext, bandId, length) {
    const band = GRADE_BANDS[bandId];
    const views = nextContext.views;
    const label = views.map(view => view.label).join(' vs ');
    const isPeriod = nextContext.mode === 'period';
    const isCompare = nextContext.mode === 'compare';
    const regions = views.flatMap(view =>
      view.profile.regions
        .map(region => ({
          label: isCompare ? `${region.label} (${view.label})` : region.label,
          data: view.data.regions?.[region.id],
          viewLabel: view.label,
        }))
        .filter(item => item.data)
    );
    const primaryEvents = regions
      .map(item => ({
        region: item.label,
        viewLabel: item.viewLabel,
        event: item.data.events?.[0],
        significance: item.data.significance,
      }))
      .filter(item => item.event);
    const tensions = views.flatMap(view =>
      (view.data.cross_region?.tensions || []).map(tension => ({
        ...tension,
        labels: (tension.regions || []).map(id =>
          `${view.profile.regions.find(region => region.id === id)?.label || id}${
            isCompare ? ` (${view.label})` : ''
          }`
        ),
      }))
    );
    const contextText = views
      .map(view => view.data.global_context)
      .filter(Boolean)
      .join(' ');
    return {
      label,
      objective: band.objective(label),
      skill: isPeriod
        ? 'Trace continuity, change, turning points, and historical significance.'
        : isCompare
          ? 'Compare historical contexts, evidence, and patterns across time.'
          : band.skill,
      essentialQuestion: essentialQuestion(label, isPeriod, isCompare, views),
      lesson: LESSON_LENGTHS[length],
      discussion: discussionPrompts(label, primaryEvents, tensions, isPeriod, isCompare),
      vocabulary: vocabularyItems(views, isPeriod),
      quickCheck: quickCheckItems(primaryEvents, tensions, contextText, isPeriod),
      sourceNote: sourceGuidance(views),
      primaryEvents,
      tensions,
    };
  }

  function essentialQuestion(label, isPeriod, isCompare, views) {
    if (isPeriod) {
      return `Which turning point best explains how the world changed during ${label}, and what evidence supports that interpretation?`;
    }
    if (isCompare) {
      return `What changed and what persisted between ${label}, and which regional evidence makes the strongest comparison?`;
    }
    const contrast = views[0]?.data.cross_region?.contrast;
    return contrast
      ? `How did shared pressures produce different regional outcomes in ${label}?`
      : `Which development best explains the wider historical significance of ${label}?`;
  }

  function discussionPrompts(label, events, tensions, isPeriod, isCompare) {
    const first = events[0];
    const second = events[1] || first;
    const relationship = tensions[0];
    return [
      `Which event should be treated as the defining development of ${label}? Defend your choice with evidence.`,
      first && second
        ? `Compare ${first.region}'s "${first.event.title}" with ${second.region}'s "${second.event.title}". What explains the different outcomes?`
        : 'Compare two regional developments. What explains their different outcomes?',
      relationship
        ? `How does the relationship between ${relationship.labels.join(' and ')} change your understanding of the wider historical pattern?`
        : 'What cross-region connection is missing from the dashboard, and why would it matter?',
      isPeriod
        ? 'Where do you see continuity beneath the period’s visible changes?'
        : isCompare
          ? 'Does the comparison use equivalent evidence for both moments? What would make it fairer?'
          : 'Whose perspective is least visible in this interpretation, and what evidence would help recover it?',
    ];
  }

  function vocabularyItems(views, isPeriod) {
    const signalTerms = new Set();
    for (const view of views) {
      for (const [key, value] of Object.entries(view.data.global_signals || {})) {
        if (String(value).toLowerCase() !== 'stable') {
          signalTerms.add(key.replaceAll('_', ' '));
        }
      }
    }
    const definitions = {
      'war intensity': 'The scale, frequency, and geographic reach of armed conflict.',
      'political fragmentation': 'The weakening or division of political authority among competing groups or states.',
      'economic pressure': 'Strain on production, trade, employment, public finance, or living standards.',
      'trade activity': 'The movement and exchange of goods, services, and resources across regions.',
      'ideological tension': 'Conflict between political, religious, or social systems of belief.',
      interdependence: 'A condition in which regions depend on one another and changes in one affect others.',
      'historical significance': 'The importance assigned to an event because of its scale, consequences, or lasting meaning.',
      causation: 'The study of why an event happened and how multiple factors contributed to it.',
      'continuity and change': 'A way to identify what persisted and what transformed across a span of time.',
    };
    const terms = [
      ...(isPeriod ? ['continuity and change'] : ['causation']),
      'historical significance',
      'interdependence',
      ...signalTerms,
    ];
    return [...new Set(terms)].slice(0, 6).map(term => ({
      term: capitalize(term),
      definition: definitions[term] || 'A recurring analytical concept in comparative history.',
    }));
  }

  function quickCheckItems(events, tensions, contextText, isPeriod) {
    const first = events[0];
    const second = events[1] || first;
    const relationship = tensions[0];
    return [
      {
        question: first
          ? `Which region is connected to "${first.event.title}"?`
          : 'Name one region represented in the analysis.',
        answer: first?.region || 'Answers will vary.',
      },
      {
        question: second
          ? `What immediate development is described for ${second.region}?`
          : 'Identify one major development.',
        answer: second?.event.description || 'Answers will vary.',
      },
      {
        question: relationship
          ? `Which two regions are linked by the relationship "${relationship.note}"?`
          : 'Identify one plausible connection between two regions.',
        answer: relationship?.labels.join(' and ') || 'Answers will vary.',
      },
      {
        question: isPeriod
          ? 'What evidence marks a turning point rather than simple continuity?'
          : 'What wider pressure or pattern shaped several regions at once?',
        answer: contextText || 'Use the global context and regional evidence to support the response.',
      },
    ];
  }

  function sourceGuidance(views) {
    const sourceCount = new Set(
      views.flatMap(view => {
        const grounding = view.data.__grounding;
        const items = Array.isArray(grounding) ? grounding : [grounding];
        return items.filter(Boolean).map(item => item.url || item.name);
      })
    ).size;
    return sourceCount
      ? `Evidence reminder: this kit draws from the ${sourceCount} chronology source${sourceCount === 1 ? '' : 's'} cited above. Students should distinguish sourced facts from the dashboard's comparative interpretation.`
      : 'Evidence reminder: verify factual claims with the cited chronology and additional primary or scholarly sources before classroom use.';
  }

  function selectControl(labelText, id, options, selected, onChange) {
    const label = document.createElement('label');
    label.className = 'teacher-mode-select';
    label.htmlFor = id;
    const text = document.createElement('span');
    text.textContent = labelText;
    const select = document.createElement('select');
    select.id = id;
    for (const [value, label] of options) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = value === selected;
      select.appendChild(option);
    }
    select.addEventListener('change', event => onChange(event.target.value));
    label.append(text, select);
    return label;
  }

  function overviewCard(labelText, text) {
    const card = document.createElement('article');
    card.className = 'teacher-mode-overview-card';
    const label = document.createElement('div');
    label.className = 'teacher-mode-card-label';
    label.textContent = labelText;
    const body = document.createElement('p');
    body.textContent = text;
    card.append(label, body);
    return card;
  }

  function contentSection(titleText, content) {
    const section = document.createElement('section');
    section.className = 'teacher-mode-section';
    const title = document.createElement('h3');
    title.textContent = titleText;
    section.append(title, content);
    return section;
  }

  function buildLessonSequence(items) {
    const list = document.createElement('ol');
    list.className = 'teacher-mode-sequence';
    for (const [stage, time, description] of items) {
      const item = document.createElement('li');
      const marker = document.createElement('span');
      marker.className = 'teacher-mode-sequence-time';
      marker.textContent = time;
      const body = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = stage;
      const text = document.createElement('p');
      text.textContent = description;
      body.append(title, text);
      item.append(marker, body);
      list.appendChild(item);
    }
    return list;
  }

  function orderedList(items, className) {
    const list = document.createElement('ol');
    list.className = className;
    for (const text of items) {
      const item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    }
    return list;
  }

  function buildVocabulary(items) {
    const list = document.createElement('dl');
    list.className = 'teacher-mode-vocabulary';
    for (const item of items) {
      const term = document.createElement('dt');
      term.textContent = item.term;
      const definition = document.createElement('dd');
      definition.textContent = item.definition;
      list.append(term, definition);
    }
    return list;
  }

  function buildQuickCheck(items) {
    const list = document.createElement('div');
    list.className = 'teacher-mode-quick-check';
    items.forEach((item, index) => {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = `${index + 1}. ${item.question}`;
      const answer = document.createElement('p');
      answer.textContent = item.answer;
      details.append(summary, answer);
      list.appendChild(details);
    });
    return list;
  }

  function actionButton(label, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'teacher-mode-action';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function copyKit(kit) {
    const lines = [
      `${kit.label} Classroom Kit`,
      `${GRADE_BANDS[gradeBand].label} · ${lessonLength} minutes`,
      '',
      `Learning objective: ${kit.objective}`,
      `Historical thinking skill: ${kit.skill}`,
      `Essential question: ${kit.essentialQuestion}`,
      '',
      'Lesson sequence:',
      ...kit.lesson.map(([stage, time, text]) => `- ${stage} (${time}): ${text}`),
      '',
      'Discussion prompts:',
      ...kit.discussion.map((text, index) => `${index + 1}. ${text}`),
      '',
      'Vocabulary:',
      ...kit.vocabulary.map(item => `- ${item.term}: ${item.definition}`),
      '',
      'Quick check:',
      ...kit.quickCheck.flatMap((item, index) => [
        `${index + 1}. ${item.question}`,
        `   Answer: ${item.answer}`,
      ]),
      '',
      kit.sourceNote,
      'Generated by HistoryLens Teacher Mode. Review and adapt before instruction.',
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showMessage('Classroom kit copied.'))
      .catch(() => showMessage('Could not copy the classroom kit.'));
  }

  function printKit() {
    document.body.classList.add('teacher-printing');
    global.print();
    setTimeout(() => document.body.classList.remove('teacher-printing'), 500);
  }

  function showMessage(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function capitalize(value) {
    return String(value).replace(/\b\w/g, character => character.toUpperCase());
  }

  global.HistoryLensTeacherMode = { configure, toggle, reset };
})(window);
