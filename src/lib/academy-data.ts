/**
 * Spellful Academy — lesson content data
 * All lesson content lives here as structured data.
 */

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VocabTerm {
  term: string;
  definition: string;
}

export interface Lesson {
  slug: string;
  title: string;
  subtitle: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  introduction: string;
  history: string;
  vocabulary: VocabTerm[];
  meaning: string;
  howToRead: string;
  example: string;
  relatedTool?: { label: string; href: string };
  quiz: QuizQuestion[];
}

export interface Topic {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  lessons: Lesson[];
}

export const ACADEMY_TOPICS: Topic[] = [
  {
    slug: 'start-here',
    title: 'Start Here',
    subtitle: 'Foundations & Orientation',
    icon: '✨',
    color: 'hsl(var(--primary))',
    description: 'New to Spellful? Begin here. Learn the core concepts, terminology, and how to navigate your spiritual journey with confidence.',
    lessons: [
      {
        slug: 'welcome',
        title: 'Welcome to Spellful Academy',
        subtitle: 'Your guide to learning with intention',
        level: 'beginner',
        durationMinutes: 5,
        introduction: "Spellful Academy is your personal learning sanctuary — a place to explore the rich traditions of astrology, tarot, lunar magic, witchcraft, and more. Whether you are completely new or deepening an existing practice, every lesson here is designed to meet you where you are.",
        history: "Spellful was built on the belief that spiritual knowledge should be accessible, accurate, and empowering. The Academy draws from documented historical sources, cross-cultural traditions, and modern interpretive frameworks — always distinguishing between verified history and symbolic or spiritual meaning.",
        vocabulary: [
          { term: 'Divination', definition: 'The practice of seeking knowledge of the future or unknown through symbolic, intuitive, or ritual means.' },
          { term: 'Correspondence', definition: 'A symbolic association between two things — for example, the moon and emotions, or the color red and passion.' },
          { term: 'Intention', definition: 'A focused mental or spiritual aim that guides a ritual, reading, or practice.' },
          { term: 'Archetype', definition: 'A universal symbol or pattern that appears across cultures and traditions, such as the Fool, the Mother, or the Trickster.' },
        ],
        meaning: "Learning about spiritual traditions is not about believing everything literally — it is about developing a symbolic language for understanding yourself and the world. Astrology, tarot, and lunar magic are frameworks for reflection, not prediction machines.",
        howToRead: "Move through lessons at your own pace. Each lesson follows the same structure: introduction, history, vocabulary, meaning, how to read or apply it, a real example, and a short quiz. You can bookmark any lesson and track your progress from your Academy dashboard.",
        example: "A beginner might start by learning what the New Moon means symbolically (new beginnings, setting intentions), then practice by writing one intention on the next New Moon. That is the Academy approach: learn, reflect, practice.",
        relatedTool: { label: 'Your Daily Dashboard', href: '/dashboard' },
        quiz: [
          {
            question: "What does 'correspondence' mean in a spiritual context?",
            options: ['A letter sent between witches', 'A symbolic association between two things', 'A type of tarot spread', 'A moon phase ritual'],
            correctIndex: 1,
            explanation: "Correspondences are symbolic links — like associating the moon with emotions, or rose quartz with love. They form the building blocks of ritual and intuitive practice.",
          },
          {
            question: "What is the Academy's approach to spiritual knowledge?",
            options: ['Everything must be believed literally', 'Only modern practices are valid', 'Symbolic frameworks for reflection, not prediction', 'Only Western traditions are covered'],
            correctIndex: 2,
            explanation: "The Academy treats spiritual tools as symbolic languages for self-understanding, always distinguishing documented history from symbolic or spiritual interpretation.",
          },
        ],
      },
      {
        slug: 'how-to-use-spellful',
        title: 'How to Use Spellful',
        subtitle: 'A tour of your tools and features',
        level: 'beginner',
        durationMinutes: 8,
        introduction: "Spellful brings together tarot, astrology, lunar magic, spells, herbs, crystals, and community in one place. This lesson walks you through each tool so you can find what resonates with you.",
        history: "Integrated spiritual platforms are a modern development, but the traditions they draw from span thousands of years across dozens of cultures. Spellful curates these traditions with care, citing sources and noting where interpretations vary.",
        vocabulary: [
          { term: 'Grimoire', definition: "Your personal Book of Shadows — a private journal for spells, rituals, dreams, herbs, and reflections." },
          { term: 'Sanctuary', definition: "Your personal hub on Spellful, showing your progress, saved content, and spiritual profile." },
          { term: 'Moon Calendar', definition: "A calendar showing lunar phases, eclipses, and astrologically significant dates." },
          { term: 'Birth Chart', definition: "A map of the sky at the exact moment of your birth, used in astrology to describe personality and life themes." },
        ],
        meaning: "Each Spellful tool is designed to support a different aspect of practice. The Grimoire is for recording and reflecting. The Tarot is for intuitive exploration. The Moon Calendar is for timing. The Birth Chart is for self-understanding.",
        howToRead: "Visit your Sanctuary to see everything in one place. From there you can access your Grimoire, Dream Journal, Cosmic Timeline, and personalized reminders. The Daily Dashboard gives you a fresh starting point each day.",
        example: "A typical day on Spellful: check the Daily Dashboard for your Card of the Day and moon phase, log a dream in your Dream Journal, then explore a tarot spread in the evening.",
        relatedTool: { label: 'My Sanctuary', href: '/sanctuary' },
        quiz: [
          {
            question: "What is a Grimoire on Spellful?",
            options: ['A type of tarot spread', 'Your personal Book of Shadows for journaling and recording', 'A community discussion board', 'A moon phase calculator'],
            correctIndex: 1,
            explanation: "Your Grimoire is your private digital Book of Shadows — a place to record spells, rituals, herb notes, dreams, and reflections.",
          },
        ],
      },
    ],
  },
  {
    slug: 'astrology',
    title: 'Astrology & Birth Charts',
    subtitle: 'Planets, signs, houses, and aspects',
    icon: '♈',
    color: 'hsl(var(--astro-sun-color))',
    description: 'Explore the language of the sky. Learn the twelve zodiac signs, ten planets, twelve houses, and how they combine to tell your unique story.',
    lessons: [
      {
        slug: 'what-is-astrology',
        title: 'What Is Astrology?',
        subtitle: 'History, purpose, and how it works',
        level: 'beginner',
        durationMinutes: 10,
        introduction: "Astrology is one of humanity's oldest symbolic systems — a language that maps the positions of celestial bodies onto human experience. It is not a science in the modern sense, but it is a rich framework for self-reflection and pattern recognition.",
        history: "Astrology's roots trace to Mesopotamia around 2000 BCE, where Babylonian priests tracked celestial omens for kings. Hellenistic astrology (3rd century BCE–7th century CE) developed the birth chart as we know it today, blending Babylonian observation with Greek philosophy. Medieval Islamic scholars preserved and expanded the tradition. Western astrology as practiced today descends primarily from this Hellenistic lineage.",
        vocabulary: [
          { term: 'Natal chart', definition: 'A map of the sky at the exact moment and location of birth, used to describe personality and life themes.' },
          { term: 'Zodiac', definition: 'The band of sky divided into twelve 30-degree segments, each named for a constellation.' },
          { term: 'Planet', definition: 'In astrology, the ten bodies used in chart interpretation: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.' },
          { term: 'House', definition: 'One of twelve divisions of the birth chart representing areas of life (self, money, communication, home, etc.).' },
          { term: 'Aspect', definition: 'An angular relationship between two planets that describes how their energies interact.' },
        ],
        meaning: "Astrology offers a symbolic vocabulary for understanding personality, timing, and life themes. A birth chart does not determine your fate — it describes tendencies and potentials. The same chart can manifest in many different ways depending on choices, culture, and context.",
        howToRead: "Start with the Big Three: your Sun sign (core identity), Moon sign (emotional nature), and Rising sign (how others perceive you). These three placements give a strong foundation before exploring planets, houses, and aspects.",
        example: "Someone with Sun in Scorpio, Moon in Pisces, and Aries Rising might be deeply private and emotionally sensitive (Scorpio Sun, Pisces Moon) but come across as bold and direct in first impressions (Aries Rising).",
        relatedTool: { label: 'Your Birth Chart', href: '/birth-chart' },
        quiz: [
          {
            question: "Where did Western astrology's birth chart tradition originate?",
            options: ['Ancient Egypt', 'Hellenistic Greece and Babylon', 'Medieval Europe', 'Renaissance Italy'],
            correctIndex: 1,
            explanation: "The birth chart as we know it developed in the Hellenistic period (roughly 3rd century BCE), blending Babylonian celestial observation with Greek philosophical frameworks.",
          },
          {
            question: "What are the 'Big Three' in astrology?",
            options: ['Sun, Mars, Saturn', 'Moon, Venus, Jupiter', 'Sun, Moon, Rising', 'Mercury, Venus, Mars'],
            correctIndex: 2,
            explanation: "The Big Three are Sun (core identity), Moon (emotional nature), and Rising/Ascendant (outward presentation). They are the most commonly used starting point in birth chart interpretation.",
          },
          {
            question: "What does a birth chart represent?",
            options: ['A prediction of your future', 'A map of the sky at your birth moment', 'A list of your personality flaws', 'A guide to compatible partners'],
            correctIndex: 1,
            explanation: "A natal chart is a snapshot of the sky at the exact moment and location of your birth. It describes tendencies and potentials, not fixed outcomes.",
          },
        ],
      },
      {
        slug: 'the-twelve-signs',
        title: 'The Twelve Zodiac Signs',
        subtitle: 'Elements, modalities, and meanings',
        level: 'beginner',
        durationMinutes: 15,
        introduction: "The twelve zodiac signs are the most recognizable part of astrology. Each sign occupies 30 degrees of the zodiac wheel and carries a distinct set of qualities shaped by its element, modality, and ruling planet.",
        history: "The twelve-sign zodiac was standardized in Babylon around the 5th century BCE. The names and imagery we use today — Aries the Ram, Taurus the Bull, etc. — come from Babylonian and later Hellenistic sources. The psychological meanings associated with each sign were largely developed in the 20th century by astrologers like Dane Rudhyar.",
        vocabulary: [
          { term: 'Element', definition: 'One of four categories (Fire, Earth, Air, Water) grouping signs by temperament.' },
          { term: 'Modality', definition: 'One of three categories (Cardinal, Fixed, Mutable) describing how a sign initiates, sustains, or adapts.' },
          { term: 'Ruling planet', definition: "The planet traditionally associated with a sign, said to express that sign's energy most naturally." },
          { term: 'Cusp', definition: 'The boundary between two signs. Being "on the cusp" means being born near the transition date.' },
        ],
        meaning: "Fire signs (Aries, Leo, Sagittarius) are energetic and expressive. Earth signs (Taurus, Virgo, Capricorn) are practical and grounded. Air signs (Gemini, Libra, Aquarius) are intellectual and social. Water signs (Cancer, Scorpio, Pisces) are emotional and intuitive. Cardinal signs initiate, Fixed signs sustain, Mutable signs adapt.",
        howToRead: "When you see a planet in a sign, the sign describes how that planet's energy expresses itself. Mars in Aries is direct and impulsive (Mars rules Aries). Mars in Libra is more diplomatic and indecisive (Libra's Air energy modifies Mars's drive).",
        example: "Venus in Taurus (Venus rules Taurus) expresses love through physical comfort, loyalty, and sensory pleasure. Venus in Gemini expresses love through conversation, variety, and intellectual connection.",
        relatedTool: { label: 'Astrology Guide', href: '/astrology' },
        quiz: [
          {
            question: "Which element group includes Taurus, Virgo, and Capricorn?",
            options: ['Fire', 'Earth', 'Air', 'Water'],
            correctIndex: 1,
            explanation: "Taurus, Virgo, and Capricorn are the three Earth signs. Earth signs are associated with practicality, groundedness, and material concerns.",
          },
          {
            question: "What does 'modality' describe in astrology?",
            options: ["A planet's speed", 'How a sign initiates, sustains, or adapts', 'The element of a sign', "The ruling planet's influence"],
            correctIndex: 1,
            explanation: "Modality (Cardinal, Fixed, Mutable) describes a sign's mode of operation: Cardinal signs begin things, Fixed signs maintain them, Mutable signs transition and adapt.",
          },
        ],
      },
      {
        slug: 'the-twelve-houses',
        title: 'The Twelve Houses',
        subtitle: 'Life areas and their meanings',
        level: 'intermediate',
        durationMinutes: 12,
        introduction: "The twelve houses of the birth chart divide the sky into twelve sectors, each representing a different area of life — from identity and money to relationships, career, and spirituality. Where a planet falls in your chart tells you which life area it influences.",
        history: "The house system in Western astrology was formalized during the Hellenistic period. Multiple house systems exist — Placidus, Whole Sign, Equal House, Koch, and others. Whole Sign houses, the oldest system, assigns one entire zodiac sign to each house. Placidus, developed in the 17th century, is the most common in modern Western practice.",
        vocabulary: [
          { term: 'Ascendant (Rising Sign)', definition: "The zodiac sign rising on the eastern horizon at your birth moment. It marks the cusp of the 1st house and shapes your outward personality." },
          { term: 'Midheaven (MC)', definition: "The highest point in the sky at your birth. It marks the cusp of the 10th house and relates to career and public reputation." },
          { term: 'House cusp', definition: "The boundary line between two houses. Planets near a cusp can influence both houses." },
          { term: 'Angular houses', definition: "The 1st, 4th, 7th, and 10th houses — the most prominent positions in the chart, associated with strong, direct expression." },
        ],
        meaning: "The twelve houses cover every domain of human experience: 1st (self), 2nd (money/values), 3rd (communication), 4th (home/roots), 5th (creativity/romance), 6th (health/daily work), 7th (partnerships), 8th (transformation/shared resources), 9th (philosophy/travel), 10th (career/reputation), 11th (community/hopes), 12th (unconscious/hidden matters).",
        howToRead: "Find a planet in your chart and note which house it occupies. Then combine: planet (what energy) + sign (how it expresses) + house (where in life it operates). Venus in Scorpio in the 7th house suggests intense, transformative romantic partnerships.",
        example: "Someone with the Sun in the 10th house often has a strong drive for public recognition and career achievement. The same Sun in the 4th house suggests someone whose identity is deeply tied to home, family, and private life.",
        relatedTool: { label: 'Your Birth Chart', href: '/birth-chart' },
        quiz: [
          {
            question: "What does the Ascendant (Rising Sign) represent?",
            options: ['Your Sun sign', 'The sign rising on the eastern horizon at birth', 'Your Moon sign', 'The highest point in the sky at birth'],
            correctIndex: 1,
            explanation: "The Ascendant is the zodiac sign rising on the eastern horizon at your exact birth moment. It marks the 1st house cusp and shapes how you appear to others.",
          },
          {
            question: "Which houses are called the angular houses?",
            options: ['2nd, 5th, 8th, 11th', '3rd, 6th, 9th, 12th', '1st, 4th, 7th, 10th', '1st, 3rd, 7th, 9th'],
            correctIndex: 2,
            explanation: "The angular houses — 1st, 4th, 7th, and 10th — are the most prominent positions in the chart. Planets here tend to express their energy strongly and directly.",
          },
        ],
      },
      {
        slug: 'aspects-and-chart-patterns',
        title: 'Aspects & Chart Patterns',
        subtitle: 'How planets talk to each other',
        level: 'intermediate',
        durationMinutes: 14,
        introduction: "Aspects are the angular relationships between planets in a birth chart. When two planets are a certain number of degrees apart, they form an aspect — a conversation between those planetary energies. Aspects are often the most revealing part of a chart reading.",
        history: "The major aspects — conjunction, sextile, square, trine, and opposition — were defined by Ptolemy in his 2nd-century CE work Tetrabiblos. Minor aspects like the quincunx and semi-sextile were added by later astrologers. The concept of orbs (how exact an aspect must be to count) has varied across traditions and eras.",
        vocabulary: [
          { term: 'Conjunction (0°)', definition: "Two planets in the same position. Their energies merge and intensify each other." },
          { term: 'Sextile (60°)', definition: "A flowing, cooperative aspect suggesting opportunity and ease between two planetary energies." },
          { term: 'Square (90°)', definition: "A tense, challenging aspect suggesting friction, conflict, or the need for effort and growth." },
          { term: 'Trine (120°)', definition: "A harmonious, easy-flowing aspect suggesting natural talent or fortunate circumstances." },
          { term: 'Opposition (180°)', definition: "Two planets directly across the chart from each other, suggesting tension, polarity, or the need for balance." },
          { term: 'Orb', definition: "The allowable margin of error for an aspect. A 5° orb means the aspect is counted if planets are within 5° of the exact angle." },
        ],
        meaning: "Squares and oppositions are not bad — they are where growth happens. Many accomplished people have heavily aspected charts full of squares. Trines and sextiles show natural gifts, but without challenge, those gifts may go undeveloped.",
        howToRead: "Look for the red lines (squares and oppositions) and blue lines (trines and sextiles) in your birth chart. A planet with many aspects is a busy, prominent energy in your life. The most aspected planet often describes a central life theme.",
        example: "Saturn square Sun in a birth chart suggests tension between authority, discipline, and self-expression — often manifesting as a drive to prove oneself or overcome early obstacles. Many high achievers have this aspect.",
        relatedTool: { label: 'Your Birth Chart', href: '/birth-chart' },
        quiz: [
          {
            question: "What does a square aspect (90°) typically indicate?",
            options: ['Natural talent and ease', 'Tension, friction, and the need for growth', 'Two planets merging their energies', 'A fortunate, flowing connection'],
            correctIndex: 1,
            explanation: "Squares indicate friction and challenge between two planetary energies. They are not inherently bad — they are often where the most growth and achievement come from.",
          },
          {
            question: "What is an orb in astrology?",
            options: ['A crystal ball', 'The allowable margin of error for an aspect to count', 'A type of house system', 'A planet outside the solar system'],
            correctIndex: 1,
            explanation: "An orb is the allowable margin of error for an aspect. If two planets are within 5° of a perfect square (90°), most astrologers would count it as a square aspect.",
          },
        ],
      },
    ],
  },
  {
    slug: 'tarot',
    title: 'Tarot & Card Meanings',
    subtitle: 'Major Arcana, Minor Arcana, and spreads',
    icon: '🃏',
    color: 'hsl(var(--grimoire-tarot))',
    description: 'Learn the 78-card tarot deck from the ground up — symbolism, suits, reversals, and how to conduct meaningful readings.',
    lessons: [
      {
        slug: 'what-is-tarot',
        title: 'What Is Tarot?',
        subtitle: 'Origins, structure, and how readings work',
        level: 'beginner',
        durationMinutes: 10,
        introduction: "Tarot is a deck of 78 illustrated cards used for reflection, intuitive exploration, and symbolic storytelling. Despite its mystical reputation, tarot began as a card game — its divinatory use came centuries later.",
        history: "Tarot cards originated in northern Italy in the 15th century as a card game called tarocchi. The earliest surviving decks (Visconti-Sforza, c. 1450) were luxury items for aristocratic families. Divinatory use of tarot emerged in 18th-century France, popularized by occultists like Antoine Court de Gébelin, who (incorrectly) claimed Egyptian origins. The Rider-Waite-Smith deck (1909), illustrated by Pamela Colman Smith, became the template for most modern decks.",
        vocabulary: [
          { term: 'Major Arcana', definition: '22 cards representing major life themes and archetypal forces (The Fool through The World).' },
          { term: 'Minor Arcana', definition: '56 cards divided into four suits (Cups, Wands, Swords, Pentacles) representing everyday situations.' },
          { term: 'Spread', definition: 'A layout of cards in specific positions, each position representing a different aspect of the question.' },
          { term: 'Reversal', definition: 'A card drawn upside-down, often interpreted as blocked, internalized, or modified energy.' },
          { term: 'Querent', definition: 'The person asking the question or receiving the reading.' },
        ],
        meaning: "Tarot works as a projective tool — the images prompt the reader to access intuition, memory, and pattern recognition. Whether you believe the cards are guided by something beyond chance or simply use them as a structured reflection exercise, the process of sitting with a question and interpreting symbols is genuinely useful.",
        howToRead: "Shuffle the deck while holding your question in mind. Draw one or more cards and place them in a spread. For each card, notice your first impression, then consider the card's traditional meaning, then synthesize both into a response to your question.",
        example: "Drawing The Tower in a reading about a relationship might prompt reflection on sudden change, disruption of false structures, or a necessary breakdown before rebuilding — not necessarily a literal disaster.",
        relatedTool: { label: 'Tarot Reading', href: '/tarot' },
        quiz: [
          {
            question: "When did tarot cards originate?",
            options: ['Ancient Egypt', '15th-century Italy', '18th-century France', 'Medieval England'],
            correctIndex: 1,
            explanation: "Tarot originated in 15th-century northern Italy as a card game called tarocchi. Divinatory use came much later, in 18th-century France.",
          },
          {
            question: "How many cards are in a standard tarot deck?",
            options: ['52', '72', '78', '80'],
            correctIndex: 2,
            explanation: "A standard tarot deck has 78 cards: 22 Major Arcana and 56 Minor Arcana (14 cards in each of four suits).",
          },
          {
            question: "What is the Rider-Waite-Smith deck significant for?",
            options: ['Being the oldest tarot deck', 'Being the first deck used for divination', 'Becoming the template for most modern decks', 'Being created in ancient Egypt'],
            correctIndex: 2,
            explanation: "The Rider-Waite-Smith deck (1909), illustrated by Pamela Colman Smith, introduced fully illustrated pip cards and became the template for the vast majority of modern tarot decks.",
          },
        ],
      },
      {
        slug: 'major-arcana',
        title: 'The Major Arcana',
        subtitle: '22 cards of archetypal power',
        level: 'beginner',
        durationMinutes: 20,
        introduction: "The 22 Major Arcana cards are the heart of the tarot deck. They represent major life themes, archetypal forces, and significant turning points. When Major Arcana cards appear in a reading, they often signal something of lasting importance.",
        history: "The Major Arcana sequence — from The Fool (0) to The World (21) — is sometimes called the Fool's Journey, a narrative arc of growth and transformation. This interpretive framework was largely developed in the 20th century. The original 15th-century Italian trionfi (triumph) cards had a different sequence and no unified narrative.",
        vocabulary: [
          { term: "The Fool's Journey", definition: "A modern interpretive framework reading the 22 Major Arcana as stages in a hero's journey of growth." },
          { term: 'Archetype', definition: 'A universal pattern or character that appears across cultures — the Hero, the Shadow, the Trickster.' },
          { term: 'Trump card', definition: 'The original term for Major Arcana cards, from the Italian trionfi (triumphs).' },
        ],
        meaning: "Each Major Arcana card carries a core theme: The High Priestess — intuition and mystery. The Emperor — structure and authority. The Wheel of Fortune — cycles and change. The Tower — sudden disruption. The Star — hope and renewal. These themes are not prescriptive — they are lenses for reflection.",
        howToRead: "When a Major Arcana card appears, ask: what major theme is this pointing to? What aspect of this archetype is active in my life right now? Major Arcana in a spread often outweigh Minor Arcana in significance.",
        example: "A reading with three Major Arcana cards (The Hermit, The Moon, The Star) might suggest a period of deep inner work (The Hermit), navigating uncertainty and the unconscious (The Moon), followed by emerging hope and clarity (The Star).",
        relatedTool: { label: 'Explore All 78 Cards', href: '/tarot' },
        quiz: [
          {
            question: "How many cards are in the Major Arcana?",
            options: ['14', '22', '40', '56'],
            correctIndex: 1,
            explanation: "The Major Arcana consists of 22 cards, numbered 0 (The Fool) through 21 (The World).",
          },
          {
            question: "What does it typically mean when multiple Major Arcana appear in a reading?",
            options: ['The reading is invalid', 'Minor themes are dominant', 'Major life themes or turning points are highlighted', 'The deck needs reshuffling'],
            correctIndex: 2,
            explanation: "Multiple Major Arcana cards in a spread often signal that significant, lasting themes or turning points are at play — not just everyday situations.",
          },
        ],
      },
      {
        slug: 'the-four-suits',
        title: 'The Four Suits of the Minor Arcana',
        subtitle: 'Cups, Wands, Swords, and Pentacles',
        level: 'beginner',
        durationMinutes: 12,
        introduction: "The 56 Minor Arcana cards are divided into four suits of 14 cards each: Cups, Wands, Swords, and Pentacles. Each suit governs a different domain of life and corresponds to one of the four classical elements.",
        history: "The four-suit structure of tarot descends from the four suits of playing cards that arrived in Europe from the Islamic world in the 14th century. The original Italian suits were cups, coins, swords, and batons — which became the tarot suits we know today. The elemental associations (Cups/Water, Wands/Fire, Swords/Air, Pentacles/Earth) were formalized by 19th-century occultists, particularly the Hermetic Order of the Golden Dawn.",
        vocabulary: [
          { term: 'Cups', definition: "The suit of water, emotion, relationships, intuition, and the unconscious. Corresponds to the heart and feeling life." },
          { term: 'Wands', definition: "The suit of fire, passion, creativity, ambition, and spiritual energy. Corresponds to drive and inspiration." },
          { term: 'Swords', definition: "The suit of air, intellect, conflict, truth, and communication. Corresponds to the mind and its challenges." },
          { term: 'Pentacles', definition: "The suit of earth, material matters, money, work, health, and the physical world. Corresponds to practical reality." },
          { term: 'Court cards', definition: "The Page, Knight, Queen, and King of each suit — representing personality types, people in your life, or aspects of yourself." },
        ],
        meaning: "Each suit tells a story from Ace (pure potential) through Ten (completion) and then through the four court cards. The Ace of Cups is the seed of emotional experience; the Ten of Cups is emotional fulfillment. The court cards add personality and relationship dynamics to the suit's story.",
        howToRead: "When a suit dominates a reading, that element is prominent in the situation. Many Swords suggest mental conflict or communication issues. Many Cups suggest emotional themes. Many Pentacles suggest practical or financial concerns. Many Wands suggest creative energy or ambition.",
        example: "A reading with the Three of Cups, Nine of Cups, and Queen of Cups is saturated with water energy — suggesting a situation deeply rooted in emotion, relationships, and intuition. The Queen of Cups might represent the querent or someone emotionally significant in the situation.",
        relatedTool: { label: 'Tarot Reading', href: '/tarot' },
        quiz: [
          {
            question: "Which suit corresponds to the element of Air?",
            options: ['Cups', 'Wands', 'Swords', 'Pentacles'],
            correctIndex: 2,
            explanation: "Swords correspond to Air — the element of intellect, communication, conflict, and truth. Cups are Water, Wands are Fire, and Pentacles are Earth.",
          },
          {
            question: "What do court cards (Page, Knight, Queen, King) typically represent?",
            options: ['Only royalty', 'Personality types, people in your life, or aspects of yourself', 'Always negative outcomes', 'The most powerful cards in the deck'],
            correctIndex: 1,
            explanation: "Court cards represent personality types, people in your life, or aspects of yourself. They add a human, relational dimension to a reading.",
          },
        ],
      },
      {
        slug: 'reversals-and-reading-ethics',
        title: 'Reversals & Reading Ethics',
        subtitle: 'Upside-down cards and responsible practice',
        level: 'intermediate',
        durationMinutes: 10,
        introduction: "Reversed tarot cards — drawn upside-down — are one of the most debated topics in tarot practice. Some readers use them; others do not. Understanding reversals and the ethics of reading for others will make you a more thoughtful, responsible reader.",
        history: "The use of reversals in tarot is not ancient — it became common in the 19th and 20th centuries as tarot shifted from a card game to a divinatory practice. Early tarot manuals often ignored reversals entirely. The Rider-Waite-Smith tradition popularized reversed meanings, and today most published tarot books include them.",
        vocabulary: [
          { term: 'Reversal', definition: "A card drawn upside-down. Common interpretations include blocked energy, internalized themes, delays, or the shadow side of the card." },
          { term: 'Shadow side', definition: "The less comfortable, suppressed, or unconscious aspect of a card's energy." },
          { term: 'Ethical reading', definition: "A reading conducted with honesty, respect for the querent's autonomy, and awareness of the reader's own limitations and biases." },
          { term: 'Confirmation bias', definition: "The tendency to interpret information in a way that confirms what we already believe. A significant risk in intuitive practices." },
        ],
        meaning: "Reversals are a tool, not a rule. Some readers find them add nuance; others find they complicate readings unnecessarily. What matters more than reversals is the quality of your attention, your willingness to sit with ambiguity, and your commitment to the querent's wellbeing rather than dramatic predictions.",
        howToRead: "If you use reversals, consider them as: blocked or delayed energy, internalized rather than externalized expression, the shadow side of the card, or a need to revisit the upright meaning more carefully. Never use reversals — or any card — to make definitive predictions about health, death, or major life events.",
        example: "The Tower reversed might suggest that a disruption is being resisted or delayed, or that the querent is experiencing internal upheaval rather than external change. It does not mean disaster is averted — it means the energy is expressing differently.",
        relatedTool: { label: 'Tarot Reading', href: '/tarot' },
        quiz: [
          {
            question: "When did reversed card meanings become common in tarot practice?",
            options: ['In 15th-century Italy', 'In ancient Egypt', 'In the 19th and 20th centuries', 'They have always been used'],
            correctIndex: 2,
            explanation: "Reversed meanings became common in the 19th and 20th centuries as tarot shifted to divinatory use. Early tarot manuals often ignored reversals entirely.",
          },
          {
            question: "What is confirmation bias in the context of tarot reading?",
            options: ['Confirming a card is reversed', 'Interpreting cards to confirm what you already believe', 'A type of spread', 'Reading for confirmation of a decision'],
            correctIndex: 1,
            explanation: "Confirmation bias is the tendency to interpret information in a way that confirms existing beliefs. It is a significant risk in intuitive practices and something thoughtful readers actively watch for.",
          },
        ],
      },
    ],
  },
  {
    slug: 'moon-phases',
    title: 'Moon Phases & Lunar Magic',
    subtitle: 'Eight phases, astronomy, and ritual',
    icon: '🌙',
    color: 'hsl(var(--astro-moon))',
    description: "Understand the eight lunar phases from both an astronomical and symbolic perspective, and learn how to align your practice with the moon's cycle.",
    lessons: [
      {
        slug: 'lunar-cycle-basics',
        title: 'The Lunar Cycle',
        subtitle: 'Astronomy and symbolism of the eight phases',
        level: 'beginner',
        durationMinutes: 12,
        introduction: "The moon completes one orbit around Earth approximately every 29.5 days — the synodic month. As it orbits, the angle between the Sun, Earth, and Moon changes, creating the phases we observe. Spellful calculates moon phases using the full Meeus perturbation series, accurate to within about two minutes.",
        history: "Lunar calendars predate solar calendars in most cultures. The Babylonians, Egyptians, Chinese, and many Indigenous cultures organized time around the moon. Lunar symbolism — the moon as feminine, cyclical, and connected to water and emotion — appears across traditions, though the specific associations vary widely by culture.",
        vocabulary: [
          { term: 'Synodic month', definition: 'The 29.5-day cycle from one New Moon to the next.' },
          { term: 'New Moon', definition: 'The moon is between Earth and Sun; the illuminated side faces away from us. Symbolically: new beginnings, intention-setting.' },
          { term: 'Full Moon', definition: 'Earth is between Sun and Moon; the moon is fully illuminated. Symbolically: culmination, release, heightened energy.' },
          { term: 'Waxing', definition: 'The moon is growing from New to Full. Symbolically associated with growth, building, and attraction.' },
          { term: 'Waning', definition: 'The moon is shrinking from Full to New. Symbolically associated with release, banishing, and reflection.' },
        ],
        meaning: "The eight phases — New, Waxing Crescent, First Quarter, Waxing Gibbous, Full, Waning Gibbous, Last Quarter, Waning Crescent — each carry distinct symbolic associations. Working with these phases means aligning your intentions and actions with the moon's natural rhythm.",
        howToRead: "Check the current moon phase on your Moon Calendar or Daily Dashboard. Notice what phase you are in and what that phase traditionally supports. New Moon: plant seeds. Full Moon: harvest and release. Waning phases: let go and reflect.",
        example: "Setting a new creative project intention on the New Moon, taking concrete action during the Waxing phases, celebrating progress at the Full Moon, and reviewing what is not working during the Waning phases.",
        relatedTool: { label: 'Moon Calendar', href: '/moon-calendar' },
        quiz: [
          {
            question: "How long is a synodic month?",
            options: ['27.3 days', '28 days', '29.5 days', '30 days'],
            correctIndex: 2,
            explanation: "A synodic month — from New Moon to New Moon — is approximately 29.5 days. (The sidereal month, measuring the moon's orbit relative to stars, is 27.3 days.)",
          },
          {
            question: "What does 'waxing' mean in lunar terms?",
            options: ['The moon is shrinking', 'The moon is growing from New to Full', 'The moon is at its peak', 'The moon is invisible'],
            correctIndex: 1,
            explanation: "Waxing means the illuminated portion of the moon is growing — from New Moon toward Full Moon. It is symbolically associated with growth, building, and attraction.",
          },
        ],
      },
      {
        slug: 'lunar-ritual-associations',
        title: 'Lunar Ritual Associations',
        subtitle: 'Aligning practice with each phase',
        level: 'beginner',
        durationMinutes: 10,
        introduction: "Each of the eight lunar phases carries traditional symbolic associations that practitioners use to time rituals, spells, and intentions. This lesson maps each phase to its symbolic meaning and suggests how to work with it.",
        history: "Lunar timing in magical practice appears across cultures — from ancient Babylonian omens to Roman agricultural calendars to modern Wiccan practice. The eight-phase system used in contemporary witchcraft was popularized in the 20th century, though lunar timing in two-phase (waxing/waning) or four-phase (quarters) systems is much older.",
        vocabulary: [
          { term: 'New Moon', definition: 'Dark moon; associated with new beginnings, intention-setting, and planting seeds.' },
          { term: 'Waxing Crescent', definition: 'First sliver of light; associated with taking first steps, gathering resources, and building momentum.' },
          { term: 'First Quarter', definition: 'Half-lit, growing; associated with decision-making, overcoming obstacles, and taking action.' },
          { term: 'Waxing Gibbous', definition: 'Almost full; associated with refinement, patience, and preparing for culmination.' },
          { term: 'Full Moon', definition: 'Fully illuminated; associated with culmination, release, heightened energy, and gratitude.' },
          { term: 'Waning Gibbous', definition: 'Beginning to decrease; associated with sharing, teaching, and distributing what was gained.' },
          { term: 'Last Quarter', definition: 'Half-lit, shrinking; associated with releasing, forgiving, and clearing what no longer serves.' },
          { term: 'Waning Crescent', definition: 'Final sliver; associated with rest, reflection, surrender, and preparation for the new cycle.' },
        ],
        meaning: "Working with lunar phases is about rhythm, not rigidity. You do not need to perform elaborate rituals at every phase. Even simply noting the current phase and reflecting on how it relates to your current situation is a meaningful practice.",
        howToRead: "Check the current moon phase on your Moon Calendar. Ask: what am I beginning, building, completing, or releasing right now? Align your most important intentions and actions with the phase that supports them.",
        example: "Starting a new creative project on the New Moon, taking concrete steps during the Waxing phases, sharing or celebrating at the Full Moon, and editing or releasing what is not working during the Waning phases.",
        relatedTool: { label: 'Moon Ritual Planner', href: '/moon-ritual' },
        quiz: [
          {
            question: "Which lunar phase is traditionally associated with release and letting go?",
            options: ['New Moon', 'Waxing Crescent', 'Full Moon', 'Waning phases'],
            correctIndex: 3,
            explanation: "The waning phases — from Full Moon back to New Moon — are traditionally associated with release, banishing, reflection, and clearing what no longer serves.",
          },
          {
            question: "What is the Full Moon traditionally associated with?",
            options: ['New beginnings and planting seeds', 'Culmination, release, and heightened energy', 'Rest and surrender', 'Decision-making and obstacles'],
            correctIndex: 1,
            explanation: "The Full Moon is associated with culmination, completion, release, and heightened energy. It is the peak of the lunar cycle — a time to celebrate what has grown and release what is ready to go.",
          },
        ],
      },
    ],
  },
  {
    slug: 'numerology',
    title: 'Numerology & Angel Numbers',
    subtitle: 'Calculation, meaning, and interpretation',
    icon: '🔢',
    color: 'hsl(var(--secondary))',
    description: 'Learn how to calculate and interpret life path numbers, expression numbers, and the significance of repeating number patterns.',
    lessons: [
      {
        slug: 'what-is-numerology',
        title: 'What Is Numerology?',
        subtitle: 'History, systems, and how numbers carry meaning',
        level: 'beginner',
        durationMinutes: 10,
        introduction: "Numerology is the study of symbolic meaning in numbers. It holds that numbers carry vibrational qualities that can describe personality, life themes, and timing. Like astrology and tarot, it is a symbolic framework rather than a predictive science.",
        history: "Numerological ideas appear in Pythagorean philosophy (6th century BCE), Kabbalistic gematria (Jewish mystical tradition), and various folk traditions worldwide. Modern Western numerology as commonly practiced today was largely systematized in the early 20th century by writers like L. Dow Balliett and later popularized by Florence Campbell.",
        vocabulary: [
          { term: 'Life Path Number', definition: 'Calculated from your birth date; considered the most significant number, describing your core life journey.' },
          { term: 'Expression Number', definition: 'Calculated from the full name at birth; describes natural talents and tendencies.' },
          { term: 'Master Numbers', definition: '11, 22, and 33 — numbers not reduced to a single digit, considered to carry intensified energy.' },
          { term: 'Angel Numbers', definition: 'Repeating number sequences (111, 444, 1212) interpreted as meaningful messages or synchronicities.' },
        ],
        meaning: "Numbers in numerology are not mathematical — they are symbolic. The number 7 is not about quantity; it is about introspection, mystery, and spiritual seeking. Interpretations vary between systems and practitioners.",
        howToRead: "To find your Life Path Number: add all digits of your birth date together, then reduce to a single digit (or Master Number). Example: November 15, 1990 = 1+1+1+5+1+9+9+0 = 27 = 2+7 = 9. Life Path 9.",
        example: "Life Path 9 is associated with humanitarianism, completion, and wisdom gained through experience. A Life Path 9 person may feel drawn to service, teaching, or creative expression with a universal message.",
        relatedTool: { label: 'Numerology Calculator', href: '/numerology' },
        quiz: [
          {
            question: "What are Master Numbers in numerology?",
            options: ['Numbers above 100', '11, 22, and 33 — not reduced to single digits', 'The numbers 1 through 9', 'Prime numbers only'],
            correctIndex: 1,
            explanation: "Master Numbers (11, 22, 33) are not reduced to single digits in most numerology systems. They are considered to carry intensified or spiritually significant energy.",
          },
          {
            question: "How is a Life Path Number calculated?",
            options: ['From your full name', 'From your birth date digits added together and reduced', 'From your sun sign', 'From your favorite number'],
            correctIndex: 1,
            explanation: "The Life Path Number is found by adding all digits of your birth date together, then reducing to a single digit (or leaving as 11, 22, or 33 if a Master Number results).",
          },
        ],
      },
      {
        slug: 'life-path-numbers',
        title: 'Life Path Numbers 1–9',
        subtitle: 'What each number means for your journey',
        level: 'beginner',
        durationMinutes: 12,
        introduction: "The Life Path Number is the most important number in a numerology reading. It describes your core journey, natural strengths, and recurring life themes. Here is a guide to all nine Life Path Numbers.",
        history: "The nine-number system used in modern Western numerology was largely codified in the early 20th century. Pythagorean numerology (the most common Western system) reduces all numbers to 1–9 plus Master Numbers 11, 22, and 33. Chaldean numerology, an older system, uses a different assignment of letters to numbers and does not reduce to 9.",
        vocabulary: [
          { term: 'Life Path 1', definition: 'The Leader — independent, pioneering, self-reliant. Themes: originality, ambition, new beginnings.' },
          { term: 'Life Path 2', definition: 'The Mediator — cooperative, sensitive, diplomatic. Themes: partnership, balance, intuition.' },
          { term: 'Life Path 3', definition: 'The Communicator — creative, expressive, joyful. Themes: self-expression, art, social connection.' },
          { term: 'Life Path 4', definition: 'The Builder — practical, disciplined, reliable. Themes: structure, hard work, foundations.' },
          { term: 'Life Path 5', definition: 'The Freedom-Seeker — adaptable, adventurous, curious. Themes: change, freedom, experience.' },
          { term: 'Life Path 6', definition: 'The Nurturer — responsible, caring, community-oriented. Themes: family, service, harmony.' },
          { term: 'Life Path 7', definition: 'The Seeker — introspective, analytical, spiritual. Themes: inner wisdom, mystery, solitude.' },
          { term: 'Life Path 8', definition: 'The Achiever — ambitious, authoritative, material-minded. Themes: power, success, abundance.' },
          { term: 'Life Path 9', definition: 'The Humanitarian — compassionate, wise, universal. Themes: completion, service, letting go.' },
        ],
        meaning: "No Life Path Number is better than another. Each carries both gifts and challenges. A Life Path 8 may achieve great material success but struggle with work-life balance. A Life Path 2 may excel in relationships but struggle with self-assertion. The number describes tendencies, not destiny.",
        howToRead: "Calculate your Life Path Number (see the previous lesson), then read its description as a starting point for reflection — not a fixed label. Notice what resonates and what does not. Your chart is a map, not a cage.",
        example: "Life Path 7 people often feel drawn to research, spirituality, or solitary creative work. They may struggle with vulnerability and intimacy. Understanding this tendency can help a Life Path 7 consciously cultivate connection rather than defaulting to isolation.",
        relatedTool: { label: 'Numerology Calculator', href: '/numerology' },
        quiz: [
          {
            question: "Which Life Path Number is associated with leadership and independence?",
            options: ['2', '4', '1', '9'],
            correctIndex: 2,
            explanation: "Life Path 1 is the Leader — associated with independence, originality, ambition, and pioneering new paths.",
          },
          {
            question: "What does Life Path 9 represent?",
            options: ['Material success and power', 'Creativity and self-expression', 'Humanitarianism, completion, and universal wisdom', 'Structure and hard work'],
            correctIndex: 2,
            explanation: "Life Path 9 is the Humanitarian — associated with compassion, wisdom, completion, and a sense of universal service. It is the final single-digit number, carrying themes of endings and letting go.",
          },
        ],
      },
    ],
  },
  {
    slug: 'witchcraft',
    title: 'Witchcraft & Spellwork',
    subtitle: 'History, ethics, tools, and practice',
    icon: '🧙',
    color: 'hsl(var(--accent))',
    description: 'Explore the history and practice of witchcraft — from ancient folk magic to modern Wicca and eclectic traditions — with attention to ethics and cultural context.',
    lessons: [
      {
        slug: 'history-of-witchcraft',
        title: 'A History of Witchcraft',
        subtitle: 'From folk magic to modern practice',
        level: 'beginner',
        durationMinutes: 15,
        introduction: "Witchcraft has meant many different things across history and cultures. Today it encompasses a wide range of practices — from Wicca (a modern religion founded in the mid-20th century) to eclectic folk magic, traditional witchcraft, and cultural practices with deep indigenous roots.",
        history: "The word 'witch' derives from Old English wicce/wicca. Pre-Christian European folk magic involved herbalism, charms, and divination practiced by cunning folk — local healers and advisors. The European witch trials (roughly 1450–1750) were a period of mass persecution driven by theological panic, political instability, and misogyny — not evidence of an organized witch religion. Modern Wicca was developed by Gerald Gardner in England in the 1950s, drawing on ceremonial magic, folklore, and Romantic-era nature religion. Contemporary witchcraft is enormously diverse.",
        vocabulary: [
          { term: 'Wicca', definition: 'A modern pagan religion founded by Gerald Gardner in the 1950s, emphasizing nature worship, the Wheel of the Year, and the Wiccan Rede.' },
          { term: 'Cunning folk', definition: 'Pre-modern European practitioners of folk magic — healers, diviners, and charm-makers who served their communities.' },
          { term: 'Wiccan Rede', definition: '"An it harm none, do what ye will" — the central ethical principle of Wicca.' },
          { term: 'Eclectic witchcraft', definition: 'A personal practice that draws from multiple traditions without adhering to one specific path.' },
          { term: 'Sabbat', definition: 'One of eight seasonal festivals in the Wheel of the Year, marking solstices, equinoxes, and cross-quarter days.' },
        ],
        meaning: "Modern witchcraft is primarily a practice of intentional living — working with natural cycles, symbolic tools, and focused intention to create change. Most contemporary practitioners emphasize personal responsibility, respect for nature, and ethical use of magical practice.",
        howToRead: "When exploring witchcraft, start with what resonates. There is no single correct path. Research the origins of practices you are drawn to, respect cultural boundaries, and develop your own ethical framework.",
        example: "A simple candle spell: choose a candle color that corresponds to your intention (green for abundance, white for clarity), write your intention on paper, light the candle, speak your intention aloud, and let the candle burn safely. The ritual creates focused attention — which is the real magic.",
        relatedTool: { label: 'Spell Library', href: '/spells' },
        quiz: [
          {
            question: "When was modern Wicca founded?",
            options: ['Ancient times', 'The Middle Ages', 'The 1950s', 'The 1990s'],
            correctIndex: 2,
            explanation: "Modern Wicca was developed by Gerald Gardner in England in the 1950s. It is a modern religion, not an ancient one, though it draws on older folklore and magical traditions.",
          },
          {
            question: "What were 'cunning folk'?",
            options: ['Witch trial prosecutors', 'Pre-modern folk magic practitioners who served their communities', 'Members of a secret society', 'A type of tarot reader'],
            correctIndex: 1,
            explanation: "Cunning folk were pre-modern European practitioners of folk magic — local healers, diviners, and charm-makers who provided practical magical services to their communities.",
          },
        ],
      },
      {
        slug: 'ritual-tools-and-ethics',
        title: 'Ritual Tools & Ethics',
        subtitle: 'Altars, tools, and responsible practice',
        level: 'beginner',
        durationMinutes: 12,
        introduction: "Ritual tools are physical objects used to focus intention, mark sacred space, and engage the senses in magical practice. They are not required — intention is the core of any spell — but many practitioners find them helpful anchors for focused attention.",
        history: "The use of ritual tools in Western witchcraft was heavily influenced by ceremonial magic traditions, particularly the Key of Solomon (a medieval grimoire) and the Hermetic Order of the Golden Dawn (19th century). Wicca adopted and adapted many of these tools. Folk magic traditions worldwide use simpler, more improvised tools drawn from everyday life.",
        vocabulary: [
          { term: 'Altar', definition: 'A dedicated surface for magical work, typically holding tools, candles, crystals, and symbols relevant to current intentions.' },
          { term: 'Athame', definition: 'A ritual knife used to direct energy, cast circles, and mark boundaries. Traditionally double-edged and not used for cutting physical objects.' },
          { term: 'Wand', definition: 'A tool for directing energy and intention. Associated with the element of Fire or Air depending on the tradition.' },
          { term: 'Chalice', definition: 'A ritual cup representing the element of Water, the feminine, and receptivity.' },
          { term: 'Pentacle', definition: 'A five-pointed star within a circle, used as a protective symbol and altar tool representing Earth.' },
          { term: 'Casting a circle', definition: 'Creating a sacred, protected space for ritual work by visualizing or physically marking a boundary.' },
        ],
        meaning: "Tools are extensions of intention, not sources of power. A candle does not cast a spell — your focused intention does. Tools help create the right mental and emotional state for magical work. You can practice effectively with nothing more than your breath, your voice, and your attention.",
        howToRead: "Start simple. A single candle, a quiet space, and a clear intention is a complete ritual. Add tools gradually as you discover what resonates with you. Never feel pressured to acquire expensive or elaborate equipment.",
        example: "A simple altar for a new beginning: a white candle (clarity, new starts), a piece of clear quartz (amplification), a written intention, and a small bowl of water (emotional clarity). Light the candle, read your intention aloud, sit quietly for a few minutes, then extinguish the candle safely.",
        relatedTool: { label: 'Spell Library', href: '/spells' },
        quiz: [
          {
            question: "What is the most essential element of any spell or ritual?",
            options: ['An expensive altar', 'A specific tool', 'Focused intention', 'A full moon'],
            correctIndex: 2,
            explanation: "Focused intention is the core of any magical practice. Tools, timing, and setting are helpful supports, but intention is what gives a spell its direction and meaning.",
          },
          {
            question: "What does casting a circle mean in witchcraft?",
            options: ['Drawing a circle on paper', 'Creating a sacred, protected space for ritual work', 'A type of tarot spread', 'A moon phase ritual'],
            correctIndex: 1,
            explanation: "Casting a circle means creating a sacred, energetically protected space for ritual work — either by physically marking a boundary or by visualization and intention.",
          },
        ],
      },
    ],
  },
  {
    slug: 'herbs-crystals',
    title: 'Herbs, Crystals & Correspondences',
    subtitle: 'Magical properties, cultural context, and safety',
    icon: '🌿',
    color: 'hsl(var(--grimoire-herb))',
    description: 'Learn the traditional magical associations of herbs and crystals, their cultural origins, and important safety considerations.',
    lessons: [
      {
        slug: 'working-with-herbs',
        title: 'Working with Herbs',
        subtitle: 'Magical correspondences and safe practice',
        level: 'beginner',
        durationMinutes: 12,
        introduction: "Herbs have been used in magical and healing practice across virtually every human culture. In magical work, herbs are used for their symbolic correspondences — their traditional associations with specific intentions, planets, elements, and energies.",
        history: "Herbal magic draws from European folk traditions, Indigenous plant medicine, Ayurveda, Traditional Chinese Medicine, and many other systems. The magical associations of herbs were codified in grimoires like the Key of Solomon and in herbalists' manuals. Modern practitioners draw from these sources while also developing personal relationships with plants.",
        vocabulary: [
          { term: 'Correspondence', definition: 'The symbolic association of an herb with a planet, element, intention, or deity.' },
          { term: 'Materia magica', definition: 'The collection of physical materials (herbs, crystals, oils) used in magical practice.' },
          { term: 'Smudging', definition: 'Burning dried herbs to cleanse a space or person. Note: white sage smudging is a sacred practice of specific Indigenous cultures — use with respect and awareness.' },
          { term: 'Infusion', definition: 'Steeping herbs in water (tea) or oil to extract their properties.' },
        ],
        meaning: "Magical herbalism is about intention and symbolic resonance. Lavender is associated with calm and peace — burning lavender incense while setting an intention for peace reinforces that intention through scent, ritual, and symbolism. The herb is a tool for focused attention.",
        howToRead: "When choosing herbs for a spell or ritual, consider: What is my intention? What herbs are traditionally associated with that intention? Are there any safety concerns? (Some herbs are toxic — never ingest without proper knowledge.) How will I use the herb — dried, as incense, in a sachet, as oil?",
        example: "A simple protection sachet: combine dried rosemary (protection, clarity), black tourmaline (grounding, protection), and a pinch of salt in a small cloth bag. Hold it while stating your intention, then carry it or place it at your door.",
        relatedTool: { label: 'Herbs & Ingredients', href: '/herbs' },
        quiz: [
          {
            question: "What does 'correspondence' mean in herbal magic?",
            options: ['A letter between practitioners', 'The symbolic association of an herb with an intention or element', 'The scientific name of a plant', 'A type of herbal tea'],
            correctIndex: 1,
            explanation: "In magical practice, a correspondence is the symbolic link between an herb (or crystal, color, planet, etc.) and a specific intention, element, or energy.",
          },
          {
            question: "Why is it important to research herbs before ingesting them?",
            options: ['For better magical results', 'Some herbs are toxic or interact with medications', 'To find the best price', 'Ingestion is always required for magic'],
            correctIndex: 1,
            explanation: "Safety is essential. Many herbs used in magical practice are toxic if ingested, and others interact with medications. Always research thoroughly before consuming any herb.",
          },
        ],
      },
      {
        slug: 'working-with-crystals',
        title: 'Working with Crystals',
        subtitle: 'Properties, correspondences, and care',
        level: 'beginner',
        durationMinutes: 10,
        introduction: "Crystals and gemstones have been used in spiritual and healing practice across cultures for thousands of years. In magical work, crystals are used for their symbolic correspondences — their traditional associations with specific intentions, planets, elements, and energies.",
        history: "Crystal use in spiritual practice appears in ancient Egypt, Mesopotamia, Greece, and many Indigenous traditions worldwide. Medieval European lapidaries (books of stone properties) described the magical and medicinal properties of gems. Modern crystal healing was popularized in the New Age movement of the 1970s–1980s, drawing on older traditions while adding new interpretations.",
        vocabulary: [
          { term: 'Amethyst', definition: 'Purple quartz associated with spiritual protection, intuition, and calm. One of the most widely used crystals in modern practice.' },
          { term: 'Rose quartz', definition: 'Pink quartz associated with love, compassion, and emotional healing.' },
          { term: 'Black tourmaline', definition: 'A protective stone associated with grounding, shielding from negative energy, and psychic protection.' },
          { term: 'Clear quartz', definition: 'Called the master healer — associated with clarity, amplification, and programmability. Used to enhance the energy of other stones.' },
          { term: 'Cleansing', definition: 'Clearing a crystal of accumulated energy through methods like moonlight, running water, sound, or smoke.' },
          { term: 'Programming', definition: 'Setting an intention for a crystal by holding it and focusing your desired purpose into it.' },
        ],
        meaning: "Crystal properties are symbolic and traditional, not scientifically verified. Their value lies in their role as physical anchors for intention — holding a rose quartz while focusing on self-compassion reinforces that intention through touch, symbolism, and ritual attention.",
        howToRead: "Choose crystals based on your current intention. Research their traditional associations, then trust your intuition about what resonates. Cleanse new crystals before use. Keep them where you will see and interact with them — on your altar, desk, or bedside.",
        example: "For a study session: place clear quartz (clarity, focus) and fluorite (mental organization, concentration) on your desk. Before beginning, hold each stone briefly and set an intention for focused, productive work.",
        relatedTool: { label: 'Daily Dashboard', href: '/dashboard' },
        quiz: [
          {
            question: "What is clear quartz traditionally associated with?",
            options: ['Love and compassion', 'Protection and grounding', 'Clarity, amplification, and programmability', 'Intuition and calm'],
            correctIndex: 2,
            explanation: "Clear quartz is called the master healer and is associated with clarity, amplification, and programmability. It is used to enhance the energy of other stones and to amplify intentions.",
          },
          {
            question: "What does 'cleansing' a crystal mean?",
            options: ['Washing it with soap', 'Clearing it of accumulated energy through moonlight, water, sound, or smoke', 'Polishing it to a shine', 'Charging it in sunlight only'],
            correctIndex: 1,
            explanation: "Cleansing a crystal means clearing it of accumulated energy. Common methods include moonlight, running water, sound (singing bowls), smoke, or placing it on selenite.",
          },
        ],
      },
    ],
  },
  {
    slug: 'dreams',
    title: 'Dreams & Symbolism',
    subtitle: 'Dream journaling, symbols, and interpretation',
    icon: '💭',
    color: 'hsl(var(--grimoire-dream))',
    description: 'Explore the rich world of dream symbolism, learn how to keep a dream journal, and develop your own personal symbol dictionary.',
    lessons: [
      {
        slug: 'dream-journaling',
        title: 'Dream Journaling',
        subtitle: 'How to capture and work with your dreams',
        level: 'beginner',
        durationMinutes: 10,
        introduction: "Dreams have fascinated humans across every culture and era. Whether you approach them psychologically (as expressions of the unconscious), spiritually (as messages or visions), or simply as interesting mental experiences, keeping a dream journal is one of the most powerful tools for self-understanding.",
        history: "Dream interpretation appears in ancient Mesopotamian, Egyptian, Greek, and Chinese texts. The Oneirocritica of Artemidorus (2nd century CE) is one of the earliest systematic dream interpretation manuals. Sigmund Freud's The Interpretation of Dreams (1899) brought dream analysis into modern psychology. Carl Jung expanded this into a framework of universal archetypes and the collective unconscious.",
        vocabulary: [
          { term: 'Lucid dream', definition: 'A dream in which the dreamer is aware they are dreaming and may be able to influence the dream.' },
          { term: 'Hypnagogic', definition: 'The transitional state between wakefulness and sleep, often accompanied by vivid imagery.' },
          { term: 'Archetype', definition: 'In Jungian psychology, a universal symbol or character pattern that appears in dreams across cultures.' },
          { term: 'Shadow', definition: 'In Jungian psychology, the unconscious aspects of the self that are repressed or unacknowledged.' },
        ],
        meaning: "Dream symbols are highly personal. A snake might represent transformation, fear, healing, or sexuality depending on the dreamer's associations and cultural background. Universal symbol dictionaries are starting points, not definitive answers. Your own recurring symbols are the most meaningful.",
        howToRead: "Keep a journal by your bed. Immediately upon waking, write down everything you remember — images, feelings, colors, people, actions — before the dream fades. Note the emotional tone. Over time, patterns will emerge.",
        example: "Recurring dream of flying: first, note the feeling (exhilarating? terrifying?). Then consider what is happening in your waking life. Flying often appears during periods of creative freedom, spiritual expansion, or a desire to escape constraints.",
        relatedTool: { label: 'Dream Journal', href: '/dream-journal' },
        quiz: [
          {
            question: "What is a lucid dream?",
            options: ['A very vivid dream', 'A dream in which you know you are dreaming', 'A prophetic dream', 'A nightmare'],
            correctIndex: 1,
            explanation: "A lucid dream is one in which the dreamer becomes aware that they are dreaming. Some people learn to influence or direct their lucid dreams.",
          },
          {
            question: "Why are personal dream symbols more meaningful than universal dictionaries?",
            options: ['They are not — dictionaries are always more accurate', 'Because dreams have no meaning', 'Because symbols carry personal associations shaped by your own life and culture', 'Because universal symbols do not exist'],
            correctIndex: 2,
            explanation: "While universal symbol patterns exist, your personal associations — shaped by your experiences, culture, and emotions — give dream symbols their most relevant meaning for you specifically.",
          },
        ],
      },
      {
        slug: 'shadow-work-and-dreams',
        title: 'Shadow Work & Dreams',
        subtitle: 'Working with the unconscious through dreams',
        level: 'intermediate',
        durationMinutes: 12,
        introduction: "Shadow work is the practice of exploring the unconscious aspects of yourself — the parts you have suppressed, denied, or not yet integrated. Dreams are one of the most direct windows into the shadow, offering images and scenarios that bypass the conscious mind's defenses.",
        history: "The concept of the shadow was developed by Swiss psychiatrist Carl Jung (1875–1961). Jung observed that the unconscious mind contains not just repressed negative material but also unlived potential — the gold in the shadow. Shadow work as a spiritual practice was popularized in the late 20th century, drawing on Jungian psychology and integrating it with spiritual and magical practice.",
        vocabulary: [
          { term: 'Shadow', definition: 'In Jungian psychology, the unconscious aspects of the self — both negative traits we deny and positive potential we have not yet claimed.' },
          { term: 'Projection', definition: 'Attributing your own unconscious qualities to other people. What strongly irritates or attracts you in others often reflects something in yourself.' },
          { term: 'Integration', definition: 'The process of acknowledging and accepting shadow material, bringing it into conscious awareness rather than suppressing it.' },
          { term: 'Active imagination', definition: "A Jungian technique of consciously engaging with dream images and unconscious figures through writing, art, or inner dialogue." },
        ],
        meaning: "Shadow work is not about becoming perfect or eliminating negative traits. It is about honest self-awareness — seeing yourself clearly, accepting your full complexity, and choosing how to act rather than being driven by unconscious patterns.",
        howToRead: "When a dream disturbs you, sit with it rather than dismissing it. Ask: what feeling did this dream evoke? What in my waking life might this connect to? What quality in the dream characters might I be projecting? Write your reflections in your Dream Journal.",
        example: "Recurring dream of being chased: the pursuer often represents something you are avoiding in waking life — an emotion, a decision, a truth. Instead of running in the dream, try turning to face the pursuer and asking what it wants. This active imagination technique can be surprisingly revealing.",
        relatedTool: { label: 'Dream Journal', href: '/dream-journal' },
        quiz: [
          {
            question: "What is the shadow in Jungian psychology?",
            options: ['Nightmares only', 'The unconscious aspects of the self — both denied negatives and unlived potential', 'Dark magic', 'The part of the mind that controls sleep'],
            correctIndex: 1,
            explanation: "The shadow contains both the negative traits we deny and the positive potential we have not yet claimed. Shadow work involves bringing these unconscious aspects into awareness.",
          },
          {
            question: "What is projection in the context of shadow work?",
            options: ['Projecting a movie', 'Attributing your own unconscious qualities to other people', 'Predicting the future through dreams', 'A type of meditation'],
            correctIndex: 1,
            explanation: "Projection is attributing your own unconscious qualities to others. What strongly irritates or attracts you in other people often reflects something in your own shadow.",
          },
        ],
      },
    ],
  },
  {
    slug: 'history-origins',
    title: 'History & Origins',
    subtitle: 'Evidence, folklore, and modern practice',
    icon: '📜',
    color: 'hsl(var(--grimoire-ritual))',
    description: 'Explore the documented historical roots of astrology, tarot, witchcraft, and related traditions — distinguishing evidence from folklore and modern invention.',
    lessons: [
      {
        slug: 'ancient-roots',
        title: 'Ancient Roots of Divination',
        subtitle: 'Mesopotamia, Egypt, Greece, and beyond',
        level: 'intermediate',
        durationMinutes: 15,
        introduction: "The practices that inform modern spiritual tools — astrology, divination, herbalism, ritual magic — have roots stretching back thousands of years across multiple civilizations. Understanding these roots helps us appreciate both the depth and the evolution of these traditions.",
        history: "Celestial divination in Mesopotamia dates to at least 2000 BCE. The Enuma Anu Enlil, a Babylonian compendium of celestial omens, contains hundreds of observations linking astronomical events to earthly outcomes. Egyptian astrology developed alongside Babylonian traditions from around 500 BCE. Greek philosophers including Plato and Aristotle engaged with astrological ideas. The Hellenistic period (roughly 300 BCE–300 CE) saw the synthesis of Babylonian, Egyptian, and Greek traditions into the horoscopic astrology that forms the basis of Western practice today.",
        vocabulary: [
          { term: 'Enuma Anu Enlil', definition: 'A Babylonian compendium of celestial omens, one of the oldest astrological texts, dating to around 1600 BCE.' },
          { term: 'Horoscopic astrology', definition: 'Astrology based on a chart cast for a specific moment and location — the birth chart tradition.' },
          { term: 'Hellenistic period', definition: 'The era from Alexander the Great (323 BCE) to the rise of Rome, during which Greek culture spread across the Mediterranean and Middle East.' },
          { term: 'Syncretism', definition: 'The blending of different religious or cultural traditions into a new synthesis.' },
        ],
        meaning: "Many modern spiritual practices are younger than they appear. Wicca is 70 years old. Tarot divination is 300 years old. Horoscopic astrology is about 2,300 years old. Knowing the actual history does not diminish these practices — it enriches them by showing how humans have always sought meaning in symbols and cycles.",
        howToRead: "When exploring the history of a practice, look for primary sources and peer-reviewed scholarship alongside popular accounts. Note when a claim is documented versus when it is folklore or modern invention. Spellful's Astronomical Accuracy page explains our methodology.",
        example: "The claim that tarot originated in ancient Egypt is a popular myth with no historical support. Tarot cards were invented in 15th-century Italy. The Egyptian origin story was invented by 18th-century French occultists. Both the real history and the invented mythology are interesting — but they are different things.",
        relatedTool: { label: 'Astronomical Accuracy', href: '/astronomical-accuracy' },
        quiz: [
          {
            question: "Where did horoscopic astrology (birth chart astrology) develop?",
            options: ['Ancient Egypt alone', 'Medieval Europe', 'The Hellenistic world, synthesizing Babylonian and Greek traditions', 'Ancient China'],
            correctIndex: 2,
            explanation: "Horoscopic astrology developed in the Hellenistic period, synthesizing Babylonian celestial observation with Greek philosophical frameworks. It spread through the Roman Empire and later through Islamic scholarship.",
          },
          {
            question: "When was modern Wicca founded?",
            options: ['Ancient times', 'The Middle Ages', 'The 1950s', 'The 1990s'],
            correctIndex: 2,
            explanation: "Modern Wicca was founded by Gerald Gardner in England in the 1950s. It is a modern religion that draws on older folklore and magical traditions but is not itself ancient.",
          },
        ],
      },
      {
        slug: 'tarot-history',
        title: 'The Real History of Tarot',
        subtitle: 'From card game to divination tool',
        level: 'intermediate',
        durationMinutes: 12,
        introduction: "Tarot has one of the most thoroughly documented and frequently misrepresented histories of any spiritual practice. Understanding what tarot actually is — and is not — makes you a more informed and grounded practitioner.",
        history: "Tarot cards were invented in northern Italy in the early 15th century as a card game called tarocchi or trionfi. The earliest surviving decks (Visconti-Sforza, c. 1450) were luxury items commissioned by aristocratic families. The game spread across Europe and was played for centuries with no divinatory use. In 1781, French occultist Antoine Court de Gébelin published a claim that tarot originated in ancient Egypt — a claim with no historical support that he invented. This Egyptian myth launched tarot's occult career. The Rider-Waite-Smith deck (1909), illustrated by Pamela Colman Smith under Arthur Edward Waite's direction, became the template for most modern decks and introduced illustrated pip cards (the numbered Minor Arcana).",
        vocabulary: [
          { term: 'Tarocchi', definition: 'The original Italian card game from which tarot developed, played from the 15th century onward.' },
          { term: 'Visconti-Sforza deck', definition: 'One of the earliest surviving tarot decks, created c. 1450 for the Visconti and Sforza families of Milan.' },
          { term: 'Antoine Court de Gébelin', definition: 'An 18th-century French occultist who invented the false claim that tarot originated in ancient Egypt.' },
          { term: 'Rider-Waite-Smith deck', definition: 'The 1909 tarot deck illustrated by Pamela Colman Smith, which became the template for most modern decks.' },
          { term: 'Pamela Colman Smith', definition: 'The artist who illustrated the Rider-Waite-Smith deck. Her contribution was long uncredited; the deck was often called simply the Rider-Waite deck.' },
        ],
        meaning: "Knowing that tarot began as a card game does not diminish its value as a reflective tool. It simply means we can appreciate it for what it actually is — a rich symbolic system developed over centuries — rather than a mythologized ancient artifact.",
        howToRead: "When you encounter claims about tarot's origins, look for primary sources. The Egyptian origin myth, the claim that tarot encodes Kabbalistic secrets from ancient times, and the idea that the Major Arcana are ancient archetypes are all modern inventions. The real history is more interesting.",
        example: "The High Priestess card was originally called La Papessa (The Female Pope) in early Italian decks — likely a reference to the legendary Pope Joan or to a specific historical figure. The occult reinterpretation as a mysterious keeper of hidden knowledge came centuries later.",
        relatedTool: { label: 'Tarot Reading', href: '/tarot' },
        quiz: [
          {
            question: "Where and when were tarot cards invented?",
            options: ['Ancient Egypt, 3000 BCE', 'Medieval France, 1200 CE', 'Northern Italy, early 15th century', 'Ancient India, 500 BCE'],
            correctIndex: 2,
            explanation: "Tarot cards were invented in northern Italy in the early 15th century as a card game. The Egyptian origin story was invented by an 18th-century French occultist with no historical evidence.",
          },
          {
            question: "Who illustrated the Rider-Waite-Smith deck?",
            options: ['Arthur Edward Waite', 'Gerald Gardner', 'Pamela Colman Smith', 'Antoine Court de Gébelin'],
            correctIndex: 2,
            explanation: "Pamela Colman Smith illustrated the 1909 Rider-Waite-Smith deck. Her contribution was long uncredited — the deck was often called simply the Rider-Waite deck, omitting her name.",
          },
        ],
      },
    ],
  },
];

export function getTopic(slug: string): Topic | undefined {
  return ACADEMY_TOPICS.find((t) => t.slug === slug);
}

export function getLesson(topicSlug: string, lessonSlug: string): Lesson | undefined {
  const topic = getTopic(topicSlug);
  return topic?.lessons.find((l) => l.slug === lessonSlug);
}

export function getTotalLessons(): number {
  return ACADEMY_TOPICS.reduce((sum, t) => sum + t.lessons.length, 0);
}
