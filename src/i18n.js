(function initHistoryLensI18n(global) {
  'use strict';

  const STORAGE_KEY = 'hl_language_v1';
  const SUPPORTED = new Set(['en', 'ru']);

  const dictionary = {
    en: {
      'language.label': 'Language',
      'language.en': 'EN',
      'language.ru': 'RU',
      'nav.explore': 'Explore',
      'nav.examples': 'Examples',
      'nav.how': 'How it works',
      'nav.educators': 'For educators',
      'nav.github': 'GitHub ↗',
      'nav.openMenu': 'Open menu',
      'hero.eyebrow': 'Global History · Comparative Analysis · Any Year',
      'hero.titleHtml': 'Understand what the world<br/>looked like in <em>any year</em>',
      'hero.subtitle': 'Compare regions, detect patterns, and understand global shifts — not just isolated events.',
      'hero.yearsCovered': 'Years Covered',
      'hero.worldRegions': 'World Regions',
      'hero.always': 'Always',
      'search.yearMode': 'Year',
      'search.periodMode': 'Period',
      'search.yearLabel': 'Enter a year to explore',
      'search.periodLabel': 'Enter a period to explore change over time',
      'search.yearHint': 'Press Enter · Ctrl/Cmd+K to focus',
      'search.periodHint': 'Periods may span up to 25 years',
      'search.explore': 'Explore →',
      'search.exploreComparison': 'Explore Comparison',
      'search.explorePeriod': 'Explore Period',
      'search.compare': 'Compare two years',
      'search.notableEras': 'Notable eras',
      'search.notablePeriods': 'Notable periods',
      'search.surprise': '🎲 Surprise me — take me to a random year in history',
      'search.startYear': 'Start year',
      'search.endYear': 'End year',
      'search.year2': 'Year 2',
      'search.runThisYear': 'Run this year live →',
      'toolbar.print': 'Print / PDF',
      'toolbar.copy': 'Copy Summary',
      'toolbar.history': 'History',
      'toolbar.share': 'Share',
      'toolbar.teacher': 'Teacher Mode',
      'toolbar.perspective': 'Perspective',
      'results.worldThisYear': 'The World in This Year',
      'results.howWorldChanged': 'How the World Changed',
      'results.analyzing': 'Analyzing...',
      'results.globalContext': 'Global Context',
      'results.globalSignals': 'Global Signals',
      'results.regionalBreakdown': 'Regional Breakdown',
      'results.keyEvents': 'Key Events',
      'results.keyTurningPoints': 'Key Turning Points',
      'results.primary': 'Primary',
      'results.definingShift': 'Defining shift',
      'results.supporting': 'Supporting',
      'results.supportingShift': 'Supporting shift',
      'results.notableFigures': 'Notable Figures',
      'results.whyItMatters': 'Why it matters',
      'results.globalContrast': 'Global Contrast',
      'results.crossRegional': 'Cross-Regional Analysis',
      'sources.evidence': 'Evidence:',
      'sources.referenceChronology': 'Reference chronology',
      'sources.reviewedEdition': 'Reviewed edition',
      'sources.curatedReviewed': 'Curated edition · reviewed {date}',
      'sources.curatedEditions': 'Curated editions',
      'signals.war_intensity': 'War Intensity',
      'signals.political_fragmentation': 'Political Fragmentation',
      'signals.economic_pressure': 'Economic Pressure',
      'signals.trade_activity': 'Trade Activity',
      'signals.ideological_tension': 'Ideological Tension',
      'loading.0': 'Analyzing global patterns...',
      'loading.1': 'Mapping regional developments...',
      'loading.2': 'Identifying primary events...',
      'loading.3': 'Detecting cross-regional signals...',
      'loading.4': 'Structuring the global analysis...',
      'loading.slow': 'Taking longer than usual — the API may be busy.',
      'errors.invalidYear': 'Please enter a valid year (e.g. 1821).',
      'errors.yearRange': 'Please enter a year between {min} BCE and {max} CE.',
      'errors.yearZero': "Year 0 does not exist in the historian's calendar. Try 1 BCE or 1 CE.",
      'errors.secondYear': 'Please enter a second year to compare.',
      'errors.periodBoth': 'Please enter both a start year and an end year.',
      'errors.periodRange': 'Use historical years between {min} BCE and {max} CE, excluding year 0.',
      'errors.periodOrder': 'The end year must come after the start year.',
      'errors.periodTooLong': 'Periods may span at most 25 years.',
      'errors.auth': 'Authentication failed. Check your API key.',
      'errors.endpoint': 'API endpoint not found. If running locally, please use "vercel dev" instead of a static server.',
      'errors.rateLimit': 'Rate limit reached. Please wait a moment and try again.',
      'errors.timeout': 'The request timed out. Please try again — the API may be busy.',
      'errors.format': 'Received unexpected data format. Please try again.',
      'errors.generic': 'Could not load data. Ensure "vercel dev" is running and your API key is configured.',
      'toast.jump': '🎲 Jumping to {year}...',
      'toast.interrupted': 'Response interrupted, some data may be missing.',
      'feedback.promptHtml': '<strong>Was this historically accurate?</strong> Your feedback helps us improve.',
      'feedback.positive': '👍 Accurate',
      'feedback.negative': '👎 Issues found',
      'feedback.report': '✉ Report details',
      'feedback.thanksPositive': 'Thanks — glad it was accurate!',
      'feedback.thanksNegative': 'Thanks for flagging. Consider verifying with primary sources.',
      'regionProfile.note': '{label}: regions reflect the political and cultural worlds of this period.',
      'region.europe': 'Europe',
      'region.asia': 'Asia',
      'region.namerica': 'Americas',
      'region.africa': 'Africa',
      'keyEvents.eyebrow': 'Go Beyond the Dashboard',
      'keyEvents.title': '7 Key Events of {year}',
      'keyEvents.description': 'Explore source-grounded events selected for lasting political, social, scientific, economic, or cultural impact.',
      'keyEvents.view': 'View 7 Key Events',
      'keyEvents.hide': 'Hide Key Events',
      'keyEvents.loading': 'Checking historical sources for {year}...',
      'keyEvents.note': 'Selected for historical consequence and geographic breadth.',
      'keyEvents.anchor': 'Chronology anchor:',
      'keyEvents.anchorSuffix': 'Additional sources are discovery aids; inspect them before formal citation.',
      'keyEvents.untitled': 'Untitled event',
      'keyEvents.why': 'Why it mattered: ',
      'keyEvents.sources': 'Research sources',
      'keyEvents.reference': 'Reference',
      'keyEvents.openSource': 'Open source',
      'keyEvents.error': 'Could not load key events.',
      'keyEvents.retry': 'Try again',
      'eventCheck.eyebrow': 'Missing Something?',
      'eventCheck.title': 'Check an Event in {year}',
      'eventCheck.description': 'Search the source chronology to see whether an event belongs to this year.',
      'eventCheck.placeholder': 'e.g. Nagorno-Karabakh War',
      'eventCheck.aria': 'Event to check in {year}',
      'eventCheck.button': 'Check chronology',
      'eventCheck.checking': 'Checking...',
      'eventCheck.loading': 'Searching the year chronology...',
      'eventCheck.found': 'Found in chronology',
      'eventCheck.notFound': 'No close match found',
      'eventCheck.openSource': 'Open source: {title}',
      'eventCheck.error': 'Could not check this event.',
    },
    ru: {
      'language.label': 'Язык',
      'language.en': 'EN',
      'language.ru': 'RU',
      'nav.explore': 'Искать',
      'nav.examples': 'Примеры',
      'nav.how': 'Как это работает',
      'nav.educators': 'Для преподавателей',
      'nav.github': 'GitHub ↗',
      'nav.openMenu': 'Открыть меню',
      'hero.eyebrow': 'Глобальная история · Сравнительный анализ · Любой год',
      'hero.titleHtml': 'Поймите, как выглядел мир<br/>в <em>любой год</em>',
      'hero.subtitle': 'Сравнивайте регионы, замечайте закономерности и видьте глобальные сдвиги, а не только отдельные события.',
      'hero.yearsCovered': 'Лет охвачено',
      'hero.worldRegions': 'Мировых региона',
      'hero.always': 'Всегда',
      'search.yearMode': 'Год',
      'search.periodMode': 'Период',
      'search.yearLabel': 'Введите год для анализа',
      'search.periodLabel': 'Введите период, чтобы увидеть изменения во времени',
      'search.yearHint': 'Нажмите Enter · Ctrl/Cmd+K для фокуса',
      'search.periodHint': 'Период может охватывать до 25 лет',
      'search.explore': 'Исследовать →',
      'search.exploreComparison': 'Сравнить годы',
      'search.explorePeriod': 'Исследовать период',
      'search.compare': 'Сравнить два года',
      'search.notableEras': 'Известные годы',
      'search.notablePeriods': 'Известные периоды',
      'search.surprise': '🎲 Случайный год из истории',
      'search.startYear': 'Начальный год',
      'search.endYear': 'Конечный год',
      'search.year2': 'Год 2',
      'search.runThisYear': 'Запустить этот год →',
      'toolbar.print': 'Печать / PDF',
      'toolbar.copy': 'Копировать обзор',
      'toolbar.history': 'История',
      'toolbar.share': 'Поделиться',
      'toolbar.teacher': 'Режим учителя',
      'toolbar.perspective': 'Перспектива',
      'results.worldThisYear': 'Мир в этот год',
      'results.howWorldChanged': 'Как менялся мир',
      'results.analyzing': 'Анализ...',
      'results.globalContext': 'Глобальный контекст',
      'results.globalSignals': 'Глобальные сигналы',
      'results.regionalBreakdown': 'Региональный разбор',
      'results.keyEvents': 'Ключевые события',
      'results.keyTurningPoints': 'Ключевые поворотные точки',
      'results.primary': 'Главное',
      'results.definingShift': 'Определяющий сдвиг',
      'results.supporting': 'Дополнительно',
      'results.supportingShift': 'Дополнительный сдвиг',
      'results.notableFigures': 'Заметные фигуры',
      'results.whyItMatters': 'Почему это важно',
      'results.globalContrast': 'Глобальный контраст',
      'results.crossRegional': 'Межрегиональный анализ',
      'sources.evidence': 'Источники:',
      'sources.referenceChronology': 'Справочная хронология',
      'sources.reviewedEdition': 'Проверенная версия',
      'sources.curatedReviewed': 'Кураторская версия · проверено {date}',
      'sources.curatedEditions': 'Кураторские версии',
      'signals.war_intensity': 'Интенсивность войн',
      'signals.political_fragmentation': 'Политическая раздробленность',
      'signals.economic_pressure': 'Экономическое давление',
      'signals.trade_activity': 'Торговая активность',
      'signals.ideological_tension': 'Идеологическое напряжение',
      'loading.0': 'Анализируем глобальные закономерности...',
      'loading.1': 'Сопоставляем региональные процессы...',
      'loading.2': 'Выделяем главные события...',
      'loading.3': 'Ищем межрегиональные сигналы...',
      'loading.4': 'Структурируем глобальный анализ...',
      'loading.slow': 'Это занимает больше времени: API может быть занят.',
      'errors.invalidYear': 'Введите корректный год, например 1821.',
      'errors.yearRange': 'Введите год между {min} до н. э. и {max} н. э.',
      'errors.yearZero': 'Года 0 в историческом календаре нет. Попробуйте 1 до н. э. или 1 н. э.',
      'errors.secondYear': 'Введите второй год для сравнения.',
      'errors.periodBoth': 'Введите начальный и конечный год.',
      'errors.periodRange': 'Используйте годы между {min} до н. э. и {max} н. э., исключая год 0.',
      'errors.periodOrder': 'Конечный год должен быть позже начального.',
      'errors.periodTooLong': 'Период может охватывать максимум 25 лет.',
      'errors.auth': 'Ошибка авторизации. Проверьте API-ключ.',
      'errors.endpoint': 'API endpoint не найден. При локальном запуске используйте "vercel dev", а не статический сервер.',
      'errors.rateLimit': 'Достигнут лимит запросов. Подождите немного и попробуйте снова.',
      'errors.timeout': 'Запрос занял слишком много времени. Попробуйте снова: API может быть занят.',
      'errors.format': 'Получен неожиданный формат данных. Попробуйте снова.',
      'errors.generic': 'Не удалось загрузить данные. Убедитесь, что "vercel dev" запущен и API-ключ настроен.',
      'toast.jump': '🎲 Переходим к {year}...',
      'toast.interrupted': 'Ответ прервался, часть данных может отсутствовать.',
      'feedback.promptHtml': '<strong>Исторически точно?</strong> Ваш отзыв поможет улучшить результат.',
      'feedback.positive': '👍 Точно',
      'feedback.negative': '👎 Есть проблемы',
      'feedback.report': '✉ Сообщить детали',
      'feedback.thanksPositive': 'Спасибо, рад что результат точный.',
      'feedback.thanksNegative': 'Спасибо за сигнал. Лучше сверить это с первичными источниками.',
      'regionProfile.note': '{label}: регионы отражают политические и культурные миры этого периода.',
      'region.europe': 'Европа',
      'region.asia': 'Азия',
      'region.namerica': 'Америка',
      'region.africa': 'Африка',
      'keyEvents.eyebrow': 'За пределами панели',
      'keyEvents.title': '7 ключевых событий: {year}',
      'keyEvents.description': 'События из источников, выбранные по политическому, социальному, научному, экономическому или культурному влиянию.',
      'keyEvents.view': 'Показать 7 событий',
      'keyEvents.hide': 'Скрыть события',
      'keyEvents.loading': 'Проверяем исторические источники за {year}...',
      'keyEvents.note': 'Выбрано по историческим последствиям и географической широте.',
      'keyEvents.anchor': 'Опорная хронология:',
      'keyEvents.anchorSuffix': 'Дополнительные источники помогают поиску; проверьте их перед формальным цитированием.',
      'keyEvents.untitled': 'Событие без названия',
      'keyEvents.why': 'Почему это важно: ',
      'keyEvents.sources': 'Исследовательские источники',
      'keyEvents.reference': 'Справка',
      'keyEvents.openSource': 'Открыть источник',
      'keyEvents.error': 'Не удалось загрузить ключевые события.',
      'keyEvents.retry': 'Повторить',
      'eventCheck.eyebrow': 'Чего-то не хватает?',
      'eventCheck.title': 'Проверить событие: {year}',
      'eventCheck.description': 'Проверьте хронологию источника, чтобы понять, относится ли событие к этому году.',
      'eventCheck.placeholder': 'например, Берлинская конференция',
      'eventCheck.aria': 'Событие для проверки за {year}',
      'eventCheck.button': 'Проверить хронологию',
      'eventCheck.checking': 'Проверяем...',
      'eventCheck.loading': 'Ищем в хронологии года...',
      'eventCheck.found': 'Найдено в хронологии',
      'eventCheck.notFound': 'Близкое совпадение не найдено',
      'eventCheck.openSource': 'Открыть источник: {title}',
      'eventCheck.error': 'Не удалось проверить событие.',
    },
  };

  let currentLanguage = initialLanguage();
  document.documentElement.lang = currentLanguage;

  function initialLanguage() {
    const params = new URLSearchParams(global.location.search);
    return normalize(params.get('lang') || safeLocalStorageGet(STORAGE_KEY) || global.navigator.language);
  }

  function normalize(value) {
    if (typeof value !== 'string') return 'en';
    const base = value.trim().toLowerCase().split(/[-_]/)[0];
    return SUPPORTED.has(base) ? base : 'en';
  }

  function safeLocalStorageGet(key) {
    try { return global.localStorage.getItem(key); } catch { return null; }
  }

  function safeLocalStorageSet(key, value) {
    try { global.localStorage.setItem(key, value); } catch { /* ignore */ }
  }

  function t(key, params = {}) {
    const template = dictionary[currentLanguage]?.[key] ?? dictionary.en[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
  }

  function getLanguage() {
    return currentLanguage;
  }

  function setLanguage(language, options = {}) {
    const next = normalize(language);
    if (next === currentLanguage && !options.force) return;
    currentLanguage = next;
    document.documentElement.lang = next;
    safeLocalStorageSet(STORAGE_KEY, next);
    if (options.updateUrl !== false) updateUrlLanguage(next);
    applyStaticTranslations();
    updateLanguageControls();
    document.dispatchEvent(new CustomEvent('historylens:languagechange', { detail: { language: next } }));
  }

  function updateUrlLanguage(language) {
    const url = new URL(global.location.href);
    if (language === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', language);
    global.history.replaceState(global.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function languageSearchParam() {
    return currentLanguage === 'en' ? '' : `&lang=${encodeURIComponent(currentLanguage)}`;
  }

  function initControls() {
    if (!document.querySelector('.language-switcher')) {
      const nav = document.querySelector('nav');
      const mobileButton = document.getElementById('mobileMenuBtn');
      if (nav && mobileButton) nav.insertBefore(buildSwitcher(), mobileButton);
    }
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav && !mobileNav.querySelector('.mobile-language-switcher')) {
      const wrap = buildSwitcher();
      wrap.classList.add('mobile-language-switcher');
      mobileNav.appendChild(wrap);
    }
    updateLanguageControls();
  }

  function buildSwitcher() {
    const wrap = document.createElement('div');
    wrap.className = 'language-switcher';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', t('language.label'));
    for (const language of ['en', 'ru']) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'language-btn';
      button.dataset.language = language;
      button.textContent = t(`language.${language}`);
      button.addEventListener('click', () => setLanguage(language, { updateUrl: true }));
      wrap.appendChild(button);
    }
    return wrap;
  }

  function updateLanguageControls() {
    document.querySelectorAll('.language-switcher').forEach(wrap => {
      wrap.setAttribute('aria-label', t('language.label'));
      wrap.querySelectorAll('.language-btn').forEach(button => {
        const active = button.dataset.language === currentLanguage;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    });
  }

  function setText(selector, key) {
    document.querySelectorAll(selector).forEach(node => { node.textContent = t(key); });
  }

  function setHtml(selector, key) {
    document.querySelectorAll(selector).forEach(node => { node.innerHTML = t(key); });
  }

  function setAttr(selector, attr, key) {
    document.querySelectorAll(selector).forEach(node => { node.setAttribute(attr, t(key)); });
  }

  function applyStaticTranslations() {
    document.documentElement.lang = currentLanguage;
    setText('.nav-links a[href="#search"], .mobile-nav a[href="#search"]', 'nav.explore');
    setText('.nav-links a[href="#exampleSection"], .mobile-nav a[href="#exampleSection"]', 'nav.examples');
    setText('.nav-links a[href="#howSection"], .mobile-nav a[href="#howSection"]', 'nav.how');
    setText('.nav-links a[href="#forSection"], .mobile-nav a[href="#forSection"]', 'nav.educators');
    setText('.nav-links a[href^="https://github.com"], .mobile-nav a[href^="https://github.com"]', 'nav.github');
    setAttr('#mobileMenuBtn', 'aria-label', 'nav.openMenu');
    setText('.hero-eyebrow', 'hero.eyebrow');
    setHtml('.hero-title', 'hero.titleHtml');
    setText('.hero-subtitle', 'hero.subtitle');
    const stats = document.querySelectorAll('.hero-stats .stat-label');
    if (stats[0]) stats[0].textContent = t('hero.yearsCovered');
    if (stats[1]) stats[1].textContent = t('hero.worldRegions');
    if (stats[2]) stats[2].textContent = t('hero.always');
    setText('#yearModeBtn', 'search.yearMode');
    setText('#periodModeBtn', 'search.periodMode');
    setText('#searchBtn', 'search.explore');
    setText('#periodSearchBtn', 'search.explorePeriod');
    setText('#compareOption span', 'search.compare');
    setText('#yearPresets .quick-nav-label', 'search.notableEras');
    setText('#periodPresets .quick-nav-label', 'search.notablePeriods');
    setText('#surpriseBtn', 'search.surprise');
    setText('#lhTryBtn', 'search.runThisYear');
    const compareLabels = document.querySelectorAll('.compare-label');
    if (compareLabels[0]) compareLabels[0].textContent = t('search.startYear');
    if (compareLabels[1]) compareLabels[1].textContent = t('search.endYear');
    if (compareLabels[2]) compareLabels[2].textContent = t('search.year2');
    setText('#btnPrint span', 'toolbar.print');
    setText('#btnCopy span', 'toolbar.copy');
    setText('#btnHistory span', 'toolbar.history');
    setText('#btnShare span', 'toolbar.share');
    setText('#btnTeacher span', 'toolbar.teacher');
    setText('#btnPerspective span', 'toolbar.perspective');
    setText('.gc-label', 'results.globalContext');
    setText('.signals-label', 'results.globalSignals');
    setText('.divider-text', 'results.regionalBreakdown');
    setHtml('.feedback-prompt', 'feedback.promptHtml');
    setText('#fbPos', 'feedback.positive');
    setText('#fbNeg', 'feedback.negative');
    setText('#btnReport', 'feedback.report');
  }

  function regionShortName(id) {
    return t(`region.${id}`);
  }

  function localizedQualityLabel(label) {
    const normalized = String(label || '').toLowerCase();
    if (normalized.includes('reviewed')) return t('sources.reviewedEdition');
    if (normalized.includes('reference')) return t('sources.referenceChronology');
    return label || t('sources.referenceChronology');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initControls();
    applyStaticTranslations();
  });

  global.HistoryLensI18n = {
    t,
    getLanguage,
    setLanguage,
    applyStaticTranslations,
    languageSearchParam,
    regionShortName,
    localizedQualityLabel,
  };
})(window);
