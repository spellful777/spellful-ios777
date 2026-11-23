// Full 78-card Rider-Waite Tarot deck with upright and reversed meanings

export interface TarotCard {
  id: number;
  name: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number: number; // 0-21 for major, 1-14 for minor
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  element?: string;
  planet?: string;
  zodiac?: string;
  description: string; // visual description for card art placeholder
  image?: string; // slot URL for uploaded card art
}

export const TAROT_CARDS: TarotCard[] = [
  // ── Major Arcana ──────────────────────────────────────────────────────────
  {
    id: 0, name: 'The Fool', arcana: 'major', number: 0,
    keywords: ['beginnings', 'innocence', 'spontaneity', 'free spirit'],
    uprightMeaning: 'New beginnings, unlimited potential, and a leap of faith. The Fool invites you to embrace adventure with an open heart, trusting the universe to catch you. A fresh start is calling — step forward with courage and wonder.',
    reversedMeaning: 'Recklessness, naivety, or holding back from a necessary leap. You may be taking unnecessary risks without forethought, or conversely, fear is preventing you from starting something new. Ground yourself before moving forward.',
    element: 'Air', planet: 'Uranus',
    description: 'A young figure stepping off a cliff edge, white rose in hand, small dog at heels, sun shining bright',
    image: '/airo-assets/images/tarot/major-arcana/the-fool',
  },
  {
    id: 1, name: 'The Magician', arcana: 'major', number: 1,
    keywords: ['manifestation', 'willpower', 'skill', 'resourcefulness'],
    uprightMeaning: 'You have all the tools you need to manifest your desires. The Magician channels divine energy into the physical world — your willpower, skill, and focus are at their peak. Take inspired action now.',
    reversedMeaning: 'Manipulation, poor planning, or untapped potential. Skills may be misused or you feel blocked from accessing your power. Examine whether you are deceiving yourself or others, and reconnect with your authentic intentions.',
    element: 'Air', planet: 'Mercury',
    description: 'A robed figure at an altar with wand raised to sky, all four suit symbols before them, infinity symbol above',
    image: '/airo-assets/images/tarot/major-arcana/the-magician',
  },
  {
    id: 2, name: 'The High Priestess', arcana: 'major', number: 2,
    image: '/airo-assets/images/tarot/major-arcana/the-high-priestess',
    keywords: ['intuition', 'mystery', 'inner knowledge', 'the subconscious'],
    uprightMeaning: 'Trust your intuition and inner wisdom above all else. The High Priestess guards the veil between worlds — she asks you to go within, listen to your dreams, and honor the sacred feminine mysteries unfolding in your life.',
    reversedMeaning: 'Secrets, disconnection from intuition, or repressed feelings. You may be ignoring your inner voice or allowing others to override your knowing. Retreat inward and reconnect with your deeper wisdom.',
    element: 'Water', planet: 'Moon',
    description: 'A crowned woman seated between two pillars, crescent moon at feet, pomegranate veil behind her',
  },
  {
    id: 3, name: 'The Empress', arcana: 'major', number: 3,
    keywords: ['fertility', 'abundance', 'nurturing', 'nature', 'creativity'],
    uprightMeaning: 'Abundance, fertility, and creative power flow through you. The Empress embodies the divine feminine — nurturing growth in all forms. This is a time of blossoming, sensual pleasure, and deep connection to the natural world.',
    reversedMeaning: 'Creative blocks, dependence, or smothering energy. You may be neglecting self-care, feeling creatively stifled, or overextending yourself for others. Reconnect with nature and your own needs.',
    element: 'Earth', planet: 'Venus',
    description: 'A crowned woman on a throne in a lush forest, wheat at her feet, heart-shaped shield with Venus symbol',
    image: '/airo-assets/images/tarot/major-arcana/the-empress',
  },
  {
    id: 4, name: 'The Emperor', arcana: 'major', number: 4,
    keywords: ['authority', 'structure', 'stability', 'leadership', 'fatherhood'],
    uprightMeaning: 'Establish order, take authority, and build lasting foundations. The Emperor brings discipline and structure — now is the time to lead with confidence, set clear boundaries, and create the stability you seek.',
    reversedMeaning: 'Rigidity, domination, or lack of discipline. Authority may be abused or you are struggling to assert yourself. Examine where control has become tyranny, or where you need to step into your own power.',
    element: 'Fire', zodiac: 'Aries',
    description: 'An armored emperor on a stone throne, ram heads carved in the throne, mountains behind him, scepter in hand',
    image: '/airo-assets/images/tarot/major-arcana/the-emperor',
  },
  {
    id: 5, name: 'The Hierophant', arcana: 'major', number: 5,
    keywords: ['tradition', 'conformity', 'morality', 'ethics', 'spiritual guidance'],
    uprightMeaning: 'Seek wisdom through established traditions, spiritual mentorship, or sacred institutions. The Hierophant bridges heaven and earth — honor the wisdom of those who came before while finding your own spiritual path.',
    reversedMeaning: 'Rebellion, subversiveness, or questioning dogma. You may be challenging conventional beliefs or feeling constrained by tradition. Trust your own spiritual authority and forge a personal path.',
    element: 'Earth', zodiac: 'Taurus',
    description: 'A robed pope figure on a throne between two pillars, two acolytes kneeling, triple crown, crossed keys at feet',
    image: '/airo-assets/images/tarot/major-arcana/the-hierophant',
  },
  {
    id: 6, name: 'The Lovers', arcana: 'major', number: 6,
    keywords: ['love', 'harmony', 'relationships', 'values alignment', 'choices'],
    uprightMeaning: 'A profound union, alignment of values, and meaningful choice awaits. The Lovers speaks of deep connection — romantic, spiritual, or with your own authentic self. Choose with your heart and align your actions with your deepest values.',
    reversedMeaning: 'Disharmony, imbalance, or misaligned values. A relationship may be strained, or you face a difficult choice between head and heart. Examine what you truly value and where compromise has become self-betrayal.',
    element: 'Air', zodiac: 'Gemini',
    description: 'A man and woman standing beneath an angel, the Tree of Knowledge behind the woman, Tree of Life behind the man',
    image: '/airo-assets/images/tarot/major-arcana/the-lovers',
  },
  {
    id: 7, name: 'The Chariot', arcana: 'major', number: 7,
    keywords: ['control', 'willpower', 'victory', 'assertion', 'determination'],
    uprightMeaning: 'Victory through willpower and focused determination. The Chariot calls you to harness opposing forces and drive forward with confidence. You have the strength to overcome obstacles — charge ahead with purpose.',
    reversedMeaning: 'Lack of control, aggression, or scattered energy. You may be forcing outcomes or feeling pulled in conflicting directions. Slow down, regain your focus, and ensure your actions align with your true destination.',
    element: 'Water', zodiac: 'Cancer',
    description: 'An armored warrior in a chariot pulled by two sphinxes — one black, one white — city behind, stars above',
    image: '/airo-assets/images/tarot/major-arcana/the-chariot',
  },
  {
    id: 8, name: 'Strength', arcana: 'major', number: 8,
    keywords: ['courage', 'patience', 'inner strength', 'compassion', 'influence'],
    uprightMeaning: 'True strength comes from compassion, patience, and inner courage. You have the power to tame your fears and impulses through love rather than force. Trust in your quiet, enduring power — it is more potent than you know.',
    reversedMeaning: 'Self-doubt, weakness, or raw emotion overwhelming reason. You may be giving your power away or acting from fear rather than love. Reconnect with your inner lion — your strength has not left you.',
    element: 'Fire', zodiac: 'Leo',
    description: 'A woman gently closing the mouth of a lion, infinity symbol above her head, flowers in her hair',
    image: '/airo-assets/images/tarot/major-arcana/strength',
  },
  {
    id: 9, name: 'The Hermit', arcana: 'major', number: 9,
    keywords: ['soul-searching', 'introspection', 'solitude', 'inner guidance', 'wisdom'],
    uprightMeaning: 'Withdraw from the noise of the world and seek your inner light. The Hermit walks alone not from loneliness but from wisdom — this is a sacred time for deep reflection, spiritual seeking, and illuminating your own path.',
    reversedMeaning: 'Isolation, loneliness, or withdrawal from the world. You may be cutting yourself off unnecessarily or avoiding the inner work that calls to you. Balance solitude with connection and bring your light back to others.',
    element: 'Earth', zodiac: 'Virgo',
    description: 'A cloaked elder on a mountain peak, lantern held aloft containing a six-pointed star, staff in other hand',
    image: '/airo-assets/images/tarot/major-arcana/the-hermit',
  },
  {
    id: 10, name: 'Wheel of Fortune', arcana: 'major', number: 10,
    keywords: ['good luck', 'karma', 'life cycles', 'destiny', 'turning point'],
    uprightMeaning: 'The wheel turns and fortune smiles upon you. A major turning point, lucky break, or karmic shift is at hand. Trust the cycles of life — what goes around comes around, and this moment holds the seeds of great change.',
    reversedMeaning: 'Bad luck, resistance to change, or breaking cycles. You may be fighting the natural flow of life or experiencing the downswing of fortune\'s wheel. Surrender to the cycle and trust that the wheel will turn again.',
    element: 'Fire', planet: 'Jupiter',
    description: 'A great wheel in the sky with sphinx atop, serpent descending, Anubis ascending, four winged creatures in corners',
    image: '/airo-assets/images/tarot/major-arcana/wheel-of-fortune',
  },
  {
    id: 11, name: 'Justice', arcana: 'major', number: 11,
    keywords: ['justice', 'fairness', 'truth', 'cause and effect', 'law'],
    uprightMeaning: 'Truth, fairness, and karmic balance are at work. Justice asks you to act with integrity and accept the consequences of your choices. A fair outcome is coming — trust that the universe sees all and balances all.',
    reversedMeaning: 'Injustice, dishonesty, or avoiding accountability. You may be experiencing unfair treatment or refusing to take responsibility for your actions. Examine where you have strayed from truth and make it right.',
    element: 'Air', zodiac: 'Libra',
    description: 'A crowned figure seated between pillars, scales in left hand, sword raised in right, red robe, purple veil behind',
    image: '/airo-assets/images/tarot/major-arcana/justice',
  },
  {
    id: 12, name: 'The Hanged Man', arcana: 'major', number: 12,
    keywords: ['pause', 'surrender', 'letting go', 'new perspectives', 'sacrifice'],
    uprightMeaning: 'Surrender to the pause and gain a new perspective. The Hanged Man willingly suspends himself to see the world differently — this is a time of sacred waiting, releasing control, and allowing transformation to unfold.',
    reversedMeaning: 'Delays, resistance, or martyrdom. You may be sacrificing yourself unnecessarily or refusing to let go of what no longer serves. The pause you resist is the very thing that will set you free.',
    element: 'Water', planet: 'Neptune',
    description: 'A serene figure hanging upside down from a living tree by one foot, halo of light around head, other leg crossed',
    image: '/airo-assets/images/tarot/major-arcana/the-hanged-man',
  },
  {
    id: 13, name: 'Death', arcana: 'major', number: 13,
    keywords: ['endings', 'change', 'transformation', 'transition', 'letting go'],
    uprightMeaning: 'A profound transformation is underway. Death in tarot rarely means physical death — it heralds the end of one chapter and the beginning of another. Release what no longer serves you and embrace the rebirth that follows.',
    reversedMeaning: 'Resistance to change, stagnation, or inability to move on. You may be clinging to the past or fearing necessary endings. The transformation you resist is the very one that will liberate you.',
    element: 'Water', zodiac: 'Scorpio',
    description: 'A skeleton knight on white horse, black flag with white rose, king fallen before him, sun rising between towers',
    image: '/airo-assets/images/tarot/major-arcana/death',
  },
  {
    id: 14, name: 'Temperance', arcana: 'major', number: 14,
    keywords: ['balance', 'moderation', 'patience', 'purpose', 'meaning'],
    uprightMeaning: 'Find the sacred middle path through patience and moderation. Temperance calls you to blend opposing forces with grace, trust the divine timing of your journey, and know that all things are working together for your highest good.',
    reversedMeaning: 'Imbalance, excess, or lack of long-term vision. You may be overindulging, rushing, or feeling out of alignment. Return to center, slow down, and reconnect with your deeper purpose.',
    element: 'Fire', zodiac: 'Sagittarius',
    description: 'An angelic figure pouring water between two cups, one foot on land one in water, triangle in square on robe, sun path ahead',
    image: '/airo-assets/images/tarot/major-arcana/temperance',
  },
  {
    id: 15, name: 'The Devil', arcana: 'major', number: 15,
    keywords: ['shadow self', 'attachment', 'addiction', 'restriction', 'materialism'],
    uprightMeaning: 'Examine the chains that bind you — many are of your own making. The Devil illuminates shadow patterns, addictions, and unhealthy attachments. Awareness is the first step to freedom; you have more power than you realize.',
    reversedMeaning: 'Breaking free, releasing limiting beliefs, or detachment. You are beginning to see through illusions and reclaim your power. The chains are loosening — continue the work of liberation.',
    element: 'Earth', zodiac: 'Capricorn',
    description: 'A horned devil on a pedestal, two chained figures below, inverted pentagram, torch in hand',
    image: '/airo-assets/images/tarot/major-arcana/the-devil',
  },
  {
    id: 16, name: 'The Tower', arcana: 'major', number: 16,
    keywords: ['sudden change', 'upheaval', 'chaos', 'revelation', 'awakening'],
    uprightMeaning: 'A sudden, dramatic upheaval clears away what was built on false foundations. The Tower may feel devastating, but it is ultimately liberating — what crumbles was never truly solid. From the rubble, something authentic can be built.',
    reversedMeaning: 'Avoiding disaster, fear of change, or delaying the inevitable. You may be resisting a necessary breakdown or experiencing internal upheaval. The tower will fall — better to release gracefully than be forced.',
    element: 'Fire', planet: 'Mars',
    description: 'A lightning-struck tower on a rocky cliff, crown blown off, two figures falling, flames erupting from windows',
    image: '/airo-assets/images/tarot/major-arcana/the-tower',
  },
  {
    id: 17, name: 'The Star', arcana: 'major', number: 17,
    keywords: ['hope', 'faith', 'renewal', 'spirituality', 'serenity'],
    uprightMeaning: 'After the storm comes the star — hope, healing, and divine guidance are yours. The Star pours her gifts freely, renewing your faith in yourself and the universe. This is a time of spiritual renewal, calm, and inspired possibility.',
    reversedMeaning: 'Lack of faith, despair, or disconnection from hope. You may be struggling to see the light after difficulty, or feeling spiritually adrift. The star still shines — look up and allow yourself to receive its healing.',
    element: 'Air', zodiac: 'Aquarius',
    description: 'A naked woman kneeling by water, one foot on land one in water, pouring from two jugs, eight stars above including one large',
    image: '/airo-assets/images/tarot/major-arcana/the-star',
  },
  {
    id: 18, name: 'The Moon', arcana: 'major', number: 18,
    keywords: ['illusion', 'fear', 'the unconscious', 'intuition', 'confusion'],
    uprightMeaning: 'Navigate the realm of dreams, illusions, and the deep unconscious. The Moon illuminates what is hidden — fears, fantasies, and shadow aspects seeking integration. Trust your intuition over logic in this mysterious time.',
    reversedMeaning: 'Release of fear, repressed emotions surfacing, or confusion lifting. The fog is beginning to clear and hidden truths are emerging. Face your fears with compassion and allow the unconscious to speak.',
    element: 'Water', zodiac: 'Pisces',
    description: 'A full moon between two towers, a crayfish emerging from water, a wolf and dog howling, path leading into darkness',
    image: '/airo-assets/images/tarot/major-arcana/the-moon',
  },
  {
    id: 19, name: 'The Sun', arcana: 'major', number: 19,
    keywords: ['positivity', 'fun', 'warmth', 'success', 'vitality'],
    uprightMeaning: 'Joy, success, and radiant vitality illuminate your path. The Sun shines its life-giving light on all your endeavors — this is a time of celebration, confidence, and the pure delight of being alive. Let yourself shine.',
    reversedMeaning: 'Temporary depression, lack of success, or inner child wounds. The sun is temporarily obscured but has not gone out. Reconnect with joy, play, and the simple pleasures that make life worth living.',
    element: 'Fire', planet: 'Sun',
    description: 'A radiant sun with a child on a white horse, sunflowers behind a wall, red banner waving, arms outstretched in joy',
    image: '/airo-assets/images/tarot/major-arcana/the-sun',
  },
  {
    id: 20, name: 'Judgement', arcana: 'major', number: 20,
    keywords: ['reflection', 'reckoning', 'awakening', 'absolution', 'inner calling'],
    uprightMeaning: 'A profound awakening and call to your higher purpose. Judgement asks you to rise, release the past with forgiveness, and answer the call of your soul. This is a moment of spiritual reckoning and glorious rebirth.',
    reversedMeaning: 'Self-doubt, ignoring the call, or inability to forgive. You may be too harsh in judging yourself or others, or refusing to heed your soul\'s calling. Release judgment and allow transformation.',
    element: 'Fire', planet: 'Pluto',
    description: 'An angel blowing a trumpet from clouds, figures rising from coffins below, mountains in background, red cross on banner',
    image: '/airo-assets/images/tarot/major-arcana/judgement',
  },
  {
    id: 21, name: 'The World', arcana: 'major', number: 21,
    keywords: ['completion', 'integration', 'accomplishment', 'travel', 'wholeness'],
    uprightMeaning: 'You have reached a magnificent completion — a cycle closes in triumph and wholeness. The World celebrates your journey and all you have integrated. A new, expanded chapter awaits as you carry your wisdom forward.',
    reversedMeaning: 'Incompletion, shortcuts, or delayed success. You may be close to completion but something remains unfinished. Tie up loose ends, integrate your lessons fully, and allow yourself to truly arrive.',
    element: 'Earth', planet: 'Saturn',
    description: 'A dancing figure wrapped in purple cloth within a laurel wreath, four winged creatures in corners, wands in each hand',
    image: '/airo-assets/images/tarot/major-arcana/the-world',
  },

  // ── Wands ─────────────────────────────────────────────────────────────────
  {
    id: 22, name: 'Ace of Wands', arcana: 'minor', suit: 'wands', number: 1,
    keywords: ['inspiration', 'new opportunities', 'growth', 'potential'],
    uprightMeaning: 'A spark of divine inspiration ignites your creative fire. The Ace of Wands brings a burst of energy, passion, and new beginnings. Seize this opportunity — the universe is handing you a torch. Run with it.',
    reversedMeaning: 'Delays, lack of motivation, or a false start. Creative energy is blocked or misdirected. Reconnect with your passion and wait for the right moment to strike.',
    element: 'Fire',
    description: 'A hand emerging from clouds holding a flowering wand, green landscape below, castle in distance',
    image: '/airo-assets/images/tarot/wands/ace-of-wands',
  },
  {
    id: 23, name: 'Two of Wands', arcana: 'minor', suit: 'wands', number: 2,
    keywords: ['future planning', 'progress', 'decisions', 'discovery'],
    uprightMeaning: 'You stand at a crossroads with the world in your hands. The Two of Wands invites bold planning and the courage to expand beyond your comfort zone. Your vision is clear — now chart your course.',
    reversedMeaning: 'Fear of the unknown, lack of planning, or playing it too safe. You may be hesitating at the threshold of expansion. Trust your vision and take the first step.',
    element: 'Fire',
    description: 'A figure on a castle battlement holding a globe, looking out to sea, one wand in hand one fixed to wall',
    image: '/airo-assets/images/tarot/wands/two-of-wands',
  },
  {
    id: 24, name: 'Three of Wands', arcana: 'minor', suit: 'wands', number: 3,
    keywords: ['expansion', 'foresight', 'overseas opportunities', 'leadership'],
    uprightMeaning: 'Your plans are in motion and the horizon is bright. The Three of Wands signals that your efforts are bearing fruit — expansion, travel, and long-term success are on their way. Keep your eyes on the horizon.',
    reversedMeaning: 'Delays in plans, obstacles to expansion, or lack of foresight. Something is preventing your vision from manifesting. Reassess your strategy and remain patient.',
    element: 'Fire',
    description: 'A figure overlooking the sea from a cliff, three wands planted around them, ships sailing in the distance',
    image: '/airo-assets/images/tarot/wands/three-of-wands',
  },
  {
    id: 25, name: 'Four of Wands', arcana: 'minor', suit: 'wands', number: 4,
    keywords: ['celebration', 'joy', 'harmony', 'relaxation', 'homecoming'],
    uprightMeaning: 'Celebrate! A milestone has been reached and joy abounds. The Four of Wands heralds a time of harmony, community, and heartfelt celebration. Gather with loved ones and honor how far you have come.',
    reversedMeaning: 'Lack of support, transition, or instability at home. A celebration may be delayed or family harmony disrupted. Create your own sense of belonging and find joy in small moments.',
    element: 'Fire',
    description: 'Four wands forming a canopy draped with flowers, two figures dancing beneath, castle in background, crowd celebrating',
    image: '/airo-assets/images/tarot/wands/four-of-wands',
  },
  {
    id: 26, name: 'Five of Wands', arcana: 'minor', suit: 'wands', number: 5,
    keywords: ['conflict', 'disagreements', 'competition', 'tension', 'diversity'],
    uprightMeaning: 'Conflict, competition, and creative tension are at play. The Five of Wands may feel chaotic, but this friction can spark growth and innovation. Stand your ground, listen to other perspectives, and find productive ways to channel this energy.',
    reversedMeaning: 'Avoiding conflict, inner tension, or competition ending. You may be suppressing disagreements or finally finding resolution. Address underlying tensions before they fester.',
    element: 'Fire',
    description: 'Five figures each wielding a wand, seemingly in chaotic battle or playful competition, no clear winner',
    image: '/airo-assets/images/tarot/wands/five-of-wands',
  },
  {
    id: 27, name: 'Six of Wands', arcana: 'minor', suit: 'wands', number: 6,
    keywords: ['success', 'public recognition', 'progress', 'self-confidence'],
    uprightMeaning: 'Victory and public recognition are yours. The Six of Wands celebrates your achievements and the admiration of others. Ride this wave of success with confidence and grace — you have earned it.',
    reversedMeaning: 'Private achievement, fall from grace, or egotism. Success may come without recognition, or pride may be getting in the way. Stay humble and remember why you began.',
    element: 'Fire',
    description: 'A triumphant rider on horseback wearing a laurel wreath, crowd cheering with wands raised, victory banner',
    image: '/airo-assets/images/tarot/wands/six-of-wands',
  },
  {
    id: 28, name: 'Seven of Wands', arcana: 'minor', suit: 'wands', number: 7,
    keywords: ['challenge', 'competition', 'protection', 'perseverance', 'conviction'],
    uprightMeaning: 'Stand your ground and defend what you have built. The Seven of Wands calls you to hold your position with courage and conviction, even when challenged from all sides. Your high ground is worth protecting.',
    reversedMeaning: 'Giving up, overwhelmed, or exhausted from fighting. You may be defending a position that no longer serves you, or feeling too tired to continue. Choose your battles wisely.',
    element: 'Fire',
    description: 'A figure on high ground wielding a wand defensively against six wands thrusting up from below',
    image: '/airo-assets/images/tarot/wands/seven-of-wands',
  },
  {
    id: 29, name: 'Eight of Wands', arcana: 'minor', suit: 'wands', number: 8,
    keywords: ['speed', 'action', 'air travel', 'movement', 'swift change'],
    uprightMeaning: 'Things are moving fast — embrace the momentum. The Eight of Wands signals swift action, rapid communication, and exciting developments. Everything is aligning and moving in the right direction. Go with the flow.',
    reversedMeaning: 'Delays, frustration, or resisting change. The energy that wants to move is being blocked. Release what is holding you back and allow things to flow.',
    element: 'Fire',
    description: 'Eight wands flying through the air in a clear sky, green landscape below, all moving in the same direction',
    image: '/airo-assets/images/tarot/wands/eight-of-wands',
  },
  {
    id: 30, name: 'Nine of Wands', arcana: 'minor', suit: 'wands', number: 9,
    keywords: ['resilience', 'grit', 'last stand', 'persistence', 'test of faith'],
    uprightMeaning: 'You are almost there — do not give up now. The Nine of Wands honors your resilience and battle-worn strength. Though weary, you have everything needed to cross the finish line. One more push.',
    reversedMeaning: 'Exhaustion, giving up, or paranoia. You may be too guarded or too depleted to continue. Rest and reassess — sometimes the bravest act is to ask for help.',
    element: 'Fire',
    description: 'A bandaged figure leaning on a wand, eight wands behind them like a fence, wary but standing firm',
    image: '/airo-assets/images/tarot/wands/nine-of-wands',
  },
  {
    id: 31, name: 'Ten of Wands', arcana: 'minor', suit: 'wands', number: 10,
    keywords: ['burden', 'extra responsibility', 'hard work', 'completion'],
    uprightMeaning: 'You are carrying a heavy load, but the destination is in sight. The Ten of Wands acknowledges the weight of responsibility and the toll of overcommitment. Delegate, release, and remember that you do not have to carry everything alone.',
    reversedMeaning: 'Doing it all yourself, collapse, or releasing burdens. You may be finally setting down what you have been carrying, or on the verge of burnout. Let go of what is not yours to carry.',
    element: 'Fire',
    description: 'A figure hunched under the weight of ten wands, struggling toward a distant house and trees',
    image: '/airo-assets/images/tarot/wands/ten-of-wands',
  },
  {
    id: 32, name: 'Page of Wands', arcana: 'minor', suit: 'wands', number: 11,
    keywords: ['exploration', 'excitement', 'freedom', 'adventure', 'enthusiasm'],
    uprightMeaning: 'A spark of adventurous energy and creative enthusiasm. The Page of Wands brings news of exciting opportunities and invites you to explore new passions with childlike wonder. Say yes to adventure.',
    reversedMeaning: 'Hasty, impatient, or lacking direction. Creative energy without focus can scatter. Channel your enthusiasm into a clear intention before leaping.',
    element: 'Fire',
    description: 'A young figure in a patterned tunic holding a wand, looking at it with curiosity, desert landscape with pyramids',
    image: '/airo-assets/images/tarot/wands/page-of-wands',
  },
  {
    id: 33, name: 'Knight of Wands', arcana: 'minor', suit: 'wands', number: 12,
    keywords: ['energy', 'passion', 'inspired action', 'adventure', 'impulsiveness'],
    uprightMeaning: 'Charge forward with passionate, inspired action. The Knight of Wands is fearless, energetic, and ready to conquer. This is a time for bold moves, travel, and following your fire wherever it leads.',
    reversedMeaning: 'Anger, impulsiveness, or reckless action. Passion without direction can cause harm. Pause before acting and ensure your fire is channeled constructively.',
    element: 'Fire',
    description: 'An armored knight on a rearing horse, wand raised, orange plumes on helmet, desert landscape',
    image: '/airo-assets/images/tarot/wands/knight-of-wands',
  },
  {
    id: 34, name: 'Queen of Wands', arcana: 'minor', suit: 'wands', number: 13,
    keywords: ['courage', 'confidence', 'independence', 'social butterfly', 'determination'],
    uprightMeaning: 'Embody your fierce, magnetic, and courageous self. The Queen of Wands radiates confidence and warmth — she knows her power and uses it generously. Step into your authority and let your light inspire others.',
    reversedMeaning: 'Selfishness, jealousy, or insecurity. Your fire may be burning others or turned inward as self-doubt. Reconnect with your authentic confidence and lead from love.',
    element: 'Fire',
    description: 'A crowned queen on a throne with sunflowers, black cat at feet, wand in one hand, sunflower in other',
    image: '/airo-assets/images/tarot/wands/queen-of-wands',
  },
  {
    id: 35, name: 'King of Wands', arcana: 'minor', suit: 'wands', number: 14,
    keywords: ['natural-born leader', 'vision', 'entrepreneur', 'honour'],
    uprightMeaning: 'Lead with vision, charisma, and bold authority. The King of Wands is a natural leader and visionary entrepreneur — he inspires others through his passion and integrity. Step into your leadership role with confidence.',
    reversedMeaning: 'Impulsiveness, high expectations, or ruthlessness. Leadership energy may be misdirected or overbearing. Temper your fire with wisdom and compassion.',
    element: 'Fire',
    description: 'A king on a throne with a salamander robe, wand in hand, small lizard at throne base, looking to the side',
    image: '/airo-assets/images/tarot/wands/king-of-wands',
  },

  // ── Cups ──────────────────────────────────────────────────────────────────
  {
    id: 36, name: 'Ace of Cups', arcana: 'minor', suit: 'cups', number: 1,
    keywords: ['love', 'new relationships', 'compassion', 'creativity', 'overwhelming emotion'],
    uprightMeaning: 'A new wave of love, emotional abundance, and spiritual connection overflows. The Ace of Cups is the divine gift of an open heart — receive this blessing with gratitude and let love flow freely in all directions.',
    reversedMeaning: 'Emotional loss, blocked creativity, or emptiness. The cup may feel empty or overflowing in unhealthy ways. Open yourself to receive love and allow emotional healing.',
    element: 'Water',
    description: 'A hand from clouds holding a chalice overflowing with water, dove descending with communion wafer, lotus flowers below',
    image: '/airo-assets/images/tarot/cups/ace-of-cups',
  },
  {
    id: 37, name: 'Two of Cups', arcana: 'minor', suit: 'cups', number: 2,
    keywords: ['unified love', 'partnership', 'mutual attraction', 'connection'],
    uprightMeaning: 'A beautiful union of hearts and souls. The Two of Cups celebrates deep connection, mutual attraction, and the sacred bond between two people. Whether romantic or platonic, this partnership is blessed.',
    reversedMeaning: 'Imbalance in a relationship, broken communication, or separation. A connection may be strained or one-sided. Seek honest communication and ensure both parties are equally invested.',
    element: 'Water',
    description: 'Two figures exchanging cups, caduceus with lion head above, red roses and vines, pledge of connection',
    image: '/airo-assets/images/tarot/cups/two-of-cups',
  },
  {
    id: 38, name: 'Three of Cups', arcana: 'minor', suit: 'cups', number: 3,
    keywords: ['celebration', 'friendship', 'creativity', 'collaborations'],
    uprightMeaning: 'Celebrate with your community and revel in the joy of connection. The Three of Cups is a card of friendship, creative collaboration, and heartfelt celebration. Gather your people and let the good times flow.',
    reversedMeaning: 'Overindulgence, gossip, or isolation. Social energy may be draining rather than nourishing. Be mindful of excess and ensure your celebrations are truly joyful.',
    element: 'Water',
    description: 'Three women dancing in a circle, each raising a cup in celebration, flowers and harvest fruits around them',
    image: '/airo-assets/images/tarot/cups/three-of-cups',
  },
  {
    id: 39, name: 'Four of Cups', arcana: 'minor', suit: 'cups', number: 4,
    keywords: ['meditation', 'contemplation', 'apathy', 'reevaluation'],
    uprightMeaning: 'A time of introspection and reevaluation. The Four of Cups asks you to look within rather than without — the gift being offered may not be visible while you are lost in contemplation. Open your eyes to what is right in front of you.',
    reversedMeaning: 'Retreat, withdrawal, or missed opportunities. You may be so turned inward that you are missing what the universe is offering. Emerge from your shell and engage with life.',
    element: 'Water',
    description: 'A figure sitting under a tree with arms crossed, three cups before them, a hand from a cloud offering a fourth cup',
    image: '/airo-assets/images/tarot/cups/four-of-cups',
  },
  {
    id: 40, name: 'Five of Cups', arcana: 'minor', suit: 'cups', number: 5,
    keywords: ['regret', 'failure', 'disappointment', 'pessimism'],
    uprightMeaning: 'Grief and loss are real, and they deserve to be honored. The Five of Cups acknowledges your sorrow, but gently reminds you that two cups still stand behind you. When you are ready, turn around — not all is lost.',
    reversedMeaning: 'Moving on, acceptance, or finding peace. You are beginning to release grief and look toward what remains. Allow yourself to heal and open to new possibilities.',
    element: 'Water',
    description: 'A cloaked figure looking down at three spilled cups, two upright cups behind them, bridge and castle in distance',
    image: '/airo-assets/images/tarot/cups/five-of-cups',
  },
  {
    id: 41, name: 'Six of Cups', arcana: 'minor', suit: 'cups', number: 6,
    keywords: ['revisiting the past', 'childhood memories', 'innocence', 'joy'],
    uprightMeaning: 'Sweet nostalgia and the healing power of innocence. The Six of Cups invites you to reconnect with the joy and wonder of your past, heal old wounds, and bring that childlike openness into your present.',
    reversedMeaning: 'Stuck in the past, naivety, or unrealistic nostalgia. You may be romanticizing the past or refusing to grow up. Honor your history while remaining present to today.',
    element: 'Water',
    description: 'Two children in a garden, one offering a cup of flowers to the other, four more cups with flowers around them',
    image: '/airo-assets/images/tarot/cups/six-of-cups',
  },
  {
    id: 42, name: 'Seven of Cups', arcana: 'minor', suit: 'cups', number: 7,
    keywords: ['opportunities', 'choices', 'wishful thinking', 'illusion'],
    uprightMeaning: 'Many possibilities shimmer before you, but not all are what they seem. The Seven of Cups warns of illusion and wishful thinking — ground yourself in reality and choose wisely from among the many options before you.',
    reversedMeaning: 'Alignment, personal values, or clarity after confusion. The fog is lifting and you can see clearly which path is truly yours. Trust your discernment.',
    element: 'Water',
    description: 'A silhouetted figure facing seven cups in clouds, each containing different visions — castle, jewels, wreath, dragon, snake, figure, head',
    image: '/airo-assets/images/tarot/cups/seven-of-cups',
  },
  {
    id: 43, name: 'Eight of Cups', arcana: 'minor', suit: 'cups', number: 8,
    keywords: ['disappointment', 'abandonment', 'withdrawal', 'escapism'],
    uprightMeaning: 'Walk away from what no longer fulfills you, even if it is comfortable. The Eight of Cups takes courage — leaving behind what you have built to seek something more meaningful. Your soul is calling you onward.',
    reversedMeaning: 'Trying one more time, fear of moving on, or aimless wandering. You may be staying in a situation past its expiry or running away from something that needs to be faced. Discern the difference.',
    element: 'Water',
    description: 'A cloaked figure walking away from eight stacked cups toward mountains, crescent moon above, water below',
    image: '/airo-assets/images/tarot/cups/eight-of-cups',
  },
  {
    id: 44, name: 'Nine of Cups', arcana: 'minor', suit: 'cups', number: 9,
    keywords: ['contentment', 'satisfaction', 'gratitude', 'wish come true'],
    uprightMeaning: 'Your wish is granted — the Nine of Cups is the wish card of the tarot. Contentment, satisfaction, and emotional fulfillment are yours. Savor this moment of abundance and allow yourself to truly receive.',
    reversedMeaning: 'Greed, dissatisfaction, or materialism. What you wished for may not bring the happiness you expected. Examine whether your desires align with your soul\'s true needs.',
    element: 'Water',
    description: 'A satisfied figure seated with arms crossed, nine cups displayed on a curved shelf behind them, smug smile',
    image: '/airo-assets/images/tarot/cups/nine-of-cups',
  },
  {
    id: 45, name: 'Ten of Cups', arcana: 'minor', suit: 'cups', number: 10,
    keywords: ['divine love', 'blissful relationships', 'harmony', 'alignment'],
    uprightMeaning: 'The highest expression of emotional fulfillment — love, family, and lasting happiness. The Ten of Cups is the happily-ever-after card, representing deep harmony, joy, and the blessing of loving relationships.',
    reversedMeaning: 'Broken family, disrupted home, or misaligned values. The dream of harmony may be disrupted by conflict or disconnection. Tend to your relationships with care and honesty.',
    element: 'Water',
    description: 'A couple embracing, two children dancing, rainbow of ten cups arching above, green hills and home in background',
    image: '/airo-assets/images/tarot/cups/ten-of-cups',
  },
  {
    id: 46, name: 'Page of Cups', arcana: 'minor', suit: 'cups', number: 11,
    keywords: ['creative opportunities', 'intuitive messages', 'curiosity', 'possibility'],
    uprightMeaning: 'A message from the heart or a creative inspiration arrives. The Page of Cups brings intuitive insights, emotional openness, and the magic of imagination. Be receptive to unexpected messages and follow your creative impulses.',
    reversedMeaning: 'Emotional immaturity, creative blocks, or escapism. Feelings may be overwhelming or you are avoiding emotional reality. Ground your sensitivity in practical expression.',
    element: 'Water',
    description: 'A young figure in a floral tunic holding a cup from which a fish emerges, ocean waves behind',
    image: '/airo-assets/images/tarot/cups/page-of-cups',
  },
  {
    id: 47, name: 'Knight of Cups', arcana: 'minor', suit: 'cups', number: 12,
    keywords: ['creativity', 'romance', 'charm', 'imagination', 'beauty'],
    uprightMeaning: 'A romantic, creative, and emotionally attuned energy arrives. The Knight of Cups follows his heart with grace and idealism. This is a time for romantic gestures, creative pursuits, and following your heart\'s deepest calling.',
    reversedMeaning: 'Moodiness, disappointment, or unrealistic expectations. Romantic idealism may be clouding your judgment. Ensure your heart is grounded in reality.',
    element: 'Water',
    description: 'A knight on a white horse holding a cup, moving slowly and gracefully, river and mountains behind',
    image: '/airo-assets/images/tarot/cups/knight-of-cups',
  },
  {
    id: 48, name: 'Queen of Cups', arcana: 'minor', suit: 'cups', number: 13,
    keywords: ['compassionate', 'caring', 'emotionally stable', 'intuitive', 'in flow'],
    uprightMeaning: 'Embody deep emotional wisdom, compassion, and intuitive grace. The Queen of Cups holds her feelings with mastery — she feels everything deeply yet remains centered. Trust your emotional intelligence and lead with empathy.',
    reversedMeaning: 'Emotional insecurity, codependency, or martyrdom. Your sensitivity may be overwhelming you or you are absorbing others\' emotions. Establish healthy emotional boundaries.',
    element: 'Water',
    description: 'A queen on a throne at the water\'s edge, holding an ornate closed cup, sea creatures on throne, dreamy expression',
    image: '/airo-assets/images/tarot/cups/queen-of-cups',
  },
  {
    id: 49, name: 'King of Cups', arcana: 'minor', suit: 'cups', number: 14,
    keywords: ['emotionally balanced', 'compassionate', 'diplomatic', 'wise'],
    uprightMeaning: 'Master your emotions with wisdom and compassion. The King of Cups balances feeling and intellect with grace — he is the emotionally mature leader who holds space for others without losing himself. Lead from the heart.',
    reversedMeaning: 'Emotional manipulation, moodiness, or volatility. Emotional mastery may be used for control, or you are struggling to maintain your center. Return to your emotional foundation.',
    element: 'Water',
    description: 'A king on a throne floating on the sea, cup in one hand, scepter in other, fish amulet, ship and leaping fish behind',
    image: '/airo-assets/images/tarot/cups/king-of-cups',
  },

  // ── Swords ────────────────────────────────────────────────────────────────
  {
    id: 50, name: 'Ace of Swords', arcana: 'minor', suit: 'swords', number: 1,
    keywords: ['breakthroughs', 'new ideas', 'mental clarity', 'success', 'truth'],
    uprightMeaning: 'A breakthrough of clarity, truth, and mental power. The Ace of Swords cuts through confusion and illusion — a new idea, revelation, or moment of crystal-clear understanding is yours. Speak your truth with courage.',
    reversedMeaning: 'Confusion, brutality, or chaos. Mental clarity is blocked or a sharp truth is being wielded destructively. Seek the truth gently and ensure your words serve healing.',
    element: 'Air',
    description: 'A hand from clouds holding an upright sword, crown with laurel and palm branches at the tip, mountains below',
    image: '/airo-assets/images/tarot/swords/ace-of-swords',
  },
  {
    id: 51, name: 'Two of Swords', arcana: 'minor', suit: 'swords', number: 2,
    keywords: ['difficult decisions', 'weighing up options', 'an impasse', 'avoidance'],
    uprightMeaning: 'You stand at a crossroads, blindfolded to the full truth. The Two of Swords represents a difficult decision where both options have merit. Remove the blindfold of avoidance and trust your inner knowing to guide you.',
    reversedMeaning: 'Indecision, confusion, or information overload. Too much information or too many options are paralyzing you. Simplify, trust your gut, and make a choice.',
    element: 'Air',
    description: 'A blindfolded figure seated, two swords crossed over chest, crescent moon above, rocky sea behind',
    image: '/airo-assets/images/tarot/swords/two-of-swords',
  },
  {
    id: 52, name: 'Three of Swords', arcana: 'minor', suit: 'swords', number: 3,
    keywords: ['heartbreak', 'emotional pain', 'sorrow', 'grief', 'hurt'],
    uprightMeaning: 'Heartbreak, grief, and emotional pain are real and valid. The Three of Swords does not minimize your suffering — it honors it. Allow yourself to feel, grieve, and release. This pain is part of your healing.',
    reversedMeaning: 'Recovery, forgiveness, or moving on. The acute pain is beginning to ease and healing is possible. Allow yourself to release the grief and open to what comes next.',
    element: 'Air',
    description: 'Three swords piercing a red heart, dark storm clouds and rain in the background',
    image: '/airo-assets/images/tarot/swords/three-of-swords',
  },
  {
    id: 53, name: 'Four of Swords', arcana: 'minor', suit: 'swords', number: 4,
    keywords: ['rest', 'restoration', 'contemplation', 'recuperation', 'passivity'],
    uprightMeaning: 'Rest is not weakness — it is sacred strategy. The Four of Swords calls you to step back, recuperate, and allow your mind and body to restore. The battle will wait; your wellbeing cannot.',
    reversedMeaning: 'Restlessness, burnout, or stagnation. You may be unable to rest when you need it most, or resting when action is required. Find the balance between stillness and movement.',
    element: 'Air',
    description: 'A knight lying in repose on a tomb, three swords on the wall above, one sword beneath, stained glass window',
    image: '/airo-assets/images/tarot/swords/four-of-swords',
  },
  {
    id: 54, name: 'Five of Swords', arcana: 'minor', suit: 'swords', number: 5,
    keywords: ['conflict', 'disagreements', 'competition', 'defeat', 'winning at all costs'],
    uprightMeaning: 'A hollow victory or a conflict that leaves everyone diminished. The Five of Swords asks: is winning worth the cost? Choose your battles wisely and consider whether the price of victory aligns with your values.',
    reversedMeaning: 'Reconciliation, making amends, or moving past conflict. A difficult situation may be resolving, or you are ready to release the need to win. Choose peace over pride.',
    element: 'Air',
    description: 'A smirking figure holding three swords, two others walking away dejected, two swords on the ground, stormy sky',
    image: '/airo-assets/images/tarot/swords/five-of-swords',
  },
  {
    id: 55, name: 'Six of Swords', arcana: 'minor', suit: 'swords', number: 6,
    keywords: ['transition', 'change', 'rite of passage', 'releasing baggage'],
    uprightMeaning: 'Moving from turbulence toward calmer waters. The Six of Swords represents a necessary transition — leaving behind what has caused pain and moving toward healing. The journey may be bittersweet, but the destination is peace.',
    reversedMeaning: 'Resistance to change, unfinished business, or returning to old patterns. You may be unable to leave the past behind or returning to what you have already outgrown. Trust the transition.',
    element: 'Air',
    description: 'A ferryman guiding a boat with two passengers, six swords standing in the bow, moving from choppy to calm water',
    image: '/airo-assets/images/tarot/swords/six-of-swords',
  },
  {
    id: 56, name: 'Seven of Swords', arcana: 'minor', suit: 'swords', number: 7,
    keywords: ['betrayal', 'deception', 'getting away with something', 'acting strategically'],
    uprightMeaning: 'Proceed with caution — not everything is as it appears. The Seven of Swords warns of deception, hidden agendas, or the need for strategic thinking. Examine your situation carefully and trust your instincts about what is true.',
    reversedMeaning: 'Coming clean, conscience, or returning what was taken. A deception may be revealed or you are ready to act with integrity. Choose honesty even when it is difficult.',
    element: 'Air',
    description: 'A figure sneaking away from a camp carrying five swords, two left behind, looking back over shoulder',
    image: '/airo-assets/images/tarot/swords/seven-of-swords',
  },
  {
    id: 57, name: 'Eight of Swords', arcana: 'minor', suit: 'swords', number: 8,
    keywords: ['negative thoughts', 'self-imposed restriction', 'imprisonment', 'victim mentality'],
    uprightMeaning: 'The prison you are in is largely of your own making. The Eight of Swords reveals how limiting beliefs and negative thinking keep you bound. The blindfold can be removed — you have more freedom than you realize.',
    reversedMeaning: 'Self-acceptance, new perspective, or freedom. The blindfold is coming off and you are beginning to see your situation clearly. Release the mental bonds and step into your power.',
    element: 'Air',
    description: 'A blindfolded, bound figure surrounded by eight swords, water and castle in background, but path is clear',
    image: '/airo-assets/images/tarot/swords/eight-of-swords',
  },
  {
    id: 58, name: 'Nine of Swords', arcana: 'minor', suit: 'swords', number: 9,
    keywords: ['anxiety', 'worry', 'fear', 'depression', 'nightmares'],
    uprightMeaning: 'The darkest hour before the dawn. The Nine of Swords represents anxiety, sleepless nights, and the torment of a worried mind. Your fears may be larger in the dark than in the light of day — seek support and know this too shall pass.',
    reversedMeaning: 'Inner turmoil, hope, or releasing anxiety. You are beginning to work through your fears and find relief. Seek help if needed and know that healing is possible.',
    element: 'Air',
    description: 'A figure sitting up in bed with head in hands, nine swords on the wall, quilt with roses and astrological symbols',
    image: '/airo-assets/images/tarot/swords/nine-of-swords',
  },
  {
    id: 59, name: 'Ten of Swords', arcana: 'minor', suit: 'swords', number: 10,
    keywords: ['painful endings', 'deep wounds', 'betrayal', 'loss', 'crisis'],
    uprightMeaning: 'A painful ending has reached its absolute bottom. The Ten of Swords is brutal but honest — this chapter is over. The good news: the only direction from here is up. Dawn is breaking on the horizon.',
    reversedMeaning: 'Recovery, regeneration, or resisting an inevitable end. You are beginning to rise from the ashes, or you are prolonging a painful situation. Accept the ending and allow the healing to begin.',
    element: 'Air',
    description: 'A figure lying face down with ten swords in their back, calm sea and sunrise in the background, dark sky above',
    image: '/airo-assets/images/tarot/swords/ten-of-swords',
  },
  {
    id: 60, name: 'Page of Swords', arcana: 'minor', suit: 'swords', number: 11,
    keywords: ['new ideas', 'curiosity', 'thirst for knowledge', 'new ways of communicating'],
    uprightMeaning: 'A sharp, curious mind ready to cut through to the truth. The Page of Swords brings mental agility, new ideas, and the courage to ask difficult questions. Speak up, investigate, and let your intellect lead the way.',
    reversedMeaning: 'Haste, deception, or manipulation. Sharp words may be used carelessly or dishonestly. Think before you speak and ensure your communication serves truth.',
    element: 'Air',
    description: 'A young figure holding a sword aloft, wind blowing through their hair, stormy sky, birds flying',
    image: '/airo-assets/images/tarot/swords/page-of-swords',
  },
  {
    id: 61, name: 'Knight of Swords', arcana: 'minor', suit: 'swords', number: 12,
    keywords: ['ambitious', 'action-oriented', 'driven to succeed', 'fast-thinking'],
    uprightMeaning: 'Charge forward with intellectual courage and decisive action. The Knight of Swords is fearless, fast-moving, and driven by truth. This is a time for bold communication, swift decisions, and cutting through obstacles.',
    reversedMeaning: 'Rudeness, tactlessness, or all action without thought. Speed without direction causes destruction. Slow down enough to ensure your actions are wise, not just fast.',
    element: 'Air',
    description: 'An armored knight charging on horseback, sword raised, storm clouds and wind-blown trees behind',
    image: '/airo-assets/images/tarot/swords/knight-of-swords',
  },
  {
    id: 62, name: 'Queen of Swords', arcana: 'minor', suit: 'swords', number: 13,
    keywords: ['independent', 'unbiased judgement', 'clear boundaries', 'direct communication'],
    uprightMeaning: 'Speak your truth with clarity, precision, and compassionate directness. The Queen of Swords has known sorrow and emerged with wisdom — she sees clearly, speaks honestly, and holds firm boundaries. Embody her clear-eyed grace.',
    reversedMeaning: 'Coldness, bitterness, or cruelty. Sharp intelligence may be weaponized or you are cutting yourself off from feeling. Soften your sword with compassion.',
    element: 'Air',
    description: 'A queen on a throne, sword raised, one hand extended, crown of butterflies, stormy sky, birds flying',
    image: '/airo-assets/images/tarot/swords/queen-of-swords',
  },
  {
    id: 63, name: 'King of Swords', arcana: 'minor', suit: 'swords', number: 14,
    keywords: ['mental clarity', 'intellectual power', 'authority', 'truth', 'ethics'],
    uprightMeaning: 'Lead with intellectual authority, ethical clarity, and decisive wisdom. The King of Swords commands through truth and reason — he is the fair judge, the wise counselor, the voice of integrity. Speak and act from your highest principles.',
    reversedMeaning: 'Manipulation, cruelty, or abuse of power. Intellectual authority may be used to dominate or deceive. Examine where power has corrupted and return to ethical leadership.',
    element: 'Air',
    description: 'A king on a throne with sword upright, butterflies on throne, clear sky with few clouds, direct gaze',
    image: '/airo-assets/images/tarot/swords/king-of-swords',
  },

  // ── Pentacles ─────────────────────────────────────────────────────────────
  {
    id: 64, name: 'Ace of Pentacles', arcana: 'minor', suit: 'pentacles', number: 1,
    keywords: ['new financial opportunity', 'manifestation', 'abundance', 'security'],
    uprightMeaning: 'A new opportunity for material abundance and practical manifestation. The Ace of Pentacles offers the seed of prosperity — a new job, financial windfall, or practical venture. Plant it wisely and tend it with care.',
    reversedMeaning: 'Lost opportunity, lack of planning, or financial instability. A material opportunity may be slipping away or you are not ready to receive it. Ground yourself and prepare the soil before planting.',
    element: 'Earth',
    description: 'A hand from clouds holding a pentacle, lush garden below with archway of flowers, mountains in distance',
    image: '/airo-assets/images/tarot/pentacles/ace-of-pentacles',
  },
  {
    id: 65, name: 'Two of Pentacles', arcana: 'minor', suit: 'pentacles', number: 2,
    keywords: ['multiple priorities', 'time management', 'prioritization', 'adaptability'],
    uprightMeaning: 'Balance multiple demands with grace and adaptability. The Two of Pentacles is the juggler — you are managing many things at once and doing it well. Stay flexible, prioritize wisely, and trust your ability to keep all the balls in the air.',
    reversedMeaning: 'Imbalance, disorganization, or overwhelm. Too many priorities are causing things to drop. Simplify, delegate, and focus on what truly matters.',
    element: 'Earth',
    description: 'A figure juggling two pentacles connected by an infinity loop, ships on turbulent sea behind',
    image: '/airo-assets/images/tarot/pentacles/two-of-pentacles',
  },
  {
    id: 66, name: 'Three of Pentacles', arcana: 'minor', suit: 'pentacles', number: 3,
    keywords: ['teamwork', 'initial fulfilment', 'collaboration', 'learning'],
    uprightMeaning: 'Collaboration and skilled craftsmanship create something greater than the sum of its parts. The Three of Pentacles celebrates teamwork, learning, and the satisfaction of doing excellent work. Your skills are valued — keep building.',
    reversedMeaning: 'Lack of teamwork, disorganization, or poor quality work. Collaboration may be breaking down or you are not applying your full skill. Recommit to excellence and open communication.',
    element: 'Earth',
    description: 'A craftsman working on a cathedral arch, two figures with plans consulting him, three pentacles carved above',
    image: '/airo-assets/images/tarot/pentacles/three-of-pentacles',
  },
  {
    id: 67, name: 'Four of Pentacles', arcana: 'minor', suit: 'pentacles', number: 4,
    keywords: ['saving money', 'security', 'conservatism', 'scarcity', 'control'],
    uprightMeaning: 'Security and stability are important, but not at the cost of joy and generosity. The Four of Pentacles asks you to examine your relationship with money and control — are you holding on from wisdom or from fear?',
    reversedMeaning: 'Over-spending, greed, or self-protection. You may be releasing financial control in unhealthy ways or finally loosening your grip on what you have been hoarding. Find the balance between security and flow.',
    element: 'Earth',
    description: 'A figure clutching a pentacle to their chest, one on their head, one under each foot, city behind them',
    image: '/airo-assets/images/tarot/pentacles/four-of-pentacles',
  },
  {
    id: 68, name: 'Five of Pentacles', arcana: 'minor', suit: 'pentacles', number: 5,
    keywords: ['financial loss', 'poverty', 'lack mindset', 'isolation', 'worry'],
    uprightMeaning: 'A difficult time of financial hardship or feeling left out in the cold. The Five of Pentacles acknowledges real struggle — but notice the lit window above. Help is available if you are willing to look up and ask for it.',
    reversedMeaning: 'Recovery from financial loss, spiritual poverty, or isolation ending. Things are beginning to improve. Allow yourself to receive help and trust that abundance is returning.',
    element: 'Earth',
    description: 'Two impoverished figures in snow passing a lit church window with five pentacles, one on crutches',
    image: '/airo-assets/images/tarot/pentacles/five-of-pentacles',
  },
  {
    id: 69, name: 'Six of Pentacles', arcana: 'minor', suit: 'pentacles', number: 6,
    keywords: ['giving', 'receiving', 'sharing wealth', 'generosity', 'charity'],
    uprightMeaning: 'The sacred flow of giving and receiving is in balance. The Six of Pentacles celebrates generosity, fair exchange, and the joy of sharing abundance. Whether you are giving or receiving, trust that the flow of prosperity serves all.',
    reversedMeaning: 'Debt, selfishness, or one-sided generosity. The balance of giving and receiving may be off. Examine whether you are giving from depletion or receiving without gratitude.',
    element: 'Earth',
    description: 'A wealthy merchant weighing coins on scales, giving to two kneeling beggars, six pentacles above',
    image: '/airo-assets/images/tarot/pentacles/six-of-pentacles',
  },
  {
    id: 70, name: 'Seven of Pentacles', arcana: 'minor', suit: 'pentacles', number: 7,
    keywords: ['long-term view', 'sustainable results', 'perseverance', 'investment'],
    uprightMeaning: 'Pause and assess the fruits of your labor. The Seven of Pentacles honors the long game — your patient investment is growing, though the harvest is not yet ready. Trust the process and continue tending your garden.',
    reversedMeaning: 'Lack of long-term vision, limited success, or impatience. You may be expecting quick results from slow-growing seeds. Reassess your investment of time and energy.',
    element: 'Earth',
    description: 'A figure leaning on a hoe, contemplating seven pentacles growing on a vine, thoughtful and patient',
    image: '/airo-assets/images/tarot/pentacles/seven-of-pentacles',
  },
  {
    id: 71, name: 'Eight of Pentacles', arcana: 'minor', suit: 'pentacles', number: 8,
    keywords: ['apprenticeship', 'repetitive tasks', 'mastery', 'skill development'],
    uprightMeaning: 'Mastery comes through dedicated practice and focused effort. The Eight of Pentacles celebrates the craftsman who shows up every day to hone their skill. Commit to your work with diligence and excellence — mastery is within reach.',
    reversedMeaning: 'Perfectionism, lack of focus, or uninspired work. You may be going through the motions without passion, or obsessing over perfection at the expense of progress. Find joy in the process.',
    element: 'Earth',
    description: 'A craftsman at a workbench carving pentacles, six mounted on a post, one in hand, one on the ground, city in distance',
    image: '/airo-assets/images/tarot/pentacles/eight-of-pentacles',
  },
  {
    id: 72, name: 'Nine of Pentacles', arcana: 'minor', suit: 'pentacles', number: 9,
    keywords: ['abundance', 'luxury', 'self-sufficiency', 'financial independence'],
    uprightMeaning: 'You have created a life of abundance, beauty, and self-sufficiency through your own efforts. The Nine of Pentacles celebrates financial independence, refined taste, and the deep satisfaction of enjoying what you have built. Savor it.',
    reversedMeaning: 'Working too hard, financial setbacks, or over-dependence. The abundance you seek may be elusive or you are sacrificing too much to achieve it. Reconnect with what truly brings you joy.',
    element: 'Earth',
    description: 'An elegantly dressed woman in a garden with a hooded falcon, nine pentacles on vines, snail at her feet',
    image: '/airo-assets/images/tarot/pentacles/nine-of-pentacles',
  },
  {
    id: 73, name: 'Ten of Pentacles', arcana: 'minor', suit: 'pentacles', number: 10,
    keywords: ['wealth', 'financial security', 'family', 'long-term success', 'contribution'],
    uprightMeaning: 'Lasting wealth, family legacy, and the fulfillment of long-term security. The Ten of Pentacles represents the pinnacle of material success — not just for yourself but for generations to come. You are building something that endures.',
    reversedMeaning: 'Financial failure, conflict over money, or broken family. The foundation of security may be cracking. Examine what truly matters beyond material wealth and tend to your relationships.',
    element: 'Earth',
    description: 'An elder with two dogs, a couple and child nearby, ten pentacles arranged in the Tree of Life pattern, archway to a castle',
    image: '/airo-assets/images/tarot/pentacles/ten-of-pentacles',
  },
  {
    id: 74, name: 'Page of Pentacles', arcana: 'minor', suit: 'pentacles', number: 11,
    keywords: ['manifestation', 'financial opportunity', 'skill development', 'new beginnings'],
    uprightMeaning: 'A new practical opportunity or the beginning of a prosperous venture. The Page of Pentacles brings the energy of a diligent student — curious, grounded, and ready to learn. Take the first practical steps toward your material goals.',
    reversedMeaning: 'Lack of progress, procrastination, or poor financial decisions. The practical opportunity is being missed or squandered. Reconnect with your goals and take concrete action.',
    element: 'Earth',
    description: 'A young figure gazing intently at a pentacle held aloft, lush green landscape, flowers, mountains behind',
    image: '/airo-assets/images/tarot/pentacles/page-of-pentacles',
  },
  {
    id: 75, name: 'Knight of Pentacles', arcana: 'minor', suit: 'pentacles', number: 12,
    keywords: ['hard work', 'productivity', 'routine', 'conservatism', 'reliability'],
    uprightMeaning: 'Steady, reliable, and methodical progress toward your goals. The Knight of Pentacles may move slowly, but he never stops — his commitment to hard work and practical action guarantees results. Trust the process and keep going.',
    reversedMeaning: 'Laziness, boredom, or feeling stuck in a rut. The steady pace has become stagnation. Inject some inspiration into your routine or examine whether your path still serves you.',
    element: 'Earth',
    description: 'A knight on a stationary horse, holding a pentacle and examining it, plowed field behind, oak tree',
    image: '/airo-assets/images/tarot/pentacles/knight-of-pentacles',
  },
  {
    id: 76, name: 'Queen of Pentacles', arcana: 'minor', suit: 'pentacles', number: 13,
    keywords: ['nurturing', 'practical', 'providing financially', 'a working parent'],
    uprightMeaning: 'Embody the abundant, nurturing, and practically wise energy of the earth mother. The Queen of Pentacles creates security and comfort for all she loves — she is generous, resourceful, and deeply connected to the natural world.',
    reversedMeaning: 'Financial independence, self-care, or smothering. You may be neglecting your own needs to provide for others, or financial security is being threatened. Tend to yourself as lovingly as you tend to others.',
    element: 'Earth',
    description: 'A queen on a throne in a lush garden, holding a pentacle in her lap, rabbit at her feet, flowers and vines',
    image: '/airo-assets/images/tarot/pentacles/queen-of-pentacles',
  },
  {
    id: 77, name: 'King of Pentacles', arcana: 'minor', suit: 'pentacles', number: 14,
    keywords: ['wealth', 'business', 'leadership', 'security', 'discipline', 'abundance'],
    uprightMeaning: 'Lead with practical wisdom, financial mastery, and generous abundance. The King of Pentacles has built his empire through discipline and integrity — he is the provider, the patriarch, the master of the material world. Embody his grounded authority.',
    reversedMeaning: 'Financially inept, obsessed with wealth, or stubborn. Material success may be pursued at the expense of relationships or ethics. Examine whether your relationship with money serves your highest values.',
    element: 'Earth',
    description: 'A king on a throne covered in vines and grapes, pentacle in hand, bull on throne, castle and garden behind',
    image: '/airo-assets/images/tarot/pentacles/king-of-pentacles',
  },
];

// ── Deeper meaning enrichment ─────────────────────────────────────────────────
// Keyed by card id. Kept separate from the main card array so the core data
// stays clean and this layer can be extended independently.

export interface DeeperMeaning {
  numerology: string;        // what the card's number means symbolically
  elementalAssociation: string; // element + what it governs in this card
  reflectionQuestions: string[]; // 3 questions for journaling / meditation
}

const DEEPER_MEANINGS: Record<number, DeeperMeaning> = {
  // ── Major Arcana ────────────────────────────────────────────────────────────
  0: {
    numerology: '0 — The void before creation. Zero holds infinite potential; it is the circle of eternity, the breath before the first word. In numerology it amplifies every number it touches, suggesting that The Fool\'s journey contains all possibilities.',
    elementalAssociation: 'Air governs The Fool — the element of thought, freedom, and the invisible force that carries seeds to new ground. Air reminds you that beginnings are light, unencumbered, and full of movement.',
    reflectionQuestions: [
      'What would you attempt if you knew you could not fail?',
      'Where in your life are you holding back from a necessary leap of faith?',
      'What old story about yourself are you ready to leave behind at the cliff\'s edge?',
    ],
  },
  1: {
    numerology: '1 — The number of initiation and singular will. One is the point from which all lines extend — pure creative force, the self standing alone before the world. It speaks of leadership, originality, and the power of focused intention.',
    elementalAssociation: 'Air and Mercury\'s quicksilver mind animate The Magician — the element of communication, intellect, and the bridge between worlds. Air here is not scattered but directed, channeled through the wand into manifest reality.',
    reflectionQuestions: [
      'Which of your existing skills or resources are you underutilising right now?',
      'What would you create if you fully believed in your own power to manifest?',
      'Where might you be using your gifts to impress others rather than to serve your true purpose?',
    ],
  },
  2: {
    numerology: '2 — The number of duality, balance, and the space between. Two holds the tension of opposites — conscious and unconscious, known and unknown, seen and unseen. The High Priestess sits at this threshold, neither choosing nor refusing, simply witnessing.',
    elementalAssociation: 'Water and the Moon rule The High Priestess — the element of emotion, intuition, and the deep tides of the unconscious. Water here is still, reflective, and profound; it does not rush but reveals truth slowly, in its own time.',
    reflectionQuestions: [
      'What does your intuition know that your rational mind is refusing to hear?',
      'Are there dreams, symbols, or recurring feelings you have been dismissing?',
      'What would change if you trusted your inner knowing as completely as you trust external evidence?',
    ],
  },
  3: {
    numerology: '3 — The number of creation, growth, and the trinity. Three is the child born of two opposites — it represents abundance, expression, and the fertile overflow of life. The Empress embodies three as the creative force that cannot be contained.',
    elementalAssociation: 'Earth and Venus ground The Empress — the element of the physical world, sensuality, and all that grows and nourishes. Earth here is rich, dark, and teeming; it asks you to tend your garden with patience and love.',
    reflectionQuestions: [
      'In what area of your life are you withholding nourishment — from yourself or from something you are growing?',
      'How connected do you feel to your body, your senses, and the natural world right now?',
      'What creative project or relationship is ready to bloom if you give it your full attention?',
    ],
  },
  4: {
    numerology: '4 — The number of structure, stability, and the four corners of the earth. Four is the foundation — the square, the compass rose, the four seasons. It asks: what are you building, and is it built to last?',
    elementalAssociation: 'Fire and Aries drive The Emperor — yet fire here is controlled, directed into forge and furnace rather than wildfire. This is the flame that heats the iron, the disciplined will that shapes raw energy into lasting form.',
    reflectionQuestions: [
      'Where in your life do you need to establish clearer boundaries or firmer structure?',
      'Are you leading from a place of genuine authority, or from fear of losing control?',
      'What would it mean to be the architect of your own life rather than a passenger in it?',
    ],
  },
  5: {
    numerology: '5 — The number of change, freedom, and the five senses. Five disrupts the stability of four, introducing challenge and growth. The Hierophant holds five as sacred tradition — the five wounds, the five-pointed star — yet five also invites questioning what we have been taught.',
    elementalAssociation: 'Earth and Taurus root The Hierophant — the element of patience, tradition, and the slow accumulation of wisdom. Earth here is the ancient soil of lineage and ritual, asking you to honour what has been passed down while discerning what still serves.',
    reflectionQuestions: [
      'Which beliefs or traditions do you follow out of genuine conviction, and which out of habit or fear?',
      'Who are the teachers or mentors whose wisdom has shaped your path?',
      'Where might you be seeking external authority when the answer already lives within you?',
    ],
  },
  6: {
    numerology: '6 — The number of harmony, responsibility, and the heart. Six is the Star of David, the hexagon of the honeycomb — perfect balance between opposing forces. The Lovers card asks you to choose with your whole heart, not just your head.',
    elementalAssociation: 'Air and Gemini animate The Lovers — the element of communication, choice, and the meeting of minds. Air here carries the breath of connection, the words that bind or release, the invisible thread between two souls.',
    reflectionQuestions: [
      'What choice are you facing that requires you to align your actions with your deepest values?',
      'Where in your relationships are you giving from wholeness rather than from need?',
      'What would unconditional love — for yourself or another — look like in your life right now?',
    ],
  },
  7: {
    numerology: '7 — The number of mystery, spiritual seeking, and inner truth. Seven is sacred across traditions — seven days, seven chakras, seven notes of the scale. The Chariot channels seven as the force of will that transcends ordinary limits.',
    elementalAssociation: 'Water and Cancer power The Chariot — a surprising pairing, yet water under pressure becomes unstoppable. Emotional mastery, not brute force, is what drives the chariot forward. The sphinxes are tamed by feeling, not by fear.',
    reflectionQuestions: [
      'What opposing forces within yourself are you being called to harness rather than suppress?',
      'Where do you need more discipline or focus to reach a goal that truly matters to you?',
      'What victory would feel most meaningful to you right now, and what is standing between you and it?',
    ],
  },
  8: {
    numerology: '8 — The number of power, infinity, and karmic cycles. Eight on its side is the lemniscate — the infinite loop of cause and effect. Strength holds this symbol above her head, reminding us that true power is cyclical, not linear.',
    elementalAssociation: 'Fire and Leo illuminate Strength — the element of courage, vitality, and the radiant heart. Fire here is not aggression but warmth; the lion is not conquered but befriended, its wildness honoured and gently redirected.',
    reflectionQuestions: [
      'What aspect of yourself — a fear, an impulse, a shadow — are you being called to meet with compassion rather than force?',
      'Where does your greatest strength actually come from: willpower, or love?',
      'What would it feel like to be fully at peace with every part of who you are?',
    ],
  },
  9: {
    numerology: '9 — The number of completion, wisdom, and the end of a cycle. Nine contains all previous numbers within it; it is the sage who has walked every path. The Hermit carries nine as the lantern of hard-won understanding.',
    elementalAssociation: 'Earth and Virgo ground The Hermit — the element of discernment, service, and the careful tending of what matters. Earth here is the mountain path, the quiet forest floor, the soil that holds the seed through winter.',
    reflectionQuestions: [
      'What period of solitude or inner work is your soul asking for right now?',
      'What wisdom have you earned through difficulty that you are ready to integrate?',
      'Who in your life might benefit from the light of your experience, offered gently and without imposition?',
    ],
  },
  10: {
    numerology: '10 — The number of completion and new beginnings. Ten reduces to one (1+0), suggesting that every ending contains a fresh start. The Wheel of Fortune turns endlessly — what goes up must come down, and what falls will rise again.',
    elementalAssociation: 'Fire and Jupiter expand the Wheel of Fortune — the element of growth, luck, and the grand sweep of destiny. Fire here is the cosmic engine, the turning force that animates all cycles and reminds us that nothing stays still.',
    reflectionQuestions: [
      'What cycle in your life feels like it is completing, and what new one is beginning?',
      'How do you respond to change — do you resist the wheel\'s turning, or learn to ride it?',
      'What would it mean to trust that the universe is always moving you toward your highest good?',
    ],
  },
  11: {
    numerology: '11 — A master number in numerology, representing illumination, intuition, and the bridge between the earthly and divine. Justice holds eleven as the perfect balance point — the scales that weigh not just actions but intentions.',
    elementalAssociation: 'Air and Libra balance Justice — the element of fairness, intellect, and the clear-eyed assessment of truth. Air here is the breath of impartiality, cutting through emotion to see what is genuinely just.',
    reflectionQuestions: [
      'Where in your life are you being called to take full responsibility for your choices and their consequences?',
      'Is there a situation where you have been judging yourself or others too harshly — or not harshly enough?',
      'What would it mean to act with complete integrity, even when no one is watching?',
    ],
  },
  12: {
    numerology: '12 — The number of sacrifice, surrender, and cosmic order. Twelve appears in the hours of the clock, the months of the year, the apostles — it speaks of a complete cycle willingly entered. The Hanged Man chooses his suspension; it is not punishment but initiation.',
    elementalAssociation: 'Water and Neptune dissolve The Hanged Man — the element of surrender, mysticism, and the willingness to let go of what we think we know. Water here is the still pool that reflects a world seen upside down and finds it beautiful.',
    reflectionQuestions: [
      'What situation in your life requires you to pause, surrender, and see from a completely different perspective?',
      'What are you clinging to that, if released, would set you free?',
      'What wisdom might be available to you only through stillness and voluntary surrender?',
    ],
  },
  13: {
    numerology: '13 — The number of transformation and rebirth. Thirteen is feared in many cultures precisely because it disrupts the order of twelve — it is the wild card, the force that clears the way for what must come next. Death holds thirteen as the great liberator.',
    elementalAssociation: 'Water and Scorpio deepen Death — the element of transformation, the unconscious, and the mysteries that lie beneath the surface. Water here is the river that carries the dead to new shores; it does not mourn, it moves.',
    reflectionQuestions: [
      'What in your life has already ended, even if you have not yet allowed yourself to grieve it?',
      'What identity, relationship, or chapter are you being called to release so something new can emerge?',
      'If you truly trusted that every ending leads to a new beginning, what would you let go of today?',
    ],
  },
  14: {
    numerology: '14 — The number of balance in motion. Fourteen reduces to five (1+4), the number of change — yet here that change is moderated, blended, and refined. Temperance asks you to find the middle path between extremes.',
    elementalAssociation: 'Fire and Sagittarius inspire Temperance — yet fire here is tempered by water, one foot on earth and one in the stream. This is the alchemy of opposites: not choosing between fire and water, but learning to hold both at once.',
    reflectionQuestions: [
      'Where in your life are you being pulled between two extremes, and what would the middle path look like?',
      'What habits or patterns are out of balance, and what small adjustment would restore harmony?',
      'What are you in the process of becoming, and can you trust the slow alchemy of that transformation?',
    ],
  },
  15: {
    numerology: '15 — Reduces to six (1+5), the number of harmony and choice — yet The Devil shows what happens when that choice is made from fear rather than love. Fifteen is the shadow of six, the binding that results from choosing comfort over truth.',
    elementalAssociation: 'Earth and Capricorn bind The Devil — the element of material reality, ambition, and the physical world taken to its shadow extreme. Earth here is the chain, the weight of matter when we mistake it for the whole of reality.',
    reflectionQuestions: [
      'What habit, relationship, or belief system are you staying in because it feels safer than freedom?',
      'Where are you giving your power away — to a substance, a person, a fear, or a story about yourself?',
      'What would you do differently if you truly believed you were not bound by your past?',
    ],
  },
  16: {
    numerology: '16 — Reduces to seven (1+6), the number of spiritual truth — but The Tower reveals that truth through sudden, unavoidable revelation. Sixteen is the lightning bolt that strikes the false tower of ego, clearing the way for authentic foundation.',
    elementalAssociation: 'Fire and Mars ignite The Tower — the element of destruction and renewal, the purifying flame that burns what is no longer true. Fire here is not gentle; it is the wildfire that clears the forest floor so new growth can reach the light.',
    reflectionQuestions: [
      'What structure in your life — a belief, a relationship, a plan — has been built on an unstable foundation?',
      'Where might sudden disruption actually be clearing the way for something more authentic?',
      'What would you rebuild if you could start completely from scratch, knowing what you know now?',
    ],
  },
  17: {
    numerology: '17 — Reduces to eight (1+7), the number of infinite cycles and renewal. After the destruction of The Tower, The Star pours out eight-pointed light — the promise that after every storm, the waters of hope are replenished.',
    elementalAssociation: 'Air and Aquarius illuminate The Star — the element of vision, humanity, and the breath of inspiration that follows devastation. Air here is the clear sky after the storm, carrying the scent of rain and the possibility of tomorrow.',
    reflectionQuestions: [
      'What hope or dream have you been afraid to hold onto after a period of loss or disappointment?',
      'Where in your life are you being called to pour yourself out in service to something larger than yourself?',
      'What does healing look like for you right now, and what small act of self-renewal can you offer yourself today?',
    ],
  },
  18: {
    numerology: '18 — Reduces to nine (1+8), the number of completion and wisdom — yet The Moon\'s nine is shadowed, uncertain, the wisdom of the unconscious rather than the conscious mind. Eighteen asks you to complete the inner journey before the outer one.',
    elementalAssociation: 'Water and Pisces deepen The Moon — the element of dreams, illusion, and the vast ocean of the unconscious. Water here is the tidal pull of the moon itself, drawing up what is hidden in the depths whether we are ready or not.',
    reflectionQuestions: [
      'What fears or illusions are distorting your perception of a current situation?',
      'What is your unconscious mind trying to communicate through dreams, intuitions, or recurring feelings?',
      'Where are you navigating by moonlight when you need to wait for the dawn?',
    ],
  },
  19: {
    numerology: '19 — Reduces to ten, then to one — the full cycle completed and returned to its source. The Sun is the number of radiant individuality, the self fully expressed after the long journey through the night. Nineteen is the triumphant return.',
    elementalAssociation: 'Fire and the Sun itself animate this card — the element of life, vitality, and the creative force at the heart of all existence. Fire here is pure, generous, and life-giving; it asks nothing in return for its warmth.',
    reflectionQuestions: [
      'What brings you genuine, uncomplicated joy — and how much space are you giving it in your life?',
      'Where have you been hiding your light, and what would it feel like to shine without apology?',
      'What does your most radiant, fully expressed self look like, and what is one step toward embodying that today?',
    ],
  },
  20: {
    numerology: '20 — Reduces to two, the number of duality and choice — yet Judgement\'s two is the moment of final reckoning, the choice between the old self and the new. Twenty is the threshold of transformation, the last door before the world.',
    elementalAssociation: 'Fire and Pluto transform through Judgement — the element of resurrection, the phoenix flame that does not merely destroy but calls the dead back to life. Fire here is the trumpet blast, the clarion call to rise.',
    reflectionQuestions: [
      'What calling or purpose have you been ignoring that is now demanding your full attention?',
      'What version of yourself are you being asked to leave behind in order to step into who you are becoming?',
      'If you heard a clear call to your highest purpose today, what would it be asking you to do?',
    ],
  },
  21: {
    numerology: '21 — Reduces to three (2+1), the number of creative completion. The World is the final card of the Major Arcana — twenty-one is the age of full maturity, the moment when the journey becomes the destination and the dancer becomes the dance.',
    elementalAssociation: 'Earth and Saturn complete The World — the element of manifestation, the physical reality that is the culmination of all spiritual work. Earth here is not limitation but achievement; the material world is revealed as sacred.',
    reflectionQuestions: [
      'What cycle in your life is reaching its natural completion, and how can you honour that with gratitude?',
      'What have you learned about yourself through this journey that you will carry into the next?',
      'What does wholeness feel like to you, and where in your life are you already living it?',
    ],
  },
  // ── Wands ───────────────────────────────────────────────────────────────────
  22: {
    numerology: '1 (Ace) — Pure potential, the seed of the suit. The Ace of Wands is the first spark before the fire — undifferentiated creative energy waiting to be directed. One is the point of origin, the moment before the journey begins.',
    elementalAssociation: 'Fire is the element of Wands — passion, inspiration, will, and the creative life force. The Ace distils this to its purest essence: raw, untamed, and electric with possibility.',
    reflectionQuestions: [
      'What new creative project, passion, or direction is calling to you right now?',
      'Where do you feel the most alive and energised, and how can you move toward more of that?',
      'What would you begin today if you trusted that the energy to sustain it would follow?',
    ],
  },
  23: {
    numerology: '2 — Partnership, planning, and the first step into the unknown. Two of Wands holds the tension between the familiar and the horizon — you have made your choice, now you must commit to the journey.',
    elementalAssociation: 'Fire and Mars in Aries make the Two of Wands bold and pioneering. This fire does not wait; it scouts ahead, maps the territory, and dares to imagine what lies beyond the edge of the known world.',
    reflectionQuestions: [
      'What long-term vision are you holding, and what is your next concrete step toward it?',
      'Where are you standing at a threshold, holding the world in your hands but hesitating to move?',
      'What would you plan if you knew the universe was fully supporting your boldest ambition?',
    ],
  },
  24: {
    numerology: '3 — Growth, expansion, and the first fruits of effort. Three of Wands signals that the seeds planted in the Ace and Two are now visible on the horizon — your ships are coming in.',
    elementalAssociation: 'Fire and Sun in Aries illuminate the Three of Wands with optimism and foresight. This fire looks outward, toward distant shores and new territories, fuelled by the confidence of early success.',
    reflectionQuestions: [
      'What early signs of progress or success can you acknowledge and celebrate right now?',
      'Where are you being called to expand beyond your current boundaries or comfort zone?',
      'What opportunities on the horizon require you to think bigger than you have been?',
    ],
  },
  25: {
    numerology: '4 — Stability, celebration, and the harvest. Four of Wands is the joyful pause in the journey — the moment to gather, celebrate, and acknowledge how far you have come before moving on.',
    elementalAssociation: 'Fire and Venus in Aries bring warmth and joy to the Four of Wands. This fire is communal — the bonfire around which people gather, the hearth that makes a house a home.',
    reflectionQuestions: [
      'What milestone or achievement in your life deserves to be properly celebrated?',
      'Who are the people who make you feel most at home, and when did you last gather with them?',
      'What foundation have you built that is now stable enough to celebrate and build upon?',
    ],
  },
  26: {
    numerology: '5 — Conflict, challenge, and the disruption of stability. Five of Wands brings the chaos of competing energies — not malicious, but scattered. Five asks: can you find your voice and your direction amid the noise?',
    elementalAssociation: 'Fire and Saturn in Leo create the friction of the Five of Wands. This fire is multiple flames competing for the same air — passionate, energetic, but lacking coordination. The challenge is to channel, not suppress, the heat.',
    reflectionQuestions: [
      'Where in your life are you experiencing conflict or competition, and what is it teaching you?',
      'Are you fighting for something that truly matters, or expending energy on battles that don\'t serve you?',
      'What would it look like to channel your competitive energy into collaboration instead?',
    ],
  },
  27: {
    numerology: '6 — Victory, recognition, and the return of the hero. Six of Wands is the triumphant homecoming — the moment when effort is publicly acknowledged and the self is affirmed by the world.',
    elementalAssociation: 'Fire and Jupiter in Leo expand the Six of Wands into generous, radiant victory. This fire is the torch held high, the light that others follow — leadership earned through genuine achievement.',
    reflectionQuestions: [
      'What recent success or achievement have you been downplaying rather than owning?',
      'How comfortable are you with being seen, celebrated, or recognised for your accomplishments?',
      'What would it mean to lead by example in an area where you have genuine expertise?',
    ],
  },
  28: {
    numerology: '7 — Perseverance, defence, and the test of commitment. Seven of Wands asks whether you have the courage to hold your ground when challenged. Seven is the number of inner truth — do you believe in what you are defending?',
    elementalAssociation: 'Fire and Mars in Leo make the Seven of Wands fierce and determined. This fire is the warrior\'s flame — it burns brightest under pressure, refusing to be extinguished by opposition.',
    reflectionQuestions: [
      'What position, belief, or boundary are you being called to defend right now?',
      'Where are you standing your ground from genuine conviction, and where from stubbornness?',
      'What would give you the confidence to hold your position even when others push back?',
    ],
  },
  29: {
    numerology: '8 — Speed, momentum, and the power of aligned action. Eight of Wands is the number of infinity in motion — all eight wands flying in the same direction, unstoppable and swift.',
    elementalAssociation: 'Fire and Mercury in Sagittarius electrify the Eight of Wands with speed and clarity. This fire travels like lightning — inspired, direct, and arriving before you have time to second-guess it.',
    reflectionQuestions: [
      'What area of your life is moving quickly right now, and are you ready to receive what is coming?',
      'Where have you been overthinking or delaying when swift, decisive action is what is needed?',
      'What message, opportunity, or communication are you waiting for — and what if it is already on its way?',
    ],
  },
  30: {
    numerology: '9 — Resilience, endurance, and the wisdom of the survivor. Nine of Wands is the penultimate number — almost at the finish line, battle-worn but unbroken. Nine asks: do you have enough left to take one more step?',
    elementalAssociation: 'Fire and Moon in Sagittarius give the Nine of Wands a weary but determined flame. This fire has been burning a long time; it is lower now, but it is steady — the ember that refuses to go out.',
    reflectionQuestions: [
      'What challenge have you been enduring that is closer to resolution than it may feel right now?',
      'Where are you protecting yourself based on past wounds rather than present reality?',
      'What would it mean to rest without giving up — to tend your flame rather than push through exhaustion?',
    ],
  },
  31: {
    numerology: '10 — Completion and the weight of accumulated effort. Ten of Wands is the full cycle of the suit — all the fire gathered into one burden. Ten reduces to one, suggesting that this completion is also a new beginning, if you are willing to set down what no longer serves.',
    elementalAssociation: 'Fire and Saturn in Sagittarius make the Ten of Wands a heavy flame. This fire has been carried too long, too far — it is time to examine what you are still holding that could be delegated, released, or simply put down.',
    reflectionQuestions: [
      'What responsibilities or burdens are you carrying that are no longer yours to carry alone?',
      'Where have ambition and drive become overextension and exhaustion?',
      'What would you need to release or delegate to feel genuinely free and energised again?',
    ],
  },
  32: {
    numerology: '11 (Page) — The student, the messenger, the spark of new learning. Court cards carry the energy of their suit in its most nascent, unformed state. The Page of Wands is fire discovering itself for the first time.',
    elementalAssociation: 'Fire of Fire — the Page of Wands is pure, undiluted creative energy. Enthusiastic, curious, and unafraid of failure, this is the flame of the beginner\'s mind, burning bright with the joy of discovery.',
    reflectionQuestions: [
      'What new creative interest or passion project is calling to you, even if you feel like a complete beginner?',
      'Where in your life could you benefit from approaching something with fresh eyes and childlike curiosity?',
      'What message or inspiration have you been receiving that you have not yet acted upon?',
    ],
  },
  33: {
    numerology: '12 (Knight) — Action, quest, and the energy of the seeker in motion. The Knight of Wands charges forward with the full force of the suit — passionate, impulsive, and utterly committed to the adventure.',
    elementalAssociation: 'Air of Fire — the Knight of Wands combines the speed of air with the passion of fire, creating a force that is brilliant, fast-moving, and sometimes reckless. The challenge is to direct this energy before it burns itself out.',
    reflectionQuestions: [
      'Where are you being called to take bold, passionate action without waiting for perfect conditions?',
      'Is your current pace sustainable, or are you burning through your energy faster than you can replenish it?',
      'What adventure or challenge would make you feel most alive right now?',
    ],
  },
  34: {
    numerology: '13 (Queen) — Mastery, magnetism, and the fully embodied expression of the suit\'s gifts. The Queen of Wands has integrated fire\'s power and radiates it as warmth, confidence, and creative authority.',
    elementalAssociation: 'Water of Fire — the Queen of Wands holds fire\'s passion within the emotional intelligence of water. She is magnetic, intuitive, and deeply creative — her fire does not burn others but draws them in.',
    reflectionQuestions: [
      'Where in your life are you being called to step into your full creative power and lead with confidence?',
      'How do you express your passion in a way that inspires and uplifts those around you?',
      'What would it mean to be fully, unapologetically yourself — and to let that be enough?',
    ],
  },
  35: {
    numerology: '14 (King) — Authority, vision, and the mature expression of the suit\'s highest qualities. The King of Wands has mastered fire and now wields it with wisdom, directing creative energy toward meaningful, lasting impact.',
    elementalAssociation: 'Fire of Fire at its most refined — the King of Wands is the visionary leader, the entrepreneur of the soul. His fire is strategic and generous, lighting the way for others while never losing sight of his own north star.',
    reflectionQuestions: [
      'What vision are you being called to lead, and do you have the courage to step into that role?',
      'How do you inspire others through your own example rather than through instruction or demand?',
      'Where might you be holding back your full creative authority out of fear of how it will be received?',
    ],
  },
  // ── Cups ────────────────────────────────────────────────────────────────────
  36: {
    numerology: '1 (Ace) — The pure gift of emotional beginning. The Ace of Cups is the overflowing chalice of the heart — love, intuition, and spiritual connection offered freely by the universe.',
    elementalAssociation: 'Water is the element of Cups — emotion, intuition, the unconscious, and all matters of the heart. The Ace is water at its most pristine: clear, deep, and brimming with feeling.',
    reflectionQuestions: [
      'What new emotional beginning, relationship, or creative flow is being offered to you right now?',
      'Are you open to receiving love — from others, from the universe, from yourself?',
      'What would it feel like to let your heart overflow without fear of being too much?',
    ],
  },
  37: {
    numerology: '2 — Union, partnership, and the sacred meeting of two souls. Two of Cups is the number of duality in its most beautiful form — two streams flowing together, each made richer by the other.',
    elementalAssociation: 'Water and Venus in Cancer deepen the Two of Cups into tender, devoted connection. This water is the shared pool of mutual understanding — clear, warm, and held gently between two open hands.',
    reflectionQuestions: [
      'What relationship in your life is calling for deeper honesty, vulnerability, or commitment?',
      'Where are you withholding yourself from genuine connection out of fear of being hurt?',
      'What would it mean to meet someone — or yourself — exactly where they are, without agenda?',
    ],
  },
  38: {
    numerology: '3 — Celebration, community, and the joy of shared abundance. Three of Cups is the number of creative overflow expressed through friendship, ritual, and collective joy.',
    elementalAssociation: 'Water and Mercury in Cancer make the Three of Cups emotionally expressive and communicative. This water is the laughter of a stream — light, musical, and irresistibly social.',
    reflectionQuestions: [
      'Who are the people in your life who truly celebrate you, and when did you last celebrate with them?',
      'Where in your life could you invite more joy, playfulness, and communal connection?',
      'What are you grateful for right now that deserves to be shared and celebrated?',
    ],
  },
  39: {
    numerology: '4 — Contemplation, apathy, and the stillness that follows satisfaction. Four of Cups is the number of stability turned inward — a pause in the emotional journey to reassess what truly matters.',
    elementalAssociation: 'Water and Moon in Cancer make the Four of Cups deeply introspective. This water is the still pond — reflective, quiet, and perhaps a little stagnant. It asks: what are you missing while you look inward?',
    reflectionQuestions: [
      'What opportunity or offer are you overlooking because you are too focused on what you lack?',
      'Is your current withdrawal a necessary period of reflection, or has it become avoidance?',
      'What would it take to feel genuinely grateful for what is already present in your life?',
    ],
  },
  40: {
    numerology: '5 — Loss, grief, and the necessary pain of emotional growth. Five of Cups is the number of disruption applied to the heart — the spilled cups that demand you grieve before you can move forward.',
    elementalAssociation: 'Water and Mars in Scorpio intensify the Five of Cups into deep, transformative grief. This water is the river of tears — necessary, cleansing, and ultimately carrying you toward new shores.',
    reflectionQuestions: [
      'What loss or disappointment are you still carrying that needs to be fully grieved?',
      'Are you so focused on what has been lost that you cannot see what remains?',
      'What would it mean to honour your grief fully, and then turn toward what is still possible?',
    ],
  },
  41: {
    numerology: '6 — Nostalgia, innocence, and the gifts of the past. Six of Cups is the number of harmony expressed through memory — the sweetness of what was, offered as a gift to the present.',
    elementalAssociation: 'Water and Sun in Scorpio warm the Six of Cups with gentle, golden nostalgia. This water is the memory of rain — soft, distant, and carrying the scent of a simpler time.',
    reflectionQuestions: [
      'What memory or experience from your past holds a gift or lesson that is relevant to your life right now?',
      'Where might nostalgia be keeping you from fully inhabiting the present?',
      'What innocent joy from your childhood would you like to reclaim in some form today?',
    ],
  },
  42: {
    numerology: '7 — Fantasy, choice, and the proliferation of possibilities. Seven of Cups is the number of inner truth applied to desire — so many options that discernment becomes the real challenge.',
    elementalAssociation: 'Water and Venus in Scorpio make the Seven of Cups seductive and illusory. This water is the dream — beautiful, shifting, and not always what it appears. The challenge is to see clearly through the mist of desire.',
    reflectionQuestions: [
      'Where in your life are you overwhelmed by options, fantasies, or possibilities that prevent you from choosing?',
      'Which of your current desires are grounded in genuine values, and which are escapism or wishful thinking?',
      'What would you choose if you could only choose one thing — and what does that tell you?',
    ],
  },
  43: {
    numerology: '8 — Withdrawal, transition, and the courage to leave what no longer serves. Eight of Cups is the number of infinite cycles applied to emotional life — the recognition that this chapter is complete.',
    elementalAssociation: 'Water and Saturn in Pisces make the Eight of Cups a melancholy but necessary departure. This water is the tide going out — not dramatic, not angry, simply moving on as tides must.',
    reflectionQuestions: [
      'What situation, relationship, or chapter of your life are you being called to walk away from, even though it is not terrible?',
      'What are you seeking that you know you will not find by staying where you are?',
      'What would it mean to honour what has been, and then choose yourself anyway?',
    ],
  },
  44: {
    numerology: '9 — Contentment, satisfaction, and the wish fulfilled. Nine of Cups is the number of completion applied to desire — the emotional journey nearly complete, the heart\'s deepest wish granted.',
    elementalAssociation: 'Water and Jupiter in Pisces expand the Nine of Cups into generous, abundant satisfaction. This water is the full cup — not overflowing with anxiety, but resting in the quiet pleasure of enough.',
    reflectionQuestions: [
      'What wish or desire has recently been fulfilled, and have you allowed yourself to truly savour it?',
      'Where in your life are you already living the answer to a prayer you once sent out?',
      'What does genuine emotional contentment feel like to you, and how close are you to it right now?',
    ],
  },
  45: {
    numerology: '10 — Completion, family, and the fullness of emotional life. Ten of Cups is the final number of the suit — the rainbow after the storm, the family gathered in joy, the heart\'s journey complete.',
    elementalAssociation: 'Water and Mars in Pisces bring the Ten of Cups to its joyful culmination. This water is the river reaching the sea — the long journey complete, the individual drop returned to the vast whole.',
    reflectionQuestions: [
      'What does your vision of emotional fulfilment and lasting happiness look like?',
      'Where in your relationships are you already experiencing the love and belonging you have been seeking?',
      'What would it mean to define home not as a place but as a feeling — and to carry it with you?',
    ],
  },
  46: {
    numerology: '11 (Page) — Emotional sensitivity, creative imagination, and the gift of the dreamer. The Page of Cups is fire discovering water — the first stirring of feeling, intuition, and artistic vision.',
    elementalAssociation: 'Earth of Water — the Page of Cups grounds emotional sensitivity in the physical world. This water is the tide pool — small, contained, but teeming with unexpected life and wonder.',
    reflectionQuestions: [
      'What creative or intuitive impulse are you being invited to explore without needing to know where it leads?',
      'Where in your life could you benefit from approaching a situation with more emotional openness and curiosity?',
      'What message is your heart sending you that your mind keeps interrupting?',
    ],
  },
  47: {
    numerology: '12 (Knight) — Romantic idealism, emotional pursuit, and the quest of the heart. The Knight of Cups rides toward beauty, love, and the ideal — sometimes wisely, sometimes naively.',
    elementalAssociation: 'Air of Water — the Knight of Cups combines the movement of air with the depth of water, creating a force that is poetic, romantic, and sometimes lost in its own dreams.',
    reflectionQuestions: [
      'What or whom are you pursuing with your heart, and is that pursuit grounded in reality?',
      'Where might romantic idealism be preventing you from seeing a situation or person clearly?',
      'What would it mean to follow your heart while also keeping your feet on the ground?',
    ],
  },
  48: {
    numerology: '13 (Queen) — Emotional mastery, empathy, and the wisdom of deep feeling. The Queen of Cups has integrated water\'s gifts and offers them as compassion, intuition, and unconditional love.',
    elementalAssociation: 'Water of Water — the Queen of Cups is the element at its most refined. She is the deep ocean — still on the surface, fathomless beneath, and capable of reflecting the sky perfectly.',
    reflectionQuestions: [
      'Where in your life are you being called to lead with empathy and emotional intelligence?',
      'How well do you honour your own emotional needs, not just those of the people you love?',
      'What would it mean to trust your intuition completely, even when it contradicts the evidence?',
    ],
  },
  49: {
    numerology: '14 (King) — Emotional authority, balance, and the mastery of feeling without suppression. The King of Cups has learned to hold the full depth of water without being swept away by it.',
    elementalAssociation: 'Fire of Water — the King of Cups brings warmth and direction to the element of feeling. He is the lighthouse — steady, warm, and guiding others safely through emotional storms.',
    reflectionQuestions: [
      'How do you maintain emotional equilibrium when those around you are in turmoil?',
      'Where might you be suppressing your feelings in the name of appearing calm or in control?',
      'What would it mean to be both deeply feeling and deeply stable — to let the waves move through you without drowning?',
    ],
  },
  // ── Swords ──────────────────────────────────────────────────────────────────
  50: {
    numerology: '1 (Ace) — The pure force of mental clarity and truth. The Ace of Swords is the first breath of the mind — the moment of absolute clarity before complexity enters.',
    elementalAssociation: 'Air is the element of Swords — intellect, communication, conflict, and the double-edged nature of truth. The Ace is air at its most pure: clear, sharp, and cutting through illusion.',
    reflectionQuestions: [
      'What truth are you ready to face clearly, without the softening of wishful thinking?',
      'Where in your life do you need to cut through confusion and name what is actually happening?',
      'What new idea, insight, or mental breakthrough is trying to emerge right now?',
    ],
  },
  51: {
    numerology: '2 — Stalemate, avoidance, and the paralysis of indecision. Two of Swords is the number of duality in its most uncomfortable form — two equally weighted options, and the blindfold of denial.',
    elementalAssociation: 'Air and Moon in Libra make the Two of Swords a tense, carefully balanced standoff. This air is held — not flowing, not moving, suspended in the moment before a difficult choice must be made.',
    reflectionQuestions: [
      'What decision are you avoiding by keeping yourself in a state of deliberate not-knowing?',
      'What information or truth are you refusing to look at because it would force you to choose?',
      'What would happen if you removed the blindfold — and what are you afraid you would see?',
    ],
  },
  52: {
    numerology: '3 — Heartbreak, sorrow, and the pain of truth spoken or withheld. Three of Swords is the number of creative expression applied to grief — the heart pierced by the clarity of what cannot be unseen.',
    elementalAssociation: 'Air and Saturn in Libra make the Three of Swords a cold, precise pain. This air is the winter wind — it does not intend cruelty, but it does not soften the truth either.',
    reflectionQuestions: [
      'What grief, betrayal, or painful truth are you carrying that needs to be acknowledged and released?',
      'Is there a conversation you have been avoiding that, though painful, would ultimately bring relief?',
      'What would it mean to let yourself feel the full weight of a sorrow rather than pushing it away?',
    ],
  },
  53: {
    numerology: '4 — Rest, recovery, and the necessary pause after conflict. Four of Swords is the number of stability applied to the mind — the retreat that allows healing and integration.',
    elementalAssociation: 'Air and Jupiter in Libra bring a merciful stillness to the Four of Swords. This air is the quiet of a sickroom — hushed, healing, and asking you to stop fighting long enough to recover.',
    reflectionQuestions: [
      'What area of your life is asking for rest, withdrawal, and quiet recuperation?',
      'Are you giving yourself permission to pause, or do you feel guilty for not being in constant motion?',
      'What would genuine mental rest look like for you — and when did you last allow yourself to have it?',
    ],
  },
  54: {
    numerology: '5 — Defeat, humiliation, and the hollow victory of ego. Five of Swords is the number of disruption applied to conflict — the battle won at too great a cost, or the loss that teaches more than winning ever could.',
    elementalAssociation: 'Air and Venus in Aquarius make the Five of Swords a cold, detached conflict. This air is the aftermath of the storm — the silence that follows when you realise the victory was not worth the price.',
    reflectionQuestions: [
      'Where in your life are you winning battles but losing the war — or fighting for something that no longer matters?',
      'Is there a conflict you are holding onto out of pride when walking away would be the wiser choice?',
      'What would it mean to choose peace over being right?',
    ],
  },
  55: {
    numerology: '6 — Transition, passage, and the journey toward calmer waters. Six of Swords is the number of harmony applied to difficulty — not resolution, but movement away from what has been painful.',
    elementalAssociation: 'Air and Mercury in Aquarius guide the Six of Swords toward clarity and forward motion. This air is the wind in the sails — not yet at the destination, but finally moving in the right direction.',
    reflectionQuestions: [
      'What difficult situation are you in the process of leaving behind, even if the journey is not yet complete?',
      'What mental or emotional baggage are you carrying with you that you could choose to leave on the shore?',
      'What does the calmer shore you are moving toward look like, and what will you do when you arrive?',
    ],
  },
  56: {
    numerology: '7 — Deception, strategy, and the shadow side of intelligence. Seven of Swords is the number of inner truth applied to cunning — the mind using its gifts for self-protection rather than genuine connection.',
    elementalAssociation: 'Air and Moon in Aquarius make the Seven of Swords clever, detached, and elusive. This air is the smoke screen — obscuring, deflecting, and moving too quickly to be pinned down.',
    reflectionQuestions: [
      'Where in your life are you being less than fully honest — with yourself or with others?',
      'Is there a situation where you are using cleverness or strategy to avoid a direct conversation?',
      'What would happen if you chose radical honesty over self-protection in a current situation?',
    ],
  },
  57: {
    numerology: '8 — Restriction, self-imposed limitation, and the prison of the mind. Eight of Swords is the number of infinite cycles applied to entrapment — the loop of thought that keeps you bound.',
    elementalAssociation: 'Air and Jupiter in Gemini make the Eight of Swords a paradox — the expansive mind turned inward and trapped by its own thinking. This air is the echo chamber, the thought that circles endlessly without resolution.',
    reflectionQuestions: [
      'What limiting belief or mental pattern is keeping you stuck in a situation you have the power to leave?',
      'If you removed the blindfold and looked clearly at your situation, what would you see that you have been afraid to acknowledge?',
      'Who or what has the power to free you — and is it actually outside you, or within?',
    ],
  },
  58: {
    numerology: '9 — Anxiety, despair, and the darkest hour before dawn. Nine of Swords is the number of completion applied to suffering — the mind at its most tormented, the night at its longest.',
    elementalAssociation: 'Air and Mars in Gemini make the Nine of Swords a relentless, anxious energy. This air is the 3am mind — racing, catastrophising, and unable to find rest in the dark.',
    reflectionQuestions: [
      'What fear or worry is keeping you awake at night, and how much of it is based in present reality versus projection?',
      'What would you say to a dear friend who was suffering the way you are suffering right now?',
      'What small act of self-compassion could you offer yourself in this moment of darkness?',
    ],
  },
  59: {
    numerology: '10 — Painful endings, rock bottom, and the absolute completion of a cycle. Ten of Swords is the final number of the suit — the wound that cannot be denied, the ending that is total and irrevocable.',
    elementalAssociation: 'Air and Sun in Gemini illuminate the Ten of Swords with brutal clarity. This air is the cold dawn light that reveals the battlefield — there is no more pretending, no more avoiding. It is over.',
    reflectionQuestions: [
      'What situation in your life has reached its absolute end, and are you willing to accept that it is over?',
      'What would it mean to stop fighting a conclusion that has already been reached?',
      'What new beginning is only possible because this ending is finally, completely done?',
    ],
  },
  60: {
    numerology: '11 (Page) — Intellectual curiosity, vigilance, and the sharp mind of the student. The Page of Swords is air discovering itself — quick, observant, and hungry for truth.',
    elementalAssociation: 'Earth of Air — the Page of Swords grounds intellectual energy in practical observation. This air is the scout — alert, watchful, and gathering information before committing to action.',
    reflectionQuestions: [
      'Where in your life do you need to gather more information before making a decision?',
      'Are you using your sharp mind to seek truth, or to find evidence for what you already believe?',
      'What would it mean to approach a current situation with genuine curiosity rather than a predetermined conclusion?',
    ],
  },
  61: {
    numerology: '12 (Knight) — Intellectual charge, swift action, and the pursuit of truth at all costs. The Knight of Swords rushes forward with the full force of the mind — brilliant, decisive, and sometimes reckless.',
    elementalAssociation: 'Air of Air — the Knight of Swords is the element at its most extreme: fast, cutting, and unstoppable. This air is the gale force wind — exhilarating and potentially destructive.',
    reflectionQuestions: [
      'Where are you charging forward with conviction — and have you considered the impact on those in your path?',
      'Is your current directness and speed serving the situation, or creating unnecessary conflict?',
      'What would it mean to be both decisive and considerate — to act swiftly without leaving a trail of damage?',
    ],
  },
  62: {
    numerology: '13 (Queen) — Intellectual mastery, clear perception, and the wisdom of one who has known loss. The Queen of Swords has integrated air\'s gifts through experience — she sees clearly, speaks honestly, and holds no illusions.',
    elementalAssociation: 'Water of Air — the Queen of Swords brings emotional depth to the element of intellect. She has felt deeply and learned to think clearly from that feeling — her clarity is not coldness but hard-won wisdom.',
    reflectionQuestions: [
      'Where in your life are you being called to speak your truth clearly, even if it is uncomfortable?',
      'How do you balance intellectual honesty with emotional compassion in your relationships?',
      'What would it mean to see a situation or person exactly as they are, without the distortion of hope or fear?',
    ],
  },
  63: {
    numerology: '14 (King) — Intellectual authority, ethical leadership, and the mastery of mind. The King of Swords has earned the right to judge — not from arrogance, but from the long practice of clear thinking and principled action.',
    elementalAssociation: 'Fire of Air — the King of Swords brings decisive, directed energy to the element of intellect. His air is the focused beam — cutting through confusion with the authority of one who has thought deeply and chosen carefully.',
    reflectionQuestions: [
      'Where in your life are you being called to make a clear, principled decision without letting emotion cloud your judgment?',
      'How do you use your intellectual authority — to serve truth and justice, or to win arguments?',
      'What would it mean to lead with both clarity and compassion, refusing to sacrifice one for the other?',
    ],
  },
  // ── Pentacles ───────────────────────────────────────────────────────────────
  64: {
    numerology: '1 (Ace) — The pure gift of material potential. The Ace of Pentacles is the seed of the earth — the opportunity for abundance, security, and physical manifestation offered by the universe.',
    elementalAssociation: 'Earth is the element of Pentacles — the physical world, material resources, the body, and all that can be touched, built, and grown. The Ace is earth at its most fertile: rich, dark, and full of promise.',
    reflectionQuestions: [
      'What new opportunity for financial growth, physical wellbeing, or material security is being offered to you?',
      'Are you ready to receive abundance — or do you have beliefs about money and worth that might block it?',
      'What seed could you plant today that, tended with patience, would grow into lasting security?',
    ],
  },
  65: {
    numerology: '2 — Balance, adaptability, and the juggling of material concerns. Two of Pentacles is the number of duality applied to practical life — the constant dance of managing competing demands.',
    elementalAssociation: 'Earth and Jupiter in Capricorn make the Two of Pentacles a pragmatic, adaptable energy. This earth is the tidal zone — constantly shifting between land and sea, learning to be stable in the midst of change.',
    reflectionQuestions: [
      'Where in your life are you juggling too many responsibilities, and what would it mean to simplify?',
      'How well are you adapting to change right now — with grace, or with resistance?',
      'What would it look like to find your balance point rather than constantly scrambling to maintain it?',
    ],
  },
  66: {
    numerology: '3 — Collaboration, craftsmanship, and the joy of skilled work. Three of Pentacles is the number of creative expression applied to the material world — the master craftsperson working with others toward a shared vision.',
    elementalAssociation: 'Earth and Mars in Capricorn bring focused, disciplined energy to the Three of Pentacles. This earth is the workshop floor — solid, purposeful, and alive with the satisfaction of work done well.',
    reflectionQuestions: [
      'Where in your work or creative life are you being called to collaborate rather than go it alone?',
      'Are you bringing your full skill and attention to the work in front of you?',
      'What would it mean to take genuine pride in the quality of what you are building?',
    ],
  },
  67: {
    numerology: '4 — Security, conservation, and the shadow of hoarding. Four of Pentacles is the number of stability applied to material resources — the question of whether you hold your resources or they hold you.',
    elementalAssociation: 'Earth and Sun in Capricorn make the Four of Pentacles solid, cautious, and perhaps overly controlled. This earth is the locked vault — secure, yes, but also sealed against the flow of abundance.',
    reflectionQuestions: [
      'Where in your life are you holding on too tightly — to money, to control, to a sense of security?',
      'What are you afraid would happen if you loosened your grip?',
      'What would it mean to trust that generosity and flow create more abundance than hoarding?',
    ],
  },
  68: {
    numerology: '5 — Loss, hardship, and the experience of material lack. Five of Pentacles is the number of disruption applied to the physical world — the cold outside the warm church, the feeling of being left out in the cold.',
    elementalAssociation: 'Earth and Mercury in Taurus make the Five of Pentacles a stubborn, grinding difficulty. This earth is the frozen ground — hard, unyielding, and seemingly indifferent to suffering.',
    reflectionQuestions: [
      'Where in your life are you experiencing material hardship or a sense of lack, and what support is available that you have not yet asked for?',
      'Are you so focused on what you have lost that you cannot see the help that is right in front of you?',
      'What would it mean to ask for help — and what is stopping you?',
    ],
  },
  69: {
    numerology: '6 — Generosity, charity, and the flow of giving and receiving. Six of Pentacles is the number of harmony applied to material exchange — the balance of giving and receiving that creates true abundance.',
    elementalAssociation: 'Earth and Moon in Taurus make the Six of Pentacles generous, nurturing, and deeply satisfying. This earth is the harvest shared — the table set for more than just yourself.',
    reflectionQuestions: [
      'Where in your life are you in a position to give generously, and where do you need to receive without shame?',
      'Is the exchange of resources in your relationships balanced and mutual, or does it flow primarily in one direction?',
      'What would it mean to give from genuine abundance rather than from obligation or the need for approval?',
    ],
  },
  70: {
    numerology: '7 — Assessment, patience, and the long view of investment. Seven of Pentacles is the number of inner truth applied to material effort — the pause to evaluate whether your work is bearing the fruit you intended.',
    elementalAssociation: 'Earth and Saturn in Taurus make the Seven of Pentacles patient, evaluative, and deeply practical. This earth is the orchard in late summer — the fruit is forming, but it is not yet ripe.',
    reflectionQuestions: [
      'What long-term investment — of time, energy, or resources — are you currently tending, and is it growing as you hoped?',
      'Where do you need more patience with a process that cannot be rushed?',
      'What would it mean to evaluate your efforts honestly and adjust your approach if needed?',
    ],
  },
  71: {
    numerology: '8 — Mastery, dedication, and the satisfaction of skilled, focused work. Eight of Pentacles is the number of infinite cycles applied to craft — the apprentice who becomes the master through repetition and devotion.',
    elementalAssociation: 'Earth and Sun in Virgo make the Eight of Pentacles meticulous, devoted, and deeply satisfying. This earth is the workshop — every tool in its place, every movement purposeful, every piece of work a small act of devotion.',
    reflectionQuestions: [
      'What skill or craft are you developing through dedicated, patient practice?',
      'Where in your work are you being called to go deeper rather than broader?',
      'What would it mean to approach your daily work as a form of spiritual practice?',
    ],
  },
  72: {
    numerology: '9 — Abundance, self-sufficiency, and the pleasure of earned comfort. Nine of Pentacles is the number of completion applied to material life — the garden in full bloom, the life of graceful independence.',
    elementalAssociation: 'Earth and Venus in Virgo make the Nine of Pentacles refined, self-possessed, and deeply satisfying. This earth is the walled garden — cultivated, beautiful, and entirely the creation of its keeper.',
    reflectionQuestions: [
      'What have you built or achieved through your own effort that you can now enjoy with genuine pride?',
      'Where in your life are you being called to cultivate more independence, self-sufficiency, or personal refinement?',
      'What does a life of graceful abundance look like to you — and how close are you to living it?',
    ],
  },
  73: {
    numerology: '10 — Legacy, family wealth, and the fullness of material life across generations. Ten of Pentacles is the final number of the suit — the estate, the inheritance, the life well-built and passed on.',
    elementalAssociation: 'Earth and Mercury in Virgo make the Ten of Pentacles a legacy of careful, loving stewardship. This earth is the ancestral land — tended across generations, rich with history and the accumulated wisdom of those who came before.',
    reflectionQuestions: [
      'What legacy are you building — financially, creatively, or in terms of the values you pass on?',
      'How connected do you feel to your family lineage, and what gifts or wounds have been passed down to you?',
      'What would it mean to build something that outlasts you — and what would you want that to be?',
    ],
  },
  74: {
    numerology: '11 (Page) — Practical curiosity, ambition, and the first steps toward material mastery. The Page of Pentacles is earth discovering itself — studious, grounded, and hungry to learn how the physical world works.',
    elementalAssociation: 'Earth of Earth — the Page of Pentacles is the element at its most literal: solid, patient, and deeply interested in the tangible. This earth is the student in the field — learning by doing, by touching, by tending.',
    reflectionQuestions: [
      'What new practical skill, financial habit, or material goal are you beginning to explore?',
      'Where in your life could you benefit from a more grounded, methodical, step-by-step approach?',
      'What would it mean to treat your body, your finances, or your physical environment with more care and attention?',
    ],
  },
  75: {
    numerology: '12 (Knight) — Methodical progress, reliability, and the slow but certain advance toward goals. The Knight of Pentacles moves at the pace of the earth — unhurried, thorough, and utterly dependable.',
    elementalAssociation: 'Air of Earth — the Knight of Pentacles brings thoughtful planning to the element of material reality. This earth is the plowed field — prepared with care, ready for the seed, promising a harvest to those who are patient.',
    reflectionQuestions: [
      'Where in your life are you being called to slow down, be more methodical, and trust the process?',
      'Is your current pace sustainable — are you building something solid, or rushing past the foundations?',
      'What would it mean to be the most reliable, consistent version of yourself in a current commitment?',
    ],
  },
  76: {
    numerology: '13 (Queen) — Practical wisdom, nurturing abundance, and the mastery of the material world in service of love. The Queen of Pentacles has integrated earth\'s gifts and offers them as security, nourishment, and generous care.',
    elementalAssociation: 'Water of Earth — the Queen of Pentacles brings emotional warmth to the element of material reality. She is the garden in full bloom — productive, beautiful, and tended with both skill and love.',
    reflectionQuestions: [
      'Where in your life are you being called to create more security, comfort, or nourishment — for yourself or for others?',
      'How well do you care for your own physical and material needs, not just those of the people you love?',
      'What would it mean to be as generous with yourself as you are with others?',
    ],
  },
  77: {
    numerology: '14 (King) — Material mastery, financial authority, and the generous stewardship of abundance. The King of Pentacles has built his empire through discipline and integrity — he is the provider, the patriarch, the master of the material world.',
    elementalAssociation: 'Fire of Earth — the King of Pentacles brings visionary ambition to the element of material reality. His earth is the kingdom — vast, well-ordered, and built to last through the wisdom of one who has learned to work with the land rather than against it.',
    reflectionQuestions: [
      'What financial or material goal are you building toward, and does your current strategy reflect your deepest values?',
      'How do you use your material resources — to accumulate power, or to create security and opportunity for others?',
      'What would it mean to be truly wealthy — not just financially, but in every dimension of your life?',
    ],
  },
};

export function getDeeperMeaning(cardId: number): DeeperMeaning | undefined {
  return DEEPER_MEANINGS[cardId];
}

// Spread definitions
export interface SpreadPosition {
  id: string;
  label: string;
  description: string;
}

export interface SpreadDefinition {
  id: string;
  name: string;
  description: string;
  intention: string;
  positions: SpreadPosition[];
  icon: string;
}

export const SPREADS: SpreadDefinition[] = [
  {
    id: 'one-card',
    name: 'Daily Card',
    description: 'A single card for daily guidance and reflection',
    intention: 'What energy or wisdom do I need today?',
    icon: '✦',
    positions: [
      { id: 'present', label: 'Your Message', description: 'The energy, lesson, or guidance for today' },
    ],
  },
  {
    id: 'three-card',
    name: 'Past · Present · Future',
    description: 'A classic three-card spread for clarity and direction',
    intention: 'Show me the flow of energy through my situation',
    icon: '⟡',
    positions: [
      { id: 'past', label: 'Past', description: 'What has led you to this moment' },
      { id: 'present', label: 'Present', description: 'The energy surrounding you now' },
      { id: 'future', label: 'Future', description: 'Where this path is leading' },
    ],
  },
  {
    id: 'love',
    name: 'Love & Relationships',
    description: 'Illuminate the heart of your romantic connections',
    intention: 'What do I need to know about love in my life?',
    icon: '♡',
    positions: [
      { id: 'you', label: 'Your Energy', description: 'What you bring to love right now' },
      { id: 'partner', label: 'Their Energy', description: 'What the other person brings' },
      { id: 'connection', label: 'The Connection', description: 'The energy between you' },
      { id: 'challenge', label: 'The Challenge', description: 'What needs to be healed or addressed' },
      { id: 'guidance', label: 'Guidance', description: 'What love is asking of you' },
    ],
  },
  {
    id: 'career',
    name: 'Career & Purpose',
    description: 'Navigate your path with clarity and confidence',
    intention: 'What do I need to know about my career and life purpose?',
    icon: '◈',
    positions: [
      { id: 'current', label: 'Current State', description: 'Where you are in your career journey' },
      { id: 'strength', label: 'Your Strength', description: 'The gift you bring to your work' },
      { id: 'challenge', label: 'The Challenge', description: 'What is blocking your progress' },
      { id: 'action', label: 'Action to Take', description: 'The next step on your path' },
      { id: 'outcome', label: 'Potential Outcome', description: 'Where this path leads' },
    ],
  },
  {
    id: 'spiritual',
    name: 'Spiritual Guidance',
    description: 'Deepen your connection to your higher self and the divine',
    intention: 'What does my soul need to know right now?',
    icon: '☽',
    positions: [
      { id: 'soul', label: 'Soul\'s Message', description: 'What your higher self wants you to know' },
      { id: 'shadow', label: 'Shadow to Integrate', description: 'What is asking to be healed' },
      { id: 'gift', label: 'Spiritual Gift', description: 'The power available to you now' },
      { id: 'path', label: 'Your Path', description: 'The direction your soul is calling you toward' },
    ],
  },
];

// Get a random card (with optional reversal)
export function drawCard(excludeIds: number[] = []): { card: TarotCard; reversed: boolean } {
  const available = TAROT_CARDS.filter(c => !excludeIds.includes(c.id));
  const card = available[Math.floor(Math.random() * available.length)];
  const reversed = Math.random() < 0.3; // 30% chance of reversal
  return { card, reversed };
}

// Draw multiple unique cards for a spread
export function drawSpread(count: number): Array<{ card: TarotCard; reversed: boolean }> {
  const drawn: Array<{ card: TarotCard; reversed: boolean }> = [];
  const usedIds: number[] = [];
  for (let i = 0; i < count; i++) {
    const result = drawCard(usedIds);
    drawn.push(result);
    usedIds.push(result.card.id);
  }
  return drawn;
}

// Get suit color token
export function getSuitColor(suit?: string): string {
  switch (suit) {
    case 'wands': return 'hsl(var(--astro-mars))';
    case 'cups': return 'hsl(var(--astro-moon))';
    case 'swords': return 'hsl(var(--accent))';
    case 'pentacles': return 'hsl(var(--grimoire-herb))';
    default: return 'hsl(var(--primary))';
  }
}

export function getCardById(id: number): TarotCard | undefined {
  return TAROT_CARDS.find(c => c.id === id);
}
