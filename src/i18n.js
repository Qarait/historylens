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
      'landing.exampleLabel': 'Example output — year 1453',
      'landing.exampleEra': 'The Age of Imperial Collision',
      'landing.exampleHookHtml': 'While the <strong>Ottoman Empire</strong> dismantled the last remnant of <strong>Rome</strong> by seizing Constantinople, <strong>Ming China</strong> had already retreated from global projection — and the <strong>Americas</strong> remained entirely outside the awareness of either.',
      'landing.exampleRegionEurope': 'Europe',
      'landing.exampleRegionAsia': 'Asia',
      'landing.exampleRegionAmericas': 'The Americas',
      'landing.exampleRegionAfrica': 'Africa',
      'landing.exampleThesisEurope': '"A thousand-year empire erased in a single siege"',
      'landing.exampleThesisAsia': '"Ottoman expansion reshapes the known world"',
      'landing.exampleThesisAmericas': '"Civilizations at peak — unaware of the coming storm"',
      'landing.exampleThesisAfrica': '"Songhai eclipses Mali as the continent\'s dominant power"',
      'landing.exampleEventEurope': '⭐ Fall of Constantinople ends the Byzantine era and redirects European trade westward',
      'landing.exampleEventAsia': '⭐ Mehmed II\'s conquest cements Ottoman dominance over eastern Mediterranean trade routes',
      'landing.exampleEventAmericas': '⭐ Aztec Triple Alliance consolidates central Mexico, 40 years before contact',
      'landing.exampleEventAfrica': '⭐ Songhai expansion under Sunni Ali accelerates West African trade consolidation',
      'landing.exampleContrastHtml': '<strong>Global Contrast —</strong> While Constantinople\'s fall forced European merchants to seek Atlantic routes, West African and Mesoamerican powers operated at peak capacity — entirely uncoupled from the Mediterranean crisis reshaping Eurasia.',
      'landing.exampleCta': '→ Run this year live',
      'landing.howLabel': 'How it works',
      'landing.how.0.title': 'Identify key global events',
      'landing.how.0.desc': 'Locate the most historically significant developments in each region for the given year.',
      'landing.how.1.title': 'Rank by historical impact',
      'landing.how.1.desc': 'One primary event per region. Two supporting. Hierarchy reflects consequence, not recency.',
      'landing.how.2.title': 'Compare across regions',
      'landing.how.2.desc': 'Regions placed side by side to expose simultaneous patterns, contrasts, and blind spots.',
      'landing.how.3.title': 'Generate a global analysis',
      'landing.how.3.desc': 'A structured cross-regional contrast surfaces the relationships between what was happening everywhere at once.',
      'landing.whoLabel': "Who it's for",
      'landing.who.0.who': 'Students',
      'landing.who.0.title': 'Understand context, not memorize facts',
      'landing.who.0.bullet.0': 'Place events in global context',
      'landing.who.0.bullet.1': 'Spot patterns across civilizations',
      'landing.who.0.bullet.2': 'Build arguments, not just timelines',
      'landing.who.1.who': 'Teachers & Educators',
      'landing.who.1.title': 'Explain global dynamics without the prep',
      'landing.who.1.bullet.0': 'Instant cross-regional comparisons',
      'landing.who.1.bullet.1': 'Printable structured analysis',
      'landing.who.1.bullet.2': 'Pairs with any curriculum',
      'landing.who.2.who': 'Curious Readers',
      'landing.who.2.title': 'Explore history the way it actually happened',
      'landing.who.2.bullet.0': 'Follow curated historical threads',
      'landing.who.2.bullet.1': 'Compare any two years side by side',
      'landing.who.2.bullet.2': 'Build your own exploration timeline',
      'landing.trust.0': 'Free — no account required',
      'landing.trust.1': 'Based on widely accepted historical records',
      'landing.trust.2': 'Built for exploration, not as a primary source',
      'landing.trust.3': 'Open source · MIT License',
      'landing.trustDisclaimer': 'Always verify important claims with textbooks, encyclopedias, and primary sources. Key events and chronology checks include source links; verify interpretation with specialist scholarship.',
      'landing.threadsLabel': 'Curated Threads',
      'landing.manifestoEyebrow': 'What this reveals',
      'landing.manifestoHeadingHtml': 'History is not a sequence of events.<br/>It is a set of simultaneous conditions.',
      'landing.manifesto.0': 'Most history education teaches one region at a time — one empire, one war, one century. The result is a mental model of the past built from <strong>isolated narratives</strong> that never intersect. Students learn what happened in Europe during the Renaissance, or what happened in China during the Ming dynasty, but rarely both — and almost never at the same moment.',
      'landing.manifesto.1': 'This matters because <strong>the patterns that shaped the modern world only become visible when you see them together.</strong> The Ottoman expansion that rerouted European trade. The simultaneous collapse of multiple empires in 1918. The way the Black Death reached Asia, the Middle East, and Europe within years of each other — not as separate events, but as a single catastrophe moving across an interconnected world.',
      'landing.manifesto.2': 'HistoryLens is built on a simple premise: <strong>placing regions side by side reveals what no single timeline can show.</strong> When you see that Columbus reached the Americas the same decade the Ottoman Empire consolidated eastern Mediterranean trade routes, you stop seeing 1492 as a "discovery" and start seeing it as a consequence — a redirection of European ambition forced by blocked eastern paths.',
      'landing.manifesto.3': 'That kind of contextual understanding cannot be built from facts alone. It requires <strong>comparison, contrast, and the willingness to look at the whole world at once.</strong> Not to replace primary sources or scholarly research — but to give students, teachers, and curious readers a structured starting point for thinking globally about any moment in human history.',
      'landing.manifestoPull.0': '<strong>World regions, side by side</strong>Europe, Asia, the Americas, and Africa — every search, every time.',
      'landing.manifestoPull.1': '<strong>Years of simultaneous history</strong>From ancient Mesopotamia to the early 21st century.',
      'landing.manifestoPull.2': '<strong>Core question behind every search</strong>"What else was happening — everywhere else — at exactly this moment?"',
      'landing.footerDesc': 'Understand what the world looked like in any year. Compare regions, detect patterns, and understand global shifts — not just isolated events.',
      'landing.footerMission': 'Our mission: make comparative global history accessible to every student, teacher, and curious reader — free, forever.',
      'landing.footerNavigate': 'Navigate',
      'landing.footerEducators': 'For Educators',
      'landing.footerExplore': 'Explore a year',
      'landing.footerExample': 'See an example',
      'landing.footerClassroom': 'Classroom use cases',
      'landing.footerPrint': 'Print as handout',
      'landing.footerGithub': 'GitHub — fork it ↗',
      'landing.footerApiKey': 'Get an API Key ↗',
      'landing.footerCopyright': '© 2026 HistoryLens',
      'landing.footerLicense': 'MIT License',
      'landing.footerDisclaimer': 'Built for exploration, not as a primary source. Based on widely accepted historical records. Always verify with textbooks and primary sources.',
      'landing.printCredit': 'Generated by HistoryLens · Verify with primary sources · historylens.app',
      'landingHook.0.era': 'The Age of Empire & Exploration',
      'landingHook.0.contrastHtml': 'While <strong>Europe</strong> fractured under religious war, <strong>Mughal India</strong> reached its administrative peak — and the <strong>Americas</strong> remained under accelerating colonial extraction.',
      'landingHook.0.metric': 'Global Stability: Uneven',
      'landingHook.0.region.europe': 'Fragmented',
      'landingHook.0.region.asia': 'Consolidated',
      'landingHook.0.region.namerica': 'Colonial pressure',
      'landingHook.0.region.africa': 'Trade expansion',
      'landingHook.1.era': 'The Black Death Arrives',
      'landingHook.1.contrastHtml': 'The plague that <strong>Europe</strong> called the end of the world was already decimating populations across <strong>Central Asia</strong> — carried west along the same trade routes that had connected civilizations for centuries.',
      'landingHook.1.metric': 'Global Stability: Collapsing',
      'landingHook.1.region.europe': 'Catastrophic decline',
      'landingHook.1.region.asia': 'Origin epicenter',
      'landingHook.1.region.namerica': 'Untouched',
      'landingHook.1.region.africa': 'Partially exposed',
      'landingHook.2.era': 'The Age of Revolution',
      'landingHook.2.contrastHtml': 'As <strong>Latin America</strong> dismantled Spanish colonial rule across an entire continent, <strong>Ottoman</strong> power contracted in the Balkans — and <strong>Qing China</strong> faced early signs of the internal pressure that would fracture it within decades.',
      'landingHook.2.metric': 'Political Fragmentation: Rising',
      'landingHook.2.region.europe': 'Post-Napoleon instability',
      'landingHook.2.region.asia': 'Declining empires',
      'landingHook.2.region.namerica': 'Independence wave',
      'landingHook.2.region.africa': 'Pre-colonial peak',
      'landingHook.3.era': 'The World on the Brink',
      'landingHook.3.contrastHtml': 'A single assassination in <strong>Sarajevo</strong> triggered every alliance Europe had built — while <strong>Japan</strong> expanded quietly in the Pacific and <strong>Africa</strong> remained almost entirely under colonial rule it had no voice in dismantling.',
      'landingHook.3.metric': 'War Intensity: Critical',
      'landingHook.3.region.europe': 'Alliance collapse',
      'landingHook.3.region.asia': 'Imperial expansion',
      'landingHook.3.region.namerica': 'Neutral, watching',
      'landingHook.3.region.africa': 'Colonized — no agency',
      'landingHook.region.europe': 'Europe',
      'landingHook.region.asia': 'Asia',
      'landingHook.region.namerica': 'Americas',
      'landingHook.region.africa': 'Africa',
      'thread.0.name': 'The Rise of Empires',
      'thread.0.desc': 'Ancient world power consolidation',
      'thread.1.name': 'World Religions Spread',
      'thread.1.desc': 'Faith reshapes civilizations',
      'thread.2.name': 'The Age of Collision',
      'thread.2.desc': 'When hemispheres crashed into each other',
      'thread.3.name': 'Revolution & Nation',
      'thread.3.desc': 'The world remade by popular sovereignty',
      'thread.4.name': 'The Century of War',
      'thread.4.desc': 'How the modern world broke and rebuilt',
      'thread.5.name': 'The Cold World Order',
      'thread.5.desc': 'Power, ideology, and proxy conflict',
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
      'toast.threadStart': '📖 {name} — starting at {year}',
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
      'landing.exampleLabel': 'Пример результата — 1453 год',
      'landing.exampleEra': 'Эпоха столкновения империй',
      'landing.exampleHookHtml': 'Пока <strong>Османская империя</strong> уничтожала последний остаток <strong>Рима</strong>, взяв Константинополь, <strong>Китай эпохи Мин</strong> уже отступил от глобальной морской экспансии — а <strong>Америки</strong> оставались вне поля зрения обеих сторон.',
      'landing.exampleRegionEurope': 'Европа',
      'landing.exampleRegionAsia': 'Азия',
      'landing.exampleRegionAmericas': 'Америки',
      'landing.exampleRegionAfrica': 'Африка',
      'landing.exampleThesisEurope': '"Тысячелетняя империя исчезла после одной осады"',
      'landing.exampleThesisAsia': '"Османская экспансия меняет известный мир"',
      'landing.exampleThesisAmericas': '"Цивилизации на подъеме — еще не знающие о грядущем ударе"',
      'landing.exampleThesisAfrica': '"Сонгай затмевает Мали как ведущая сила континента"',
      'landing.exampleEventEurope': '⭐ Падение Константинополя завершает византийскую эпоху и направляет европейскую торговлю на запад',
      'landing.exampleEventAsia': '⭐ Завоевание Мехмеда II закрепляет османское господство над восточными средиземноморскими торговыми путями',
      'landing.exampleEventAmericas': '⭐ Тройственный союз ацтеков укрепляет центральную Мексику за 40 лет до контакта с Европой',
      'landing.exampleEventAfrica': '⭐ Расширение Сонгая при сунни Али ускоряет консолидацию торговли в Западной Африке',
      'landing.exampleContrastHtml': '<strong>Глобальный контраст —</strong> падение Константинополя подталкивало европейских купцов искать атлантические пути, тогда как западноафриканские и мезоамериканские державы действовали на пике возможностей — почти не связанные со средиземноморским кризисом, который менял Евразию.',
      'landing.exampleCta': '→ Запустить этот год',
      'landing.howLabel': 'Как это работает',
      'landing.how.0.title': 'Выделяет ключевые мировые события',
      'landing.how.0.desc': 'Находит наиболее значимые исторические процессы в каждом регионе для выбранного года.',
      'landing.how.1.title': 'Ранжирует по историческому влиянию',
      'landing.how.1.desc': 'Одно главное событие на регион и два дополнительных. Иерархия отражает последствия, а не свежесть события.',
      'landing.how.2.title': 'Сравнивает регионы',
      'landing.how.2.desc': 'Регионы показаны рядом, чтобы выявить одновременные закономерности, контрасты и слепые зоны.',
      'landing.how.3.title': 'Создает глобальный анализ',
      'landing.how.3.desc': 'Структурированный межрегиональный контраст показывает связи между событиями, происходившими одновременно.',
      'landing.whoLabel': 'Для кого это',
      'landing.who.0.who': 'Студенты',
      'landing.who.0.title': 'Понимать контекст, а не заучивать факты',
      'landing.who.0.bullet.0': 'Помещать события в мировой контекст',
      'landing.who.0.bullet.1': 'Замечать закономерности между цивилизациями',
      'landing.who.0.bullet.2': 'Строить аргументы, а не только хронологии',
      'landing.who.1.who': 'Учителя и преподаватели',
      'landing.who.1.title': 'Объяснять глобальную динамику без долгой подготовки',
      'landing.who.1.bullet.0': 'Мгновенные межрегиональные сравнения',
      'landing.who.1.bullet.1': 'Структурированный материал для печати',
      'landing.who.1.bullet.2': 'Подходит к любой учебной программе',
      'landing.who.2.who': 'Любознательные читатели',
      'landing.who.2.title': 'Исследовать историю такой, какой она происходила',
      'landing.who.2.bullet.0': 'Следовать выбранным историческим линиям',
      'landing.who.2.bullet.1': 'Сравнивать любые два года рядом',
      'landing.who.2.bullet.2': 'Собирать собственную линию исследования',
      'landing.trust.0': 'Бесплатно — без аккаунта',
      'landing.trust.1': 'Основано на признанных исторических данных',
      'landing.trust.2': 'Создано для исследования, не как первоисточник',
      'landing.trust.3': 'Открытый исходный код · лицензия MIT',
      'landing.trustDisclaimer': 'Всегда проверяйте важные утверждения по учебникам, энциклопедиям и первичным источникам. Ключевые события и проверки хронологии содержат ссылки; интерпретацию сверяйте со специальной литературой.',
      'landing.threadsLabel': 'Подборки тем',
      'landing.manifestoEyebrow': 'Что это показывает',
      'landing.manifestoHeadingHtml': 'История — не последовательность событий.<br/>Это набор одновременных условий.',
      'landing.manifesto.0': 'Обычно историю преподают по одному региону за раз — одна империя, одна война, один век. В итоге прошлое складывается из <strong>изолированных рассказов</strong>, которые почти не пересекаются. Учащиеся узнают, что происходило в Европе во время Возрождения или в Китае при Мин, но редко видят оба мира одновременно.',
      'landing.manifesto.1': 'Это важно, потому что <strong>закономерности, сформировавшие современный мир, становятся видимыми только при сравнении.</strong> Османская экспансия меняла торговые пути Европы. Одновременно рушились несколько империй в 1918 году. Черная смерть двигалась через Азию, Ближний Восток и Европу как единая катастрофа взаимосвязанного мира.',
      'landing.manifesto.2': 'HistoryLens строится на простой идее: <strong>если поставить регионы рядом, становится видно то, чего не показывает одна линия времени.</strong> Когда видно, что Колумб достиг Америки в ту же эпоху, когда Османская империя укрепляла контроль над восточным Средиземноморьем, 1492 год перестает быть только "открытием" и становится следствием перенаправленной европейской амбиции.',
      'landing.manifesto.3': 'Такое понимание контекста нельзя построить из одних фактов. Нужны <strong>сравнение, контраст и готовность смотреть на весь мир одновременно.</strong> Это не замена первичным источникам или научным исследованиям, а структурированная отправная точка для глобального мышления о любом историческом моменте.',
      'landing.manifestoPull.0': '<strong>Мировые регионы рядом</strong>Европа, Азия, Америки и Африка — при каждом поиске.',
      'landing.manifestoPull.1': '<strong>Лет одновременной истории</strong>От древней Месопотамии до начала XXI века.',
      'landing.manifestoPull.2': '<strong>Главный вопрос каждого поиска</strong>"Что еще происходило — повсюду — именно в этот момент?"',
      'landing.footerDesc': 'Поймите, как выглядел мир в любой год. Сравнивайте регионы, находите закономерности и понимайте глобальные сдвиги, а не только отдельные события.',
      'landing.footerMission': 'Наша миссия: сделать сравнительную глобальную историю доступной каждому студенту, учителю и любознательному читателю — бесплатно и навсегда.',
      'landing.footerNavigate': 'Навигация',
      'landing.footerEducators': 'Для преподавателей',
      'landing.footerExplore': 'Исследовать год',
      'landing.footerExample': 'Посмотреть пример',
      'landing.footerClassroom': 'Идеи для уроков',
      'landing.footerPrint': 'Печать как раздатка',
      'landing.footerGithub': 'GitHub — сделать форк ↗',
      'landing.footerApiKey': 'Получить API-ключ ↗',
      'landing.footerCopyright': '© 2026 HistoryLens',
      'landing.footerLicense': 'Лицензия MIT',
      'landing.footerDisclaimer': 'Создано для исследования, не как первоисточник. Основано на признанных исторических данных. Всегда сверяйте с учебниками и первичными источниками.',
      'landing.printCredit': 'Создано HistoryLens · Проверяйте по первичным источникам · historylens.app',
      'landingHook.0.era': 'Эпоха империй и исследований',
      'landingHook.0.contrastHtml': 'Пока <strong>Европа</strong> раскалывалась религиозными войнами, <strong>Могольская Индия</strong> достигала административного расцвета — а <strong>Америки</strong> оставались под усиливающимся колониальным извлечением ресурсов.',
      'landingHook.0.metric': 'Глобальная стабильность: неравномерная',
      'landingHook.0.region.europe': 'Раздробленность',
      'landingHook.0.region.asia': 'Консолидация',
      'landingHook.0.region.namerica': 'Колониальное давление',
      'landingHook.0.region.africa': 'Рост торговли',
      'landingHook.1.era': 'Приход Черной смерти',
      'landingHook.1.contrastHtml': 'Чума, которую <strong>Европа</strong> воспринимала как конец света, уже уничтожала население <strong>Центральной Азии</strong> — продвигаясь на запад по тем же торговым путям, которые веками связывали цивилизации.',
      'landingHook.1.metric': 'Глобальная стабильность: обрушение',
      'landingHook.1.region.europe': 'Катастрофический спад',
      'landingHook.1.region.asia': 'Эпицентр происхождения',
      'landingHook.1.region.namerica': 'Не затронуты',
      'landingHook.1.region.africa': 'Частично затронута',
      'landingHook.2.era': 'Эпоха революций',
      'landingHook.2.contrastHtml': 'Пока <strong>Латинская Америка</strong> разрушала испанское колониальное господство на целом континенте, <strong>Османская</strong> власть сокращалась на Балканах — а <strong>Цинский Китай</strong> сталкивался с ранними признаками внутреннего давления, которое через десятилетия расколет его.',
      'landingHook.2.metric': 'Политическая раздробленность: рост',
      'landingHook.2.region.europe': 'Постнаполеоновская нестабильность',
      'landingHook.2.region.asia': 'Упадок империй',
      'landingHook.2.region.namerica': 'Волна независимости',
      'landingHook.2.region.africa': 'Доколониальный пик',
      'landingHook.3.era': 'Мир на грани',
      'landingHook.3.contrastHtml': 'Одно убийство в <strong>Сараево</strong> привело в действие все союзы, построенные Европой, — пока <strong>Япония</strong> тихо расширялась в Тихом океане, а <strong>Африка</strong> почти полностью оставалась под колониальным правлением, не имея голоса в его разрушении.',
      'landingHook.3.metric': 'Интенсивность войн: критическая',
      'landingHook.3.region.europe': 'Крах союзов',
      'landingHook.3.region.asia': 'Имперское расширение',
      'landingHook.3.region.namerica': 'Нейтральное наблюдение',
      'landingHook.3.region.africa': 'Колонизирована — без права голоса',
      'landingHook.region.europe': 'Европа',
      'landingHook.region.asia': 'Азия',
      'landingHook.region.namerica': 'Америки',
      'landingHook.region.africa': 'Африка',
      'thread.0.name': 'Возвышение империй',
      'thread.0.desc': 'Консолидация власти в древнем мире',
      'thread.1.name': 'Распространение мировых религий',
      'thread.1.desc': 'Как вера меняла цивилизации',
      'thread.2.name': 'Эпоха столкновений',
      'thread.2.desc': 'Когда полушария столкнулись друг с другом',
      'thread.3.name': 'Революции и нации',
      'thread.3.desc': 'Мир, перестроенный народным суверенитетом',
      'thread.4.name': 'Век войн',
      'thread.4.desc': 'Как современный мир ломался и собирался заново',
      'thread.5.name': 'Порядок холодной войны',
      'thread.5.desc': 'Власть, идеология и конфликты через посредников',
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
      'toast.threadStart': '📖 {name} — начало с {year}',
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

  function replaceTextAfterLeadingChild(node, text) {
    const leading = node.firstElementChild;
    if (!leading) {
      node.textContent = text;
      return;
    }
    Array.from(node.childNodes).forEach(child => {
      if (child !== leading) node.removeChild(child);
    });
    node.appendChild(document.createTextNode(text));
  }

  function setTextWithLeadingChild(selector, key) {
    document.querySelectorAll(selector).forEach(node => { replaceTextAfterLeadingChild(node, t(key)); });
  }

  function setIndexedText(selector, keys) {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (keys[index]) node.textContent = t(keys[index]);
    });
  }

  function setIndexedHtml(selector, keys) {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (keys[index]) node.innerHTML = t(keys[index]);
    });
  }

  function setIndexedTextWithLeadingChild(selector, keys) {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (keys[index]) replaceTextAfterLeadingChild(node, t(keys[index]));
    });
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
    setText('#exampleSection .section-label', 'landing.exampleLabel');
    setText('.example-year-era', 'landing.exampleEra');
    setHtml('.example-hook', 'landing.exampleHookHtml');
    setTextWithLeadingChild('.example-region-name.europe', 'landing.exampleRegionEurope');
    setTextWithLeadingChild('.example-region-name.asia', 'landing.exampleRegionAsia');
    setTextWithLeadingChild('.example-region-name.namerica', 'landing.exampleRegionAmericas');
    setTextWithLeadingChild('.example-region-name.africa', 'landing.exampleRegionAfrica');
    setIndexedText('.example-thesis', ['landing.exampleThesisEurope', 'landing.exampleThesisAsia', 'landing.exampleThesisAmericas', 'landing.exampleThesisAfrica']);
    setIndexedText('.example-event-line', ['landing.exampleEventEurope', 'landing.exampleEventAsia', 'landing.exampleEventAmericas', 'landing.exampleEventAfrica']);
    setHtml('.example-contrast', 'landing.exampleContrastHtml');
    setText('#exampleCta1453', 'landing.exampleCta');
    setText('#howSection .section-label', 'landing.howLabel');
    setIndexedText('#howSection .how-step-title', ['landing.how.0.title', 'landing.how.1.title', 'landing.how.2.title', 'landing.how.3.title']);
    setIndexedText('#howSection .how-step-desc', ['landing.how.0.desc', 'landing.how.1.desc', 'landing.how.2.desc', 'landing.how.3.desc']);
    setText('#forSection .section-label', 'landing.whoLabel');
    setIndexedText('#forSection .for-who', ['landing.who.0.who', 'landing.who.1.who', 'landing.who.2.who']);
    setIndexedText('#forSection .for-title', ['landing.who.0.title', 'landing.who.1.title', 'landing.who.2.title']);
    setIndexedText('#forSection .for-bullets li', ['landing.who.0.bullet.0', 'landing.who.0.bullet.1', 'landing.who.0.bullet.2', 'landing.who.1.bullet.0', 'landing.who.1.bullet.1', 'landing.who.1.bullet.2', 'landing.who.2.bullet.0', 'landing.who.2.bullet.1', 'landing.who.2.bullet.2']);
    setIndexedTextWithLeadingChild('.trust-item', ['landing.trust.0', 'landing.trust.1', 'landing.trust.2', 'landing.trust.3']);
    setText('.trust-disclaimer', 'landing.trustDisclaimer');
    setText('.threads-section-wrap .section-label', 'landing.threadsLabel');
    setText('.manifesto-eyebrow', 'landing.manifestoEyebrow');
    setHtml('.manifesto-heading', 'landing.manifestoHeadingHtml');
    setIndexedHtml('.manifesto-col p', ['landing.manifesto.0', 'landing.manifesto.1', 'landing.manifesto.2', 'landing.manifesto.3']);
    setIndexedHtml('.manifesto-pull-claim', ['landing.manifestoPull.0', 'landing.manifestoPull.1', 'landing.manifestoPull.2']);
    setText('.print-credit', 'landing.printCredit');
    setText('.footer-desc', 'landing.footerDesc');
    setText('.footer-mission', 'landing.footerMission');
    setIndexedText('.footer-col-title', ['landing.footerNavigate', 'landing.footerEducators']);
    setIndexedText('footer .footer-links a', ['landing.footerExplore', 'landing.footerExample', 'landing.howLabel', 'landing.whoLabel', 'landing.footerClassroom', 'landing.footerPrint', 'landing.footerGithub', 'landing.footerApiKey']);
    setIndexedText('.footer-meta span:not(.footer-version)', ['landing.footerCopyright', 'landing.footerLicense']);
    setText('.footer-disclaimer', 'landing.footerDisclaimer');
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
