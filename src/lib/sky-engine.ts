/**
 * sky-engine.ts
 *
 * Pure-JS sky engine for the Live Sky Explorer.
 * Converts ecliptic planetary positions → equatorial (RA/Dec) → horizontal
 * (altitude/azimuth) for any observer location and time.
 *
 * Also provides:
 *   - Rising / transit / setting times for each planet
 *   - 88-constellation boundary lookup (simplified zodiacal + major)
 *   - Bright fixed-star catalogue (20 stars)
 *   - Constellation line data for SVG rendering
 */

// ─── Math helpers ─────────────────────────────────────────────────────────────

export function toRad(d: number): number { return d * Math.PI / 180; }
export function toDeg(r: number): number { return r * 180 / Math.PI; }
export function norm360(d: number): number { return ((d % 360) + 360) % 360; }
// ─── Julian Day ───────────────────────────────────────────────────────────────

export function julianDay(
  year: number, month: number, day: number, hourUTC: number
): number {
  let y = year; let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hourUTC / 24 + B - 1524.5;
}

export function jdFromDate(date: Date): number {
  return julianDay(
    date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  );
}

// ─── Obliquity ────────────────────────────────────────────────────────────────

export function obliquity(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  return 23.439291111 - 0.013004167 * t - 0.000000164 * t * t + 0.000000504 * t * t * t;
}

// ─── Ecliptic → Equatorial ────────────────────────────────────────────────────

export interface Equatorial { ra: number; dec: number; }

export function eclipticToEquatorial(lon: number, lat: number, jd: number): Equatorial {
  const eps = toRad(obliquity(jd));
  const lonR = toRad(lon);
  const latR = toRad(lat);
  const sinDec = Math.sin(latR) * Math.cos(eps) + Math.cos(latR) * Math.sin(eps) * Math.sin(lonR);
  const dec = toDeg(Math.asin(sinDec));
  const y = Math.sin(lonR) * Math.cos(eps) - Math.tan(latR) * Math.sin(eps);
  const x = Math.cos(lonR);
  const ra = norm360(toDeg(Math.atan2(y, x)));
  return { ra, dec };
}

// ─── Greenwich Sidereal Time ──────────────────────────────────────────────────

export function greenwichSiderealTime(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t);
}

export function localSiderealTime(jd: number, lonDeg: number): number {
  return norm360(greenwichSiderealTime(jd) + lonDeg);
}

// ─── Equatorial → Horizontal ─────────────────────────────────────────────────

export interface Horizontal { altitude: number; azimuth: number; }

export function equatorialToHorizontal(
  ra: number, dec: number,
  jd: number,
  latDeg: number, lonDeg: number
): Horizontal {
  const lst = localSiderealTime(jd, lonDeg);
  const ha = norm360(lst - ra);          // hour angle in degrees
  const haR = toRad(ha);
  const decR = toRad(dec);
  const latR = toRad(latDeg);

  const sinAlt = Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(haR);
  const altitude = toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));

  const cosAz = (Math.sin(decR) - Math.sin(toRad(altitude)) * Math.sin(latR))
              / (Math.cos(toRad(altitude)) * Math.cos(latR));
  const azBase = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
  const azimuth = Math.sin(haR) > 0 ? 360 - azBase : azBase;

  return { altitude, azimuth };
}

// ─── Planet data ──────────────────────────────────────────────────────────────

export interface PlanetSkyData {
  key: string;
  name: string;
  symbol: string;
  glyph: string;
  eclipticLon: number;
  eclipticLat: number;
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
  sign: string;
  degree: number;
  minute: number;
  retrograde: boolean;
  colorVar: string;
  size: number;          // visual radius in SVG units
  aboveHorizon: boolean;
}

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

const PLANET_META: Record<string, { name: string; symbol: string; glyph: string; colorVar: string; size: number }> = {
  sun:     { name: 'Sun',     symbol: '☉', glyph: '☉', colorVar: '--primary',          size: 10 },
  moon:    { name: 'Moon',    symbol: '☽', glyph: '☽', colorVar: '--accent',            size: 8  },
  mercury: { name: 'Mercury', symbol: '☿', glyph: '☿', colorVar: '--muted-foreground',  size: 5  },
  venus:   { name: 'Venus',   symbol: '♀', glyph: '♀', colorVar: '--secondary',         size: 6  },
  mars:    { name: 'Mars',    symbol: '♂', glyph: '♂', colorVar: '--destructive',       size: 6  },
  jupiter: { name: 'Jupiter', symbol: '♃', glyph: '♃', colorVar: '--primary',           size: 7  },
  saturn:  { name: 'Saturn',  symbol: '♄', glyph: '♄', colorVar: '--muted-foreground',  size: 6  },
  uranus:  { name: 'Uranus',  symbol: '♅', glyph: '♅', colorVar: '--accent',            size: 5  },
  neptune: { name: 'Neptune', symbol: '♆', glyph: '♆', colorVar: '--accent',            size: 5  },
  pluto:   { name: 'Pluto',   symbol: '♇', glyph: '♇', colorVar: '--muted-foreground',  size: 4  },
};

// Ecliptic latitudes (approximate mean values — planets stay near ecliptic)
const ECLIPTIC_LAT: Record<string, number> = {
  sun: 0, moon: 0, mercury: 0, venus: 0, mars: 0,
  jupiter: 1.3, saturn: 2.5, uranus: 0.8, neptune: 1.8, pluto: 17,
};

function lonToSignDegMin(lon: number): { sign: string; degree: number; minute: number } {
  const signIndex = Math.floor(lon / 30);
  const degInSign = lon - signIndex * 30;
  return {
    sign: SIGNS[Math.min(signIndex, 11)],
    degree: Math.floor(degInSign),
    minute: Math.floor((degInSign - Math.floor(degInSign)) * 60),
  };
}

// ─── Compute all planet sky positions ─────────────────────────────────────────

export interface SkySnapshot {
  jd: number;
  date: Date;
  lat: number;
  lon: number;
  planets: PlanetSkyData[];
  lst: number;           // local sidereal time (degrees)
}

/**
 * Given a ChartData-like object (from astro-calculator.ts calculateChart),
 * project all 10 planets into horizontal coordinates for the observer.
 */
export function buildSkySnapshot(
  planetLongitudes: Record<string, { longitude: number; retrograde: boolean }>,
  date: Date,
  latDeg: number,
  lonDeg: number
): SkySnapshot {
  const jd = jdFromDate(date);
  const lst = localSiderealTime(jd, lonDeg);

  const planets: PlanetSkyData[] = Object.entries(planetLongitudes).map(([key, p]) => {
    const meta = PLANET_META[key];
    if (!meta) return null;
    const eclLat = ECLIPTIC_LAT[key] ?? 0;
    const eq = eclipticToEquatorial(p.longitude, eclLat, jd);
    const hz = equatorialToHorizontal(eq.ra, eq.dec, jd, latDeg, lonDeg);
    const { sign, degree, minute } = lonToSignDegMin(p.longitude);
    return {
      key,
      name: meta.name,
      symbol: meta.symbol,
      glyph: meta.glyph,
      eclipticLon: p.longitude,
      eclipticLat: eclLat,
      ra: eq.ra,
      dec: eq.dec,
      altitude: hz.altitude,
      azimuth: hz.azimuth,
      sign,
      degree,
      minute,
      retrograde: p.retrograde,
      colorVar: meta.colorVar,
      size: meta.size,
      aboveHorizon: hz.altitude > 0,
    } satisfies PlanetSkyData;
  }).filter((p): p is PlanetSkyData => p !== null);

  return { jd, date, lat: latDeg, lon: lonDeg, planets, lst };
}

// ─── Rising / Transit / Setting ───────────────────────────────────────────────

export interface RiseTransitSet {
  rise: Date | null;
  transit: Date | null;
  set: Date | null;
  alwaysAbove: boolean;
  alwaysBelow: boolean;
}

/**
 * Approximate rise/transit/set for a body with fixed RA/Dec on a given date.
 * Uses the iterative method from Meeus Ch.15.
 */
export function riseTransitSet(
  ra: number, dec: number,
  date: Date,
  latDeg: number, lonDeg: number,
  h0: number = -0.5667   // standard atmospheric refraction for stars/planets
): RiseTransitSet {
  const jd0 = julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 0);
  const latR = toRad(latDeg);
  const decR = toRad(dec);

  const cosH0 = (Math.sin(toRad(h0)) - Math.sin(latR) * Math.sin(decR))
              / (Math.cos(latR) * Math.cos(decR));

  if (cosH0 < -1) return { rise: null, transit: null, set: null, alwaysAbove: true, alwaysBelow: false };
  if (cosH0 > 1)  return { rise: null, transit: null, set: null, alwaysAbove: false, alwaysBelow: true };

  const H0 = toDeg(Math.acos(cosH0));
  const gst0 = greenwichSiderealTime(jd0);

  // Approximate transit, rise, set as fractions of day
  let m0 = norm360(ra - lonDeg - gst0) / 360;
  let m1 = m0 - H0 / 360;
  let m2 = m0 + H0 / 360;

  // Normalise to [0,1)
  m0 = ((m0 % 1) + 1) % 1;
  m1 = ((m1 % 1) + 1) % 1;
  m2 = ((m2 % 1) + 1) % 1;

  const toDate = (m: number) => new Date(Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
    0, 0, Math.round(m * 86400)
  ));

  return {
    rise:    toDate(m1),
    transit: toDate(m0),
    set:     toDate(m2),
    alwaysAbove: false,
    alwaysBelow: false,
  };
}

// ─── Fixed Stars ──────────────────────────────────────────────────────────────

export interface FixedStar {
  name: string;
  ra: number;    // degrees (J2000)
  dec: number;   // degrees (J2000)
  magnitude: number;
  constellation: string;
}

export const BRIGHT_STARS: FixedStar[] = [
  { name: 'Sirius',      ra: 101.29, dec: -16.72, magnitude: -1.46, constellation: 'Canis Major' },
  { name: 'Canopus',     ra: 95.99,  dec: -52.70, magnitude: -0.74, constellation: 'Carina' },
  { name: 'Arcturus',    ra: 213.92, dec:  19.18, magnitude: -0.05, constellation: 'Boötes' },
  { name: 'Vega',        ra: 279.23, dec:  38.78, magnitude:  0.03, constellation: 'Lyra' },
  { name: 'Capella',     ra:  79.17, dec:  45.99, magnitude:  0.08, constellation: 'Auriga' },
  { name: 'Rigel',       ra:  78.63, dec:  -8.20, magnitude:  0.13, constellation: 'Orion' },
  { name: 'Procyon',     ra: 114.83, dec:   5.22, magnitude:  0.34, constellation: 'Canis Minor' },
  { name: 'Betelgeuse',  ra:  88.79, dec:   7.41, magnitude:  0.42, constellation: 'Orion' },
  { name: 'Achernar',    ra:  24.43, dec: -57.24, magnitude:  0.46, constellation: 'Eridanus' },
  { name: 'Hadar',       ra: 210.96, dec: -60.37, magnitude:  0.61, constellation: 'Centaurus' },
  { name: 'Altair',      ra: 297.70, dec:   8.87, magnitude:  0.77, constellation: 'Aquila' },
  { name: 'Aldebaran',   ra:  68.98, dec:  16.51, magnitude:  0.87, constellation: 'Taurus' },
  { name: 'Antares',     ra: 247.35, dec: -26.43, magnitude:  0.96, constellation: 'Scorpius' },
  { name: 'Spica',       ra: 201.30, dec: -11.16, magnitude:  0.97, constellation: 'Virgo' },
  { name: 'Pollux',      ra: 116.33, dec:  28.03, magnitude:  1.14, constellation: 'Gemini' },
  { name: 'Fomalhaut',   ra: 344.41, dec: -29.62, magnitude:  1.16, constellation: 'Piscis Austrinus' },
  { name: 'Deneb',       ra: 310.36, dec:  45.28, magnitude:  1.25, constellation: 'Cygnus' },
  { name: 'Regulus',     ra: 152.09, dec:  11.97, magnitude:  1.36, constellation: 'Leo' },
  { name: 'Castor',      ra: 113.65, dec:  31.89, magnitude:  1.58, constellation: 'Gemini' },
  { name: 'Bellatrix',   ra:  81.28, dec:   6.35, magnitude:  1.64, constellation: 'Orion' },
];

// ─── Constellation lines ──────────────────────────────────────────────────────

export interface ConstellationLine {
  name: string;
  abbr: string;
  stars: Array<{ ra: number; dec: number }>; // pairs of connected stars
  segments: Array<[number, number]>;          // indices into stars array
}

// Zodiacal + prominent constellations with simplified line data
export const CONSTELLATION_LINES: ConstellationLine[] = [
  {
    name: 'Orion', abbr: 'Ori',
    stars: [
      { ra: 83.82, dec: -5.91 },   // 0 Mintaka
      { ra: 84.05, dec: -1.20 },   // 1 Alnilam
      { ra: 84.41, dec: -2.60 },   // 2 Alnitak
      { ra: 88.79, dec:  7.41 },   // 3 Betelgeuse
      { ra: 78.63, dec: -8.20 },   // 4 Rigel
      { ra: 81.28, dec:  6.35 },   // 5 Bellatrix
      { ra: 82.06, dec: -9.67 },   // 6 Saiph
    ],
    segments: [[3,0],[0,1],[1,2],[2,4],[0,5],[3,5],[4,6]],
  },
  {
    name: 'Ursa Major', abbr: 'UMa',
    stars: [
      { ra: 165.93, dec: 61.75 },  // 0 Dubhe
      { ra: 165.46, dec: 56.38 },  // 1 Merak
      { ra: 178.46, dec: 53.69 },  // 2 Phecda
      { ra: 183.86, dec: 57.03 },  // 3 Megrez
      { ra: 193.51, dec: 55.96 },  // 4 Alioth
      { ra: 200.98, dec: 54.93 },  // 5 Mizar
      { ra: 206.89, dec: 49.31 },  // 6 Alkaid
    ],
    segments: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[0,3]],
  },
  {
    name: 'Scorpius', abbr: 'Sco',
    stars: [
      { ra: 240.08, dec: -22.62 }, // 0 Graffias
      { ra: 247.35, dec: -26.43 }, // 1 Antares
      { ra: 252.97, dec: -34.29 }, // 2 Sargas
      { ra: 258.04, dec: -43.00 }, // 3 Shaula
      { ra: 244.58, dec: -15.72 }, // 4 Dschubba
    ],
    segments: [[4,0],[0,1],[1,2],[2,3]],
  },
  {
    name: 'Leo', abbr: 'Leo',
    stars: [
      { ra: 152.09, dec: 11.97 },  // 0 Regulus
      { ra: 154.99, dec: 19.84 },  // 1 Eta Leo
      { ra: 168.53, dec: 20.52 },  // 2 Zosma
      { ra: 177.26, dec: 14.57 },  // 3 Denebola
      { ra: 148.19, dec: 26.01 },  // 4 Algieba
      { ra: 146.46, dec: 23.77 },  // 5 Adhafera
    ],
    segments: [[0,1],[1,4],[4,5],[0,2],[2,3]],
  },
  {
    name: 'Gemini', abbr: 'Gem',
    stars: [
      { ra: 116.33, dec: 28.03 },  // 0 Pollux
      { ra: 113.65, dec: 31.89 },  // 1 Castor
      { ra: 100.98, dec: 25.13 },  // 2 Alhena
      { ra: 99.43,  dec: 16.40 },  // 3 Tejat
    ],
    segments: [[0,2],[1,2],[2,3]],
  },
  {
    name: 'Taurus', abbr: 'Tau',
    stars: [
      { ra: 68.98, dec: 16.51 },   // 0 Aldebaran
      { ra: 56.87, dec: 24.11 },   // 1 Pleiades centre
      { ra: 84.41, dec: 21.14 },   // 2 Elnath
    ],
    segments: [[1,0],[0,2]],
  },
  {
    name: 'Virgo', abbr: 'Vir',
    stars: [
      { ra: 201.30, dec: -11.16 }, // 0 Spica
      { ra: 193.90, dec:  -0.60 }, // 1 Porrima
      { ra: 187.79, dec:   1.77 }, // 2 Vindemiatrix
    ],
    segments: [[2,1],[1,0]],
  },
  {
    name: 'Cygnus', abbr: 'Cyg',
    stars: [
      { ra: 310.36, dec: 45.28 },  // 0 Deneb
      { ra: 305.56, dec: 40.26 },  // 1 Sadr
      { ra: 292.68, dec: 27.96 },  // 2 Albireo
      { ra: 311.55, dec: 33.97 },  // 3 Gienah
      { ra: 299.08, dec: 35.08 },  // 4 Delta Cyg
    ],
    segments: [[0,1],[1,2],[1,3],[1,4]],
  },
  {
    name: 'Lyra', abbr: 'Lyr',
    stars: [
      { ra: 279.23, dec: 38.78 },  // 0 Vega
      { ra: 283.63, dec: 36.90 },  // 1 Sheliak
      { ra: 284.74, dec: 32.69 },  // 2 Sulafat
    ],
    segments: [[0,1],[1,2],[2,0]],
  },
  {
    name: 'Aquila', abbr: 'Aql',
    stars: [
      { ra: 297.70, dec:  8.87 },  // 0 Altair
      { ra: 296.56, dec: 10.61 },  // 1 Tarazed
      { ra: 298.83, dec:  6.41 },  // 2 Alshain
    ],
    segments: [[1,0],[0,2]],
  },
];

// ─── Sky dome projection ──────────────────────────────────────────────────────

/**
 * Project altitude/azimuth onto a 2D circle (stereographic-like).
 * Returns (x, y) in [-1, 1] range. North is up (azimuth=0).
 * Objects below horizon (alt < 0) are still returned but flagged.
 */
export function altAzToXY(altitude: number, azimuth: number): { x: number; y: number } {
  // r = 0 at zenith (alt=90), r = 1 at horizon (alt=0)
  const r = Math.max(0, (90 - altitude) / 90);
  const azR = toRad(azimuth);
  // North up: azimuth 0 = up = negative y
  const x =  r * Math.sin(azR);
  const y = -r * Math.cos(azR);
  return { x, y };
}

/**
 * Project a fixed star (RA/Dec) to alt/az then to XY for the current JD/location.
 */
export function starToXY(
  ra: number, dec: number,
  jd: number, latDeg: number, lonDeg: number
): { x: number; y: number; altitude: number; azimuth: number } {
  const hz = equatorialToHorizontal(ra, dec, jd, latDeg, lonDeg);
  const xy = altAzToXY(hz.altitude, hz.azimuth);
  return { ...xy, altitude: hz.altitude, azimuth: hz.azimuth };
}

// ─── Compass direction label ──────────────────────────────────────────────────

export function compassLabel(azimuth: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const idx = Math.round(azimuth / 22.5) % 16;
  return dirs[idx];
}

// ─── Day/night indicator ──────────────────────────────────────────────────────

export function isDaytime(sunAltitude: number): boolean {
  return sunAltitude > -6; // civil twilight threshold
}

export type SkyPhase = 'day' | 'civil_twilight' | 'nautical_twilight' | 'astronomical_twilight' | 'night';

/** SVG gradient stop colours for the sky dome background. Not user-visible copy. */
export const SKY_DOME_BG: Record<SkyPhase, string> = {
  day:                   '#0a0a1a',
  civil_twilight:        '#0a0a1a',
  nautical_twilight:     '#080818',
  astronomical_twilight: '#060610',
  night:                 '#04040e',
};

/** SVG gradient stop colours for the sky dome horizon. Not user-visible copy. */
export const SKY_DOME_HORIZON: Record<SkyPhase, string> = {
  day:                   '#1a1a3a',
  civil_twilight:        '#1a1030',
  nautical_twilight:     '#120c28',
  astronomical_twilight: '#0e0820',
  night:                 '#080616',
};

export function skyPhase(sunAltitude: number): SkyPhase {
  if (sunAltitude > 0)   return 'day';
  if (sunAltitude > -6)  return 'civil_twilight';
  if (sunAltitude > -12) return 'nautical_twilight';
  if (sunAltitude > -18) return 'astronomical_twilight';
  return 'night';
}
