/**
 * Synastry (Romantic Connection) Engine
 * Calculates cross-chart aspects, composite midpoints, and compatibility scores.
 */

import type { ChartData, PlanetPosition } from './astro-calculator';
import { getArchetype, getGrowthEdges } from './synastry-extras';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SynastryAspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  angle: number;
  score: number;
  dimension: ('love' | 'stability' | 'sexual' | 'communication' | 'longterm')[];
  description: string;
}

export interface CompatibilityScores {
  love: number;
  stability: number;
  sexual: number;
  communication: number;
  longterm: number;
  overall: number;
}

export interface SynastryResult {
  aspects: SynastryAspect[];
  scores: CompatibilityScores;
  highlights: string[];
  challenges: string[];
  summary: string;
  elementSynergy: string;
  venusMarsNote: string;
  moonSunNote: string;
  communicationNote: string;
  compositeSun: string;
  compositeMoon: string;
  relationshipPatterns: string[];
  timingInsights: string[];
  archetype: string;
  archetypeDescription: string;
  growthEdges: string[];
}

const ASPECT_DEFS: { angle: number; name: string; orb: number; harmony: number }[] = [
  { angle: 0,   name: 'Conjunction', orb: 8, harmony: 1    },
  { angle: 60,  name: 'Sextile',     orb: 6, harmony: 0.7  },
  { angle: 90,  name: 'Square',      orb: 7, harmony: -0.6 },
  { angle: 120, name: 'Trine',       orb: 8, harmony: 0.9  },
  { angle: 150, name: 'Quincunx',    orb: 3, harmony: -0.3 },
  { angle: 180, name: 'Opposition',  orb: 8, harmony: -0.5 },
];

type PlanetKey = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'ascendant';

interface PairWeight {
  love?: number;
  stability?: number;
  sexual?: number;
  communication?: number;
  longterm?: number;
}

const PAIR_WEIGHTS: Record<string, PairWeight> = {
  'venus-mars':      { love: 3, sexual: 3 },
  'mars-venus':      { love: 3, sexual: 3 },
  'sun-moon':        { love: 2.5, longterm: 3 },
  'moon-sun':        { love: 2.5, longterm: 3 },
  'moon-moon':       { love: 2, stability: 2.5, longterm: 2 },
  'sun-sun':         { stability: 2, longterm: 2 },
  'venus-venus':     { love: 2, stability: 1.5 },
  'mars-mars':       { sexual: 2, stability: 1 },
  'venus-jupiter':   { love: 2, longterm: 1.5 },
  'jupiter-venus':   { love: 2, longterm: 1.5 },
  'moon-venus':      { love: 2, stability: 1.5 },
  'venus-moon':      { love: 2, stability: 1.5 },
  'sun-venus':       { love: 2, sexual: 1 },
  'venus-sun':       { love: 2, sexual: 1 },
  'mars-pluto':      { sexual: 2.5 },
  'pluto-mars':      { sexual: 2.5 },
  'saturn-moon':     { stability: 2.5, longterm: 2.5 },
  'moon-saturn':     { stability: 2.5, longterm: 2.5 },
  'saturn-sun':      { stability: 2, longterm: 2.5 },
  'sun-saturn':      { stability: 2, longterm: 2.5 },
  'jupiter-moon':    { love: 1.5, longterm: 1.5 },
  'moon-jupiter':    { love: 1.5, longterm: 1.5 },
  'ascendant-venus': { love: 1.5, sexual: 2 },
  'venus-ascendant': { love: 1.5, sexual: 2 },
  'ascendant-mars':  { sexual: 2.5 },
  'mars-ascendant':  { sexual: 2.5 },
  'neptune-venus':   { love: 1.5 },
  'venus-neptune':   { love: 1.5 },
  'pluto-venus':     { love: 1.5, sexual: 2 },
  'venus-pluto':     { love: 1.5, sexual: 2 },
  // Communication pairs
  'mercury-mercury': { communication: 3 },
  'mercury-sun':     { communication: 2, stability: 1 },
  'sun-mercury':     { communication: 2, stability: 1 },
  'mercury-moon':    { communication: 2.5, love: 1 },
  'moon-mercury':    { communication: 2.5, love: 1 },
  'mercury-venus':   { communication: 2, love: 1 },
  'venus-mercury':   { communication: 2, love: 1 },
  'mercury-jupiter': { communication: 2, longterm: 1 },
  'jupiter-mercury': { communication: 2, longterm: 1 },
  'mercury-uranus':  { communication: 1.5 },
  'uranus-mercury':  { communication: 1.5 },
  'mercury-saturn':  { communication: 1.5, stability: 1 },
  'saturn-mercury':  { communication: 1.5, stability: 1 },
};

const ASPECT_DESCRIPTIONS: Record<string, Record<string, string>> = {
  'venus-mars': {
    Conjunction: "Magnetic physical attraction — you spark each other's desire naturally.",
    Trine: "Effortless romantic chemistry; affection and passion flow without friction.",
    Sextile: "Playful attraction with good creative and romantic energy between you.",
    Square: "Intense push-pull tension — desire is strong but friction can arise.",
    Opposition: "Powerful attraction through polarity; you balance and challenge each other.",
  },
  'sun-moon': {
    Conjunction: "Deep soul recognition — your core identities and emotional needs align beautifully.",
    Trine: "Natural emotional harmony; you understand each other's inner world intuitively.",
    Sextile: "Warm, supportive connection with easy emotional communication.",
    Square: "Core needs can clash, requiring conscious effort to meet each other halfway.",
    Opposition: "Complementary energies that attract — you each offer what the other lacks.",
  },
  'moon-moon': {
    Conjunction: "Emotional mirroring — you feel each other's moods almost telepathically.",
    Trine: "Emotional ease and comfort; home and family life feel natural together.",
    Sextile: "Friendly emotional rapport with good mutual understanding.",
    Square: "Emotional rhythms differ; learning each other's needs takes patience.",
    Opposition: "Contrasting emotional styles that can complement or create distance.",
  },
  'venus-venus': {
    Conjunction: "Shared tastes, values, and aesthetics — you love the same things.",
    Trine: "Harmonious values and a shared sense of beauty and pleasure.",
    Sextile: "Compatible tastes with room for each other's individuality.",
    Square: "Different love languages; growth comes from appreciating your differences.",
    Opposition: "Contrasting values that can attract or create friction over time.",
  },
  'saturn-moon': {
    Conjunction: "Saturn person offers structure and security; Moon person feels held.",
    Trine: "Stable, committed emotional bond — this aspect supports long-term loyalty.",
    Sextile: "Grounding emotional connection with a sense of reliability.",
    Square: "Saturn's seriousness can feel restrictive to Moon's emotional needs.",
    Opposition: "Tension between freedom and commitment; requires honest communication.",
  },
  'mars-pluto': {
    Conjunction: "Intense, transformative sexual magnetism — deeply compelling energy.",
    Trine: "Powerful shared drive and passionate, regenerative sexual chemistry.",
    Sextile: "Strong physical chemistry with a sense of mutual empowerment.",
    Square: "Explosive intensity — passion is high but power struggles can arise.",
    Opposition: "Magnetic yet volatile; the attraction is undeniable but needs boundaries.",
  },
};
function getAspectDescription(p1: string, p2: string, aspectType: string): string {
  const key1 = p1 + '-' + p2;
  const key2 = p2 + '-' + p1;
  // eslint-disable-next-line security/detect-object-injection
  const map = ASPECT_DESCRIPTIONS[key1] || ASPECT_DESCRIPTIONS[key2];
  // eslint-disable-next-line security/detect-object-injection
  if (map && map[aspectType]) return map[aspectType];
  const generics: Record<string, string> = {
    Conjunction: "Your " + p1 + " and partner's " + p2 + " merge — this placement intensifies shared themes.",
    Trine: 'A flowing, supportive connection between your ' + p1 + ' and their ' + p2 + '.',
    Sextile: 'Harmonious opportunity energy between your ' + p1 + ' and their ' + p2 + '.',
    Square: 'Creative tension between your ' + p1 + ' and their ' + p2 + ' — growth through challenge.',
    Opposition: 'Complementary polarity between your ' + p1 + ' and their ' + p2 + '.',
    Quincunx: 'An adjustment aspect — your ' + p1 + ' and their ' + p2 + ' require conscious adaptation.',
  };
  // eslint-disable-next-line security/detect-object-injection
  return generics[aspectType] || aspectType + ' between ' + p1 + ' and ' + p2 + '.';
}

function norm360(d: number) { return ((d % 360) + 360) % 360; }

function angularDiff(a: number, b: number): number {
  const diff = Math.abs(norm360(a) - norm360(b));
  return diff > 180 ? 360 - diff : diff;
}

function getLongitude(chart: ChartData, key: string): number {
  // eslint-disable-next-line security/detect-object-injection
  const pos = (chart as unknown as Record<string, PlanetPosition>)[key];
  return pos?.longitude ?? 0;
}

const PLANET_KEYS_SYNASTRY: PlanetKey[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'ascendant',
];

export function calculateSynastry(chartA: ChartData, chartB: ChartData): SynastryResult {
  const aspects: SynastryAspect[] = [];

  for (const keyA of PLANET_KEYS_SYNASTRY) {
    for (const keyB of PLANET_KEYS_SYNASTRY) {
      const lonA = getLongitude(chartA, keyA);
      const lonB = getLongitude(chartB, keyB);
      const diff = angularDiff(lonA, lonB);

      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          const pairKey = keyA + '-' + keyB;
          // eslint-disable-next-line security/detect-object-injection
          const weights = PAIR_WEIGHTS[pairKey] || {};
          const dims: SynastryAspect['dimension'] = [];
          if (weights.love)          dims.push('love');
          if (weights.stability)     dims.push('stability');
          if (weights.sexual)        dims.push('sexual');
          if (weights.communication) dims.push('communication');
          if (weights.longterm)      dims.push('longterm');
          if (dims.length === 0) dims.push('love');

          const baseScore = def.harmony * (1 - orb / def.orb);

          aspects.push({
            planet1: keyA,
            planet2: keyB,
            type: def.name,
            orb: Math.round(orb * 10) / 10,
            angle: def.angle,
            score: baseScore,
            dimension: dims,
            description: getAspectDescription(keyA, keyB, def.name),
          });
          break;
        }
      }
    }
  }

  const raw = { love: 0, stability: 0, sexual: 0, communication: 0, longterm: 0 };
  const maxW = { love: 0, stability: 0, sexual: 0, communication: 0, longterm: 0 };

  for (const asp of aspects) {
    const pairKey = asp.planet1 + '-' + asp.planet2;
    // eslint-disable-next-line security/detect-object-injection
    const weights = PAIR_WEIGHTS[pairKey] || {};
    for (const dim of asp.dimension) {
      const w = (weights[dim as keyof PairWeight] ?? 1);
      raw[dim as keyof typeof raw] += asp.score * w;
      maxW[dim as keyof typeof maxW] += w;
    }
  }

  function normalize(val: number, maxVal: number): number {
    if (maxVal === 0) return 60;
    const ratio = val / maxVal;
    const score = 60 + ratio * 40;
    return Math.max(20, Math.min(100, Math.round(score)));
  }

  const scores: CompatibilityScores = {
    love:          normalize(raw.love,          maxW.love),
    stability:     normalize(raw.stability,     maxW.stability),
    sexual:        normalize(raw.sexual,        maxW.sexual),
    communication: normalize(raw.communication, maxW.communication),
    longterm:      normalize(raw.longterm,      maxW.longterm),
    overall: 0,
  };
  scores.overall = Math.round(
    scores.love * 0.25 + scores.stability * 0.2 + scores.sexual * 0.15 +
    scores.communication * 0.15 + scores.longterm * 0.25
  );

  const positiveAspects = aspects.filter(a => a.score > 0.3).sort((a, b) => b.score - a.score);
  const challengeAspects = aspects.filter(a => a.score < -0.2).sort((a, b) => a.score - b.score);

  const highlights = positiveAspects.slice(0, 3).map(a =>
    capitalize(a.planet1) + ' ' + a.type + ' ' + capitalize(a.planet2) + ': ' + a.description
  );
  const challenges = challengeAspects.slice(0, 2).map(a =>
    capitalize(a.planet1) + ' ' + a.type + ' ' + capitalize(a.planet2) + ': ' + a.description
  );

  const elementSynergy = getElementSynergy(chartA, chartB);
  const venusMarsNote = getVenusMarsNote(chartA, chartB);
  const moonSunNote = getMoonSunNote(chartA, chartB);
  const communicationNote = getCommunicationNote(chartA, chartB);
  const { compositeSun, compositeMoon } = getCompositeLuminaries(chartA, chartB);
  const relationshipPatterns = getRelationshipPatterns(chartA, chartB, aspects);
  const timingInsights = getTimingInsights(chartA, chartB);
  const summary = buildSummary(scores, highlights.length, challenges.length);
  const { archetype, archetypeDescription } = getArchetype(scores, aspects);
  const growthEdges = getGrowthEdges(chartA, chartB, aspects, scores);

  return {
    aspects, scores, highlights, challenges, summary,
    elementSynergy, venusMarsNote, moonSunNote,
    communicationNote, compositeSun, compositeMoon,
    relationshipPatterns, timingInsights,
    archetype, archetypeDescription, growthEdges,
  };
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

function getElementSynergy(a: ChartData, b: ChartData): string {
  // eslint-disable-next-line security/detect-object-injection
  const elA = SIGN_ELEMENTS[a.sun.sign];
  // eslint-disable-next-line security/detect-object-injection
  const elB = SIGN_ELEMENTS[b.sun.sign];
  const compatible: Record<string, string[]> = {
    Fire: ['Fire', 'Air'], Earth: ['Earth', 'Water'],
    Air: ['Air', 'Fire'], Water: ['Water', 'Earth'],
  };
  if (elA === elB) {
    return `Both Sun signs share the ${elA} element — you instinctively understand each other's energy and approach to life.`;
  }
  // eslint-disable-next-line security/detect-object-injection
  if (compatible[elA]?.includes(elB)) {
    return `Your ${elA} Sun and their ${elB} Sun are naturally compatible elements — you complement and energize each other.`;
  }
  return `Your ${elA} Sun and their ${elB} Sun bring contrasting elemental energies — this creates both friction and fascination.`;
}

function getVenusMarsNote(a: ChartData, b: ChartData): string {
  const venusA = a.venus.sign;
  const marsB = b.mars.sign;
  const marsA = a.mars.sign;
  const venusB = b.venus.sign;
  // eslint-disable-next-line security/detect-object-injection
  const elVA = SIGN_ELEMENTS[venusA];
  // eslint-disable-next-line security/detect-object-injection
  const elMB = SIGN_ELEMENTS[marsB];
  // eslint-disable-next-line security/detect-object-injection
  const elMA = SIGN_ELEMENTS[marsA];
  // eslint-disable-next-line security/detect-object-injection
  const elVB = SIGN_ELEMENTS[venusB];
  const compatible: Record<string, string[]> = {
    Fire: ['Fire', 'Air'], Earth: ['Earth', 'Water'],
    Air: ['Air', 'Fire'], Water: ['Water', 'Earth'],
  };
  // eslint-disable-next-line security/detect-object-injection
  const fwd = compatible[elVA]?.includes(elMB);
  // eslint-disable-next-line security/detect-object-injection
  const rev = compatible[elMA]?.includes(elVB);
  if (fwd && rev) {
    return `Your Venus in ${venusA} and their Mars in ${marsB} — and your Mars in ${marsA} and their Venus in ${venusB} — create a reciprocal romantic and sexual pull. This is a deeply magnetic pairing.`;
  }
  if (fwd) {
    return `Your Venus in ${venusA} is drawn to their Mars in ${marsB} — you naturally attract their desire and they respond to your affection with warmth.`;
  }
  if (rev) {
    return `Their Venus in ${venusB} is drawn to your Mars in ${marsA} — they are naturally attracted to your drive and energy.`;
  }
  return `Your Venus in ${venusA} and their Mars in ${marsB} bring different elemental energies to romance — the attraction may be unconventional but can be compelling.`;
}

function getMoonSunNote(a: ChartData, b: ChartData): string {
  const sunA = a.sun.sign;
  const moonB = b.moon.sign;
  const moonA = a.moon.sign;
  const sunB = b.sun.sign;
  // eslint-disable-next-line security/detect-object-injection
  const elSA = SIGN_ELEMENTS[sunA];
  // eslint-disable-next-line security/detect-object-injection
  const elMB = SIGN_ELEMENTS[moonB];
  const compatible: Record<string, string[]> = {
    Fire: ['Fire', 'Air'], Earth: ['Earth', 'Water'],
    Air: ['Air', 'Fire'], Water: ['Water', 'Earth'],
  };
  // eslint-disable-next-line security/detect-object-injection
  const fwd = compatible[elSA]?.includes(elMB);
  if (fwd) {
    return `Your Sun in ${sunA} illuminates their Moon in ${moonB} — you naturally make them feel seen, secure, and emotionally nourished. Their Moon in ${moonB} and your Sun in ${sunA} is a classic soulmate indicator.`;
  }
  return `Your Sun in ${sunA} and their Moon in ${moonB} bring different elemental rhythms — emotional attunement takes conscious effort but deepens the bond over time. Their Sun in ${sunB} and your Moon in ${moonA} add another layer of complexity to your emotional dynamic.`;
}

function buildSummary(scores: CompatibilityScores, highlights: number, challenges: number): string {
  const overall = scores.overall;
  if (overall >= 80) {
    return `This is a profoundly harmonious connection. Your charts weave together with ${highlights} strong positive aspects, suggesting a relationship with deep resonance across love, passion, and longevity.`;
  }
  if (overall >= 65) {
    return `A rich and promising connection with genuine compatibility. ${highlights > 0 ? highlights + " key aspects light up your synastry" : "Your charts connect meaningfully"}, and any challenges present are opportunities for growth rather than barriers.`;
  }
  if (overall >= 50) {
    return "A complex and layered connection — there is real chemistry here alongside areas that will require honest communication and mutual understanding. The tension itself can be a source of growth.";
  }
  return `This connection carries both magnetic pull and significant friction. The ${challenges} challenging aspects suggest this relationship will ask both of you to grow. With awareness, the intensity can become a catalyst for transformation.`;
}

// ── Communication Note ────────────────────────────────────────────────────────
function getCommunicationNote(a: ChartData, b: ChartData): string {
  const mercA = a.mercury.sign;
  const mercB = b.mercury.sign;
  // eslint-disable-next-line security/detect-object-injection
  const elA = SIGN_ELEMENTS[mercA];
  // eslint-disable-next-line security/detect-object-injection
  const elB = SIGN_ELEMENTS[mercB];
  const compatible: Record<string, string[]> = {
    Fire: ['Fire', 'Air'], Earth: ['Earth', 'Water'],
    Air: ['Air', 'Fire'], Water: ['Water', 'Earth'],
  };
  if (mercA === mercB) {
    return `Both Mercury signs are in ${mercA} — you think and communicate in almost identical ways. Conversations flow naturally and you rarely misunderstand each other's meaning.`;
  }
  if (elA === elB) {
    return `Your Mercury in ${mercA} and their Mercury in ${mercB} share the ${elA} element — your communication styles are naturally compatible, making dialogue feel easy and stimulating.`;
  }
  // eslint-disable-next-line security/detect-object-injection
  if (compatible[elA]?.includes(elB)) {
    return `Your Mercury in ${mercA} (${elA}) and their Mercury in ${mercB} (${elB}) complement each other — your different thinking styles create interesting conversations and help you both see new perspectives.`;
  }
  return `Your Mercury in ${mercA} and their Mercury in ${mercB} bring contrasting communication styles. You may need to consciously bridge different ways of thinking and expressing — but this difference can also spark fascinating intellectual exchange.`;
}

// ── Composite Luminaries (midpoint method) ────────────────────────────────────
const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function midpointSign(lonA: number, lonB: number): string {
  const diff = ((lonB - lonA + 360) % 360);
  const mid = diff <= 180 ? (lonA + lonB) / 2 : ((lonA + lonB) / 2 + 180) % 360;
  const norm = ((mid % 360) + 360) % 360;
  return SIGN_NAMES[Math.floor(norm / 30)];
}

function getCompositeLuminaries(a: ChartData, b: ChartData): { compositeSun: string; compositeMoon: string } {
  const compositeSunSign = midpointSign(a.sun.longitude, b.sun.longitude);
  const compositeMoonSign = midpointSign(a.moon.longitude, b.moon.longitude);

  const sunDescs: Record<string, string> = {
    Aries: 'bold, pioneering, and action-oriented — this relationship thrives on adventure and new beginnings',
    Taurus: 'sensual, stable, and pleasure-seeking — this relationship values comfort, loyalty, and beauty',
    Gemini: 'curious, communicative, and playful — this relationship is mentally stimulating and ever-evolving',
    Cancer: 'nurturing, emotionally deep, and home-centered — this relationship is a sanctuary of feeling',
    Leo: 'radiant, passionate, and expressive — this relationship shines brightly and loves to celebrate life',
    Virgo: 'devoted, practical, and growth-oriented — this relationship improves each other through service and care',
    Libra: 'harmonious, romantic, and partnership-focused — this relationship seeks beauty, balance, and fairness',
    Scorpio: 'intense, transformative, and deeply bonded — this relationship goes to the depths of the soul',
    Sagittarius: 'expansive, freedom-loving, and philosophical — this relationship grows through shared adventures and beliefs',
    Capricorn: 'ambitious, committed, and enduring — this relationship is built to last through dedication and shared goals',
    Aquarius: 'unconventional, intellectually bonded, and future-focused — this relationship breaks new ground together',
    Pisces: 'spiritual, compassionate, and dreamy — this relationship transcends the ordinary into something magical',
  };

  const moonDescs: Record<string, string> = {
    Aries: 'emotionally direct and spontaneous — you process feelings quickly and need freedom to express them',
    Taurus: 'emotionally steady and comfort-seeking — you find security in routine, touch, and shared pleasures',
    Gemini: 'emotionally curious and communicative — you process feelings through conversation and mental exploration',
    Cancer: 'emotionally intuitive and deeply nurturing — your emotional bond is one of the relationship\'s greatest strengths',
    Leo: 'emotionally warm and expressive — you both need to feel seen, celebrated, and adored',
    Virgo: 'emotionally attentive and service-oriented — you show love through practical care and thoughtful attention',
    Libra: 'emotionally harmonious and relationship-focused — you both need peace, fairness, and romantic connection',
    Scorpio: 'emotionally intense and transformative — your emotional bond is deep, passionate, and potentially life-changing',
    Sagittarius: 'emotionally optimistic and freedom-loving — you need space, adventure, and philosophical exploration together',
    Capricorn: 'emotionally reserved but deeply loyal — you build emotional security through reliability and shared achievement',
    Aquarius: 'emotionally independent and intellectually bonded — you connect through ideas, ideals, and friendship',
    Pisces: 'emotionally empathic and spiritually connected — your emotional bond has a mystical, transcendent quality',
  };

  return {
    // eslint-disable-next-line security/detect-object-injection
    compositeSun: `Your composite Sun falls in ${compositeSunSign} — ${sunDescs[compositeSunSign] ?? 'a unique blend of energies'}.`,
    // eslint-disable-next-line security/detect-object-injection
    compositeMoon: `Your composite Moon falls in ${compositeMoonSign} — ${moonDescs[compositeMoonSign] ?? 'a unique emotional dynamic'}.`,
  };
}

// ── Relationship Patterns ─────────────────────────────────────────────────────
function getRelationshipPatterns(a: ChartData, b: ChartData, aspects: SynastryAspect[]): string[] {
  const patterns: string[] = [];

  // Check for double whammy (reciprocal Venus-Mars)
  const hasVenusMarsFwd = aspects.some(asp => asp.planet1 === 'venus' && asp.planet2 === 'mars' && asp.score > 0);
  const hasMarsVenusFwd = aspects.some(asp => asp.planet1 === 'mars' && asp.planet2 === 'venus' && asp.score > 0);
  if (hasVenusMarsFwd && hasMarsVenusFwd) {
    patterns.push('Double Venus-Mars activation — a rare reciprocal romantic and sexual magnetism flows between you in both directions. This is one of the most powerful attraction signatures in synastry.');
  }

  // Sun-Moon conjunction or trine
  const hasSunMoonHarmony = aspects.some(asp =>
    ((asp.planet1 === 'sun' && asp.planet2 === 'moon') || (asp.planet1 === 'moon' && asp.planet2 === 'sun')) &&
    (asp.type === 'Conjunction' || asp.type === 'Trine') && asp.score > 0
  );
  if (hasSunMoonHarmony) {
    patterns.push('Sun-Moon harmony — your core identities and emotional needs align naturally. This is a classic indicator of deep compatibility and mutual understanding.');
  }

  // Element dominance
  const elA = SIGN_ELEMENTS[a.sun.sign];
  const elB = SIGN_ELEMENTS[b.sun.sign];
  if (elA === elB) {
    patterns.push(`Shared ${elA} element between your Sun signs — you share a fundamental approach to life, energy, and self-expression that creates an instinctive sense of kinship.`);
  }

  // Saturn aspects (karmic/long-term)
  const hasSaturnAspect = aspects.some(asp =>
    (asp.planet1 === 'saturn' || asp.planet2 === 'saturn') && Math.abs(asp.score) > 0.3
  );
  if (hasSaturnAspect) {
    patterns.push('Saturn aspects present — this relationship carries a karmic quality. Saturn connections often indicate a significant, long-term bond with lessons to learn and structures to build together.');
  }

  // Neptune aspects (spiritual/idealistic)
  const hasNeptuneVenus = aspects.some(asp =>
    ((asp.planet1 === 'neptune' && asp.planet2 === 'venus') || (asp.planet1 === 'venus' && asp.planet2 === 'neptune')) && asp.score > 0
  );
  if (hasNeptuneVenus) {
    patterns.push('Neptune-Venus connection — a dreamy, idealistic, and spiritually romantic quality infuses this relationship. You may feel you have known each other before, or that this love transcends the ordinary.');
  }

  // Pluto aspects (transformative)
  const hasPlutoAspect = aspects.some(asp =>
    (asp.planet1 === 'pluto' || asp.planet2 === 'pluto') && Math.abs(asp.score) > 0.3
  );
  if (hasPlutoAspect) {
    patterns.push('Pluto aspects present — this relationship has transformative power. Pluto connections are intense and life-changing; this bond will not leave either of you unchanged.');
  }

  if (patterns.length === 0) {
    patterns.push('Your synastry shows a balanced mix of energies without a single dominant pattern — this relationship is multifaceted and will reveal its deeper nature over time.');
  }

  return patterns.slice(0, 4);
}

// ── Timing Insights ───────────────────────────────────────────────────────────
function getTimingInsights(a: ChartData, b: ChartData): string[] {
  const insights: string[] = [];
  const elA = SIGN_ELEMENTS[a.sun.sign];
  const elB = SIGN_ELEMENTS[b.sun.sign];

  // Season-based timing
  const springSigns = ['Aries', 'Taurus', 'Gemini'];
  const summerSigns = ['Cancer', 'Leo', 'Virgo'];
  const autumnSigns = ['Libra', 'Scorpio', 'Sagittarius'];
  const winterSigns = ['Capricorn', 'Aquarius', 'Pisces'];

  const getSeason = (sign: string) => {
    if (springSigns.includes(sign)) return 'Spring';
    if (summerSigns.includes(sign)) return 'Summer';
    if (autumnSigns.includes(sign)) return 'Autumn';
    if (winterSigns.includes(sign)) return 'Winter';
    return 'any season';
  };

  const seasonA = getSeason(a.sun.sign);
  const seasonB = getSeason(b.sun.sign);

  if (seasonA === seasonB) {
    insights.push(`Both your Sun signs fall in ${seasonA} — this season carries special resonance for your relationship. ${seasonA} is a powerful time for deepening your bond, making important decisions together, and celebrating your connection.`);
  } else {
    insights.push(`Your Sun signs span ${seasonA} and ${seasonB} — the transitions between these seasons are potent times for your relationship. Pay attention to what shifts between you as the wheel of the year turns.`);
  }

  // Venus cycle timing
  const venusRetroSigns = ['Aries', 'Scorpio', 'Gemini', 'Capricorn'];
  if (venusRetroSigns.includes(a.venus.sign) || venusRetroSigns.includes(b.venus.sign)) {
    insights.push('Venus retrograde periods (occurring every 18 months for about 40 days) are significant for this relationship. Old feelings resurface, past connections return, and the heart\'s true desires become clearer. Use these windows for honest reflection rather than major decisions.');
  }

  // New and Full Moon timing
  const moonSign = a.moon.sign;
  insights.push(`New Moons in ${moonSign} (your Moon sign) are especially potent times to set intentions for this relationship. Full Moons in ${moonSign} bring emotional revelations and completions — pay attention to what surfaces between you during these lunations.`);

  // Jupiter timing
  insights.push(`Jupiter transiting through ${a.sun.sign} or ${b.sun.sign} (roughly every 12 years, lasting about a year) brings expansion, luck, and growth to this relationship. These are ideal windows for major commitments, travel together, or taking the relationship to the next level.`);

  // Element-based timing
  if (elA === 'Fire' || elB === 'Fire') {
    insights.push('Aries, Leo, and Sagittarius seasons (Spring through Autumn) tend to energize and ignite this relationship. Fire season transits bring passion, spontaneity, and the courage to take bold steps together.');
  } else if (elA === 'Earth' || elB === 'Earth') {
    insights.push('Taurus, Virgo, and Capricorn seasons bring grounding and practical momentum to this relationship. These are ideal times for building shared foundations, making financial decisions, or committing to long-term plans.');
  } else if (elA === 'Air' || elB === 'Air') {
    insights.push('Gemini, Libra, and Aquarius seasons stimulate communication and intellectual connection in this relationship. These periods are ideal for important conversations, travel, and exploring new ideas together.');
  } else {
    insights.push('Cancer, Scorpio, and Pisces seasons deepen the emotional and spiritual dimensions of this relationship. These are powerful times for vulnerability, healing, and strengthening your emotional bond.');
  }

  return insights.slice(0, 4);
}
