// Astrological interpretations for birth chart readings

export interface Interpretation {
  title: string;
  symbol: string;
  keywords: string[];
  description: string;
  shadow?: string;
}

// ── SIGN INTERPRETATIONS ──────────────────────────────────────────────────────
export const SIGN_INTERPRETATIONS: Record<string, Interpretation> = {
  Aries: {
    title: 'Aries ♈', symbol: '♈',
    keywords: ['Pioneering', 'Bold', 'Impulsive', 'Courageous', 'Independent'],
    description: 'Aries energy is the spark of creation — raw, unfiltered, and fiercely alive. It carries the warrior spirit, the drive to initiate, and the courage to be first. This placement brings a direct, passionate approach to life.',
    shadow: 'Impatience, aggression, and acting before thinking can create unnecessary conflict.',
  },
  Taurus: {
    title: 'Taurus ♉', symbol: '♉',
    keywords: ['Sensual', 'Steadfast', 'Patient', 'Grounded', 'Luxurious'],
    description: 'Taurus energy is the sacred body — pleasure, beauty, and the deep knowing that comes from being rooted in the physical world. This placement brings patience, loyalty, and a profound appreciation for earthly delights.',
    shadow: 'Stubbornness and resistance to change can create stagnation.',
  },
  Gemini: {
    title: 'Gemini ♊', symbol: '♊',
    keywords: ['Curious', 'Adaptable', 'Witty', 'Communicative', 'Dual'],
    description: 'Gemini energy is the quicksilver mind — endlessly curious, delightfully contradictory, and alive with ideas. This placement brings versatility, charm, and the gift of seeing multiple perspectives simultaneously.',
    shadow: 'Scattered energy and superficiality can prevent deep roots from forming.',
  },
  Cancer: {
    title: 'Cancer ♋', symbol: '♋',
    keywords: ['Nurturing', 'Intuitive', 'Protective', 'Emotional', 'Psychic'],
    description: 'Cancer energy is the sacred womb — deeply intuitive, fiercely protective, and attuned to the tides of emotion. This placement brings profound empathy, psychic sensitivity, and the ability to create sanctuary.',
    shadow: 'Emotional defensiveness and clinging to the past can prevent growth.',
  },
  Leo: {
    title: 'Leo ♌', symbol: '♌',
    keywords: ['Radiant', 'Creative', 'Generous', 'Dramatic', 'Regal'],
    description: 'Leo energy is the solar flame — radiant, generous, and born to shine. This placement brings creative power, natural leadership, and a warm heart that lights up every room it enters.',
    shadow: 'Pride and need for validation can overshadow genuine connection.',
  },
  Virgo: {
    title: 'Virgo ♍', symbol: '♍',
    keywords: ['Discerning', 'Healing', 'Precise', 'Devoted', 'Analytical'],
    description: 'Virgo energy is the sacred healer — discerning, devoted, and in service to wholeness. This placement brings analytical brilliance, a gift for refinement, and the ability to find the sacred in the details.',
    shadow: 'Perfectionism and self-criticism can become a cage rather than a compass.',
  },
  Libra: {
    title: 'Libra ♎', symbol: '♎',
    keywords: ['Harmonious', 'Diplomatic', 'Aesthetic', 'Just', 'Relational'],
    description: 'Libra energy is the sacred mirror — seeking beauty, balance, and the divine in relationship. This placement brings charm, a refined aesthetic sense, and the ability to see all sides of any situation.',
    shadow: 'Indecision and people-pleasing can lead to losing oneself in others.',
  },
  Scorpio: {
    title: 'Scorpio ♏', symbol: '♏',
    keywords: ['Transformative', 'Intense', 'Psychic', 'Magnetic', 'Regenerative'],
    description: 'Scorpio energy is the sacred death and rebirth — magnetic, penetrating, and unafraid of the depths. This placement brings extraordinary emotional intelligence, psychic power, and the ability to transform through crisis.',
    shadow: 'Control, jealousy, and holding grudges can poison what is most precious.',
  },
  Sagittarius: {
    title: 'Sagittarius ♐', symbol: '♐',
    keywords: ['Expansive', 'Philosophical', 'Adventurous', 'Optimistic', 'Visionary'],
    description: 'Sagittarius energy is the sacred quest — always reaching toward the horizon, hungry for truth and meaning. This placement brings optimism, philosophical depth, and the gift of inspiring others with a larger vision.',
    shadow: 'Restlessness and bluntness can leave a trail of unfinished journeys.',
  },
  Capricorn: {
    title: 'Capricorn ♑', symbol: '♑',
    keywords: ['Ambitious', 'Disciplined', 'Wise', 'Structured', 'Enduring'],
    description: 'Capricorn energy is the sacred mountain — patient, disciplined, and built for the long climb. This placement brings mastery, strategic thinking, and the ability to manifest lasting structures in the world.',
    shadow: 'Rigidity and workaholism can create success at the cost of joy.',
  },
  Aquarius: {
    title: 'Aquarius ♒', symbol: '♒',
    keywords: ['Revolutionary', 'Humanitarian', 'Visionary', 'Eccentric', 'Collective'],
    description: 'Aquarius energy is the sacred rebel — ahead of its time, devoted to humanity, and delightfully unconventional. This placement brings originality, humanitarian vision, and the ability to see the future before others can.',
    shadow: 'Emotional detachment and contrarianism can create isolation.',
  },
  Pisces: {
    title: 'Pisces ♓', symbol: '♓',
    keywords: ['Mystical', 'Compassionate', 'Dreamy', 'Psychic', 'Boundless'],
    description: 'Pisces energy is the sacred ocean — boundless, mystical, and deeply attuned to the unseen. This placement brings extraordinary compassion, artistic sensitivity, and a direct line to the divine.',
    shadow: 'Escapism and losing boundaries can lead to confusion and martyrdom.',
  },
};

// ── PLANET INTERPRETATIONS ────────────────────────────────────────────────────
export const PLANET_INTERPRETATIONS: Record<string, { title: string; symbol: string; rules: string; meaning: string }> = {
  sun: {
    title: 'Sun', symbol: '☉',
    rules: 'Leo · 5th House',
    meaning: 'Your Sun sign is the core of your identity — the conscious self you are here to embody and express. It represents your life force, your ego, your creative power, and the essential qualities you are developing in this lifetime.',
  },
  moon: {
    title: 'Moon', symbol: '☽',
    rules: 'Cancer · 4th House',
    meaning: 'Your Moon sign reveals your emotional nature, your instinctive responses, and your deepest needs for security and belonging. It governs your subconscious patterns, your relationship with the feminine, and what nourishes your soul.',
  },
  mercury: {
    title: 'Mercury', symbol: '☿',
    rules: 'Gemini & Virgo · 3rd & 6th Houses',
    meaning: 'Mercury governs your mind, communication style, and how you process information. It reveals how you think, speak, write, and learn — the quality of your mental energy and the way you connect ideas.',
  },
  venus: {
    title: 'Venus', symbol: '♀',
    rules: 'Taurus & Libra · 2nd & 7th Houses',
    meaning: 'Venus reveals what you love, what you find beautiful, and how you attract and relate to others. It governs your values, your aesthetic sensibility, your approach to romance, and your relationship with pleasure and abundance.',
  },
  mars: {
    title: 'Mars', symbol: '♂',
    rules: 'Aries · 1st House',
    meaning: 'Mars is your drive, desire, and will to act. It governs how you pursue what you want, how you handle anger and conflict, your sexual energy, and the way you assert yourself in the world.',
  },
  jupiter: {
    title: 'Jupiter', symbol: '♃',
    rules: 'Sagittarius · 9th House',
    meaning: 'Jupiter is the planet of expansion, abundance, and higher wisdom. Its placement reveals where you find luck and growth, your philosophical outlook, and the areas of life where you are meant to expand and teach.',
  },
  saturn: {
    title: 'Saturn', symbol: '♄',
    rules: 'Capricorn · 10th House',
    meaning: 'Saturn is the great teacher — representing discipline, responsibility, and the lessons you are here to master. Its placement shows where you face challenges that ultimately build your greatest strengths and wisdom.',
  },
  uranus: {
    title: 'Uranus', symbol: '♅',
    rules: 'Aquarius · 11th House',
    meaning: 'Uranus governs revolution, awakening, and the breaking of old patterns. It reveals where you are meant to innovate, rebel, and bring radical change — both in your own life and in the collective.',
  },
  neptune: {
    title: 'Neptune', symbol: '♆',
    rules: 'Pisces · 12th House',
    meaning: 'Neptune governs dreams, mysticism, and the dissolution of boundaries. It reveals your spiritual gifts, your capacity for compassion and transcendence, and where illusion or inspiration most powerfully shapes your life.',
  },
  pluto: {
    title: 'Pluto', symbol: '♇',
    rules: 'Scorpio · 8th House',
    meaning: 'Pluto governs transformation, power, and the deepest cycles of death and rebirth. Its placement reveals where you undergo profound metamorphosis, where you encounter power dynamics, and where your soul is called to evolve.',
  },
};

// ── HOUSE INTERPRETATIONS ─────────────────────────────────────────────────────
export const HOUSE_INTERPRETATIONS: Record<number, { title: string; keywords: string; meaning: string }> = {
  1: { title: '1st House — Self & Identity', keywords: 'Appearance · Personality · First Impressions · The Body', meaning: 'The house of self — how you present to the world, your physical appearance, and the mask you wear. Planets here are highly visible and color your entire personality.' },
  2: { title: '2nd House — Values & Resources', keywords: 'Money · Possessions · Self-Worth · Talents', meaning: 'The house of what you value and own — both material and spiritual. It reveals your relationship with money, security, and your sense of self-worth.' },
  3: { title: '3rd House — Mind & Communication', keywords: 'Siblings · Local Travel · Learning · Writing', meaning: 'The house of the everyday mind — communication, learning, siblings, and your immediate environment. It governs how you think and express yourself.' },
  4: { title: '4th House — Home & Roots', keywords: 'Family · Ancestry · Inner Life · Foundation', meaning: 'The house of home and origins — your family, ancestry, and the private inner world. It reveals your emotional foundation and what makes you feel safe.' },
  5: { title: '5th House — Creativity & Joy', keywords: 'Romance · Children · Play · Self-Expression', meaning: 'The house of creative self-expression, romance, and joy. It governs what lights you up, your relationship with pleasure, and your inner child.' },
  6: { title: '6th House — Health & Service', keywords: 'Daily Routines · Work · Wellness · Devotion', meaning: 'The house of daily life, health, and service. It reveals your work ethic, your approach to wellness, and how you show up in devotion to something larger.' },
  7: { title: '7th House — Partnership', keywords: 'Marriage · Contracts · Open Enemies · The Other', meaning: 'The house of one-on-one relationships — marriage, business partnerships, and significant others. It reveals what you seek in partnership and what you project onto others.' },
  8: { title: '8th House — Transformation', keywords: 'Death · Rebirth · Shared Resources · Occult', meaning: 'The house of deep transformation, shared resources, and the occult. It governs sexuality, inheritance, and the profound changes that come through merging with another.' },
  9: { title: '9th House — Philosophy & Expansion', keywords: 'Higher Learning · Travel · Spirituality · Truth', meaning: 'The house of higher wisdom, long-distance travel, and spiritual seeking. It reveals your philosophical outlook, your relationship with truth, and your hunger for meaning.' },
  10: { title: '10th House — Career & Legacy', keywords: 'Public Life · Reputation · Ambition · Authority', meaning: 'The house of career, public reputation, and your legacy in the world. It reveals your ambitions, your relationship with authority, and how you are seen by society.' },
  11: { title: '11th House — Community & Vision', keywords: 'Friends · Groups · Hopes · Collective Dreams', meaning: 'The house of community, friendship, and collective vision. It reveals your social circles, your hopes and dreams, and your role in shaping the future.' },
  12: { title: '12th House — The Hidden Realm', keywords: 'Solitude · Karma · Mysticism · The Unconscious', meaning: 'The house of the hidden, the unconscious, and the mystical. It governs karma, spiritual retreat, and the parts of yourself that operate beneath the surface.' },
};

// ── ASPECT INTERPRETATIONS ────────────────────────────────────────────────────
export const ASPECT_INTERPRETATIONS: Record<string, { symbol: string; nature: string; meaning: string }> = {
  Conjunction: { symbol: '☌', nature: 'Intense', meaning: 'A powerful merging of energies — these two planetary forces blend and amplify each other, creating an intensified expression of both.' },
  Sextile: { symbol: '⚹', nature: 'Harmonious', meaning: 'A flowing, supportive connection that offers opportunities and ease. These energies work well together and create natural talent.' },
  Square: { symbol: '□', nature: 'Challenging', meaning: 'A dynamic tension that creates friction and challenge — but also the motivation for growth. Squares are the aspects that build character.' },
  Trine: { symbol: '△', nature: 'Flowing', meaning: 'A graceful, effortless flow of energy between these planets. Trines represent natural gifts and areas where things come easily.' },
  Opposition: { symbol: '☍', nature: 'Polarizing', meaning: 'A push-pull dynamic between opposing forces that seeks integration. Oppositions often manifest through relationships and require balance.' },
  Quincunx: { symbol: '⚻', nature: 'Adjusting', meaning: "An awkward angle requiring constant adjustment and recalibration. These energies don't naturally understand each other but create unique adaptability." },
};

// ── ELEMENT & MODALITY ANALYSIS ───────────────────────────────────────────────
export const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

export const SIGN_MODALITIES: Record<string, string> = {
  Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed',
  Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable',
};

export const ELEMENT_DESCRIPTIONS: Record<string, string> = {
  Fire: 'Passionate, inspired, and driven by vision — you lead with enthusiasm and creative spark.',
  Earth: 'Grounded, practical, and attuned to the physical world — you build with patience and wisdom.',
  Air: 'Intellectual, communicative, and socially gifted — you navigate the world through ideas and connection.',
  Water: 'Intuitive, emotional, and deeply psychic — you feel your way through life with extraordinary sensitivity.',
};
