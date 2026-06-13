const COLORS = ['#c0392b', '#16a085', '#2980b9', '#d4ac0d', '#8e6bbd'];

const PROFILES = [
  {
    id: 'ancient',
    label: 'Ancient world regions',
    maxYear: 500,
    eventsPerRegion: 2,
    regions: [
      region('mediterranean', 'Mediterranean & Europe', 'Rome, Greece, and neighboring societies', 'M', 0),
      region('west_south_asia', 'West, Central & South Asia', 'Persia, Mesopotamia, the steppe, and India', 'W', 1),
      region('east_asia', 'East Asia', 'China, Korea, Japan, and adjacent societies', 'E', 2),
      region('africa', 'Africa', 'North, West, East, Central, and Southern Africa', 'A', 3),
      region('americas_pacific', 'Americas & Pacific', 'American civilizations and Pacific societies', 'P', 4),
    ],
  },
  {
    id: 'medieval',
    label: 'Medieval world regions',
    maxYear: 1499,
    eventsPerRegion: 2,
    regions: [
      region('europe_mediterranean', 'Europe & Mediterranean', 'Latin, Byzantine, and neighboring worlds', 'E', 0),
      region('islamic_world', 'Islamic World & Central Asia', 'Middle East, North Africa, Persia, and the steppe', 'I', 1),
      region('south_east_asia', 'South & East Asia', 'India, China, Korea, Japan, and Southeast Asia', 'S', 2),
      region('africa', 'Sub-Saharan Africa', 'West, East, Central, and Southern Africa', 'A', 3),
      region('americas_pacific', 'Americas & Pacific', 'American civilizations and Pacific societies', 'P', 4),
    ],
  },
  {
    id: 'early-modern',
    label: 'Early modern world regions',
    maxYear: 1800,
    eventsPerRegion: 2,
    regions: [
      region('europe', 'Europe', 'Atlantic, Mediterranean, and Eastern Europe', 'E', 0),
      region('middle_south_asia', 'Middle East & South Asia', 'Ottoman, Persian, Central Asian, and Indian worlds', 'M', 1),
      region('east_asia_pacific', 'East Asia & Pacific', 'China, Japan, Korea, Southeast Asia, and Oceania', 'E', 2),
      region('africa', 'Africa', 'North, West, East, Central, and Southern Africa', 'A', 3),
      region('americas', 'The Americas', 'Indigenous, colonial, and revolutionary societies', 'A', 4),
    ],
  },
  {
    id: 'modern',
    label: 'Modern continental regions',
    maxYear: Infinity,
    eventsPerRegion: 3,
    regions: [
      region('europe', 'Europe', 'Western & Eastern Europe', '\u{1F3F0}', 0),
      region('asia', 'Asia', 'East, South, Central Asia & Middle East', '\u{1F3EF}', 1),
      region('namerica', 'The Americas', 'North, Central & South America', '\u{1F30E}', 2),
      region('africa', 'Africa', 'Sub-Saharan & North Africa', '\u{1F30D}', 3),
    ],
  },
];

export function getRegionProfile(year) {
  return PROFILES.find(profile => year <= profile.maxYear);
}

export function getRegionProfileForPeriod(startYear, endYear) {
  let midpoint = Math.trunc((startYear + endYear) / 2);
  if (midpoint === 0) midpoint = endYear > 0 ? 1 : -1;
  return getRegionProfile(midpoint);
}

export function publicRegionProfile(profile) {
  return {
    id: profile.id,
    label: profile.label,
    regions: profile.regions.map(({ id, label, sub, icon, color }) => ({
      id,
      label,
      sub,
      icon,
      color,
    })),
  };
}

export function setRegionProfileHeader(res, profile) {
  res.setHeader?.(
    'X-HistoryLens-Region-Profile',
    encodeURIComponent(JSON.stringify(publicRegionProfile(profile)))
  );
}

function region(id, label, sub, icon, colorIndex) {
  return { id, label, sub, icon, color: COLORS[colorIndex] };
}
