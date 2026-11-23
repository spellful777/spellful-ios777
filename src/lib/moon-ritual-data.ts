/**
 * moon-ritual-data.ts
 * All ritual content for the Moon Ritual Planner.
 * Pure data — no API calls, no side effects.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type MoonPhaseKey =
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export type IntentionKey =
  | 'love'
  | 'protection'
  | 'prosperity'
  | 'confidence'
  | 'healing'
  | 'new_beginnings'
  | 'manifestation'
  | 'clarity'
  | 'abundance'
  | 'courage'
  | 'gratitude'
  | 'release';

export interface RitualRecommendation {
  ritualName: string;
  description: string;
  herbs: string[];
  crystals: string[];
  affirmations: string[];
  journalPrompts: string[];
  steps: string[];
  candle: string;
  bestTime: string;
}

export interface MoonPhaseInfo {
  key: MoonPhaseKey;
  name: string;
  glyph: string;
  illumination: string;
  energy: string;
  keywords: string[];
  color: string; // CSS variable reference key
}

export interface IntentionInfo {
  key: IntentionKey;
  label: string;
  icon: string;
  color: string;
}

// ── Moon Phase Definitions ────────────────────────────────────────────────────

export const MOON_PHASES: MoonPhaseInfo[] = [
  {
    key: 'new_moon',
    name: 'New Moon',
    glyph: '🌑',
    illumination: '0%',
    energy: 'New beginnings, intention-setting, planting seeds',
    keywords: ['beginnings', 'intention', 'potential', 'silence', 'reset'],
    color: 'astro-moon',
  },
  {
    key: 'waxing_crescent',
    name: 'Waxing Crescent',
    glyph: '🌒',
    illumination: '1–49%',
    energy: 'Growth, momentum, taking first steps',
    keywords: ['growth', 'hope', 'courage', 'action', 'building'],
    color: 'primary',
  },
  {
    key: 'first_quarter',
    name: 'First Quarter',
    glyph: '🌓',
    illumination: '50%',
    energy: 'Decision-making, overcoming obstacles, commitment',
    keywords: ['decisions', 'strength', 'determination', 'challenge'],
    color: 'astro-sun',
  },
  {
    key: 'waxing_gibbous',
    name: 'Waxing Gibbous',
    glyph: '🌔',
    illumination: '51–99%',
    energy: 'Refinement, patience, fine-tuning your path',
    keywords: ['refinement', 'patience', 'trust', 'clarity', 'focus'],
    color: 'primary',
  },
  {
    key: 'full_moon',
    name: 'Full Moon',
    glyph: '🌕',
    illumination: '100%',
    energy: 'Culmination, manifestation, heightened intuition',
    keywords: ['manifestation', 'power', 'release', 'gratitude', 'clarity'],
    color: 'astro-sun',
  },
  {
    key: 'waning_gibbous',
    name: 'Waning Gibbous',
    glyph: '🌖',
    illumination: '99–51%',
    energy: 'Gratitude, sharing wisdom, releasing what no longer serves',
    keywords: ['gratitude', 'sharing', 'release', 'wisdom', 'reflection'],
    color: 'accent',
  },
  {
    key: 'last_quarter',
    name: 'Last Quarter',
    glyph: '🌗',
    illumination: '50%',
    energy: 'Letting go, forgiveness, breaking old patterns',
    keywords: ['release', 'forgiveness', 'clearing', 'surrender', 'endings'],
    color: 'astro-mars',
  },
  {
    key: 'waning_crescent',
    name: 'Waning Crescent',
    glyph: '🌘',
    illumination: '49–1%',
    energy: 'Rest, reflection, deep inner work, surrender',
    keywords: ['rest', 'reflection', 'surrender', 'healing', 'dreams'],
    color: 'grimoire-dream',
  },
];

// ── Intention Definitions ─────────────────────────────────────────────────────

export const INTENTIONS: IntentionInfo[] = [
  { key: 'love',           label: 'Love & Relationships', icon: '💕', color: 'astro-venus' },
  { key: 'protection',     label: 'Protection & Warding',  icon: '🛡️', color: 'astro-mars' },
  { key: 'prosperity',     label: 'Prosperity & Abundance', icon: '✨', color: 'primary' },
  { key: 'confidence',     label: 'Confidence & Courage',  icon: '🔥', color: 'astro-sun' },
  { key: 'healing',        label: 'Healing & Wellness',    icon: '🌿', color: 'grimoire-herb' },
  { key: 'new_beginnings', label: 'New Beginnings',        icon: '🌱', color: 'secondary' },
];

// ── Ritual Matrix ─────────────────────────────────────────────────────────────
// [phase][intention] → RitualRecommendation

type RitualMatrix = Record<MoonPhaseKey, Partial<Record<IntentionKey, RitualRecommendation>>>;

export const RITUAL_MATRIX: RitualMatrix = {
  new_moon: {
    love: {
      ritualName: 'New Moon Love Seed Ritual',
      description: 'Plant the seed of love under the dark sky. This ritual opens your heart to receive and radiate love in its purest form.',
      herbs: ['Rose petals', 'Lavender', 'Jasmine', 'Damiana'],
      crystals: ['Rose Quartz', 'Rhodonite', 'Moonstone'],
      affirmations: [
        'I am worthy of deep, nourishing love.',
        'My heart is open and ready to give and receive love.',
        'Love flows to me easily and naturally.',
      ],
      journalPrompts: [
        'What does my ideal loving relationship look and feel like?',
        'What old beliefs about love am I ready to release?',
        'How can I cultivate more self-love this lunar cycle?',
      ],
      steps: [
        'Cleanse your space with lavender smoke or sound.',
        'Light a pink candle and place rose quartz in front of it.',
        'Write your intention for love on pink paper.',
        'Sprinkle rose petals around the candle in a circle.',
        'Speak your affirmations aloud three times.',
        'Sit in quiet meditation for 5–10 minutes, visualizing love entering your life.',
        'Fold the paper toward you and keep it under your pillow until the full moon.',
      ],
      candle: 'Pink or red',
      bestTime: 'After sunset on the new moon night',
    },
    protection: {
      ritualName: 'New Moon Ward-Setting Ritual',
      description: 'Cast a protective circle at the new moon to shield your energy and space for the entire lunar cycle ahead.',
      herbs: ['Black salt', 'Rosemary', 'Sage', 'Mugwort'],
      crystals: ['Black Tourmaline', 'Obsidian', 'Smoky Quartz'],
      affirmations: [
        'I am safe, protected, and surrounded by light.',
        'Only love and positive energy may enter my space.',
        'I release all that does not serve my highest good.',
      ],
      journalPrompts: [
        'What areas of my life feel most vulnerable right now?',
        'What boundaries do I want to strengthen this cycle?',
        'Who or what drains my energy, and how can I protect myself?',
      ],
      steps: [
        'Cleanse your space thoroughly with sage or rosemary smoke.',
        'Sprinkle black salt across doorways and windowsills.',
        'Place black tourmaline at the four corners of your home or room.',
        'Light a black or white candle and state your protection intention.',
        'Visualize a golden shield of light surrounding your entire space.',
        'Speak your affirmations with conviction.',
        'Leave the crystals in place for the full lunar cycle.',
      ],
      candle: 'Black or white',
      bestTime: 'Midnight on the new moon',
    },
    prosperity: {
      ritualName: 'New Moon Abundance Seed Ritual',
      description: 'Plant the seeds of prosperity in fertile new moon soil. Set clear financial and material intentions for the cycle ahead.',
      herbs: ['Basil', 'Cinnamon', 'Bay laurel', 'Mint'],
      crystals: ['Citrine', 'Green Aventurine', 'Pyrite'],
      affirmations: [
        'I am a magnet for abundance and prosperity.',
        'Money flows to me easily and in alignment with my values.',
        'I am open to receiving unexpected blessings.',
      ],
      journalPrompts: [
        'What specific abundance am I calling in this lunar cycle?',
        'What limiting beliefs about money am I ready to release?',
        'How will I use my prosperity to serve others?',
      ],
      steps: [
        'Cleanse a green or gold candle with cinnamon oil.',
        'Write your financial intention on bay laurel leaf.',
        'Place citrine and pyrite beside the candle.',
        'Light the candle and burn the bay leaf in its flame (safely).',
        'Speak your affirmations while holding the citrine.',
        'Visualize your goal as already achieved in vivid detail.',
        'Let the candle burn down safely or snuff and relight nightly.',
      ],
      candle: 'Green or gold',
      bestTime: 'New moon evening, ideally during a waxing hour',
    },
    confidence: {
      ritualName: 'New Moon Solar Spark Ritual',
      description: 'Ignite your inner fire at the new moon. Call in courage, self-belief, and the boldness to step into your power.',
      herbs: ['Ginger', 'Cinnamon', 'Sunflower petals', 'Calendula'],
      crystals: ['Carnelian', 'Tiger\'s Eye', 'Sunstone'],
      affirmations: [
        'I am bold, capable, and worthy of success.',
        'I trust myself completely.',
        'My confidence grows stronger with each passing day.',
      ],
      journalPrompts: [
        'What bold action have I been afraid to take?',
        'When do I feel most powerfully myself?',
        'What would I do if I knew I could not fail?',
      ],
      steps: [
        'Take a cleansing shower or bath with ginger and cinnamon.',
        'Light an orange or yellow candle.',
        'Hold carnelian in your dominant hand.',
        'Speak your affirmations loudly and with full conviction.',
        'Write a list of 10 things you are proud of yourself for.',
        'Visualize yourself succeeding at your boldest goal.',
        'Carry the carnelian with you throughout the lunar cycle.',
      ],
      candle: 'Orange or yellow',
      bestTime: 'Sunrise or noon on the new moon day',
    },
    healing: {
      ritualName: 'New Moon Healing Intention Ritual',
      description: 'Set a powerful healing intention at the new moon. Call in restoration, wholeness, and gentle renewal for body, mind, and spirit.',
      herbs: ['Chamomile', 'Lavender', 'Echinacea', 'Calendula'],
      crystals: ['Amethyst', 'Clear Quartz', 'Green Fluorite'],
      affirmations: [
        'My body, mind, and spirit are healing and whole.',
        'I release all that no longer serves my wellbeing.',
        'I am worthy of deep healing and restoration.',
      ],
      journalPrompts: [
        'What aspect of myself most needs healing right now?',
        'What does true wellness look and feel like for me?',
        'What small act of self-care can I commit to this cycle?',
      ],
      steps: [
        'Draw a healing bath with chamomile and lavender.',
        'Light a blue or white candle beside the bath.',
        'Place amethyst and clear quartz at the four corners of the tub.',
        'Soak for at least 20 minutes, breathing deeply.',
        'Speak your healing affirmations aloud.',
        'After the bath, journal your healing intentions.',
        'Sleep with amethyst under your pillow.',
      ],
      candle: 'Blue or white',
      bestTime: 'Evening of the new moon',
    },
    new_beginnings: {
      ritualName: 'New Moon Fresh Start Ritual',
      description: 'The new moon is the ultimate symbol of new beginnings. This ritual clears the slate and opens the door to your next chapter.',
      herbs: ['Peppermint', 'Lemon verbena', 'Frankincense', 'Cedar'],
      crystals: ['Clear Quartz', 'Labradorite', 'Moonstone'],
      affirmations: [
        'I welcome new beginnings with open arms.',
        'Every ending is a doorway to something beautiful.',
        'I am ready for my next chapter.',
      ],
      journalPrompts: [
        'What chapter of my life am I ready to close?',
        'What does my ideal new beginning look like?',
        'What one step can I take tomorrow toward my fresh start?',
      ],
      steps: [
        'Thoroughly cleanse your space — physically and energetically.',
        'Open all windows to let in fresh air and new energy.',
        'Light a white candle and frankincense incense.',
        'Write everything you are releasing on paper, then burn it safely.',
        'On a fresh page, write your vision for this new chapter.',
        'Speak your affirmations while holding moonstone.',
        'Place clear quartz on your written vision to amplify it.',
      ],
      candle: 'White or silver',
      bestTime: 'New moon night, ideally at the exact new moon time',
    },
  },

  waxing_crescent: {
    love: {
      ritualName: 'Waxing Crescent Heart-Opening Ritual',
      description: 'As the moon grows, so does your capacity for love. This ritual builds momentum toward your love intentions.',
      herbs: ['Rose petals', 'Hibiscus', 'Yarrow', 'Vanilla'],
      crystals: ['Rose Quartz', 'Emerald', 'Pink Tourmaline'],
      affirmations: [
        'Love is growing in my life right now.',
        'I attract loving, supportive relationships.',
        'My heart expands with each passing day.',
      ],
      journalPrompts: [
        'What loving action can I take today?',
        'How am I showing up for love in my life?',
        'What does growing love feel like in my body?',
      ],
      steps: [
        'Light a pink candle and rose incense.',
        'Hold rose quartz over your heart center.',
        'Speak your affirmations while breathing deeply.',
        'Write a love letter to your future self or partner.',
        'Place the letter under rose quartz on your altar.',
        'Each night until the full moon, reread the letter and add to it.',
      ],
      candle: 'Pink',
      bestTime: 'Evening, as the crescent moon rises',
    },
    protection: {
      ritualName: 'Waxing Crescent Shield-Building Ritual',
      description: 'Strengthen your protective wards as the moon grows. Build energetic armor layer by layer.',
      herbs: ['Rosemary', 'Angelica root', 'Rue', 'Hyssop'],
      crystals: ['Black Tourmaline', 'Labradorite', 'Selenite'],
      affirmations: [
        'My protection grows stronger every day.',
        'I am shielded from all harm and negativity.',
        'My energy is mine alone to direct.',
      ],
      journalPrompts: [
        'What new boundaries am I building this cycle?',
        'Where do I need to strengthen my energetic defenses?',
        'How does it feel to be truly protected?',
      ],
      steps: [
        'Create a protection oil with rosemary and angelica in carrier oil.',
        'Anoint a black candle from base to wick (drawing protection in).',
        'Light the candle and hold labradorite.',
        'Visualize a growing shield of light around you.',
        'Speak your affirmations three times.',
        'Place selenite above your door to maintain the ward.',
      ],
      candle: 'Black or dark blue',
      bestTime: 'After dark, facing north',
    },
    prosperity: {
      ritualName: 'Waxing Crescent Money-Drawing Ritual',
      description: 'Draw prosperity toward you as the moon waxes. Take inspired action and watch abundance grow.',
      herbs: ['Basil', 'Clover', 'Chamomile', 'Allspice'],
      crystals: ['Citrine', 'Malachite', 'Jade'],
      affirmations: [
        'Abundance is flowing toward me now.',
        'I take inspired action toward my financial goals.',
        'Every day I grow wealthier in all ways.',
      ],
      journalPrompts: [
        'What concrete step toward prosperity can I take today?',
        'What skills or gifts can I offer the world for abundance?',
        'How does financial freedom feel in my body?',
      ],
      steps: [
        'Anoint a green candle with basil oil.',
        'Place coins and citrine around the candle.',
        'Write your financial goal on green paper.',
        'Fold the paper toward you three times.',
        'Light the candle and speak your affirmations.',
        'Each day until the full moon, add a coin to your altar.',
      ],
      candle: 'Green',
      bestTime: 'Thursday evening (Jupiter\'s day)',
    },
    confidence: {
      ritualName: 'Waxing Crescent Courage-Building Ritual',
      description: 'Build your confidence step by step as the moon grows. Each day, your inner fire burns brighter.',
      herbs: ['Ginger', 'Black pepper', 'Cinnamon', 'Bay laurel'],
      crystals: ['Carnelian', 'Red Jasper', 'Pyrite'],
      affirmations: [
        'My confidence builds with every breath.',
        'I am becoming bolder and more powerful each day.',
        'I face challenges with courage and grace.',
      ],
      journalPrompts: [
        'What one brave thing will I do today?',
        'How have I grown in confidence recently?',
        'What does my most confident self look like?',
      ],
      steps: [
        'Stand in sunlight (or visualize it) for 5 minutes.',
        'Light an orange candle and hold carnelian.',
        'Write three brave actions you will take this week.',
        'Speak your affirmations with power and conviction.',
        'Carry carnelian in your pocket as a confidence talisman.',
        'Each evening, journal one courageous thing you did that day.',
      ],
      candle: 'Orange or red',
      bestTime: 'Morning or midday',
    },
    healing: {
      ritualName: 'Waxing Crescent Restoration Ritual',
      description: 'Begin the active work of healing as the moon grows. Nourish yourself and build toward wholeness.',
      herbs: ['Chamomile', 'Lemon balm', 'St. John\'s Wort', 'Rosemary'],
      crystals: ['Amethyst', 'Lepidolite', 'Blue Lace Agate'],
      affirmations: [
        'I am actively healing and growing stronger.',
        'My body knows how to restore itself.',
        'I nourish myself with love and care.',
      ],
      journalPrompts: [
        'What does my body need most right now?',
        'What healing practice will I commit to this week?',
        'How am I already healing, even in small ways?',
      ],
      steps: [
        'Brew a healing tea with chamomile and lemon balm.',
        'Sit quietly and drink the tea mindfully.',
        'Light a blue candle and hold amethyst.',
        'Speak your healing affirmations while breathing deeply.',
        'Journal your healing intentions and progress.',
        'Commit to one healing practice daily until the full moon.',
      ],
      candle: 'Blue or green',
      bestTime: 'Morning, to set healing intentions for the day',
    },
    new_beginnings: {
      ritualName: 'Waxing Crescent First Steps Ritual',
      description: 'Take your first brave steps into the new. The crescent moon supports bold beginnings and fresh momentum.',
      herbs: ['Peppermint', 'Lemon verbena', 'Ginger', 'Clover'],
      crystals: ['Labradorite', 'Aventurine', 'Clear Quartz'],
      affirmations: [
        'I take bold steps toward my new beginning.',
        'Every step forward is a victory.',
        'I trust the path unfolding before me.',
      ],
      journalPrompts: [
        'What is the first concrete step toward my new beginning?',
        'What fears am I willing to move through?',
        'How will I celebrate my progress this week?',
      ],
      steps: [
        'Light a green or white candle.',
        'Hold labradorite and set your intention for the week.',
        'Write three specific actions you will take toward your new beginning.',
        'Speak your affirmations with excitement and belief.',
        'Place aventurine on your written action list.',
        'Take at least one action from your list before the next moon phase.',
      ],
      candle: 'Green or white',
      bestTime: 'Morning, to energize your day',
    },
  },

  first_quarter: {
    love: {
      ritualName: 'First Quarter Love Decision Ritual',
      description: 'The first quarter asks you to make a decision. Commit fully to love — whether that means opening your heart, having a difficult conversation, or choosing yourself.',
      herbs: ['Rose', 'Hawthorn berry', 'Yarrow', 'Damiana'],
      crystals: ['Rose Quartz', 'Garnet', 'Rhodochrosite'],
      affirmations: [
        'I choose love, in all its forms.',
        'I have the courage to be vulnerable.',
        'I commit fully to the love I desire.',
      ],
      journalPrompts: [
        'What decision about love have I been avoiding?',
        'What would choosing love look like right now?',
        'What am I willing to commit to in my relationships?',
      ],
      steps: [
        'Light a red and pink candle together.',
        'Hold garnet in your left hand and rose quartz in your right.',
        'Speak the decision you are making about love aloud.',
        'Write your commitment on paper and sign it.',
        'Speak your affirmations with full conviction.',
        'Burn the paper safely as a seal of your commitment.',
      ],
      candle: 'Red and pink',
      bestTime: 'When the half-moon is visible in the sky',
    },
    protection: {
      ritualName: 'First Quarter Boundary Ritual',
      description: 'The first quarter is a time of challenge and decision. Set firm boundaries and reinforce your protective magic.',
      herbs: ['Rue', 'Garlic', 'Black pepper', 'Vetiver'],
      crystals: ['Obsidian', 'Black Kyanite', 'Hematite'],
      affirmations: [
        'My boundaries are clear, firm, and respected.',
        'I protect my energy with love and strength.',
        'I have the power to say no.',
      ],
      journalPrompts: [
        'Where do I need to set a firmer boundary?',
        'What am I protecting myself from right now?',
        'How does it feel to honor my own limits?',
      ],
      steps: [
        'Create a boundary line with black salt across your doorway.',
        'Light a black candle and hold obsidian.',
        'State your boundaries clearly and firmly aloud.',
        'Visualize a wall of protective light around you.',
        'Speak your affirmations with authority.',
        'Carry hematite as a grounding protection stone.',
      ],
      candle: 'Black',
      bestTime: 'Midnight',
    },
    prosperity: {
      ritualName: 'First Quarter Abundance Action Ritual',
      description: 'The first quarter demands action. Take decisive steps toward your prosperity goals and push through any obstacles.',
      herbs: ['Cinnamon', 'Ginger', 'Bay laurel', 'Clove'],
      crystals: ['Pyrite', 'Citrine', 'Tiger\'s Eye'],
      affirmations: [
        'I take decisive action toward my financial goals.',
        'I overcome obstacles with ease and confidence.',
        'Prosperity rewards my bold action.',
      ],
      journalPrompts: [
        'What financial obstacle am I ready to push through?',
        'What bold action will I take for my prosperity today?',
        'How does financial success feel in my body?',
      ],
      steps: [
        'Write your biggest financial obstacle on paper.',
        'Light a gold candle and hold pyrite.',
        'Speak your affirmations with fierce determination.',
        'Burn the obstacle paper, releasing it.',
        'Write three bold actions you will take this week.',
        'Place tiger\'s eye on your action list as a power boost.',
      ],
      candle: 'Gold or green',
      bestTime: 'High noon — peak solar energy',
    },
    confidence: {
      ritualName: 'First Quarter Power Ritual',
      description: 'Stand in your power at the first quarter. Face your fears head-on and claim the confidence that is your birthright.',
      herbs: ['Cinnamon', 'Dragon\'s blood resin', 'Ginger', 'Clove'],
      crystals: ['Carnelian', 'Sunstone', 'Red Jasper'],
      affirmations: [
        'I stand in my full power.',
        'I face my fears with courage.',
        'Nothing can dim my inner light.',
      ],
      journalPrompts: [
        'What fear am I ready to face today?',
        'When have I been most powerfully myself?',
        'What would I do if I were completely fearless?',
      ],
      steps: [
        'Stand barefoot on the earth (or visualize it).',
        'Light a red candle and dragon\'s blood incense.',
        'Hold carnelian and feel its fiery energy.',
        'Speak your affirmations loudly, with your whole body.',
        'Write the fear you are facing and burn it.',
        'Do one thing today that scares you.',
      ],
      candle: 'Red',
      bestTime: 'Noon or early afternoon',
    },
    healing: {
      ritualName: 'First Quarter Healing Challenge Ritual',
      description: 'Healing is not always easy. The first quarter asks you to face what needs healing with courage and commitment.',
      herbs: ['Yarrow', 'Echinacea', 'Ginger', 'Turmeric'],
      crystals: ['Malachite', 'Bloodstone', 'Clear Quartz'],
      affirmations: [
        'I face my healing with courage and compassion.',
        'I am stronger than what I am healing from.',
        'Every challenge makes me more whole.',
      ],
      journalPrompts: [
        'What aspect of my healing requires the most courage?',
        'What am I willing to face that I have been avoiding?',
        'How has my healing journey made me stronger?',
      ],
      steps: [
        'Light a green candle and hold malachite.',
        'Write what you are healing from honestly and fully.',
        'Speak your affirmations with compassion for yourself.',
        'Visualize the healing already complete.',
        'Commit to one difficult healing action this week.',
        'Place bloodstone under your pillow for healing dreams.',
      ],
      candle: 'Green',
      bestTime: 'Midday, when the sun is strong',
    },
    new_beginnings: {
      ritualName: 'First Quarter Commitment Ritual',
      description: 'Commit fully to your new beginning. The first quarter tests your resolve — show the universe you are serious.',
      herbs: ['Bay laurel', 'Frankincense', 'Cinnamon', 'Clove'],
      crystals: ['Labradorite', 'Garnet', 'Clear Quartz'],
      affirmations: [
        'I am fully committed to my new path.',
        'I push through obstacles with grace.',
        'My new beginning is worth every challenge.',
      ],
      journalPrompts: [
        'What is testing my commitment to this new beginning?',
        'Why does this new chapter matter so deeply to me?',
        'What will I do when I face the next obstacle?',
      ],
      steps: [
        'Light a white and red candle together.',
        'Hold garnet and state your commitment aloud.',
        'Write a commitment contract to yourself.',
        'Sign it and place it on your altar.',
        'Speak your affirmations with fierce determination.',
        'Identify the next obstacle and plan how you will overcome it.',
      ],
      candle: 'White and red',
      bestTime: 'When the half-moon is visible',
    },
  },

  waxing_gibbous: {
    love: {
      ritualName: 'Waxing Gibbous Love Refinement Ritual',
      description: 'Refine and deepen your love intentions as the moon nears fullness. Trust the process and prepare to receive.',
      herbs: ['Rose', 'Jasmine', 'Ylang ylang', 'Neroli'],
      crystals: ['Rose Quartz', 'Kunzite', 'Moonstone'],
      affirmations: [
        'Love is blossoming in my life.',
        'I trust divine timing in love.',
        'I am ready to receive the love I deserve.',
      ],
      journalPrompts: [
        'How has my relationship with love evolved this cycle?',
        'What am I grateful for in my love life right now?',
        'How am I preparing to receive more love?',
      ],
      steps: [
        'Create a love altar with roses, pink candles, and rose quartz.',
        'Anoint yourself with jasmine or ylang ylang oil.',
        'Meditate on your heart center for 10 minutes.',
        'Speak your affirmations with deep feeling.',
        'Write a gratitude list for love already in your life.',
        'Sleep with moonstone under your pillow.',
      ],
      candle: 'Pink or white',
      bestTime: 'Evening, as the nearly-full moon rises',
    },
    protection: {
      ritualName: 'Waxing Gibbous Final Ward Ritual',
      description: 'Complete your protective work before the full moon. Seal your wards and prepare for the peak of your protective magic.',
      herbs: ['Frankincense', 'Myrrh', 'Angelica', 'Copal'],
      crystals: ['Black Tourmaline', 'Selenite', 'Amethyst'],
      affirmations: [
        'My protection is complete and powerful.',
        'I am sealed in divine light.',
        'No harm can reach me.',
      ],
      journalPrompts: [
        'Do I feel protected in all areas of my life?',
        'What final adjustments do my wards need?',
        'How does complete safety feel in my body?',
      ],
      steps: [
        'Walk the perimeter of your home with frankincense smoke.',
        'Place selenite above every door and window.',
        'Light a white candle and hold black tourmaline.',
        'Speak your protection affirmations with authority.',
        'Visualize your home and aura sealed in white light.',
        'Thank your guides and ancestors for their protection.',
      ],
      candle: 'White',
      bestTime: 'Night, when the nearly-full moon is high',
    },
    prosperity: {
      ritualName: 'Waxing Gibbous Abundance Amplification',
      description: 'Amplify your prosperity magic as the moon nears fullness. Trust that abundance is on its way.',
      herbs: ['Mint', 'Basil', 'Cinnamon', 'Nutmeg'],
      crystals: ['Citrine', 'Green Aventurine', 'Jade'],
      affirmations: [
        'Abundance is flowing to me now.',
        'I trust that prosperity is on its way.',
        'I am grateful for the abundance already in my life.',
      ],
      journalPrompts: [
        'What abundance has already arrived this cycle?',
        'How am I making space to receive more?',
        'What am I grateful for in my financial life?',
      ],
      steps: [
        'Count your blessings — literally list everything you have.',
        'Light a gold candle and hold citrine.',
        'Speak your affirmations with genuine gratitude.',
        'Write a check to yourself for your desired amount.',
        'Place it under citrine on your altar.',
        'Visualize your prosperity goal as already achieved.',
      ],
      candle: 'Gold',
      bestTime: 'Evening, as the moon grows',
    },
    confidence: {
      ritualName: 'Waxing Gibbous Confidence Peak Ritual',
      description: 'Your confidence is nearly at its peak. Prepare to step fully into your power at the full moon.',
      herbs: ['Cinnamon', 'Sunflower', 'Calendula', 'Saffron'],
      crystals: ['Sunstone', 'Carnelian', 'Golden Topaz'],
      affirmations: [
        'I am almost at my full power.',
        'I trust myself completely.',
        'I am ready to shine.',
      ],
      journalPrompts: [
        'How has my confidence grown this cycle?',
        'What am I most proud of myself for?',
        'How will I express my full confidence at the full moon?',
      ],
      steps: [
        'Dress in something that makes you feel powerful.',
        'Light a yellow or gold candle.',
        'Hold sunstone and feel its warm, confident energy.',
        'Speak your affirmations while looking in a mirror.',
        'Write a list of your greatest strengths.',
        'Plan one bold, visible action to take at the full moon.',
      ],
      candle: 'Yellow or gold',
      bestTime: 'Midday or early afternoon',
    },
    healing: {
      ritualName: 'Waxing Gibbous Deep Healing Ritual',
      description: 'Go deeper into your healing as the moon nears fullness. Trust the process and prepare for a breakthrough.',
      herbs: ['Lavender', 'Chamomile', 'Lemon balm', 'Passionflower'],
      crystals: ['Amethyst', 'Lepidolite', 'Aquamarine'],
      affirmations: [
        'I am healing at the deepest level.',
        'I trust my body\'s wisdom.',
        'A breakthrough is coming.',
      ],
      journalPrompts: [
        'What deep healing is happening beneath the surface?',
        'What do I need to release to complete my healing?',
        'How will I celebrate my healing at the full moon?',
      ],
      steps: [
        'Take a healing bath with lavender and chamomile.',
        'Light a blue candle and hold amethyst.',
        'Speak your healing affirmations with deep feeling.',
        'Journal about your healing journey so far.',
        'Write what you are ready to release at the full moon.',
        'Sleep with lepidolite for deep, healing rest.',
      ],
      candle: 'Blue or purple',
      bestTime: 'Evening or before sleep',
    },
    new_beginnings: {
      ritualName: 'Waxing Gibbous Preparation Ritual',
      description: 'Prepare for the full manifestation of your new beginning. Trust and refine your vision.',
      herbs: ['Frankincense', 'Sandalwood', 'Peppermint', 'Lemon'],
      crystals: ['Clear Quartz', 'Labradorite', 'Moonstone'],
      affirmations: [
        'My new beginning is almost here.',
        'I trust the timing of my life.',
        'I am ready for everything I have been working toward.',
      ],
      journalPrompts: [
        'How close am I to my new beginning?',
        'What final preparations do I need to make?',
        'How will I celebrate when my new beginning arrives?',
      ],
      steps: [
        'Review the intentions you set at the new moon.',
        'Light a white candle and hold clear quartz.',
        'Speak your affirmations with excited anticipation.',
        'Visualize your new beginning in complete detail.',
        'Write a letter to your future self, dated one month from now.',
        'Place moonstone on the letter to amplify the magic.',
      ],
      candle: 'White or silver',
      bestTime: 'Evening, as the nearly-full moon rises',
    },
  },

  full_moon: {
    love: {
      ritualName: 'Full Moon Love Manifestation Ritual',
      description: 'The full moon is the most powerful time for love magic. Manifest your deepest heart\'s desires under the peak of lunar energy.',
      herbs: ['Rose petals', 'Jasmine', 'Hibiscus', 'Damiana'],
      crystals: ['Rose Quartz', 'Moonstone', 'Garnet'],
      affirmations: [
        'I am fully open to giving and receiving love.',
        'My love life is abundant and fulfilling.',
        'I am deeply loved and cherished.',
      ],
      journalPrompts: [
        'What love has manifested in my life this cycle?',
        'What am I releasing that has blocked love?',
        'How does it feel to be completely loved?',
      ],
      steps: [
        'Create a sacred love altar with roses, candles, and crystals.',
        'Bathe in rose water under the moonlight if possible.',
        'Light a red and pink candle.',
        'Write your love manifestation on pink paper.',
        'Charge rose quartz in the moonlight.',
        'Speak your affirmations with your whole heart.',
        'Release any love that no longer serves you into the moon.',
      ],
      candle: 'Red and pink',
      bestTime: 'When the full moon is at its peak',
    },
    protection: {
      ritualName: 'Full Moon Protection Ritual',
      description: 'Harness the full moon\'s peak power to create the strongest protective magic of the cycle.',
      herbs: ['Sage', 'Frankincense', 'Myrrh', 'Rue'],
      crystals: ['Black Tourmaline', 'Obsidian', 'Selenite'],
      affirmations: [
        'I am protected by the full power of the moon.',
        'I release all negative energy and attachments.',
        'I am surrounded by divine light and love.',
      ],
      journalPrompts: [
        'What have I successfully protected myself from this cycle?',
        'What negative energy am I releasing tonight?',
        'How does complete protection feel?',
      ],
      steps: [
        'Cleanse all your crystals in the moonlight.',
        'Create a full protection circle with salt.',
        'Light a white candle in the center.',
        'Burn sage and frankincense together.',
        'Speak your protection affirmations with full power.',
        'Charge your protection crystals overnight in the moonlight.',
        'Release all fear and anxiety into the moon.',
      ],
      candle: 'White or black',
      bestTime: 'Midnight on the full moon',
    },
    prosperity: {
      ritualName: 'Full Moon Abundance Manifestation',
      description: 'The full moon is the peak of manifestation energy. Call in your greatest prosperity under the full lunar light.',
      herbs: ['Basil', 'Mint', 'Cinnamon', 'Bay laurel'],
      crystals: ['Citrine', 'Pyrite', 'Green Aventurine'],
      affirmations: [
        'I am abundant in all areas of my life.',
        'Money and opportunities flow to me effortlessly.',
        'I am grateful for my overflowing prosperity.',
      ],
      journalPrompts: [
        'What abundance has manifested this lunar cycle?',
        'What am I releasing that has blocked my prosperity?',
        'How will I use my abundance to serve others?',
      ],
      steps: [
        'Charge all your prosperity crystals in the moonlight.',
        'Light a gold candle and burn bay laurel leaves.',
        'Count your blessings and speak them aloud.',
        'Write a gratitude list for all your abundance.',
        'Speak your affirmations under the open sky if possible.',
        'Release any scarcity mindset into the moon.',
        'Leave citrine in the moonlight overnight.',
      ],
      candle: 'Gold or green',
      bestTime: 'When the full moon is highest in the sky',
    },
    confidence: {
      ritualName: 'Full Moon Power Activation',
      description: 'Step into your full power under the full moon. This is your moment to shine brightest.',
      herbs: ['Cinnamon', 'Dragon\'s blood', 'Sunflower', 'Calendula'],
      crystals: ['Sunstone', 'Carnelian', 'Clear Quartz'],
      affirmations: [
        'I am at my full power.',
        'I shine my light for all to see.',
        'I am confident, capable, and magnificent.',
      ],
      journalPrompts: [
        'How have I grown in confidence this cycle?',
        'What am I most proud of myself for?',
        'How will I express my full power going forward?',
      ],
      steps: [
        'Stand in the moonlight and raise your arms to the sky.',
        'Feel the moon\'s energy filling you with power.',
        'Light a gold candle and hold sunstone.',
        'Speak your affirmations loudly under the moon.',
        'Dance, sing, or move your body in celebration.',
        'Write a declaration of your power and read it aloud.',
        'Charge your confidence crystals in the moonlight.',
      ],
      candle: 'Gold or orange',
      bestTime: 'When the full moon is at its peak',
    },
    healing: {
      ritualName: 'Full Moon Healing Release Ritual',
      description: 'Release what has been blocking your healing under the full moon\'s powerful light. Receive deep restoration.',
      herbs: ['Lavender', 'Eucalyptus', 'Rosemary', 'Mugwort'],
      crystals: ['Amethyst', 'Clear Quartz', 'Selenite'],
      affirmations: [
        'I release all that has blocked my healing.',
        'I am healed, whole, and complete.',
        'The moon\'s light restores me fully.',
      ],
      journalPrompts: [
        'What have I healed this lunar cycle?',
        'What am I releasing tonight for my complete healing?',
        'How does complete wholeness feel?',
      ],
      steps: [
        'Take a healing bath with lavender and eucalyptus.',
        'Charge amethyst and selenite in the moonlight.',
        'Light a blue candle and hold clear quartz.',
        'Write what you are releasing for your healing.',
        'Burn the paper safely, releasing it to the moon.',
        'Speak your healing affirmations under the moonlight.',
        'Sleep with selenite on your chest for deep healing.',
      ],
      candle: 'Blue or white',
      bestTime: 'Midnight on the full moon',
    },
    new_beginnings: {
      ritualName: 'Full Moon Manifestation Ritual',
      description: 'Your new beginning is here. Celebrate what has manifested and release what no longer serves your path.',
      herbs: ['Frankincense', 'Sandalwood', 'Rose', 'Jasmine'],
      crystals: ['Moonstone', 'Clear Quartz', 'Labradorite'],
      affirmations: [
        'My new beginning has arrived.',
        'I celebrate how far I have come.',
        'I release the old and embrace the new with joy.',
      ],
      journalPrompts: [
        'What has manifested from my new moon intentions?',
        'What am I releasing to make space for more?',
        'How will I celebrate this new chapter?',
      ],
      steps: [
        'Read the intentions you set at the new moon.',
        'Celebrate what has manifested — no matter how small.',
        'Light a white candle and hold moonstone.',
        'Write what you are releasing to make space for more.',
        'Burn the release paper under the moonlight.',
        'Speak your affirmations with deep gratitude.',
        'Charge all your crystals in the moonlight overnight.',
      ],
      candle: 'White or silver',
      bestTime: 'When the full moon is at its peak',
    },
  },

  waning_gibbous: {
    love: {
      ritualName: 'Waning Gibbous Love Gratitude Ritual',
      description: 'Express deep gratitude for love as the moon begins to wane. Share your love freely and release what no longer serves.',
      herbs: ['Rose', 'Lavender', 'Chamomile', 'Vanilla'],
      crystals: ['Rose Quartz', 'Rhodonite', 'Lepidolite'],
      affirmations: [
        'I am grateful for all the love in my life.',
        'I release love that no longer serves my highest good.',
        'I share my love freely and abundantly.',
      ],
      journalPrompts: [
        'What love am I most grateful for right now?',
        'What relationship patterns am I ready to release?',
        'How can I share more love with those around me?',
      ],
      steps: [
        'Write a gratitude list for all the love in your life.',
        'Light a pink candle and hold rose quartz.',
        'Speak your affirmations with deep gratitude.',
        'Write a love letter to someone important to you.',
        'Release any resentment or hurt from past relationships.',
        'Perform a small act of love for someone today.',
      ],
      candle: 'Pink or lavender',
      bestTime: 'Evening, as the waning moon rises',
    },
    protection: {
      ritualName: 'Waning Gibbous Energy Clearing Ritual',
      description: 'Clear and release negative energy as the moon wanes. Let go of what has been draining your protective reserves.',
      herbs: ['Sage', 'Palo santo', 'Lemon', 'Hyssop'],
      crystals: ['Selenite', 'Black Tourmaline', 'Smoky Quartz'],
      affirmations: [
        'I release all negative energy from my space and aura.',
        'I am clearing and renewing my protection.',
        'I let go of all that drains my energy.',
      ],
      journalPrompts: [
        'What negative energy am I releasing this week?',
        'Who or what has been draining my protective energy?',
        'How does it feel to be completely cleared?',
      ],
      steps: [
        'Thoroughly cleanse your space with sage or palo santo.',
        'Cleanse your aura by visualizing smoke clearing your energy field.',
        'Light a white candle and hold selenite.',
        'Speak your clearing affirmations with intention.',
        'Journal about what you are releasing.',
        'Place smoky quartz in corners to absorb remaining negativity.',
      ],
      candle: 'White',
      bestTime: 'After sunset',
    },
    prosperity: {
      ritualName: 'Waning Gibbous Gratitude Ritual',
      description: 'Give thanks for the abundance you have received and release scarcity thinking as the moon wanes.',
      herbs: ['Mint', 'Chamomile', 'Lemon balm', 'Basil'],
      crystals: ['Citrine', 'Jade', 'Green Aventurine'],
      affirmations: [
        'I am deeply grateful for my abundance.',
        'I release all scarcity thinking.',
        'I share my prosperity generously.',
      ],
      journalPrompts: [
        'What abundance am I most grateful for?',
        'What scarcity beliefs am I releasing?',
        'How can I share my prosperity with others?',
      ],
      steps: [
        'Count your blessings and write them down.',
        'Light a green candle and hold jade.',
        'Speak your gratitude affirmations with genuine feeling.',
        'Make a donation or perform an act of generosity.',
        'Release any feelings of "not enough" into the waning moon.',
        'Journal about the abundance you are grateful for.',
      ],
      candle: 'Green',
      bestTime: 'Evening',
    },
    confidence: {
      ritualName: 'Waning Gibbous Wisdom Ritual',
      description: 'Reflect on your growth and share your wisdom as the moon wanes. Release self-doubt and integrate your confidence.',
      herbs: ['Sage', 'Rosemary', 'Thyme', 'Lavender'],
      crystals: ['Sodalite', 'Lapis Lazuli', 'Amethyst'],
      affirmations: [
        'I am wise and I share my gifts freely.',
        'I release all self-doubt.',
        'My confidence is integrated and lasting.',
      ],
      journalPrompts: [
        'What wisdom have I gained this cycle?',
        'What self-doubt am I ready to release?',
        'How can I share my confidence with others?',
      ],
      steps: [
        'Light a purple candle and hold lapis lazuli.',
        'Reflect on your growth this lunar cycle.',
        'Write down the wisdom you have gained.',
        'Release self-doubt by writing it and burning it.',
        'Speak your affirmations with quiet confidence.',
        'Share your wisdom with someone who needs it.',
      ],
      candle: 'Purple or blue',
      bestTime: 'Evening',
    },
    healing: {
      ritualName: 'Waning Gibbous Integration Ritual',
      description: 'Integrate your healing and share your journey. Release what has been holding back your full recovery.',
      herbs: ['Lavender', 'Chamomile', 'Lemon balm', 'Rosemary'],
      crystals: ['Amethyst', 'Lepidolite', 'Blue Lace Agate'],
      affirmations: [
        'I integrate my healing with gratitude.',
        'I release the last of what has been blocking me.',
        'I am grateful for how far I have come.',
      ],
      journalPrompts: [
        'What healing have I integrated this cycle?',
        'What is the last thing I need to release?',
        'How has this healing changed me?',
      ],
      steps: [
        'Take a gentle, restorative bath.',
        'Light a blue candle and hold lepidolite.',
        'Journal about your healing journey.',
        'Release the last of what has been blocking you.',
        'Speak your affirmations with deep self-compassion.',
        'Rest and allow your healing to integrate fully.',
      ],
      candle: 'Blue or lavender',
      bestTime: 'Before sleep',
    },
    new_beginnings: {
      ritualName: 'Waning Gibbous Wisdom Harvest',
      description: 'Harvest the wisdom from your new beginning and share it. Release what did not serve your new path.',
      herbs: ['Sage', 'Frankincense', 'Sandalwood', 'Lavender'],
      crystals: ['Labradorite', 'Moonstone', 'Amethyst'],
      affirmations: [
        'I harvest the wisdom of my new beginning.',
        'I release what did not serve my path.',
        'I am grateful for every step of my journey.',
      ],
      journalPrompts: [
        'What wisdom has this new beginning taught me?',
        'What did not work, and what can I learn from it?',
        'How will I apply this wisdom going forward?',
      ],
      steps: [
        'Review your journey since the new moon.',
        'Light a purple candle and hold labradorite.',
        'Write the lessons you have learned.',
        'Release what did not serve you.',
        'Speak your affirmations with gratitude.',
        'Share your journey with someone you trust.',
      ],
      candle: 'Purple or white',
      bestTime: 'Evening',
    },
  },

  last_quarter: {
    love: {
      ritualName: 'Last Quarter Love Release Ritual',
      description: 'Release old love wounds, toxic patterns, and what no longer serves your heart. Make space for the love you deserve.',
      herbs: ['Rose', 'Lavender', 'Yarrow', 'Mugwort'],
      crystals: ['Rhodonite', 'Lepidolite', 'Black Tourmaline'],
      affirmations: [
        'I release all love that no longer serves me.',
        'I forgive myself and others completely.',
        'I make space for the love I truly deserve.',
      ],
      journalPrompts: [
        'What old love wound am I ready to release?',
        'Who do I need to forgive — including myself?',
        'What love pattern am I breaking free from?',
      ],
      steps: [
        'Write everything you are releasing from your love life.',
        'Light a black candle and hold rhodonite.',
        'Speak your release affirmations with conviction.',
        'Burn the release paper safely.',
        'Take a cleansing bath with lavender and rose.',
        'Forgive yourself and others in your journal.',
      ],
      candle: 'Black or dark red',
      bestTime: 'Midnight',
    },
    protection: {
      ritualName: 'Last Quarter Banishing Ritual',
      description: 'Banish negative influences and break harmful patterns. The last quarter is the most powerful time for banishing magic.',
      herbs: ['Black salt', 'Rue', 'Garlic', 'Pepper'],
      crystals: ['Obsidian', 'Black Kyanite', 'Smoky Quartz'],
      affirmations: [
        'I banish all negativity from my life.',
        'I break free from harmful patterns.',
        'I am free from all that has harmed me.',
      ],
      journalPrompts: [
        'What negative influence am I banishing?',
        'What harmful pattern am I breaking?',
        'How does freedom from this feel?',
      ],
      steps: [
        'Write what you are banishing on black paper.',
        'Light a black candle and hold obsidian.',
        'Speak your banishing affirmations with authority.',
        'Burn the paper and scatter the ashes outside.',
        'Cleanse your space thoroughly with black salt.',
        'Seal your space with a protection prayer.',
      ],
      candle: 'Black',
      bestTime: 'Midnight or the dark hours',
    },
    prosperity: {
      ritualName: 'Last Quarter Debt Release Ritual',
      description: 'Release financial blocks, debt energy, and scarcity patterns. Clear the way for new prosperity.',
      herbs: ['Lemon', 'Hyssop', 'Sage', 'Cedar'],
      crystals: ['Smoky Quartz', 'Black Tourmaline', 'Citrine'],
      affirmations: [
        'I release all financial blocks and debt energy.',
        'I break free from scarcity patterns.',
        'I am clearing the way for new abundance.',
      ],
      journalPrompts: [
        'What financial pattern am I breaking?',
        'What beliefs about money am I releasing?',
        'How will my finances look when I am free from this?',
      ],
      steps: [
        'Write your financial blocks and limiting beliefs.',
        'Light a black candle and hold smoky quartz.',
        'Speak your release affirmations with determination.',
        'Burn the paper, releasing the energy.',
        'Cleanse your wallet and financial spaces.',
        'Place citrine in your wallet to attract new prosperity.',
      ],
      candle: 'Black or dark green',
      bestTime: 'After midnight',
    },
    confidence: {
      ritualName: 'Last Quarter Shadow Work Ritual',
      description: 'Face your shadow and release self-limiting beliefs. True confidence comes from knowing and accepting all of yourself.',
      herbs: ['Mugwort', 'Wormwood', 'Sage', 'Myrrh'],
      crystals: ['Obsidian', 'Labradorite', 'Smoky Quartz'],
      affirmations: [
        'I face my shadow with courage and compassion.',
        'I release all self-limiting beliefs.',
        'I accept and love all parts of myself.',
      ],
      journalPrompts: [
        'What shadow aspect of myself am I ready to face?',
        'What self-limiting belief am I releasing?',
        'How does self-acceptance feel?',
      ],
      steps: [
        'Create a quiet, safe space for deep inner work.',
        'Light a black candle and hold obsidian.',
        'Journal about your shadow — what you hide, fear, or deny.',
        'Speak your affirmations with deep self-compassion.',
        'Burn what you are releasing.',
        'Thank your shadow for its protection and release it.',
      ],
      candle: 'Black or dark purple',
      bestTime: 'Late night, in quiet darkness',
    },
    healing: {
      ritualName: 'Last Quarter Deep Release Ritual',
      description: 'Release the deepest layers of what has been blocking your healing. The last quarter supports profound letting go.',
      herbs: ['Mugwort', 'Yarrow', 'Sage', 'Lavender'],
      crystals: ['Obsidian', 'Malachite', 'Lepidolite'],
      affirmations: [
        'I release the deepest layers of my pain.',
        'I let go of what I have been holding onto.',
        'I am free to heal completely.',
      ],
      journalPrompts: [
        'What is the deepest thing I am ready to release?',
        'What have I been holding onto that is preventing my healing?',
        'How does complete release feel?',
      ],
      steps: [
        'Create a safe, private space for deep work.',
        'Light a black candle and hold malachite.',
        'Write the deepest thing you are releasing.',
        'Allow yourself to feel it fully, then let it go.',
        'Burn the paper and speak your release affirmations.',
        'Take a cleansing bath and rest deeply.',
      ],
      candle: 'Black or dark blue',
      bestTime: 'Late night',
    },
    new_beginnings: {
      ritualName: 'Last Quarter Clearing Ritual',
      description: 'Clear the old completely to make space for your new beginning. Release the past with gratitude and love.',
      herbs: ['Sage', 'Cedar', 'Frankincense', 'Palo santo'],
      crystals: ['Obsidian', 'Smoky Quartz', 'Clear Quartz'],
      affirmations: [
        'I release the old completely and with love.',
        'I am clearing space for my new beginning.',
        'I am grateful for the past and ready for the future.',
      ],
      journalPrompts: [
        'What from the past am I finally ready to release?',
        'How has the old chapter served me?',
        'What space am I creating for my new beginning?',
      ],
      steps: [
        'Thoroughly cleanse your home and sacred space.',
        'Light a black candle and hold obsidian.',
        'Write everything from the old chapter you are releasing.',
        'Burn the paper with gratitude.',
        'Speak your clearing affirmations.',
        'Open windows and let fresh air in.',
      ],
      candle: 'Black then white',
      bestTime: 'Midnight',
    },
  },

  waning_crescent: {
    love: {
      ritualName: 'Waning Crescent Love Rest Ritual',
      description: 'Rest in the quiet of the waning crescent. Surrender love to the divine and prepare for the new cycle.',
      herbs: ['Lavender', 'Chamomile', 'Mugwort', 'Passionflower'],
      crystals: ['Moonstone', 'Lepidolite', 'Selenite'],
      affirmations: [
        'I surrender love to the divine.',
        'I rest in the knowing that love is coming.',
        'I trust the universe with my heart.',
      ],
      journalPrompts: [
        'What have I learned about love this cycle?',
        'How am I preparing my heart for the next cycle?',
        'What does surrendering love to the divine mean to me?',
      ],
      steps: [
        'Create a quiet, restful space.',
        'Brew chamomile and lavender tea.',
        'Light a white candle and hold moonstone.',
        'Meditate on surrendering love to the divine.',
        'Journal your love lessons from this cycle.',
        'Sleep with selenite for peaceful, loving dreams.',
      ],
      candle: 'White or silver',
      bestTime: 'Before sleep',
    },
    protection: {
      ritualName: 'Waning Crescent Rest and Renew Ritual',
      description: 'Rest your protective magic and renew your energy before the new cycle. Surrender and trust in divine protection.',
      herbs: ['Lavender', 'Chamomile', 'Mugwort', 'Valerian'],
      crystals: ['Selenite', 'Moonstone', 'Amethyst'],
      affirmations: [
        'I rest in divine protection.',
        'I surrender my need to control.',
        'I am safe even in the darkness.',
      ],
      journalPrompts: [
        'What have I learned about protection this cycle?',
        'Where can I surrender control and trust?',
        'How does resting in safety feel?',
      ],
      steps: [
        'Take a gentle, relaxing bath.',
        'Light a white candle and hold selenite.',
        'Meditate on surrendering to divine protection.',
        'Journal your protection lessons.',
        'Speak your affirmations softly and with trust.',
        'Sleep with amethyst for protected, peaceful sleep.',
      ],
      candle: 'White',
      bestTime: 'Before sleep',
    },
    prosperity: {
      ritualName: 'Waning Crescent Surrender Ritual',
      description: 'Surrender your prosperity goals to the divine and rest before the new cycle. Trust that abundance is always available.',
      herbs: ['Chamomile', 'Lavender', 'Lemon balm', 'Mint'],
      crystals: ['Moonstone', 'Selenite', 'Clear Quartz'],
      affirmations: [
        'I surrender my prosperity to divine timing.',
        'I rest in the knowing that abundance is always available.',
        'I trust the universe to provide.',
      ],
      journalPrompts: [
        'What have I learned about abundance this cycle?',
        'Where am I being called to surrender and trust?',
        'How will I approach prosperity differently next cycle?',
      ],
      steps: [
        'Sit quietly and breathe deeply.',
        'Light a white candle and hold moonstone.',
        'Meditate on surrendering your prosperity goals.',
        'Journal your abundance lessons.',
        'Speak your affirmations with deep trust.',
        'Rest and allow the universe to work on your behalf.',
      ],
      candle: 'White or silver',
      bestTime: 'Evening or before sleep',
    },
    confidence: {
      ritualName: 'Waning Crescent Inner Reflection Ritual',
      description: 'Rest and reflect on your inner journey. The waning crescent invites deep introspection and quiet confidence.',
      herbs: ['Lavender', 'Mugwort', 'Chamomile', 'Valerian'],
      crystals: ['Moonstone', 'Labradorite', 'Amethyst'],
      affirmations: [
        'I rest in quiet confidence.',
        'I trust my inner wisdom.',
        'I am enough, exactly as I am.',
      ],
      journalPrompts: [
        'What have I learned about myself this cycle?',
        'Where does my deepest confidence come from?',
        'How will I carry this confidence into the next cycle?',
      ],
      steps: [
        'Create a quiet, dark, sacred space.',
        'Light a single white candle.',
        'Hold moonstone and breathe deeply.',
        'Meditate in silence for 15–20 minutes.',
        'Journal your inner reflections.',
        'Speak your affirmations softly, as a whisper to yourself.',
      ],
      candle: 'White',
      bestTime: 'Late night or before sleep',
    },
    healing: {
      ritualName: 'Waning Crescent Deep Rest Ritual',
      description: 'Rest deeply and allow your healing to complete. The waning crescent is the most powerful time for rest and surrender.',
      herbs: ['Lavender', 'Valerian', 'Passionflower', 'Chamomile'],
      crystals: ['Selenite', 'Lepidolite', 'Moonstone'],
      affirmations: [
        'I rest and allow my healing to complete.',
        'I surrender to the healing power of rest.',
        'I trust my body to heal while I sleep.',
      ],
      journalPrompts: [
        'What healing has occurred this cycle?',
        'What does my body need most right now?',
        'How will I honor my need for rest?',
      ],
      steps: [
        'Prepare your bedroom as a healing sanctuary.',
        'Brew a sleep tea with valerian and chamomile.',
        'Light a blue candle and hold selenite.',
        'Speak your healing affirmations softly.',
        'Journal your healing journey.',
        'Sleep with lepidolite and moonstone for deep healing rest.',
      ],
      candle: 'Blue or white',
      bestTime: 'Before sleep',
    },
    new_beginnings: {
      ritualName: 'Waning Crescent Surrender and Prepare',
      description: 'Surrender the old cycle completely and prepare in stillness for your next new beginning. Rest in the void.',
      herbs: ['Frankincense', 'Myrrh', 'Lavender', 'Mugwort'],
      crystals: ['Moonstone', 'Labradorite', 'Clear Quartz'],
      affirmations: [
        'I surrender the old cycle with gratitude.',
        'I rest in the fertile void of possibility.',
        'I am ready for my next new beginning.',
      ],
      journalPrompts: [
        'What is the most important lesson from this cycle?',
        'What am I most excited to begin in the next cycle?',
        'How will I honor the darkness before the new moon?',
      ],
      steps: [
        'Sit in complete darkness for a few minutes.',
        'Light a single white candle.',
        'Hold moonstone and breathe in the stillness.',
        'Journal your cycle lessons and next intentions.',
        'Speak your affirmations as seeds for the next cycle.',
        'Sleep early and dream of your new beginning.',
      ],
      candle: 'White or silver',
      bestTime: 'Before sleep, in the dark hours',
    },
  },
};

// ── Moon Phase Calculator ─────────────────────────────────────────────────────

/**
 * Calculate the current moon phase from a date.
 * Returns the phase key and illumination percentage.
 */
// ── Shared lunar math (Meeus Ch. 47, elongation bisection) ──────────────────
// Inlined here to keep moon-ritual-data.ts self-contained and synchronous.

function _mrd_toRad(deg: number) { return (deg * Math.PI) / 180; }
function _mrd_norm360(d: number) { return ((d % 360) + 360) % 360; }
function _mrd_T(jd: number) { return (jd - 2451545.0) / 36525; }

function _mrd_sunLon(jd: number): number {
  const t  = _mrd_T(jd);
  const L0 = _mrd_norm360(280.46646 + 36000.76983 * t);
  const M  = _mrd_norm360(357.52911 + 35999.05029 * t);
  const Mr = _mrd_toRad(M);
  return _mrd_norm360(L0 + (1.914602 - 0.004817 * t) * Math.sin(Mr) + 0.019993 * Math.sin(2 * Mr) + 0.000289 * Math.sin(3 * Mr));
}

function _mrd_moonLon(jd: number): number {
  const t  = _mrd_T(jd);
  const L1 = _mrd_norm360(218.3165 + 481267.8813 * t);
  const M  = _mrd_norm360(357.5291 + 35999.0503  * t);
  const Mp = _mrd_norm360(134.9634 + 477198.8676 * t);
  const D  = _mrd_norm360(297.8502 + 445267.1115 * t);
  const F  = _mrd_norm360(93.2721  + 483202.0175 * t);
  return _mrd_norm360(L1
    + 6.2888 * Math.sin(_mrd_toRad(Mp))
    + 1.2740 * Math.sin(_mrd_toRad(2 * D - Mp))
    + 0.6583 * Math.sin(_mrd_toRad(2 * D))
    + 0.2136 * Math.sin(_mrd_toRad(2 * Mp))
    - 0.1851 * Math.sin(_mrd_toRad(M))
    - 0.1143 * Math.sin(_mrd_toRad(2 * F))
    + 0.0588 * Math.sin(_mrd_toRad(2 * D - 2 * Mp))
    + 0.0533 * Math.sin(_mrd_toRad(2 * D + Mp))
    + 0.0458 * Math.sin(_mrd_toRad(2 * D - M))
    + 0.0409 * Math.sin(_mrd_toRad(Mp - M)));
}

function _mrd_moonElong(jd: number): number {
  return _mrd_norm360(_mrd_moonLon(jd) - _mrd_sunLon(jd));
}

export function getCurrentMoonPhase(date: Date = new Date()): {
  phase: MoonPhaseKey;
  illumination: number;
  age: number; // days since new moon
} {
  // Uses elongation bisection — no linear drift, no hardcoded reference points.
  // Meeus Ch. 47 moon longitude with 10-term perturbation series (~0.08° accuracy).
  const jd    = date.getTime() / 86400000 + 2440587.5;
  const elong = _mrd_moonElong(jd);

  // Find the preceding new moon (elongation crosses 0° going forward)
  let prevNewJD = jd - 15; // safe fallback
  let j = jd;
  for (let i = 0; i < 35; i++) {
    const e0 = _mrd_moonElong(j);
    const e1 = _mrd_moonElong(j - 1);
    // Crossing detected when elongation wraps 360→0 going backward in time
    if ((e0 < 30 && e1 > 330) || (e0 > 330 && e1 < 30)) {
      let lo = j - 1; let hi = j;
      for (let b = 0; b < 50; b++) {
        const mid = (lo + hi) / 2;
        const em  = _mrd_moonElong(mid);
        if (em > 330) lo = mid; else hi = mid;
      }
      prevNewJD = (lo + hi) / 2;
      break;
    }
    j -= 1;
  }

  const SYNODIC = 29.530588861;
  const rawAge  = jd - prevNewJD;
  const age     = ((rawAge % SYNODIC) + SYNODIC) % SYNODIC;
  const illumination = Math.round((1 - Math.cos((elong / 180) * Math.PI)) / 2 * 100);

  // Classify by elongation angle — more accurate than age-based boundaries.
  let phase: MoonPhaseKey;
  if (elong >= 337.5 || elong < 22.5)  phase = 'new_moon';
  else if (elong < 67.5)               phase = 'waxing_crescent';
  else if (elong < 112.5)              phase = 'first_quarter';
  else if (elong < 157.5)              phase = 'waxing_gibbous';
  else if (elong < 202.5)              phase = 'full_moon';
  else if (elong < 247.5)              phase = 'waning_gibbous';
  else if (elong < 292.5)              phase = 'last_quarter';
  else                                 phase = 'waning_crescent';

  return { phase, illumination, age: Math.round(age * 10) / 10 };
}

export function getRitual(phase: MoonPhaseKey, intention: IntentionKey): RitualRecommendation | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return RITUAL_MATRIX[phase][intention];
}

export function getMoonPhaseInfo(phase: MoonPhaseKey): MoonPhaseInfo {
  return MOON_PHASES.find(p => p.key === phase) ?? MOON_PHASES[0];
}

export function getIntentionInfo(intention: IntentionKey): IntentionInfo {
  return INTENTIONS.find(i => i.key === intention) ?? INTENTIONS[0];
}
