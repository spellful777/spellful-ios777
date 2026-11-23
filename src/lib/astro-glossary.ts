// Astrological glossary — shared across all Astrology 2.0 pages
export interface GlossaryEntry {
  term: string;
  definition: string;
  /** Optional path to a deeper resource page */
  learnMorePath?: string;
}

export const ASTRO_GLOSSARY: Record<string, GlossaryEntry> = {
  // ── General chart concepts ──────────────────────────────────────────────────
  natal_chart: {
    term: 'Natal Chart',
    definition: 'A map of the sky at the exact moment and place of your birth. It shows where every planet was positioned and forms the foundation of your personal astrology.',
    learnMorePath: '/birth-chart',
  },
  birth_chart: {
    term: 'Birth Chart',
    definition: 'Another name for your natal chart — a snapshot of the heavens at your birth that reveals your personality, strengths, and life themes.',
    learnMorePath: '/birth-chart',
  },
  ascendant: {
    term: 'Ascendant (Rising Sign)',
    definition: 'The zodiac sign rising on the eastern horizon at your birth. It shapes your outward personality, appearance, and how others first perceive you.',
    learnMorePath: '/astrology',
  },
  midheaven: {
    term: 'Midheaven (MC)',
    definition: 'The highest point in your birth chart, representing your public reputation, career path, and life ambitions.',
    learnMorePath: '/astrology',
  },
  // ── Planets ─────────────────────────────────────────────────────────────────
  retrograde: {
    term: 'Retrograde',
    definition: "When a planet appears to move backward through the zodiac from Earth's perspective. It's an optical illusion, but astrologically it signals a time to review and reflect on that planet's themes.",
    learnMorePath: '/astrology/planets',
  },
  elongation: {
    term: 'Elongation',
    definition: 'The angular distance between a planet and the Sun as seen from Earth, measured in degrees. It determines whether a planet is visible in the morning or evening sky.',
    learnMorePath: '/astrology/planets',
  },
  rulership: {
    term: 'Rulership',
    definition: "Each planet 'rules' one or two zodiac signs, meaning it expresses its energy most naturally through those signs. For example, Venus rules Taurus and Libra.",
    learnMorePath: '/astrology/planets',
  },
  inner_planets: {
    term: 'Inner Planets',
    definition: 'Mercury, Venus, and Mars — the planets closest to the Sun. They move quickly through the zodiac and influence your day-to-day personality, communication, love life, and drive.',
    learnMorePath: '/astrology/planets',
  },
  outer_planets: {
    term: 'Outer Planets',
    definition: 'Jupiter, Saturn, Uranus, Neptune, and Pluto. They move slowly and shape generational themes, long-term growth, and deep transformation.',
    learnMorePath: '/astrology/planets',
  },
  // ── Houses ──────────────────────────────────────────────────────────────────
  house_system: {
    term: 'House System',
    definition: 'The method used to divide the birth chart into 12 houses. Popular systems include Placidus, Whole Sign, and Equal House — each divides the sky slightly differently.',
    learnMorePath: '/astrology/houses',
  },
  angular_house: {
    term: 'Angular House',
    definition: 'The 1st, 4th, 7th, and 10th houses. Planets placed here are especially powerful and prominent, directly shaping identity, home, relationships, and career.',
    learnMorePath: '/astrology/houses',
  },
  succedent_house: {
    term: 'Succedent House',
    definition: 'The 2nd, 5th, 8th, and 11th houses. They stabilize and consolidate the energy of the angular houses, governing resources, creativity, transformation, and community.',
    learnMorePath: '/astrology/houses',
  },
  cadent_house: {
    term: 'Cadent House',
    definition: 'The 3rd, 6th, 9th, and 12th houses. Transitional in nature, they govern the mind, service, philosophy, and the hidden or spiritual realm.',
    learnMorePath: '/astrology/houses',
  },
  // ── Aspects ─────────────────────────────────────────────────────────────────
  aspect: {
    term: 'Aspect',
    definition: 'An angular relationship between two planets in a birth chart. Aspects describe how planetary energies interact — harmoniously, tensely, or neutrally.',
    learnMorePath: '/astrology/aspects',
  },
  orb: {
    term: 'Orb',
    definition: 'The allowable margin of error for an aspect. For example, a conjunction is exact at 0° but is still considered active within a few degrees of orb on either side.',
    learnMorePath: '/astrology/aspects',
  },
  conjunction: {
    term: 'Conjunction',
    definition: "Two planets at 0° apart, blending their energies together. It's one of the most powerful aspects — intensifying and merging the themes of both planets.",
    learnMorePath: '/astrology/aspects',
  },
  trine: {
    term: 'Trine',
    definition: "Two planets 120° apart, sharing the same element. Trines flow easily and represent natural talents, harmony, and areas of life that come effortlessly.",
    learnMorePath: '/astrology/aspects',
  },
  square: {
    term: 'Square',
    definition: "Two planets 90° apart, creating friction and challenge. Squares push you to grow by confronting tension — they're difficult but deeply motivating.",
    learnMorePath: '/astrology/aspects',
  },
  opposition: {
    term: 'Opposition',
    definition: "Two planets 180° apart, pulling in opposite directions. Oppositions highlight polarities and the need for balance — often playing out through relationships.",
    learnMorePath: '/astrology/aspects',
  },
  sextile: {
    term: 'Sextile',
    definition: 'Two planets 60° apart. Sextiles are gentle, supportive aspects that offer opportunities and easy cooperation between the planets involved.',
    learnMorePath: '/astrology/aspects',
  },
  applying_aspect: {
    term: 'Applying Aspect',
    definition: 'An aspect that is moving toward exactness — the planets are getting closer to the precise angle. Applying aspects are considered stronger and more active.',
    learnMorePath: '/astrology/aspects',
  },
  separating_aspect: {
    term: 'Separating Aspect',
    definition: 'An aspect that has already reached exactness and is now moving apart. Separating aspects represent energy that has already been expressed or is fading.',
    learnMorePath: '/astrology/aspects',
  },
  // ── Zodiac ──────────────────────────────────────────────────────────────────
  element: {
    term: 'Element',
    definition: 'The four classical elements — Fire, Earth, Air, and Water — each group three zodiac signs and describe a fundamental temperament and way of engaging with the world.',
    learnMorePath: '/astrology',
  },
  modality: {
    term: 'Modality',
    definition: 'The three modes — Cardinal, Fixed, and Mutable — describe how each sign initiates, sustains, or adapts energy. Each element contains one sign of each modality.',
    learnMorePath: '/astrology',
  },
};
