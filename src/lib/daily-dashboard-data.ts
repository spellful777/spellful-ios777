/**
 * daily-dashboard-data.ts
 * Deterministic daily content seeded by date — no API, no randomness.
 * Every value is stable for the entire calendar day.
 */

import { TAROT_CARDS } from './tarot-data';
import { getMoonPhaseInfo, MOON_PHASES } from './moon-ritual-data';
import { getMoonPhase } from './moon-phase-engine';

// ── Seeded pseudo-random ──────────────────────────────────────────────────────
function dateKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function seededRandom(seed: number, offset = 0): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function pickByDate<T>(arr: T[], date: Date, offset = 0): T {
  const key = dateKey(date);
  const idx = Math.floor(seededRandom(key, offset) * arr.length);
  // eslint-disable-next-line security/detect-object-injection
  return arr[idx];
}

// ── Daily Tarot ───────────────────────────────────────────────────────────────
export function getDailyCard(date: Date) {
  const card = pickByDate(TAROT_CARDS, date, 1);
  const reversed = seededRandom(dateKey(date), 99) > 0.7; // 30% reversed
  return { card, reversed };
}

// ── Daily Affirmations ────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  'I descend into my own darkness and return carrying light no one else can name.',
  'The void does not swallow me — it reveals what I was always made of.',
  'I am the storm that tends its own altar.',
  'My grief is sacred. My rage is sacred. My silence is sacred.',
  'I walk between worlds and belong fully to both.',
  'The dead speak in the language of roots and I have learned to listen.',
  'I do not fear the shadow — I have sat with it long enough to know its name.',
  'My power was never given to me. It was always mine, buried beneath what they asked me to be.',
  'I am the crow, the thorn, the candle burning at the edge of midnight.',
  'Every scar on my soul is a sigil I carved with my own survival.',
  'The moon does not apologize for her darkness, and neither do I.',
  'I am ancient. I have burned before and risen from ash that still remembers my name.',
  'My intuition is a black mirror — I trust what it shows me, even when it unsettles.',
  'I release what is dead with ceremony, not apology.',
  'I am the keeper of my own underworld, and I descend on my own terms.',
  'Silence is my most potent spell. I wield it with intention.',
  'I do not chase the light. I am the thing that makes the light meaningful.',
  'My magic lives in the liminal — the hour before dawn, the breath before the word.',
  'I honor the parts of me that were never meant to be soft.',
  'The universe does not comfort me. It initiates me, and I accept.',
  'I am rooted in the bones of the earth and open to the cold fire of the stars.',
  'My dreams are dispatches from the underworld. I read them like scripture.',
  'I carry the wisdom of every woman who was silenced before me.',
  'I do not perform my healing. I do it in the dark, alone, and it is enough.',
  'The veil between worlds is thin inside me — I have always lived at the threshold.',
  'I am not broken. I am mid-transformation, and transformation is never clean.',
  'My shadow is not my enemy. It is the part of me that refused to disappear.',
  'I speak my truth like a spell — once, clearly, and with full consequence.',
  'I am the witch at the crossroads. I know which road leads home.',
  'Death is not the end of my story. It is the ink I write with.',
];

export function getDailyAffirmation(date: Date): string {
  return pickByDate(AFFIRMATIONS, date, 2);
}

// ── Herb of the Day ───────────────────────────────────────────────────────────
const DAILY_HERBS = [
  { name: 'Lavender', element: 'Air', planet: 'Mercury', uses: 'Calm, sleep, purification, love', tip: 'Place dried lavender under your pillow for peaceful dreams.' },
  { name: 'Rose', element: 'Water', planet: 'Venus', uses: 'Love, healing, psychic power, beauty', tip: 'Add rose petals to your bath to attract love and self-compassion.' },
  { name: 'Rosemary', element: 'Fire', planet: 'Sun', uses: 'Protection, memory, purification, love', tip: 'Burn rosemary to cleanse your space of negative energy.' },
  { name: 'Mugwort', element: 'Earth', planet: 'Moon', uses: 'Dreams, psychic visions, astral travel', tip: 'Brew mugwort tea before bed to enhance dream recall.' },
  { name: 'Chamomile', element: 'Water', planet: 'Sun', uses: 'Calm, sleep, prosperity, purification', tip: 'Carry chamomile in your wallet to attract money.' },
  { name: 'Sage', element: 'Air', planet: 'Jupiter', uses: 'Wisdom, purification, protection, longevity', tip: 'Burn white sage to clear stagnant energy from your home.' },
  { name: 'Basil', element: 'Fire', planet: 'Mars', uses: 'Prosperity, love, protection, exorcism', tip: 'Keep fresh basil on your altar to attract abundance.' },
  { name: 'Mint', element: 'Air', planet: 'Mercury', uses: 'Money, healing, travel, luck', tip: 'Rub mint leaves on your hands before a business meeting.' },
  { name: 'Cinnamon', element: 'Fire', planet: 'Sun', uses: 'Success, healing, power, psychic ability', tip: 'Sprinkle cinnamon across your doorstep to attract prosperity.' },
  { name: 'Thyme', element: 'Water', planet: 'Venus', uses: 'Courage, healing, sleep, psychic power', tip: 'Wear thyme to develop courage and confidence.' },
  { name: 'Frankincense', element: 'Fire', planet: 'Sun', uses: 'Protection, purification, spirituality, luck', tip: 'Burn frankincense resin to raise the vibration of your space.' },
  { name: 'Jasmine', element: 'Water', planet: 'Moon', uses: 'Love, money, prophetic dreams, spirituality', tip: 'Anoint candles with jasmine oil to attract love.' },
  { name: 'Bay Laurel', element: 'Fire', planet: 'Sun', uses: 'Wishes, protection, psychic power, healing', tip: 'Write a wish on a bay leaf and burn it to manifest your desire.' },
  { name: 'Yarrow', element: 'Water', planet: 'Venus', uses: 'Courage, love, psychic ability, exorcism', tip: 'Carry yarrow to boost your courage in difficult situations.' },
  { name: 'Dandelion', element: 'Air', planet: 'Jupiter', uses: 'Wishes, divination, calling spirits, luck', tip: 'Blow dandelion seeds while making a wish under the moon.' },
  { name: 'Elderflower', element: 'Water', planet: 'Venus', uses: 'Healing, protection, prosperity, sleep', tip: 'Hang elder branches above your door for protection.' },
  { name: 'Clove', element: 'Fire', planet: 'Jupiter', uses: 'Protection, exorcism, love, money', tip: 'Stick cloves into an orange to create a protective charm.' },
  { name: 'Lemon Balm', element: 'Water', planet: 'Moon', uses: 'Love, success, healing, psychic ability', tip: 'Brew lemon balm tea to calm anxiety and open your heart.' },
  { name: 'Peppermint', element: 'Fire', planet: 'Mercury', uses: 'Purification, sleep, love, healing, psychic power', tip: 'Place peppermint leaves in your shoes for safe travels.' },
  { name: 'Calendula', element: 'Fire', planet: 'Sun', uses: 'Protection, prophetic dreams, legal matters, psychic power', tip: 'Add calendula petals to your bath for solar energy and protection.' },
  { name: 'Valerian', element: 'Water', planet: 'Venus', uses: 'Sleep, love, purification, protection', tip: 'Keep valerian root under your pillow to prevent nightmares.' },
  { name: 'Hawthorn', element: 'Fire', planet: 'Mars', uses: 'Fertility, happiness, protection, fishing magic', tip: 'Carry hawthorn berries to attract happiness and good fortune.' },
  { name: 'Wormwood', element: 'Fire', planet: 'Mars', uses: 'Psychic power, protection, love, calling spirits', tip: 'Burn wormwood to enhance psychic visions during divination.' },
  { name: 'Nettle', element: 'Fire', planet: 'Mars', uses: 'Protection, healing, lust, exorcism', tip: 'Carry dried nettle in a pouch for protection against negativity.' },
  { name: 'Passionflower', element: 'Water', planet: 'Venus', uses: 'Peace, sleep, friendship, love', tip: 'Place passionflower in your home to create a peaceful atmosphere.' },
  { name: 'Echinacea', element: 'Earth', planet: 'Venus', uses: 'Strengthening spells, healing, protection', tip: 'Add echinacea to spell bags to amplify their power.' },
  { name: 'Vervain', element: 'Earth', planet: 'Venus', uses: 'Protection, purification, love, peace, money', tip: 'Sprinkle vervain around your home for all-purpose protection.' },
  { name: 'Hyssop', element: 'Fire', planet: 'Jupiter', uses: 'Purification, protection, healing', tip: 'Wash your hands with hyssop water before ritual work.' },
];

export function getDailyHerb(date: Date) {
  return pickByDate(DAILY_HERBS, date, 3);
}

// ── Crystal of the Day ────────────────────────────────────────────────────────
const DAILY_CRYSTALS = [
  { name: 'Amethyst', color: '#9B59B6', element: 'Air/Water', chakra: 'Crown', uses: 'Intuition, protection, spiritual growth', tip: 'Meditate with amethyst to deepen your connection to higher wisdom.' },
  { name: 'Rose Quartz', color: '#F4A7B9', element: 'Water', chakra: 'Heart', uses: 'Love, compassion, emotional healing', tip: 'Place rose quartz over your heart during meditation to open to love.' },
  { name: 'Black Tourmaline', color: '#2C3E50', element: 'Earth', chakra: 'Root', uses: 'Protection, grounding, EMF shielding', tip: 'Carry black tourmaline to create an energetic shield around you.' },
  { name: 'Citrine', color: '#F39C12', element: 'Fire', chakra: 'Solar Plexus', uses: 'Abundance, confidence, manifestation', tip: 'Place citrine in the wealth corner of your home to attract prosperity.' },
  { name: 'Moonstone', color: '#AED6F1', element: 'Water', chakra: 'Third Eye', uses: 'Intuition, new beginnings, feminine energy', tip: 'Charge moonstone under the full moon for maximum power.' },
  { name: 'Labradorite', color: '#5DADE2', element: 'Water', chakra: 'Third Eye', uses: 'Magic, transformation, protection', tip: 'Hold labradorite to strengthen your aura and magical abilities.' },
  { name: 'Clear Quartz', color: '#ECF0F1', element: 'All', chakra: 'Crown', uses: 'Amplification, clarity, healing, programming', tip: 'Program clear quartz with your intention by holding it and visualizing.' },
  { name: 'Obsidian', color: '#1C2833', element: 'Earth/Fire', chakra: 'Root', uses: 'Protection, truth, shadow work', tip: 'Gaze into obsidian for scrying and shadow work insights.' },
  { name: 'Selenite', color: '#FDFEFE', element: 'Air', chakra: 'Crown', uses: 'Cleansing, clarity, angelic connection', tip: 'Wave selenite over other crystals to cleanse and recharge them.' },
  { name: 'Carnelian', color: '#E74C3C', element: 'Fire', chakra: 'Sacral', uses: 'Courage, creativity, motivation, vitality', tip: 'Carry carnelian when you need an extra boost of confidence.' },
  { name: 'Lapis Lazuli', color: '#2471A3', element: 'Water', chakra: 'Third Eye', uses: 'Wisdom, truth, communication, psychic ability', tip: 'Wear lapis lazuli to speak your truth with clarity and power.' },
  { name: 'Malachite', color: '#27AE60', element: 'Earth', chakra: 'Heart', uses: 'Transformation, healing, protection, abundance', tip: 'Place malachite on your heart to release old emotional patterns.' },
  { name: "Tiger's Eye", color: '#D4AC0D', element: 'Fire/Earth', chakra: 'Solar Plexus', uses: 'Courage, protection, luck, willpower', tip: "Carry tiger's eye to stay grounded and focused on your goals." },
  { name: 'Lepidolite', color: '#A569BD', element: 'Water', chakra: 'Heart/Crown', uses: 'Calm, transition, anxiety relief, sleep', tip: 'Hold lepidolite during stressful moments to restore calm.' },
  { name: 'Pyrite', color: '#D4AC0D', element: 'Earth/Fire', chakra: 'Solar Plexus', uses: 'Prosperity, protection, confidence, manifestation', tip: 'Keep pyrite on your desk to attract success and abundance.' },
  { name: 'Rhodonite', color: '#E8A0BF', element: 'Earth', chakra: 'Heart', uses: 'Forgiveness, compassion, emotional healing', tip: 'Meditate with rhodonite to heal old wounds and open your heart.' },
  { name: 'Sodalite', color: '#2E86C1', element: 'Water', chakra: 'Throat', uses: 'Logic, communication, truth, intuition', tip: 'Carry sodalite to enhance clear thinking and honest communication.' },
  { name: 'Green Aventurine', color: '#1E8449', element: 'Earth', chakra: 'Heart', uses: 'Luck, opportunity, prosperity, healing', tip: 'Keep aventurine in your pocket on days when you need good luck.' },
  { name: 'Aquamarine', color: '#5DADE2', element: 'Water', chakra: 'Throat', uses: 'Courage, communication, clarity, protection', tip: 'Wear aquamarine to speak with clarity and calm in difficult conversations.' },
  { name: 'Fluorite', color: '#8E44AD', element: 'Air', chakra: 'Third Eye', uses: 'Focus, clarity, psychic protection, learning', tip: 'Place fluorite on your desk to enhance concentration and mental clarity.' },
  { name: 'Sunstone', color: '#E67E22', element: 'Fire', chakra: 'Sacral/Solar Plexus', uses: 'Joy, confidence, abundance, leadership', tip: 'Hold sunstone to lift your mood and reconnect with your inner joy.' },
  { name: 'Bloodstone', color: '#1D6A39', element: 'Earth', chakra: 'Root', uses: 'Courage, healing, strength, vitality', tip: 'Carry bloodstone to boost your physical energy and courage.' },
  { name: 'Smoky Quartz', color: '#6E2F1A', element: 'Earth', chakra: 'Root', uses: 'Grounding, protection, releasing negativity', tip: 'Hold smoky quartz to transmute negative energy into positive.' },
  { name: 'Blue Lace Agate', color: '#AED6F1', element: 'Air', chakra: 'Throat', uses: 'Calm, communication, peace, clarity', tip: 'Wear blue lace agate to soothe anxiety and promote peaceful communication.' },
  { name: 'Garnet', color: '#922B21', element: 'Fire', chakra: 'Root', uses: 'Passion, energy, commitment, love', tip: 'Carry garnet to reignite your passion and commitment to your goals.' },
];

export function getDailyCrystal(date: Date) {
  return pickByDate(DAILY_CRYSTALS, date, 4);
}

// ── Journal Prompts ───────────────────────────────────────────────────────────
const JOURNAL_PROMPTS = [
  'What is one thing I am releasing today, and what am I welcoming in its place?',
  'Where in my life am I being called to trust my intuition more deeply?',
  'What does my highest self want me to know right now?',
  'What old story am I ready to rewrite about myself?',
  'How am I showing up for my own magic today?',
  'What would I do today if I knew I was fully supported by the universe?',
  'What emotion is asking for my attention right now, and what does it need?',
  'Where am I holding back, and what would it feel like to let go?',
  'What am I most grateful for in this exact moment?',
  'What does my body need today that I have been ignoring?',
  'If my life were a spell, what intention would I set for it today?',
  'What pattern am I ready to break free from in this lunar cycle?',
  'How can I bring more magic into my everyday routines?',
  'What is the universe trying to show me through recent challenges?',
  'What does my shadow self want me to acknowledge today?',
  'How am I growing, even when it is uncomfortable?',
  'What would I tell my younger self about the path I am walking?',
  'Where am I seeking validation outside myself, and how can I find it within?',
  'What does abundance look and feel like in my life right now?',
  'How am I honoring the sacred in my daily life?',
  'What dream or vision keeps returning to me, and what does it mean?',
  'Where am I being called to be more courageous?',
  'What relationship in my life is asking for more attention and care?',
  'How does my connection to nature nourish my spirit?',
  'What am I manifesting, and am I truly aligned with it?',
  'What does my intuition say about a decision I have been avoiding?',
  'How am I different from who I was one year ago?',
  'What would it feel like to fully trust the timing of my life?',
  'What is one small act of magic I can perform today?',
  'How am I contributing to the healing of the world around me?',
];

export function getDailyJournalPrompt(date: Date): string {
  return pickByDate(JOURNAL_PROMPTS, date, 5);
}

// ── Spell / Ritual Recommendation ─────────────────────────────────────────────
const DAILY_SPELLS = [
  { name: 'Morning Intention Candle', type: 'Candle Magic', duration: '5 min', description: 'Light a white candle and speak your intention for the day aloud three times. Visualize your day unfolding perfectly.', materials: ['White candle', 'Matches'] },
  { name: 'Gratitude Jar Ritual', type: 'Manifestation', duration: '10 min', description: 'Write three things you are grateful for on small papers and place them in a jar. Add a citrine chip to amplify the energy.', materials: ['Paper', 'Pen', 'Jar', 'Citrine'] },
  { name: 'Salt Circle Cleanse', type: 'Cleansing', duration: '15 min', description: 'Walk the perimeter of your home sprinkling salt while visualizing a protective white light sealing your space.', materials: ['Sea salt', 'Intention'] },
  { name: 'Moon Water Charging', type: 'Moon Magic', duration: '5 min', description: 'Place a glass of water on your windowsill to charge under the moon\'s energy. Use it in spells or drink it to absorb lunar power.', materials: ['Glass jar', 'Water', 'Moonlight'] },
  { name: 'Bay Leaf Wish Spell', type: 'Manifestation', duration: '5 min', description: 'Write your deepest wish on a bay leaf and burn it safely in a candle flame. As the smoke rises, your wish travels to the universe.', materials: ['Bay leaf', 'Pen', 'Candle'] },
  { name: 'Crystal Grid for Clarity', type: 'Crystal Magic', duration: '20 min', description: 'Arrange clear quartz points in a star pattern with amethyst in the center. Sit with the grid and ask for clarity on a question.', materials: ['Clear quartz', 'Amethyst', 'Intention'] },
  { name: 'Smoke Cleansing Ritual', type: 'Cleansing', duration: '10 min', description: 'Light sage or palo santo and move through your space, paying special attention to corners and doorways where energy stagnates.', materials: ['Sage or palo santo', 'Fireproof bowl'] },
  { name: 'Mirror Affirmation Spell', type: 'Self-Love', duration: '5 min', description: 'Look into your eyes in a mirror and speak three powerful affirmations aloud. Touch the mirror and say "So it is" to seal the magic.', materials: ['Mirror', 'Your voice'] },
  { name: 'Herb Bundle Charm', type: 'Herbal Magic', duration: '15 min', description: 'Bundle rosemary, lavender, and rose petals with twine. Hang it above your door to attract love, protection, and peace.', materials: ['Rosemary', 'Lavender', 'Rose petals', 'Twine'] },
  { name: 'Sigil Creation', type: 'Sigil Magic', duration: '10 min', description: 'Write your intention as a statement, remove vowels and repeating letters, then combine the remaining letters into a unique symbol. Charge it with your energy.', materials: ['Paper', 'Pen'] },
  { name: 'Tarot Daily Draw', type: 'Divination', duration: '10 min', description: 'Shuffle your deck while focusing on the question "What do I need to know today?" Draw one card and journal its message for you.', materials: ['Tarot deck', 'Journal'] },
  { name: 'Elemental Meditation', type: 'Meditation', duration: '15 min', description: 'Sit quietly and call in each element: Earth (north), Air (east), Fire (south), Water (west). Feel each element\'s energy moving through you.', materials: ['Quiet space', 'Intention'] },
  { name: 'Honey Jar Sweetening Spell', type: 'Attraction Magic', duration: '10 min', description: 'Write a name or situation on paper, fold it toward you, and place it in a jar of honey. Add rose petals and seal with pink wax.', materials: ['Honey jar', 'Paper', 'Pen', 'Rose petals', 'Pink candle'] },
  { name: 'Cord Cutting Ritual', type: 'Release Magic', duration: '15 min', description: 'Tie two ends of a cord to represent yourself and what you are releasing. Cut the cord with intention while visualizing the energetic tie dissolving.', materials: ['Cord or string', 'Scissors', 'Intention'] },
  { name: 'Full Moon Release Ritual', type: 'Moon Magic', duration: '20 min', description: 'Write everything you are releasing on paper. Under the moon, burn the paper safely and watch the smoke carry your burdens away.', materials: ['Paper', 'Pen', 'Fireproof bowl', 'Matches'] },
];

export function getDailySpell(date: Date) {
  return pickByDate(DAILY_SPELLS, date, 6);
}

// ── Daily Moon Phase ──────────────────────────────────────────────────────────
export function getDailyMoonData(date: Date) {
  // Use moon-phase-engine.ts (Meeus Ch. 47) — single source of truth
  const raw = getMoonPhase(date);
  // Map engine phase name → moon-ritual-data key for phaseInfo lookup
  const phaseKeyMap: Record<string, string> = {
    'New Moon': 'new_moon', 'Waxing Crescent': 'waxing_crescent',
    'First Quarter': 'first_quarter', 'Waxing Gibbous': 'waxing_gibbous',
    'Full Moon': 'full_moon', 'Waning Gibbous': 'waning_gibbous',
    'Last Quarter': 'last_quarter', 'Waning Crescent': 'waning_crescent',
  };
  const moonData = { phase: (phaseKeyMap[raw.phase] ?? 'new_moon') as Parameters<typeof getMoonPhaseInfo>[0], illumination: raw.illumination, age: raw.age };
  const phaseInfo = getMoonPhaseInfo(moonData.phase);
  return { ...moonData, phaseInfo };
}

// ── Upcoming Events (next 5) ──────────────────────────────────────────────────
export { getUpcomingEvents } from './astro-feed';

// ── All daily data in one call ────────────────────────────────────────────────
export interface DailyData {
  date: Date;
  moon: ReturnType<typeof getDailyMoonData>;
  card: ReturnType<typeof getDailyCard>;
  affirmation: string;
  herb: ReturnType<typeof getDailyHerb>;
  crystal: ReturnType<typeof getDailyCrystal>;
  journalPrompt: string;
  spell: ReturnType<typeof getDailySpell>;
}

export function getDailyData(date: Date = new Date()): DailyData {
  return {
    date,
    moon: getDailyMoonData(date),
    card: getDailyCard(date),
    affirmation: getDailyAffirmation(date),
    herb: getDailyHerb(date),
    crystal: getDailyCrystal(date),
    journalPrompt: getDailyJournalPrompt(date),
    spell: getDailySpell(date),
  };
}

// ── Moon phase display helpers ────────────────────────────────────────────────
export { MOON_PHASES };
