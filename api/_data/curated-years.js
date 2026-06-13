const CURATED_YEARS = new Map([
  [2020, {
    reviewedAt: '2026-06-13',
    sourceName: 'Wikipedia contributors',
    sourceUrl: 'https://en.wikipedia.org/wiki/2020',
    data: {
      year_label: '2020 CE',
      era_description: 'Pandemic Shock and Political Strain',
      hook_moment: 'A pandemic halted ordinary life across continents while wars, protests, elections, and constitutional ruptures kept reshaping political power.',
      global_context: 'COVID-19 synchronized a worldwide public-health and economic crisis without producing a unified political response. Governments expanded emergency authority as social movements, elections, and regional wars exposed deep fractures beneath the shared emergency.',
      global_signals: {
        war_intensity: 'High',
        political_fragmentation: 'Rising',
        economic_pressure: 'Critical',
        trade_activity: 'Declining',
        ideological_tension: 'High',
      },
      cross_region: {
        contrast: 'East Asia first confronted the outbreak and restored production earlier, while Europe and the Americas endured repeated waves and sharper political polarization. Africa recorded a younger demographic profile but absorbed severe economic disruption alongside conflicts in Ethiopia and the Sahel.',
        tensions: [
          {
            regions: ['europe', 'asia'],
            note: 'Medical supply dependence and competing pandemic narratives intensified European scrutiny of China.',
          },
          {
            regions: ['namerica', 'africa'],
            note: 'Global recession and unequal access to fiscal support magnified economic pressure across African states and the Americas.',
          },
          {
            regions: ['europe', 'africa'],
            note: 'Migration policy and conflicts around the Mediterranean reinforced political strain between the two regions.',
          },
        ],
      },
      regions: {
        europe: {
          state: 'Locked down and divided',
          thesis_headline: 'Crisis Deepened Political Fault Lines',
          thesis_argument: 'The pandemic forced unprecedented restrictions and collective European spending, yet Brexit and democratic confrontation in Belarus exposed persistent fractures in the regional order.',
          events: [
            {
              year: '2020',
              title: 'COVID-19 lockdowns transform Europe',
              description: 'European governments imposed broad restrictions as the pandemic overwhelmed health systems, triggering a historic recession and emergency fiscal intervention.',
              rank: 'primary',
            },
            {
              year: '2020',
              title: 'United Kingdom leaves the European Union',
              description: 'The United Kingdom formally withdrew from the European Union on January 31, cementing the bloc\'s first loss of a member state.',
              rank: 'secondary',
            },
            {
              year: '2020',
              title: 'Belarus election triggers mass protests',
              description: 'A disputed presidential election on August 9 triggered sustained demonstrations and repression, exposing the fragility of Alexander Lukashenko\'s rule.',
              rank: 'secondary',
            },
          ],
          key_figures: ['Angela Merkel', 'Boris Johnson', 'Sviatlana Tsikhanouskaya'],
          significance: 'Europe responded with deeper fiscal cooperation, but the year also entrenched disputes over sovereignty, democratic legitimacy, and the limits of continental unity.',
        },
        asia: {
          state: 'Pandemic managed, tensions sharpened',
          thesis_headline: 'State Capacity Met Strategic Conflict',
          thesis_argument: 'Asian governments deployed sharply different pandemic controls while Beijing tightened authority in Hong Kong and war redrew the security landscape of the South Caucasus.',
          events: [
            {
              year: '2020',
              title: 'Wuhan lockdown signals global emergency',
              description: 'China placed Wuhan under lockdown on January 23 as COVID-19 spread, introducing containment measures later adopted across much of the world.',
              rank: 'primary',
            },
            {
              year: '2020',
              title: 'Second Nagorno-Karabakh War',
              description: 'Fighting erupted on September 27 and ended with a November 10 ceasefire that restored substantial territory to Azerbaijani control and deployed Russian peacekeepers.',
              rank: 'secondary',
            },
            {
              year: '2020',
              title: 'Hong Kong national security law enacted',
              description: 'China imposed a national security law on Hong Kong on June 30, dismantling much of the political space used by the territory\'s opposition movement.',
              rank: 'secondary',
            },
          ],
          key_figures: ['Xi Jinping', 'Ilham Aliyev', 'Nikol Pashinyan'],
          significance: 'The year demonstrated the reach of centralized state power while territorial conflict and political consolidation altered regional balances beyond the pandemic.',
        },
        namerica: {
          state: 'Polarized under pressure',
          thesis_headline: 'Pandemic and Protest Reordered Politics',
          thesis_argument: 'The United States became an epicenter of both the pandemic and a mass racial-justice movement, while a bitter election tested institutional legitimacy across the region\'s dominant power.',
          events: [
            {
              year: '2020',
              title: 'COVID-19 devastates the Americas',
              description: 'The pandemic produced severe mortality and economic contraction across North, Central, and South America, exposing unequal health systems and social protection.',
              rank: 'primary',
            },
            {
              year: '2020',
              title: 'George Floyd protests spread internationally',
              description: 'George Floyd\'s murder by a Minneapolis police officer on May 25 triggered mass protests against racism and police violence throughout the United States and abroad.',
              rank: 'secondary',
            },
            {
              year: '2020',
              title: 'Joe Biden wins the United States election',
              description: 'Joe Biden defeated Donald Trump in the November 3 presidential election, but false fraud claims destabilized confidence in the transfer of power.',
              rank: 'secondary',
            },
          ],
          key_figures: ['Joe Biden', 'Donald Trump', 'George Floyd'],
          significance: 'Public-health failure, racial-justice mobilization, and electoral distrust made political legitimacy the central regional struggle of the year.',
        },
        africa: {
          state: 'Economically strained, conflicts escalating',
          thesis_headline: 'Resilience Could Not Contain Conflict',
          thesis_argument: 'Many African states limited early pandemic mortality through rapid public-health measures, but recession and new wars intensified humanitarian and political pressure.',
          events: [
            {
              year: '2020',
              title: 'Tigray War begins in Ethiopia',
              description: 'Conflict erupted in November between Ethiopia\'s federal government and the Tigray People\'s Liberation Front, triggering mass displacement and a prolonged humanitarian crisis.',
              rank: 'primary',
            },
            {
              year: '2020',
              title: 'Sudan signs the Juba Peace Agreement',
              description: 'Sudan\'s transitional government and several armed groups signed the Juba Peace Agreement on October 3, seeking to end conflicts in Darfur and other regions.',
              rank: 'secondary',
            },
            {
              year: '2020',
              title: 'African economies contract under COVID-19',
              description: 'Border closures, commodity shocks, and reduced tourism imposed the continent\'s first recession in decades despite comparatively rapid public-health coordination.',
              rank: 'secondary',
            },
          ],
          key_figures: ['Abiy Ahmed', 'Abdel Fattah al-Burhan', 'Tedros Adhanom Ghebreyesus'],
          significance: 'The pandemic exposed economic vulnerability while wars and fragile transitions determined whether public-health resilience could translate into political stability.',
        },
      },
    },
  }],
]);

export function getCuratedYear(year) {
  return CURATED_YEARS.get(year) || null;
}
