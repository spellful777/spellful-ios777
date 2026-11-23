/**
 * full-moon-feed.ts
 *
 * Generates full moon data for the lunar calendar.
 * All astronomical calculations delegate to moon-phase-engine.ts
 * (Meeus Ch. 47 with full perturbation series — accurate to ±2 min).
 */

import { generateFullMoonMoments } from './moon-phase-engine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FullMoon {
  id: string;
  /** e.g. "November 5, 2026" */
  date: string;
  /** e.g. "Thu" */
  day: string;
  /** ISO date string for sorting / filtering */
  iso: string;
  /** e.g. "Beaver Moon" */
  name: string;
  /** Zodiac sign the moon is in */
  sign: string;
  /** "Standard" | "Super Moon" | "Blue Moon" */
  type: string;
  theme: string;
  spellwork: string;
  herbs: string;
  crystals: string;
  color: string;
}

// ─── Zodiac sign from moon longitude ─────────────────────────────────────────

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function toRad(deg: number): number { return (deg * Math.PI) / 180; }

/** Moon longitude at JDE using Meeus Ch. 47 simplified series */
function moonLonForSign(jde: number): number {
  const t  = (jde - 2451545.0) / 36525;
  const L1 = ((218.3165 + 481267.8813 * t) % 360 + 360) % 360;
  const Mp = ((134.9634 + 477198.8676 * t) % 360 + 360) % 360;
  const D  = ((297.8502 + 445267.1115 * t) % 360 + 360) % 360;
  const F  = ((93.2721  + 483202.0175 * t) % 360 + 360) % 360;
  const M  = ((357.5291 + 35999.0503  * t) % 360 + 360) % 360;
  const lon = L1
    + 6.2888 * Math.sin(toRad(Mp))
    + 1.2740 * Math.sin(toRad(2 * D - Mp))
    + 0.6583 * Math.sin(toRad(2 * D))
    + 0.2136 * Math.sin(toRad(2 * Mp))
    - 0.1851 * Math.sin(toRad(M))
    - 0.1143 * Math.sin(toRad(2 * F))
    + 0.0588 * Math.sin(toRad(2 * D - 2 * Mp))
    + 0.0533 * Math.sin(toRad(2 * D + Mp));
  return ((lon % 360) + 360) % 360;
}

function moonSign(jde: number): string {
  const lon = moonLonForSign(jde);
  return SIGNS[Math.floor(lon / 30)];
}

// ─── Traditional moon names by month ─────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOON_NAMES: Record<number, string> = {
  1: 'Wolf Moon',
  2: 'Snow Moon',
  3: 'Worm Moon',
  4: 'Pink Moon',
  5: 'Flower Moon',
  6: 'Strawberry Moon',
  7: 'Buck Moon',
  8: 'Sturgeon Moon',
  9: 'Harvest Moon',
  10: "Hunter's Moon",
  11: 'Beaver Moon',
  12: 'Cold Moon',
};

// ─── Magical enrichment by zodiac sign ───────────────────────────────────────

interface MagicData {
  theme: string;
  spellwork: string;
  herbs: string;
  crystals: string;
  color: string;
}

const SIGN_MAGIC: Record<string, MagicData> = {
  Aries: {
    theme: 'Courage & New Beginnings',
    spellwork: 'Courage spells, new beginnings, banishing fear, igniting passion, warrior energy, leadership rituals.',
    herbs: 'Dragon\'s Blood, Ginger, Cinnamon',
    crystals: 'Carnelian, Red Jasper, Bloodstone',
    color: 'Red',
  },
  Taurus: {
    theme: 'Abundance & Grounding',
    spellwork: 'Money spells, property magic, grounding rituals, fertility work, spells for stability and long-term security.',
    herbs: 'Patchouli, Vetiver, Oakmoss',
    crystals: 'Pyrite, Green Aventurine, Moss Agate',
    color: 'Forest Green',
  },
  Gemini: {
    theme: 'Communication & Clarity',
    spellwork: 'Communication spells, travel magic, learning and study rituals, binding gossip, clarity of mind.',
    herbs: 'Lavender, Lemongrass, Peppermint',
    crystals: 'Citrine, Blue Lace Agate, Clear Quartz',
    color: 'Yellow',
  },
  Cancer: {
    theme: 'Home & Emotional Healing',
    spellwork: 'Home protection, emotional healing, ancestral work, fertility magic, nurturing self-love rituals.',
    herbs: 'Jasmine, Mugwort, White Willow',
    crystals: 'Moonstone, Pearl, Selenite',
    color: 'Silver',
  },
  Leo: {
    theme: 'Confidence & Creative Power',
    spellwork: 'Confidence spells, creative power, fame and recognition magic, heart-opening rituals, solar energy work.',
    herbs: 'Frankincense, Bay Laurel, Sunflower',
    crystals: 'Sunstone, Tiger\'s Eye, Golden Topaz',
    color: 'Gold',
  },
  Virgo: {
    theme: 'Healing & Sacred Service',
    spellwork: 'Healing rituals, purification work, harvest magic, practical manifestation, banishing illness.',
    herbs: 'Rosemary, Fennel, Dill',
    crystals: 'Amazonite, Peridot, Fluorite',
    color: 'Earthy Brown',
  },
  Libra: {
    theme: 'Balance & Justice',
    spellwork: 'Love spells, justice magic, harmony rituals, beauty enchantments, balancing relationships.',
    herbs: 'Rose, Spearmint, Thyme',
    crystals: 'Rose Quartz, Lepidolite, Opal',
    color: 'Pink',
  },
  Scorpio: {
    theme: 'Transformation & Shadow Work',
    spellwork: 'Shadow work, transformation rituals, psychic development, banishing, ancestral healing, deep release.',
    herbs: 'Wormwood, Myrrh, Blackthorn',
    crystals: 'Obsidian, Labradorite, Malachite',
    color: 'Deep Crimson',
  },
  Sagittarius: {
    theme: 'Expansion & Wisdom',
    spellwork: 'Expansion spells, travel magic, higher learning, truth-seeking rituals, abundance through adventure.',
    herbs: 'Sage, Juniper, Clove',
    crystals: 'Lapis Lazuli, Turquoise, Amethyst',
    color: 'Purple',
  },
  Capricorn: {
    theme: 'Ambition & Mastery',
    spellwork: 'Career magic, ambition spells, discipline rituals, long-term goal setting, ancestral strength work.',
    herbs: 'Comfrey, Horsetail, Solomon\'s Seal',
    crystals: 'Garnet, Black Tourmaline, Smoky Quartz',
    color: 'Black',
  },
  Aquarius: {
    theme: 'Liberation & Vision',
    spellwork: 'Liberation spells, community magic, visionary work, breaking old patterns, humanitarian intentions.',
    herbs: 'Mimosa, Violet, Valerian',
    crystals: 'Aquamarine, Amethyst, Angelite',
    color: 'Electric Blue',
  },
  Pisces: {
    theme: 'Dreams & Spiritual Depth',
    spellwork: 'Dream magic, psychic enhancement, spiritual cleansing, past-life work, compassion and surrender rituals.',
    herbs: 'Mugwort, Lotus, Seaweed',
    crystals: 'Amethyst, Aquamarine, Fluorite',
    color: 'Sea Green',
  },
};


// ─── Core generator ───────────────────────────────────────────────────────────

/** Super Moon threshold: within 360,000 km of Earth */
const SUPER_MOON_KM = 360000;

/**
 * Generate all full moons between startYear and endYear (inclusive).
 * Uses Meeus Ch. 47 perturbation-corrected moments via moon-phase-engine.
 * Automatically detects Super Moons and Blue Moons.
 */
export function generateFullMoons(startYear: number, endYear: number): FullMoon[] {
  const moments = generateFullMoonMoments(startYear, endYear);
  const results: FullMoon[] = [];
  const byMonthKey: Record<string, FullMoon[]> = {};

  for (const m of moments) {
    // JDE for sign/distance: convert back from the UTC date
    const jde = m.date.getTime() / 86400000 + 2440587.5;
    const sign = moonSign(jde);
    // eslint-disable-next-line security/detect-object-injection
    const magic = SIGN_MAGIC[sign] ?? SIGN_MAGIC['Cancer'];
    const isSuper = m.distanceKm <= SUPER_MOON_KM;

    // eslint-disable-next-line security/detect-object-injection
    const dateStr = MONTH_NAMES[m.month - 1] + ' ' + m.day + ', ' + m.year;
    // eslint-disable-next-line security/detect-object-injection
    const dayStr = DAY_NAMES[m.dow];

    const moon: FullMoon = {
      id: m.iso,
      date: dateStr,
      day: dayStr,
      iso: m.iso,
      // eslint-disable-next-line security/detect-object-injection
      name: MOON_NAMES[m.month] ?? 'Full Moon',
      sign,
      type: isSuper ? 'Super Moon' : 'Standard',
      theme: magic.theme,
      spellwork: magic.spellwork,
      herbs: magic.herbs,
      crystals: magic.crystals,
      color: magic.color,
    };

    const key = m.year + '-' + m.month;
    // eslint-disable-next-line security/detect-object-injection
    if (!byMonthKey[key]) byMonthKey[key] = [];
    // eslint-disable-next-line security/detect-object-injection
    byMonthKey[key].push(moon);
    results.push(moon);
  }

  // Blue Moon: second full moon in a calendar month
  for (const moons of Object.values(byMonthKey)) {
    if (moons.length >= 2) {
      const blue = moons[moons.length - 1];
      blue.type = 'Blue Moon';
    }
  }

  return results;
}

/**
 * Returns full moons from the current year through (currentYear + yearsAhead).
 * The calendar auto-advances as real time passes.
 */
export function getUpcomingFullMoons(yearsAhead = 4): FullMoon[] {
  const now = new Date();
  const startYear = now.getUTCFullYear();
  return generateFullMoons(startYear, startYear + yearsAhead);
}
