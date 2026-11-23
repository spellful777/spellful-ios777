/**
 * Daily horoscope content engine.
 * Generates a deterministic Co-Star-style reading for a given Sun sign and date.
 * No external API — seeded by sign + date so the same user always gets the same
 * reading for a given day, and it changes at midnight.
 */

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type ZodiacSign = typeof SIGN_NAMES[number];

// ── Seeded RNG ────────────────────────────────────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateSeed(dateStr: string, sign: string): number {
  let hash = 0;
  const str = dateStr + sign;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Headlines ─────────────────────────────────────────────────────────────────
const HEADLINES: Record<ZodiacSign, string[]> = {
  Aries: [
    'Let the fire breathe.',
    'Not every battle is yours.',
    'Move first. Think second.',
    'Your urgency is a gift. Use it wisely.',
    'The door is open. Walk through it.',
    'Stop waiting for permission.',
    'Anger is information. Read it.',
    'You are faster than you think.',
    'The spark is already lit.',
    'Courage is not the absence of fear.',
    'Your instincts are sharper than you know.',
    'Rest is not retreat.',
    'The boldest move is the honest one.',
    'You do not need an invitation.',
    'Channel the fire, do not extinguish it.',
    'What you start today matters.',
  ],
  Taurus: [
    'Slow is not the same as stuck.',
    'What you build today will last.',
    'Comfort is not a crime.',
    'Your body knows something your mind does not.',
    'Hold your ground.',
    'Beauty is a form of intelligence.',
    'The long way is sometimes the only way.',
    'Let yourself be nourished.',
    'Patience is a form of power.',
    'The roots go deeper than you think.',
    'Stability is something you create.',
    'Your senses are telling you something true.',
    'Enough is a place you can choose to arrive at.',
    'Tend to what is growing.',
    'Pleasure is not a distraction.',
    'What endures is what matters.',
  ],
  Gemini: [
    'Two truths can coexist.',
    'Your mind is a gift. Stop apologizing for it.',
    'Say the thing you have been circling.',
    'Curiosity is your compass.',
    'Not every thought needs a voice.',
    'The conversation you are avoiding is the one you need.',
    'Change your mind. It is allowed.',
    'Words have weight today.',
    'The connection you are looking for is closer than you think.',
    'Wit without depth is just noise.',
    'Listen as well as you speak.',
    'The question is more interesting than the answer.',
    'Your adaptability is a superpower.',
    'Not every door needs to be opened today.',
    'The idea is ready. Share it.',
    'Contradiction is not confusion — it is complexity.',
  ],
  Cancer: [
    'Your softness is not weakness.',
    'Home is where you decide it is.',
    'Let yourself be held.',
    'The past is not a prison.',
    'Protect your energy like a sacred thing.',
    'Feeling everything is a superpower.',
    'You do not have to explain your needs.',
    'Tend to what is tender.',
    'Intuition is not anxiety.',
    'The shell is protection, not isolation.',
    'Nurturing others begins with nurturing yourself.',
    'Memory is a gift when it does not become a cage.',
    'Your empathy is not a burden.',
    'The tide turns. So will this.',
    'What you feel is real data.',
    'Safety is something you can build from the inside.',
  ],
  Leo: [
    'You do not need an audience to shine.',
    'Generosity begins with yourself.',
    'Let them see you.',
    'Your warmth changes rooms.',
    'Pride and arrogance are not the same thing.',
    'Create something today.',
    'The spotlight finds those who stop chasing it.',
    'Lead with your heart.',
    'Your joy is contagious. Let it be.',
    'Vulnerability is not weakness in a lion.',
    'The performance ends. The person remains.',
    'What you create outlasts the applause.',
    'Loyalty is your greatest currency.',
    'Radiance is not the same as noise.',
    'The heart that gives freely is the one that fills.',
    'You are the main character. Act like it.',
  ],
  Virgo: [
    'Good enough is sometimes perfect.',
    'Your attention to detail is a form of love.',
    'Rest is productive.',
    'The body is asking for something.',
    'Criticism and care are not the same.',
    'Let the imperfect thing exist.',
    'Service is sacred. So are your limits.',
    'Notice what is working.',
    'Precision is a gift. Perfectionism is a trap.',
    'The small things you do add up to something large.',
    'Healing begins with honest observation.',
    'Your discernment is a form of wisdom.',
    'Order is a tool, not a destination.',
    'What you tend to grows.',
    'Analysis without action is just worry.',
    'You are allowed to be a work in progress.',
  ],
  Libra: [
    'You cannot hold every side.',
    'Beauty is a form of truth.',
    'The decision you are avoiding is already made.',
    'Peace is not the same as silence.',
    'Your fairness is a gift. Do not weaponize it against yourself.',
    'Choose yourself first today.',
    'Harmony begins inside.',
    'Say what you mean with grace.',
    'Justice and kindness are not opposites.',
    'The scales tip when you stop tending them.',
    'Indecision is also a choice.',
    'Your aesthetic sense is a form of intelligence.',
    'Compromise is not the same as surrender.',
    'Diplomacy without honesty is just delay.',
    'The relationship worth keeping can hold your truth.',
    'Balance is dynamic, not static.',
  ],
  Scorpio: [
    'What you are afraid of is what you need.',
    'Depth is not darkness.',
    'Let something die so something else can live.',
    'You already know the answer.',
    'Power used with intention transforms.',
    'Trust is built in the dark.',
    'The truth will not break you.',
    'Go all the way in.',
    'Transformation is not comfortable. It is necessary.',
    'What you hide from others, do not hide from yourself.',
    'Intensity is not a flaw.',
    'The wound and the gift are the same thing.',
    'Letting go is not losing.',
    'Your perception cuts through what others miss.',
    'Rebirth requires the ending.',
    'Still water runs deep.',
  ],
  Sagittarius: [
    'The horizon is not a destination.',
    'Your optimism is a form of courage.',
    'Not every question needs an answer today.',
    'Freedom is a practice, not a place.',
    'Say yes to the thing that scares you.',
    'Philosophy without action is just noise.',
    'Wander with purpose.',
    'Your belief shapes your reality.',
    'The truth you seek is already moving toward you.',
    'Adventure is a state of mind.',
    'Commitment and freedom are not opposites.',
    'Your enthusiasm is a gift to every room you enter.',
    'The arrow flies farthest when aimed.',
    'Wisdom is experience that has been reflected on.',
    'Not every bridge needs to be burned.',
    'The journey is the point.',
  ],
  Capricorn: [
    'Ambition without rest is just exhaustion.',
    'The mountain will still be there tomorrow.',
    'What you have built is enough.',
    'Discipline is a form of self-respect.',
    'Let someone else carry it for a moment.',
    'Legacy is made of small, consistent acts.',
    'You are allowed to want more.',
    'The long game is the only game.',
    'Mastery is built one day at a time.',
    'The summit is not the only view worth having.',
    'Structure is not a cage — it is a foundation.',
    'Your reliability is a form of love.',
    'Rest is part of the strategy.',
    'What you sacrifice for should be worth the cost.',
    'Authority earned is authority that lasts.',
    'The work speaks for itself.',
  ],
  Aquarius: [
    'Your strangeness is your gift.',
    'The future needs your vision.',
    'Detachment is not the same as freedom.',
    'Connect before you correct.',
    'Revolution begins in the mind.',
    'You are not obligated to explain yourself.',
    'The collective needs your individual voice.',
    'Think the thought no one else will.',
    'Innovation without compassion misses the point.',
    'Your independence is a strength, not a wall.',
    'The outsider sees what the insider cannot.',
    'Progress is not always linear.',
    'Belonging and individuality are not opposites.',
    'The idea that changes things starts small.',
    'Humanity is the point of the vision.',
    'Question everything. Including your own assumptions.',
  ],
  Pisces: [
    'The dream is real.',
    'Your empathy is not a burden.',
    'Boundaries are a form of love.',
    'What you imagine, you can become.',
    'The veil is thin today.',
    'Let the feeling move through you.',
    'Surrender is not defeat.',
    'Magic lives in the in-between.',
    'Intuition is a form of knowing.',
    'The invisible is not the same as the unreal.',
    'Compassion without limits becomes dissolution.',
    'Your sensitivity is a form of perception.',
    'The ocean does not apologize for its depth.',
    'Art is how you translate what cannot be said.',
    'Healing is not linear.',
    'What you feel for others, feel also for yourself.',
  ],
};

// ── Body paragraphs ───────────────────────────────────────────────────────────
const BODIES: Record<ZodiacSign, string[]> = {
  Aries: [
    "Something in you is ready to move before the rest of you has caught up. That gap between impulse and action is not a flaw — it is where your best decisions live. Pause long enough to let intention catch up with instinct. Then go.",
    "The energy you are carrying today is not restlessness. It is readiness. The difference matters. Restlessness scatters. Readiness focuses. Point yourself at the one thing that actually needs your fire and let everything else wait.",
    "You have been patient longer than feels natural. That patience is about to pay off in a way you did not expect. Do not abandon the thing you have been tending just because it has not bloomed yet. It is closer than it looks.",
    "There is a conflict brewing — either inside you or between you and someone else. The temptation is to charge at it. The wiser move is to name what is actually at stake before you decide how to fight for it.",
    "The courage you are looking for is not somewhere ahead of you. It is already in you, waiting to be called on. You have done hard things before. This is just the next one. Begin.",
    "Something you dismissed as impossible is quietly becoming possible. You moved past it too fast. Go back. Look again. The door you thought was closed may only have been stuck.",
    "Your directness is one of your greatest gifts, and today it is exactly what someone needs from you. Do not soften it into something unrecognizable. Say the true thing. Kindly, but clearly.",
  ],
  Taurus: [
    "The pace you are moving at is not slow. It is deliberate. There is a difference, and today you are being asked to trust it. The thing you are building cannot be rushed without losing something essential. Stay with it.",
    "Your senses are sharper than usual today. Pay attention to what feels off — in your body, in a conversation, in a space you enter. You are picking up on something real. Do not dismiss it as anxiety.",
    "There is a version of security you have been chasing that lives outside you. Today asks you to look for it inside instead. What would it feel like to be enough, right now, exactly as things are? Start there.",
    "Something you have been holding onto is ready to be released. Not because it was wrong to hold it, but because you have gotten everything from it that it had to give. Letting go is not loss. It is completion.",
    "The comfort you have been seeking is not laziness — it is wisdom. You know what restores you. Today, give yourself permission to go there without guilt. Replenishment is not indulgence. It is maintenance.",
    "A decision you have been postponing is costing you more energy than making it would. The uncertainty is the heaviest part. Choose, even imperfectly, and let the relief of having chosen carry you forward.",
    "Something beautiful is available to you today if you slow down enough to notice it. Not a grand gesture — something small. A quality of light. A moment of stillness. The ordinary made sacred by your attention.",
  ],
  Gemini: [
    "Your mind has been running two parallel tracks and you have been pretending they do not contradict each other. Today is a good day to let them meet. The tension between them is not a problem to solve — it is a question worth sitting with.",
    "A conversation you have been avoiding is asking for your attention. Not because it will be easy, but because the version of you on the other side of it is someone you want to be. Say the thing. Carefully, but say it.",
    "Information is coming in from multiple directions today and not all of it is reliable. Your job is not to process all of it — it is to notice which pieces actually matter to you and let the rest pass through.",
    "You have been performing a version of yourself that is slightly off. Not dishonest, just — not quite right. Today offers a small window to drop the performance and just be the thing you actually are. Someone will notice. In a good way.",
    "The idea you have been turning over in your mind is ready to be shared. Not because it is finished — it never will be — but because the act of saying it out loud will show you what it still needs. Let it out.",
    "Your curiosity is pulling you in a direction that feels frivolous. Follow it anyway. The things that seem like distractions are sometimes the most direct route to where you actually need to go.",
    "You have been listening to everyone else's version of events. Today, notice what your own version is. Not the one you perform for others — the one you actually believe when no one is watching.",
  ],
  Cancer: [
    "The emotional weather today is complex. Something from the past is surfacing — not to haunt you, but to be seen. Give it a moment of your attention. Acknowledge it. Then let it settle back into the water it came from.",
    "You have been taking care of everyone around you with a generosity that is starting to cost you something. Today, the most important person to tend to is yourself. Not as a reward. As a necessity.",
    "A boundary you have been soft about needs to become firm. Not with anger — with clarity. The people who matter will respect it. The ones who do not were never really on your side.",
    "Something is asking to be felt all the way through rather than managed. Let it. You are not fragile. You are deep. There is a difference, and today you get to live in that difference.",
    "Something you have been carrying emotionally is heavier than it needs to be. Not because the feeling is wrong, but because you have been carrying it alone. Today, let someone in — not to fix it, but just to know it is there.",
    "You have been tending to everyone else's emotional landscape while your own has gone unwatered. Today, reverse that. What do you need? Not what would be nice — what do you actually need? Start there.",
    "The softness you offer others is one of your greatest gifts. Today, offer it to yourself. The same patience you extend to the people you love — you deserve that too. Give it without conditions.",
  ],
  Leo: [
    "The recognition you have been waiting for is not coming from the direction you expected. It is coming from inside — from the quiet knowledge that what you made was worth making, regardless of who noticed. Let that be enough today.",
    "Your generosity has been flowing outward for a long time. Today, turn some of it back toward yourself. Not selfishness — replenishment. You cannot keep giving from an empty place.",
    "There is something you have been afraid to want because wanting it felt too big, too exposed, too much. Today, let yourself want it anyway. The wanting is not the problem. The hiding is.",
    "Someone around you needs your warmth more than your advice. Show up as the sun today — not the teacher, not the leader, just the light. That is enough. That is everything.",
    "Something you created — or are in the process of creating — is better than you are giving it credit for. The inner critic has been louder than the inner artist lately. Today, let the artist speak.",
    "A relationship is asking for your full presence, not your performance. The version of you that shows up when you stop trying to impress is the one people actually fall in love with. Let them see that version.",
    "Your enthusiasm is one of the most contagious things about you. Today, let it be unguarded. Not performed, not managed — just real. The room will feel it. The right people will lean in.",
  ],
  Virgo: [
    "The standard you are holding yourself to today is not yours — it is borrowed from somewhere else, someone else, some earlier version of what you thought you were supposed to be. Put it down. What does your own standard actually look like?",
    "Your body is communicating something your mind has been too busy to hear. Slow down long enough to listen. It is not asking for much — just acknowledgment. Just a moment of being in it rather than managing it.",
    "The thing you keep almost finishing is asking to be completed. Not perfectly. Just done. The gap between almost and done is smaller than it feels, and crossing it will free up more energy than you expect.",
    "You have been analyzing a situation from every angle except the one that matters most: how do you actually feel about it? Not what makes sense. Not what is logical. What do you feel? Start there.",
    "A project or task you have been approaching with anxiety is actually something you are very capable of. The anxiety is not a signal that you cannot do it — it is a signal that it matters to you. Let it matter. Then do it anyway.",
    "You have been helping everyone else get organized while your own inner life has gotten cluttered. Today, tend to that. Not the to-do list — the inner landscape. What needs sorting? What needs releasing?",
    "Something small you do every day is more meaningful than you realize. The consistency, the care, the attention to detail — these are not small things. They are the architecture of a life well-tended. Notice that today.",
  ],
  Libra: [
    "You have been weighing a decision so carefully that the weighing itself has become the problem. At some point, choosing is the only way forward. You have enough information. Trust yourself to make the call.",
    "The harmony you have been maintaining has come at a cost you have not fully acknowledged. Something in you has been quiet for too long. Today, let it speak — even if only to yourself.",
    "Beauty is not frivolous. Your attention to it, your need for it, your ability to create it — these are not weaknesses. They are a form of intelligence. Let yourself be moved by something beautiful today.",
    "A relationship is asking for honesty rather than diplomacy. The kind thing and the true thing are not always the same. Today, choose the true thing. Kindly, but truly.",
    "You have been so focused on keeping the peace that you have lost track of what you actually want. Today, check in with yourself before you check in with anyone else. Your needs are not an afterthought.",
    "Something in a relationship has been left unsaid for too long. Not because there is no right time — but because you have been waiting for a perfect moment that is not coming. Say it imperfectly. Say it now.",
    "The fairness you extend to others is rarely extended to yourself. Today, apply the same generous interpretation to your own choices that you would give to someone you love. You deserve your own benefit of the doubt.",
  ],
  Scorpio: [
    "Something is ending. You can feel it. The temptation is to hold on, to control the terms of the ending, to make it mean something different. But some endings are just endings — and they make room for something that cannot arrive until they are complete.",
    "The intensity you are feeling is not a problem to be managed. It is information. What is it pointing at? What is it protecting? What does it want? Sit with those questions before you act on the feeling.",
    "Trust is being tested — either your trust in someone else or your trust in yourself. The answer is not to close off. It is to get clearer about what you actually need and whether this situation can provide it.",
    "You have been carrying a secret — from others, or from yourself. Today, the weight of it is more noticeable than usual. You do not have to reveal it. But you might consider what it would feel like to stop hiding it from yourself.",
    "Something beneath the surface is shifting. You may not be able to name it yet, and that is fine. The transformation does not require your understanding to proceed. It just requires your willingness to not interfere with it.",
    "The power you have been reluctant to claim is not dangerous. It is yours. The fear of it is not a warning — it is a habit. Today, take one small step toward owning what you are actually capable of.",
    "You have been protecting yourself from something that has already happened. The armor is still on, but the threat has passed. Today, notice where you are still braced for an impact that is not coming. You can relax now.",
  ],
  Sagittarius: [
    "The adventure you are craving is not a place. It is a perspective. You can find it without going anywhere — by approaching something familiar as if you have never seen it before. Today, try that.",
    "Your optimism is one of your greatest gifts, but today it might be serving as a shield. Something uncomfortable is asking to be looked at directly. Your belief that it will work out does not mean you get to skip the looking.",
    "A belief you have held for a long time is being quietly questioned. Not by someone else — by your own experience. Let the question exist. You do not have to answer it today. But do not dismiss it either.",
    "Freedom is not the absence of commitment. It is the presence of choice. Today, notice where you are choosing versus where you are just going along. The difference is everything.",
    "Something you have been treating as a detour is actually the main road. The path that felt like a distraction from your real life is your real life. Pay attention to it with the same seriousness you give to your plans.",
    "You have been generous with your enthusiasm and your ideas, but you have been holding back the part of yourself that is uncertain. Today, let someone see that part too. Vulnerability is not a contradiction of your fire — it is what makes it real.",
    "The truth you have been circling is simpler than the story you have built around it. Strip away the philosophy, the justification, the grand narrative. What is the plain, unadorned thing? Start there.",
  ],
  Capricorn: [
    "The goal is real. The timeline is not. Something you have been pushing toward on a schedule that no longer fits is asking for a recalibration. Adjusting the timeline is not failure. It is wisdom.",
    "You have been so focused on what you are building that you have forgotten to notice what you have already built. Today, look back. Not to rest on it — just to see it. It is more than you think.",
    "Someone needs your steadiness today. Not your advice, not your strategy — just your presence. The thing you do without thinking, the way you show up reliably, is a gift. Let it be enough.",
    "The discipline you apply to your work is not being applied to your rest. That imbalance is starting to show up in ways you can feel. Today, treat rest with the same seriousness you treat productivity.",
    "You have been measuring your worth by your output for so long that you have forgotten there is a version of you that exists outside of what you produce. Today, spend a little time with that version. It has been waiting.",
    "Something you have been treating as a weakness — your caution, your need for structure, your reluctance to move before you are ready — is actually one of your greatest strengths. The world needs people who build things that last.",
    "The ambition that drives you is real and worth honoring. But today, check whether it is serving you or whether you have started serving it. The goal is supposed to be in your hands, not the other way around.",
  ],
  Aquarius: [
    "The idea you have been sitting on is ready to be shared. Not because it is finished — it is not. But because the act of sharing it will show you what it still needs. Let it out into the world, imperfect and alive.",
    "You have been observing from a distance when what is needed is your actual presence. The detachment that protects you is also keeping you from something real. Today, step closer.",
    "A community or group you belong to is asking something of you that conflicts with your individual vision. This tension is not a problem to solve — it is a creative constraint. Work with it.",
    "The future you are imagining is more possible than it seems. The gap between now and then is not made of obstacles — it is made of small, consistent choices. Make one today.",
    "You have been so focused on the big picture that you have missed something important in the foreground. Today, zoom in. The detail you have been skipping over is the one that changes everything.",
    "The independence you prize is real and worth protecting. But today, notice if it has become a way of avoiding something rather than a way of being free. There is a difference between chosen solitude and defended isolation.",
    "Something unconventional you have been considering is more viable than the conventional wisdom suggests. The people who told you it could not be done were working from a smaller set of possibilities than you are. Trust your read.",
  ],
  Pisces: [
    "The boundary between you and someone else has gotten blurry. You have absorbed something that is not yours to carry. Today, gently return it. Not with judgment — just with clarity about where you end and they begin.",
    "Something you dismissed as a fantasy is asking to be taken seriously. Not every dream is escapism. Some of them are instructions. Which kind is this one?",
    "Your intuition is louder than usual today. It is not anxiety — it is information. The feeling you keep pushing aside is pointing at something real. Give it five minutes of your full attention.",
    "You have been giving your compassion freely and widely, which is beautiful. Today, notice if there is one person who needs it most — including, possibly, yourself.",
    "The creative work you have been putting off is not waiting for inspiration. It is waiting for you to show up without requiring inspiration first. Begin in the absence of the feeling. The feeling will follow.",
    "Something you have been trying to understand with your mind is actually something you already know in your body. Stop analyzing it. Stop explaining it. Just feel what you feel and let that be the answer for today.",
    "You have been so attuned to everyone else's emotional reality that you have lost track of your own. Today, spend some time in your own interior. Not to fix anything — just to remember what it feels like to be you, specifically, without anyone else in the room.",
  ],
};

// ── Do / Don't lists ──────────────────────────────────────────────────────────
type DoList = { do: string[]; dont: string[] };

const DO_DONTS: Record<ZodiacSign, DoList[]> = {
  Aries: [
    { do: ['Act on instinct', 'Start the thing', 'Say it plainly'], dont: ['Pick fights', 'Rush the ending', 'Burn bridges'] },
    { do: ['Lead from the front', 'Trust your body', 'Move fast'], dont: ['Bulldoze', 'Ignore feedback', 'Abandon ship'] },
    { do: ['Channel the fire', 'Protect your energy', 'Finish what you started'], dont: ['React before thinking', 'Take the bait', 'Overcommit'] },
    { do: ['Be direct', 'Take the first step', 'Own your choices'], dont: ['Blame others', 'Scatter your focus', 'Let pride win'] },
  ],
  Taurus: [
    { do: ['Hold your ground', 'Enjoy the moment', 'Finish what you started'], dont: ['Dig in out of stubbornness', 'Overspend', 'Ignore the signs'] },
    { do: ['Slow down', 'Nourish yourself', 'Stay the course'], dont: ['Hoard', 'Resist all change', 'Comfort-eat your feelings'] },
    { do: ['Trust your senses', 'Invest in quality', 'Rest without guilt'], dont: ['Cling to what is done', 'Mistake comfort for safety', 'Shut out new ideas'] },
    { do: ['Appreciate what you have', 'Move at your own pace', 'Tend to your body'], dont: ['Overindulge', 'Postpone the hard conversation', 'Confuse loyalty with obligation'] },
  ],
  Gemini: [
    { do: ['Ask the question', 'Change your mind', 'Connect the dots'], dont: ['Scatter your energy', 'Gossip', 'Commit to nothing'] },
    { do: ['Listen twice', 'Write it down', 'Follow the thread'], dont: ['Overthink', 'Talk over people', 'Avoid the hard conversation'] },
    { do: ['Stay curious', 'Make the connection', 'Say the true thing'], dont: ['Spread yourself too thin', 'Deflect with humor', 'Leave things half-done'] },
    { do: ['Explore the idea', 'Be present in the conversation', 'Trust your wit'], dont: ['Commit to nothing', 'Rationalize your feelings away', 'Perform instead of connect'] },
  ],
  Cancer: [
    { do: ['Feel it fully', 'Protect your space', 'Reach out'], dont: ['Retreat into your shell', 'Guilt-trip', 'Cling'] },
    { do: ['Nurture yourself', 'Trust your gut', 'Let someone in'], dont: ['Catastrophize', 'Martyr yourself', 'Hold grudges'] },
    { do: ['Set the boundary', 'Honor your intuition', 'Create safety for yourself'], dont: ['Absorb others emotions', 'Punish with silence', 'Sacrifice your needs'] },
    { do: ['Tend to your inner world', 'Ask for what you need', 'Be gentle with yourself'], dont: ['Withdraw without explanation', 'Mistake sensitivity for weakness', 'Replay old wounds'] },
  ],
  Leo: [
    { do: ['Shine without apology', 'Create something', 'Be generous'], dont: ['Seek validation', 'Dominate the room', 'Take it personally'] },
    { do: ['Lead with warmth', 'Celebrate others', 'Own your gifts'], dont: ['Perform', 'Sulk', 'Make it about you'] },
    { do: ['Express yourself fully', 'Lift someone up', 'Trust your instincts'], dont: ['Confuse attention with love', 'Dismiss criticism', 'Dim your light for others'] },
    { do: ['Be the warmth in the room', 'Create for the joy of it', 'Acknowledge your wins'], dont: ['Compete unnecessarily', 'Let pride block connection', 'Perform instead of feel'] },
  ],
  Virgo: [
    { do: ['Notice the details', 'Finish the task', 'Rest intentionally'], dont: ['Criticize yourself', 'Nitpick others', 'Postpone rest'] },
    { do: ['Tend to your body', 'Simplify', 'Ask for help'], dont: ['Overthink', 'Seek perfection', 'Dismiss your feelings'] },
    { do: ['Apply your discernment', 'Organize one thing', 'Be of service'], dont: ['Analyze instead of act', 'Hold yourself to impossible standards', 'Ignore your own needs'] },
    { do: ['Trust your process', 'Refine rather than restart', 'Acknowledge your effort'], dont: ['Catastrophize small errors', 'Withhold help to prove a point', 'Confuse busyness with productivity'] },
  ],
  Libra: [
    { do: ['Make the decision', 'Speak your truth', 'Choose beauty'], dont: ['People-please', 'Avoid conflict forever', 'Lose yourself in others'] },
    { do: ['Find the balance', 'Be fair to yourself', 'Create harmony'], dont: ['Sit on the fence', 'Suppress your needs', 'Keep the peace at all costs'] },
    { do: ['Choose yourself', 'Appreciate what is beautiful', 'Be honest with kindness'], dont: ['Defer endlessly', 'Sacrifice your needs for approval', 'Mistake harmony for agreement'] },
    { do: ['Commit to the choice', 'Invest in the relationship', 'Trust your aesthetic sense'], dont: ['Overthink every option', 'Smooth over what needs addressing', 'Lose your perspective in others'] },
  ],
  Scorpio: [
    { do: ['Go deep', 'Trust the process', 'Let it transform you'], dont: ['Control the outcome', 'Sting first', 'Obsess'] },
    { do: ['Investigate', 'Feel the intensity', 'Release what is done'], dont: ['Manipulate', 'Hold the grudge', 'Destroy what you love'] },
    { do: ['Face the truth', 'Channel the intensity', 'Let the old thing go'], dont: ['Use your power against yourself', 'Punish vulnerability', 'Confuse control with safety'] },
    { do: ['Trust your perception', 'Commit to the transformation', 'Protect your energy'], dont: ['Test people unnecessarily', 'Withhold to maintain power', 'Mistake suspicion for wisdom'] },
  ],
  Sagittarius: [
    { do: ['Explore', 'Speak your truth', 'Aim high'], dont: ['Overpromise', 'Run from commitment', 'Preach'] },
    { do: ['Stay curious', 'Take the leap', 'Laugh at yourself'], dont: ['Exaggerate', 'Abandon the plan', 'Philosophize instead of acting'] },
    { do: ['Follow the thread', 'Be honest about what you want', 'Expand your perspective'], dont: ['Escape instead of engage', 'Mistake restlessness for wisdom', 'Commit to nothing'] },
    { do: ['Say yes to the adventure', 'Share what you have learned', 'Trust your optimism'], dont: ['Overshoot and underdeliver', 'Dismiss the details', 'Run when things get real'] },
  ],
  Capricorn: [
    { do: ['Stay the course', 'Delegate', 'Rest on purpose'], dont: ['Overwork', 'Dismiss emotions', 'Sacrifice everything for the goal'] },
    { do: ['Build steadily', 'Acknowledge progress', 'Ask for support'], dont: ['Be ruthless', 'Ignore your body', 'Postpone joy'] },
    { do: ['Honor your commitments', 'Pace yourself', 'Celebrate what you have built'], dont: ['Confuse worth with productivity', 'Shut out softness', 'Delay rest until it is earned'] },
    { do: ['Set the boundary', 'Take the long view', 'Trust your discipline'], dont: ['Sacrifice your health for the goal', 'Dismiss what cannot be measured', 'Mistake seriousness for strength'] },
  ],
  Aquarius: [
    { do: ['Share the idea', 'Connect with your community', 'Think differently'], dont: ['Detach completely', 'Dismiss emotion', 'Rebel for its own sake'] },
    { do: ['Innovate', 'Show up fully', 'Question the norm'], dont: ['Alienate your allies', 'Live only in your head', 'Refuse all structure'] },
    { do: ['Bring your vision to the group', 'Stay curious about people', 'Challenge the assumption'], dont: ['Mistake aloofness for independence', 'Dismiss what you cannot quantify', 'Burn the bridge to prove a point'] },
    { do: ['Be present in the relationship', 'Let the idea evolve', 'Trust the collective'], dont: ['Prioritize the concept over the person', 'Detach when things get emotional', 'Confuse nonconformity with wisdom'] },
  ],
  Pisces: [
    { do: ['Trust your intuition', 'Create something', 'Let yourself dream'], dont: ['Dissolve into others', 'Escape instead of feel', 'Ignore your limits'] },
    { do: ['Feel it through', 'Set the boundary', 'Surrender to what is'], dont: ['Martyr yourself', 'Confuse fantasy with reality', 'Absorb everyone else'] },
    { do: ['Follow the creative impulse', 'Honor your sensitivity', 'Let yourself be helped'], dont: ['Lose yourself in someone else', 'Use imagination to avoid reality', 'Sacrifice your needs for peace'] },
    { do: ['Trust the invisible', 'Create from the feeling', 'Be gentle with yourself'], dont: ['Drift without direction', 'Confuse empathy with responsibility', 'Escape when presence is needed'] },
  ],
};

// ── Planet focus ──────────────────────────────────────────────────────────────
const PLANET_NOTES: Record<ZodiacSign, string[]> = {
  Aries: [
    'Mars is pushing you toward action. The question is whether the action is chosen or reactive.',
    'Your ruling planet wants movement. Give it direction.',
    'Mars energy is high today. Channel it into something that builds rather than burns.',
    'The warrior in you is awake. Choose your battles with intention.',
    'Mars asks: what are you fighting for? Make sure the answer is worth the energy.',
  ],
  Taurus: [
    'Venus is asking you to slow down and receive. Let yourself be nourished.',
    'Your ruling planet is drawing you toward beauty and stability. Honor that pull.',
    'Venus is highlighting what you value. Are you living in alignment with it?',
    'Your ruling planet wants you to enjoy what you have built. Take a moment to do that.',
    'Venus asks: what brings you genuine pleasure? Pursue it without apology.',
  ],
  Gemini: [
    'Mercury is sharp today. Use it for the conversation that matters, not the one that distracts.',
    'Your ruling planet wants connection. Make it meaningful.',
    'Mercury is moving fast. Keep up, but do not let speed replace depth.',
    'Your ruling planet is amplifying your communication. Choose your words with care.',
    'Mercury asks: what do you actually want to say? Say that.',
  ],
  Cancer: [
    'The Moon is your compass. Notice what it is illuminating in your emotional landscape today.',
    'Your ruling planet is heightening your sensitivity. That is a gift, not a liability.',
    'The Moon is shifting the emotional tide. Ride it rather than resist it.',
    'Your ruling planet is asking you to trust what you feel. It is information.',
    'The Moon asks: what needs tending? Start there.',
  ],
  Leo: [
    'The Sun is your source. Return to it when you feel depleted.',
    'Your ruling planet is asking you to lead — not perform. There is a difference.',
    'The Sun is illuminating something you have been avoiding. Look at it directly.',
    'Your ruling planet wants you to shine from the inside out, not the outside in.',
    'The Sun asks: what lights you up? Do more of that today.',
  ],
  Virgo: [
    'Mercury is in service mode. Use your analytical gifts to help, not to criticize.',
    'Your ruling planet wants precision. Apply it to what actually matters today.',
    'Mercury is asking you to organize your thoughts before you speak them.',
    'Your ruling planet is highlighting what needs refining. Trust the process.',
    'Mercury asks: what can be improved? Focus there, not everywhere.',
  ],
  Libra: [
    'Venus is drawing you toward connection and beauty. Let yourself be moved.',
    'Your ruling planet is asking for balance — not between others, but within yourself.',
    'Venus is highlighting your relationships. Which ones are nourishing you?',
    'Your ruling planet wants harmony. Begin by finding it inside yourself.',
    'Venus asks: what is beautiful in your life right now? Notice it.',
  ],
  Scorpio: [
    'Pluto is working beneath the surface. Something is transforming whether you acknowledge it or not.',
    'Your ruling planet is asking you to go deeper. You already know what that means.',
    'Pluto is clearing something out. Let it go without clinging to the form it had.',
    'Your ruling planet wants truth. Start with the truth you have been avoiding.',
    'Pluto asks: what needs to die so something better can live? Trust the answer.',
  ],
  Sagittarius: [
    'Jupiter is expanding something in your life. Make sure it is something you actually want more of.',
    'Your ruling planet is generous. Be intentional about where that generosity flows.',
    'Jupiter is opening a door. Walk through it with your eyes open.',
    'Your ruling planet wants growth. Make sure the growth is in a direction you have chosen.',
    'Jupiter asks: what are you ready to expand into? Say yes to that.',
  ],
  Capricorn: [
    'Saturn is watching. Not to judge — to witness. What are you building that you are proud of?',
    'Your ruling planet rewards consistency. Show up again today.',
    'Saturn is asking for accountability. Hold yourself to the standard you set.',
    'Your ruling planet wants structure. Build it with intention, not just habit.',
    'Saturn asks: what are you committed to? Recommit to it today.',
  ],
  Aquarius: [
    'Uranus is disrupting something. Trust that the disruption is clearing space for something better.',
    'Your ruling planet wants innovation. Give it a problem worth solving.',
    'Uranus is shaking something loose. What it reveals may surprise you.',
    'Your ruling planet is asking you to think differently about a familiar problem.',
    'Uranus asks: what needs to change? You already know. Begin.',
  ],
  Pisces: [
    'Neptune is heightening your intuition and your imagination. Both are real. Both matter.',
    'Your ruling planet is dissolving a boundary. Make sure it is one that needed dissolving.',
    'Neptune is blurring the line between what is and what could be. Stay grounded while you dream.',
    'Your ruling planet wants you to trust the invisible. It is not nothing.',
    'Neptune asks: what are you being called toward? Follow that thread.',
  ],
};

// ── Moon sign context lines ──────────────────────────────────────────────────
// Short personalized lines reflecting the emotional tone of each Moon sign.
const MOON_CONTEXTS: Record<ZodiacSign, string[]> = {
  Aries:       ['Your Moon in Aries brings an urgency to your feelings today. Act on what you feel, but give it one breath first.', 'Emotionally, you need movement. Find a way to channel that restless inner energy into something constructive.'],
  Taurus:      ['Your Moon in Taurus is asking for comfort and stability today. Honor that need — it is not weakness, it is wisdom.', 'Emotionally, you need to feel grounded. Slow down and let yourself settle before making any big decisions.'],
  Gemini:      ['Your Moon in Gemini means your feelings are moving fast today. Write them down before they shift again.', 'Emotionally, you need conversation. Find someone you trust and let the words do the work of sorting out what you feel.'],
  Cancer:      ['Your Moon in Cancer amplifies your sensitivity today. What you feel is real and worth honoring — just make sure it is yours.', 'Emotionally, you need safety. Create a small pocket of it for yourself before you engage with the demands of the day.'],
  Leo:         ['Your Moon in Leo wants to be seen today. Let yourself be witnessed — not performed, just genuinely seen.', 'Emotionally, you need warmth and appreciation. Give some of it to yourself if no one else is offering it right now.'],
  Virgo:       ['Your Moon in Virgo is processing today. Give yourself time to sort through what you feel before you act on it.', 'Emotionally, you need order. Tending to one small thing will help the larger emotional landscape feel more manageable.'],
  Libra:       ['Your Moon in Libra is seeking harmony today. Notice if you are suppressing your own feelings to keep the peace.', 'Emotionally, you need beauty and balance. Do one thing today that restores your sense of equilibrium.'],
  Scorpio:     ['Your Moon in Scorpio runs deep today. What you feel is more layered than it appears — give it room to surface fully.', 'Emotionally, you need honesty. The feeling you are avoiding is the one most worth sitting with.'],
  Sagittarius: ['Your Moon in Sagittarius needs space today. Do not let anyone crowd the feeling before it has room to breathe.', 'Emotionally, you need freedom and perspective. Step back from the immediate and look at the larger picture.'],
  Capricorn:   ['Your Moon in Capricorn is steady today. Use that steadiness to anchor yourself while you navigate whatever the day brings.', 'Emotionally, you need structure. A clear plan for the day will help your inner world feel more settled.'],
  Aquarius:    ['Your Moon in Aquarius is observing today. Notice what you feel without immediately needing to explain or categorize it.', 'Emotionally, you need space to be different. Do not force your feelings into a shape that makes sense to others.'],
  Pisces:      ['Your Moon in Pisces is porous today. Be gentle about what you absorb from the people and spaces around you.', 'Emotionally, you need quiet. Even ten minutes of stillness will help you distinguish your feelings from everyone around you.'],
};

// ── Rising sign context lines ─────────────────────────────────────────────────
// Short lines reflecting how the Rising sign shapes outward expression today.
const RISING_CONTEXTS: Record<ZodiacSign, string[]> = {
  Aries:       ['With Aries rising, you lead with energy today. Make sure what you project outward matches what you actually intend.', 'Your Aries ascendant gives you a direct, immediate presence. Use it to initiate something that has been waiting.'],
  Taurus:      ['With Taurus rising, you project calm and steadiness today. Let that groundedness be a gift to the people around you.', 'Your Taurus ascendant draws others toward your stability. Be the anchor today.'],
  Gemini:      ['With Gemini rising, you are quick and adaptable in how you show up today. Use that flexibility to navigate whatever the day brings.', 'Your Gemini ascendant makes you easy to talk to. Someone needs that from you today.'],
  Cancer:      ['With Cancer rising, you lead with warmth and intuition today. People will feel safe with you — make sure you feel safe with yourself too.', 'Your Cancer ascendant makes you perceptive about others. Trust what you pick up.'],
  Leo:         ['With Leo rising, you have a natural presence today. You do not have to try to be noticed — just be genuine and the room will feel it.', 'Your Leo ascendant gives you warmth and confidence. Lead with the heart, not the performance.'],
  Virgo:       ['With Virgo rising, you show up with precision and care today. Let your attention to detail be in service of something that matters.', 'Your Virgo ascendant makes you observant and helpful. Someone will benefit from your noticing today.'],
  Libra:       ['With Libra rising, you move through the world with grace today. Use that ease to smooth something that has been rough.', 'Your Libra ascendant makes you a natural diplomat. Find the place where your tact is most needed.'],
  Scorpio:     ['With Scorpio rising, you have an intensity today that others will feel before you speak. Use it with intention.', 'Your Scorpio ascendant gives you depth and magnetism. What you project is more powerful than you realize.'],
  Sagittarius: ['With Sagittarius rising, you bring optimism and openness to every room today. Let that be contagious.', 'Your Sagittarius ascendant makes you expansive and direct. Say the true thing with the warmth you naturally carry.'],
  Capricorn:   ['With Capricorn rising, you project authority and competence today. Let people lean on that — and let yourself lean on it too.', 'Your Capricorn ascendant gives you gravitas. Use it to build something, not just to manage something.'],
  Aquarius:    ['With Aquarius rising, you bring a fresh perspective to everything today. Someone needs to see things the way you see them.', 'Your Aquarius ascendant makes you original and independent. Do not dilute that to fit in.'],
  Pisces:      ['With Pisces rising, you move through the world with sensitivity and imagination today. Let that be a strength, not a vulnerability.', 'Your Pisces ascendant makes you attuned to the invisible. Trust what you sense even when you cannot explain it.'],
};

// ── Sun sign from birth date ──────────────────────────────────────────────────
export function sunSignFromDate(birthDate: string): ZodiacSign {
  const d = new Date(birthDate);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

// ── Main generator ────────────────────────────────────────────────────────────
export interface DailyHoroscope {
  sign: ZodiacSign;
  date: string;
  headline: string;
  body: string;
  planetNote: string;
  do: string[];
  dont: string[];
  /**
   * Per the Scientific Lunar & Celestial Accuracy Protocol:
   * This reading is astrological interpretation — a symbolic, traditional framework.
   * It is not a scientifically validated prediction of events or outcomes.
   */
  interpretationNote: string;
  /** Short personalized line for the user's Moon sign, if available */
  moonContext?: string;
  /** Short personalized line for the user's Rising sign, if available */
  risingContext?: string;
}

export function generateDailyHoroscope(
  sign: ZodiacSign,
  dateStr: string,
  moonSign?: string | null,
  risingSign?: string | null,
): DailyHoroscope {
  const seed = dateSeed(dateStr, sign);
  const rng = seededRng(seed);

  // eslint-disable-next-line security/detect-object-injection
  const headline = pick(HEADLINES[sign], rng);
  // eslint-disable-next-line security/detect-object-injection
  const body = pick(BODIES[sign], rng);
  // eslint-disable-next-line security/detect-object-injection
  const planetNote = pick(PLANET_NOTES[sign], rng);
  // eslint-disable-next-line security/detect-object-injection
  const doList = pick(DO_DONTS[sign], rng);

  // Personalized Moon and Rising context lines (only when the user has these stored)
  const moonCtx = moonSign && SIGN_NAMES.includes(moonSign as ZodiacSign)
    // eslint-disable-next-line security/detect-object-injection
    ? pick(MOON_CONTEXTS[moonSign as ZodiacSign], seededRng(dateSeed(dateStr, moonSign + '_moon')))
    : undefined;

  const risingCtx = risingSign && SIGN_NAMES.includes(risingSign as ZodiacSign)
    // eslint-disable-next-line security/detect-object-injection
    ? pick(RISING_CONTEXTS[risingSign as ZodiacSign], seededRng(dateSeed(dateStr, risingSign + '_rising')))
    : undefined;

  return {
    sign,
    date: dateStr,
    headline,
    body,
    planetNote,
    do: doList.do,
    dont: doList.dont,
    interpretationNote: 'Astrological interpretation — a symbolic, traditional framework, not a scientifically validated prediction.',
    moonContext: moonCtx,
    risingContext: risingCtx,
  };
}
