/**
 * Seed script for the magical welcome quotes pool.
 *
 * Run once (or re-run safely — it skips duplicates via normalized_hash).
 * Usage: npx tsx src/server/db/seed-quotes.ts
 *
 * Themes: moonlight | stars | self | courage | transformation | wonder | beginnings | celestial
 * Accents: gold | lavender | silver
 */
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { getDatabaseCredentials } from './config.js';

// ─── Quote data ───────────────────────────────────────────────────────────────

type Accent = 'gold' | 'lavender' | 'silver';
interface RawQuote { text: string; theme: string; accent: Accent }

const QUOTES: RawQuote[] = [
  // ── moonlight ──────────────────────────────────────────────────────────────
  { text: 'Even the moon has phases. You are still luminous.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon kept a little light aside just for you.', theme: 'moonlight', accent: 'silver' },
  { text: 'Moonlight finds its way through every crack.', theme: 'moonlight', accent: 'silver' },
  { text: 'You are made of the same silver the moon is made of.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon rises without asking permission. So can you.', theme: 'moonlight', accent: 'silver' },
  { text: 'Every full moon is a reminder that wholeness returns.', theme: 'moonlight', accent: 'silver' },
  { text: 'The crescent moon is not broken. It is becoming.', theme: 'moonlight', accent: 'silver' },
  { text: 'Moonrise is proof that beauty returns on its own schedule.', theme: 'moonlight', accent: 'silver' },
  { text: 'You have survived every dark moon so far.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon does not apologize for its glow.', theme: 'moonlight', accent: 'silver' },
  { text: 'Tides answer the moon without question. Trust your pull.', theme: 'moonlight', accent: 'silver' },
  { text: 'A new moon is not an absence. It is a quiet beginning.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon waxes and wanes, and still the sea loves it.', theme: 'moonlight', accent: 'silver' },
  { text: 'Moonlight does not compete with the sun. It simply shines.', theme: 'moonlight', accent: 'silver' },
  { text: 'You are the moon in someone\'s darkest night.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon has watched over you every single night.', theme: 'moonlight', accent: 'silver' },
  { text: 'Even a sliver of moon is enough to light a path.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon does not hurry. Neither must you.', theme: 'moonlight', accent: 'silver' },
  { text: 'Moonrise is a daily promise that light returns.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon holds the ocean. You hold more than you know.', theme: 'moonlight', accent: 'silver' },

  // ── stars ──────────────────────────────────────────────────────────────────
  { text: 'The universe kept a little wonder aside for you.', theme: 'stars', accent: 'gold' },
  { text: 'Stars do not ask if they are bright enough.', theme: 'stars', accent: 'gold' },
  { text: 'You are made of the same light that fills the sky.', theme: 'stars', accent: 'gold' },
  { text: 'A star shines whether or not anyone is watching.', theme: 'stars', accent: 'gold' },
  { text: 'The stars have been waiting for you to look up.', theme: 'stars', accent: 'gold' },
  { text: 'Every star you see is a message that light travels far.', theme: 'stars', accent: 'gold' },
  { text: 'You carry stardust in places you have not yet discovered.', theme: 'stars', accent: 'gold' },
  { text: 'The night sky is proof that darkness holds infinite light.', theme: 'stars', accent: 'gold' },
  { text: 'Stars burn quietly and still illuminate everything.', theme: 'stars', accent: 'gold' },
  { text: 'You are a fixed point in someone else\'s constellation.', theme: 'stars', accent: 'gold' },
  { text: 'The cosmos arranged itself to bring you here.', theme: 'stars', accent: 'gold' },
  { text: 'Even the faintest star leaves a trail in a long exposure.', theme: 'stars', accent: 'gold' },
  { text: 'The sky never runs out of stars. Neither do you run out of chances.', theme: 'stars', accent: 'gold' },
  { text: 'You are not lost. You are navigating by your own stars.', theme: 'stars', accent: 'gold' },
  { text: 'Starlight left its source long ago and still arrives perfectly.', theme: 'stars', accent: 'gold' },
  { text: 'The universe is still expanding. So are you.', theme: 'stars', accent: 'gold' },
  { text: 'A shooting star does not apologize for burning bright.', theme: 'stars', accent: 'gold' },
  { text: 'You were written into the stars before you had a name.', theme: 'stars', accent: 'gold' },
  { text: 'The sky holds every star gently. The world holds you.', theme: 'stars', accent: 'gold' },
  { text: 'Some stars are only visible when you stop looking for them.', theme: 'stars', accent: 'gold' },

  // ── self-worth ─────────────────────────────────────────────────────────────
  { text: 'Your magic was never lost. It was waiting to be remembered.', theme: 'self', accent: 'lavender' },
  { text: 'You are allowed to take up space in the universe.', theme: 'self', accent: 'lavender' },
  { text: 'Your worth is not a question the world gets to answer.', theme: 'self', accent: 'lavender' },
  { text: 'You do not need to earn the right to rest.', theme: 'self', accent: 'lavender' },
  { text: 'The version of you that shows up today is enough.', theme: 'self', accent: 'lavender' },
  { text: 'You are not behind. You are on your own sacred timeline.', theme: 'self', accent: 'lavender' },
  { text: 'Your softness is not weakness. It is a form of power.', theme: 'self', accent: 'lavender' },
  { text: 'You are allowed to be both a work in progress and a masterpiece.', theme: 'self', accent: 'lavender' },
  { text: 'The kindness you give others belongs to you too.', theme: 'self', accent: 'lavender' },
  { text: 'You are not too much. You are exactly enough.', theme: 'self', accent: 'lavender' },
  { text: 'Your presence is a gift that cannot be replicated.', theme: 'self', accent: 'lavender' },
  { text: 'You are allowed to change your mind as many times as you need.', theme: 'self', accent: 'lavender' },
  { text: 'Rest is not the opposite of progress. It is part of it.', theme: 'self', accent: 'lavender' },
  { text: 'You do not need to be fixed. You need to be witnessed.', theme: 'self', accent: 'lavender' },
  { text: 'Your story is still being written in the most beautiful ink.', theme: 'self', accent: 'lavender' },
  { text: 'You are allowed to outgrow what no longer fits.', theme: 'self', accent: 'lavender' },
  { text: 'The love you seek has always lived inside you first.', theme: 'self', accent: 'lavender' },
  { text: 'You are not defined by your hardest days.', theme: 'self', accent: 'lavender' },
  { text: 'Your intuition is a compass that never truly breaks.', theme: 'self', accent: 'lavender' },
  { text: 'You are worthy of the same grace you give to others.', theme: 'self', accent: 'lavender' },

  // ── courage ────────────────────────────────────────────────────────────────
  { text: 'Somewhere between dreaming and doing, magic begins.', theme: 'courage', accent: 'gold' },
  { text: 'The first step does not need to be perfect. It just needs to be taken.', theme: 'courage', accent: 'gold' },
  { text: 'Courage is not the absence of fear. It is the decision that something matters more.', theme: 'courage', accent: 'gold' },
  { text: 'You have already survived things that once seemed impossible.', theme: 'courage', accent: 'gold' },
  { text: 'The path forward is lit by the steps you have already taken.', theme: 'courage', accent: 'gold' },
  { text: 'You are braver than the story you tell yourself at night.', theme: 'courage', accent: 'gold' },
  { text: 'Every small act of courage compounds into something extraordinary.', theme: 'courage', accent: 'gold' },
  { text: 'The door you are afraid to open is usually the right one.', theme: 'courage', accent: 'gold' },
  { text: 'You have faced the dark before and found your way through.', theme: 'courage', accent: 'gold' },
  { text: 'Showing up, even imperfectly, is its own kind of magic.', theme: 'courage', accent: 'gold' },
  { text: 'The bravest thing you can do is begin again.', theme: 'courage', accent: 'gold' },
  { text: 'You do not need certainty to take the next step.', theme: 'courage', accent: 'gold' },
  { text: 'Your fear and your courage can coexist. Let both be present.', theme: 'courage', accent: 'gold' },
  { text: 'The universe rewards the ones who dare to try.', theme: 'courage', accent: 'gold' },
  { text: 'You are not starting over. You are starting wiser.', theme: 'courage', accent: 'gold' },
  { text: 'Every act of courage leaves a mark on the world.', theme: 'courage', accent: 'gold' },
  { text: 'You have more resilience than you have ever been given credit for.', theme: 'courage', accent: 'gold' },
  { text: 'The hardest part is usually the moment just before you begin.', theme: 'courage', accent: 'gold' },
  { text: 'You are allowed to be afraid and still move forward.', theme: 'courage', accent: 'gold' },
  { text: 'Magic favors the ones who show up.', theme: 'courage', accent: 'gold' },

  // ── transformation ─────────────────────────────────────────────────────────
  { text: 'Every ending is a spell cast for a new beginning.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are not the same person who walked in yesterday.', theme: 'transformation', accent: 'lavender' },
  { text: 'Growth is not always visible. Sometimes it is happening underground.', theme: 'transformation', accent: 'lavender' },
  { text: 'The caterpillar does not know it is becoming something magnificent.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are allowed to shed what no longer serves you.', theme: 'transformation', accent: 'lavender' },
  { text: 'Change is not loss. It is the universe making room for more.', theme: 'transformation', accent: 'lavender' },
  { text: 'The version of you that is coming is worth the wait.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are in the middle of a transformation you cannot yet see.', theme: 'transformation', accent: 'lavender' },
  { text: 'Every shedding is a sacred act of becoming.', theme: 'transformation', accent: 'lavender' },
  { text: 'The old self does not die. It becomes the foundation.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are not falling apart. You are rearranging into something truer.', theme: 'transformation', accent: 'lavender' },
  { text: 'Seasons change without apology. So can you.', theme: 'transformation', accent: 'lavender' },
  { text: 'The chrysalis is not a prison. It is a sacred pause.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are allowed to become someone your past self would not recognize.', theme: 'transformation', accent: 'lavender' },
  { text: 'Every storm you have weathered has shaped your roots deeper.', theme: 'transformation', accent: 'lavender' },
  { text: 'The fire that refines you is not the same as the fire that destroys.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are not broken. You are mid-transformation.', theme: 'transformation', accent: 'lavender' },
  { text: 'What feels like an ending is often a threshold.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are the alchemist turning your own lead into gold.', theme: 'transformation', accent: 'gold' },
  { text: 'The most beautiful things grow slowly and in the dark.', theme: 'transformation', accent: 'lavender' },

  // ── wonder ─────────────────────────────────────────────────────────────────
  { text: 'A little magic has been waiting for you.', theme: 'wonder', accent: 'gold' },
  { text: 'The world is stranger and more beautiful than it appears.', theme: 'wonder', accent: 'gold' },
  { text: 'Magic is not rare. It is simply easy to overlook.', theme: 'wonder', accent: 'gold' },
  { text: 'There is wonder in the ordinary if you know where to look.', theme: 'wonder', accent: 'gold' },
  { text: 'The universe is full of doors you have not yet found.', theme: 'wonder', accent: 'gold' },
  { text: 'Curiosity is its own kind of spell.', theme: 'wonder', accent: 'gold' },
  { text: 'Something extraordinary is always just around the corner.', theme: 'wonder', accent: 'gold' },
  { text: 'The world is still full of things that cannot be explained.', theme: 'wonder', accent: 'gold' },
  { text: 'You have not yet seen all the beauty that is coming for you.', theme: 'wonder', accent: 'gold' },
  { text: 'Magic is the art of noticing what others walk past.', theme: 'wonder', accent: 'gold' },
  { text: 'Every day holds at least one moment worth marveling at.', theme: 'wonder', accent: 'gold' },
  { text: 'The universe is always leaving you small gifts to find.', theme: 'wonder', accent: 'gold' },
  { text: 'Wonder is not childish. It is the most honest response to existence.', theme: 'wonder', accent: 'gold' },
  { text: 'There are still things in this world that will take your breath away.', theme: 'wonder', accent: 'gold' },
  { text: 'The mystery is not a problem to solve. It is a place to dwell.', theme: 'wonder', accent: 'lavender' },
  { text: 'You are surrounded by more magic than you currently believe.', theme: 'wonder', accent: 'gold' },
  { text: 'The ordinary world is hiding extraordinary things.', theme: 'wonder', accent: 'gold' },
  { text: 'Something beautiful is always in the process of arriving.', theme: 'wonder', accent: 'gold' },
  { text: 'The universe has not run out of surprises for you.', theme: 'wonder', accent: 'gold' },
  { text: 'Enchantment is a choice you can make at any moment.', theme: 'wonder', accent: 'lavender' },

  // ── new beginnings ─────────────────────────────────────────────────────────
  { text: 'Every morning is a blank page in the most important book.', theme: 'beginnings', accent: 'gold' },
  { text: 'Today holds possibilities that yesterday could not imagine.', theme: 'beginnings', accent: 'gold' },
  { text: 'You are allowed to begin again as many times as you need.', theme: 'beginnings', accent: 'gold' },
  { text: 'A fresh start is available to you at any moment you choose it.', theme: 'beginnings', accent: 'gold' },
  { text: 'The seed does not mourn the soil. It simply begins.', theme: 'beginnings', accent: 'gold' },
  { text: 'Every dawn is the universe offering you another chance.', theme: 'beginnings', accent: 'gold' },
  { text: 'You are not too late. You are right on time.', theme: 'beginnings', accent: 'gold' },
  { text: 'The best chapter of your story has not been written yet.', theme: 'beginnings', accent: 'gold' },
  { text: 'New beginnings do not require a perfect moment. Just a willing heart.', theme: 'beginnings', accent: 'gold' },
  { text: 'Something is always beginning, even when something else is ending.', theme: 'beginnings', accent: 'gold' },
  { text: 'The universe is always preparing something new for you.', theme: 'beginnings', accent: 'gold' },
  { text: 'You have permission to start exactly where you are.', theme: 'beginnings', accent: 'gold' },
  { text: 'Every breath is a small beginning. Every day, a larger one.', theme: 'beginnings', accent: 'silver' },
  { text: 'The door to a new chapter is always unlocked from the inside.', theme: 'beginnings', accent: 'gold' },
  { text: 'You are standing at the threshold of something you cannot yet see.', theme: 'beginnings', accent: 'lavender' },
  { text: 'The universe is always in the middle of beginning something.', theme: 'beginnings', accent: 'gold' },
  { text: 'Today is the earliest you can start anything that matters.', theme: 'beginnings', accent: 'gold' },
  { text: 'A new beginning is not a reward. It is always available.', theme: 'beginnings', accent: 'gold' },
  { text: 'You are not starting over. You are starting forward.', theme: 'beginnings', accent: 'gold' },
  { text: 'The next beautiful thing in your life is already on its way.', theme: 'beginnings', accent: 'gold' },

  // ── celestial ──────────────────────────────────────────────────────────────
  { text: 'The planets have been moving in your favor longer than you know.', theme: 'celestial', accent: 'lavender' },
  { text: 'Your chart is a map, not a sentence.', theme: 'celestial', accent: 'lavender' },
  { text: 'The cosmos does not make mistakes. Neither does your existence.', theme: 'celestial', accent: 'lavender' },
  { text: 'You were born under a sky that was arranged just for you.', theme: 'celestial', accent: 'lavender' },
  { text: 'The stars do not dictate. They illuminate.', theme: 'celestial', accent: 'silver' },
  { text: 'Your rising sign is not a mask. It is your first gift to the world.', theme: 'celestial', accent: 'lavender' },
  { text: 'The universe has been conspiring on your behalf since before you arrived.', theme: 'celestial', accent: 'lavender' },
  { text: 'Every transit is a conversation the sky is having with you.', theme: 'celestial', accent: 'lavender' },
  { text: 'You are not at the mercy of the stars. You are in dialogue with them.', theme: 'celestial', accent: 'lavender' },
  { text: 'The sky on the day you were born was a celebration.', theme: 'celestial', accent: 'gold' },
  { text: 'Your natal chart is a love letter from the cosmos.', theme: 'celestial', accent: 'lavender' },
  { text: 'The planets are not obstacles. They are teachers.', theme: 'celestial', accent: 'lavender' },
  { text: 'You carry the energy of every planet that was present at your birth.', theme: 'celestial', accent: 'lavender' },
  { text: 'The cosmos arranged itself to make room for you.', theme: 'celestial', accent: 'lavender' },
  { text: 'Your soul chose this sky for a reason.', theme: 'celestial', accent: 'lavender' },
  { text: 'The universe is not indifferent. It is paying close attention.', theme: 'celestial', accent: 'silver' },
  { text: 'Every retrograde is an invitation to go deeper, not backward.', theme: 'celestial', accent: 'lavender' },
  { text: 'The stars have been telling your story since before you could speak.', theme: 'celestial', accent: 'silver' },
  { text: 'You are a living expression of the cosmos exploring itself.', theme: 'celestial', accent: 'lavender' },
  { text: 'The universe has never stopped believing in you.', theme: 'celestial', accent: 'gold' },

  // ── general magic ──────────────────────────────────────────────────────────
  { text: 'Magic is not something you find. It is something you remember.', theme: 'general', accent: 'gold' },
  { text: 'The spell you need most is the one you cast on yourself.', theme: 'general', accent: 'gold' },
  { text: 'Your intentions are seeds. Plant them with care.', theme: 'general', accent: 'gold' },
  { text: 'Every ritual is a conversation with the deeper self.', theme: 'general', accent: 'lavender' },
  { text: 'The magic you seek is already inside the life you are living.', theme: 'general', accent: 'gold' },
  { text: 'You are the most powerful tool in your own practice.', theme: 'general', accent: 'gold' },
  { text: 'Every candle you light is a prayer the universe hears.', theme: 'general', accent: 'gold' },
  { text: 'The grimoire of your life is still being written.', theme: 'general', accent: 'lavender' },
  { text: 'Your practice does not need to be perfect to be powerful.', theme: 'general', accent: 'gold' },
  { text: 'The herbs, the stones, the stars — they are all listening.', theme: 'general', accent: 'lavender' },
  { text: 'Magic is the art of aligning your will with the world.', theme: 'general', accent: 'gold' },
  { text: 'Every small ritual adds up to a life of intention.', theme: 'general', accent: 'gold' },
  { text: 'The universe speaks in symbols. You are learning the language.', theme: 'general', accent: 'lavender' },
  { text: 'Your craft is a living thing. Let it grow with you.', theme: 'general', accent: 'gold' },
  { text: 'The most sacred space is the one you create inside yourself.', theme: 'general', accent: 'lavender' },
  { text: 'Magic does not require perfection. It requires presence.', theme: 'general', accent: 'gold' },
  { text: 'You are the witch, the wand, and the wish all at once.', theme: 'general', accent: 'gold' },
  { text: 'The universe responds to the energy you bring to it.', theme: 'general', accent: 'gold' },
  { text: 'Your intuition is the oldest magic you possess.', theme: 'general', accent: 'lavender' },
  { text: 'Every act of self-care is a spell for the future self.', theme: 'general', accent: 'lavender' },

  // ── hope & comfort ─────────────────────────────────────────────────────────
  { text: 'Something good is always quietly making its way to you.', theme: 'general', accent: 'gold' },
  { text: 'The universe has not forgotten about you.', theme: 'general', accent: 'gold' },
  { text: 'You are held by more than you can currently see.', theme: 'general', accent: 'lavender' },
  { text: 'Even on the hardest days, something small is going right.', theme: 'general', accent: 'silver' },
  { text: 'The light at the end is not a train. It is a sunrise.', theme: 'general', accent: 'gold' },
  { text: 'You are not alone in this. The universe walks with you.', theme: 'general', accent: 'lavender' },
  { text: 'Healing is not linear, but it is always happening.', theme: 'general', accent: 'lavender' },
  { text: 'You are allowed to feel everything and still keep going.', theme: 'general', accent: 'lavender' },
  { text: 'The tenderness you feel is proof that you are still open.', theme: 'general', accent: 'lavender' },
  { text: 'Something is always working in your favor, even in silence.', theme: 'general', accent: 'gold' },
  { text: 'You are more supported than you realize right now.', theme: 'general', accent: 'lavender' },
  { text: 'The universe is patient with you. You can be patient with yourself.', theme: 'general', accent: 'lavender' },
  { text: 'Even the darkest night holds the promise of dawn.', theme: 'general', accent: 'silver' },
  { text: 'You are not carrying this alone, even when it feels that way.', theme: 'general', accent: 'lavender' },
  { text: 'Something beautiful is always in the process of arriving.', theme: 'general', accent: 'gold' },
  { text: 'The universe has a way of delivering exactly what is needed.', theme: 'general', accent: 'gold' },
  { text: 'You are allowed to rest in the knowing that things will shift.', theme: 'general', accent: 'lavender' },
  { text: 'Hope is not naive. It is the most radical act available.', theme: 'general', accent: 'gold' },
  { text: 'The world is still capable of surprising you with goodness.', theme: 'general', accent: 'gold' },
  { text: 'You are exactly where you need to be, even if it does not feel like it.', theme: 'general', accent: 'lavender' },

  // ── presence & stillness ───────────────────────────────────────────────────
  { text: 'The present moment is the only place magic can happen.', theme: 'general', accent: 'silver' },
  { text: 'Stillness is not emptiness. It is where everything begins.', theme: 'general', accent: 'silver' },
  { text: 'You do not need to rush. The universe is not in a hurry with you.', theme: 'general', accent: 'silver' },
  { text: 'The most powerful thing you can do right now is breathe.', theme: 'general', accent: 'silver' },
  { text: 'Presence is its own kind of magic.', theme: 'general', accent: 'silver' },
  { text: 'The quiet moments are where the deepest knowing lives.', theme: 'general', accent: 'silver' },
  { text: 'You do not need to fill every silence. Some are sacred.', theme: 'general', accent: 'silver' },
  { text: 'The pause between breaths is where the universe speaks.', theme: 'general', accent: 'silver' },
  { text: 'Slowing down is not falling behind. It is going deeper.', theme: 'general', accent: 'silver' },
  { text: 'You are allowed to simply be, without becoming anything today.', theme: 'general', accent: 'silver' },

  // ── extra moonlight ────────────────────────────────────────────────────────
  { text: 'The moon has never once forgotten to rise for you.', theme: 'moonlight', accent: 'silver' },
  { text: 'You are as constant as the moon, even in your phases.', theme: 'moonlight', accent: 'silver' },
  { text: 'The dark of the moon is not an absence. It is a gathering.', theme: 'moonlight', accent: 'silver' },
  { text: 'Moonlight is just sunlight that took the long way around.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon pulls the tides without touching them. You have that power too.', theme: 'moonlight', accent: 'silver' },
  { text: 'Every phase of the moon is a different kind of beautiful.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon does not need to be full to be worthy of the sky.', theme: 'moonlight', accent: 'silver' },
  { text: 'You are the moon: always present, always changing, always enough.', theme: 'moonlight', accent: 'silver' },
  { text: 'The moon rises in darkness and still manages to illuminate everything.', theme: 'moonlight', accent: 'silver' },
  { text: 'A waning moon is not diminishing. It is releasing.', theme: 'moonlight', accent: 'silver' },

  // ── extra stars ────────────────────────────────────────────────────────────
  { text: 'The light from distant stars still reaches us. So does your kindness.', theme: 'stars', accent: 'gold' },
  { text: 'You are a rare configuration of elements that will never exist again.', theme: 'stars', accent: 'gold' },
  { text: 'The stars are not competing with each other. Neither should you.', theme: 'stars', accent: 'gold' },
  { text: 'Every star in the sky is a story the universe is still telling.', theme: 'stars', accent: 'gold' },
  { text: 'You are the kind of light that makes other things visible.', theme: 'stars', accent: 'gold' },
  { text: 'The universe is 13.8 billion years old and it still made time for you.', theme: 'stars', accent: 'gold' },
  { text: 'Some of the most important stars are the ones you cannot see yet.', theme: 'stars', accent: 'gold' },
  { text: 'You are a star in someone\'s navigation.', theme: 'stars', accent: 'gold' },
  { text: 'The sky does not run out of room for new stars. Neither does the world for you.', theme: 'stars', accent: 'gold' },
  { text: 'Starlight is patient. It travels for thousands of years just to reach you.', theme: 'stars', accent: 'gold' },

  // ── extra self ─────────────────────────────────────────────────────────────
  { text: 'You are not a burden. You are a whole universe asking to be known.', theme: 'self', accent: 'lavender' },
  { text: 'The parts of you that feel broken are often the most luminous.', theme: 'self', accent: 'lavender' },
  { text: 'You are allowed to be proud of how far you have come.', theme: 'self', accent: 'lavender' },
  { text: 'Your sensitivity is not a flaw. It is a form of perception.', theme: 'self', accent: 'lavender' },
  { text: 'You are not too intense. The world simply has not caught up yet.', theme: 'self', accent: 'lavender' },
  { text: 'The things that make you different are the things that make you irreplaceable.', theme: 'self', accent: 'lavender' },
  { text: 'You are allowed to love yourself on the days when it is hardest.', theme: 'self', accent: 'lavender' },
  { text: 'Your complexity is not a problem. It is your depth.', theme: 'self', accent: 'lavender' },
  { text: 'You are not too much for the right people.', theme: 'self', accent: 'lavender' },
  { text: 'The most important relationship you will ever have is the one with yourself.', theme: 'self', accent: 'lavender' },

  // ── extra transformation ───────────────────────────────────────────────────
  { text: 'You are not the same person you were a year ago. That is the point.', theme: 'transformation', accent: 'lavender' },
  { text: 'The discomfort you feel is often the shape of growth.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are in the process of becoming something you cannot yet name.', theme: 'transformation', accent: 'lavender' },
  { text: 'Every version of you has been necessary.', theme: 'transformation', accent: 'lavender' },
  { text: 'The ending you are grieving is making room for something new.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are not losing yourself. You are finding a truer version.', theme: 'transformation', accent: 'lavender' },
  { text: 'The cocoon is not comfortable. That is how you know it is working.', theme: 'transformation', accent: 'lavender' },
  { text: 'You are allowed to be unrecognizable to your past self.', theme: 'transformation', accent: 'lavender' },
  { text: 'Growth often looks like confusion before it looks like clarity.', theme: 'transformation', accent: 'lavender' },
  { text: 'The version of you that is coming has been worth every step.', theme: 'transformation', accent: 'lavender' },

  // ── extra celestial ────────────────────────────────────────────────────────
  { text: 'Your Venus placement is a map to what makes you feel alive.', theme: 'celestial', accent: 'lavender' },
  { text: 'The moon in your chart is the part of you that needs to be held.', theme: 'celestial', accent: 'silver' },
  { text: 'Your Saturn return is not a punishment. It is a graduation.', theme: 'celestial', accent: 'lavender' },
  { text: 'The nodes of your chart point toward your soul\'s direction.', theme: 'celestial', accent: 'lavender' },
  { text: 'Every eclipse is the universe asking you to pay attention.', theme: 'celestial', accent: 'silver' },
  { text: 'Your Jupiter placement is where the universe wants to expand you.', theme: 'celestial', accent: 'gold' },
  { text: 'The sky on your birthday is a gift that keeps giving.', theme: 'celestial', accent: 'gold' },
  { text: 'Your Mercury placement is the voice the universe gave you.', theme: 'celestial', accent: 'lavender' },
  { text: 'The cosmos does not rush its timing. Neither should you rush yours.', theme: 'celestial', accent: 'lavender' },
  { text: 'You were born at the exact right moment in cosmic history.', theme: 'celestial', accent: 'gold' },

  // ── extra wonder ───────────────────────────────────────────────────────────
  { text: 'The world is still full of things that have no explanation.', theme: 'wonder', accent: 'gold' },
  { text: 'You have not yet seen all the beauty that is coming for you.', theme: 'wonder', accent: 'gold' },
  { text: 'The most magical things often arrive without announcement.', theme: 'wonder', accent: 'gold' },
  { text: 'Something extraordinary is always just around the corner.', theme: 'wonder', accent: 'gold' },
  { text: 'The universe is still writing stories that will take your breath away.', theme: 'wonder', accent: 'gold' },
  { text: 'There is more magic in one ordinary day than most people notice.', theme: 'wonder', accent: 'gold' },
  { text: 'The world is stranger and more generous than it appears.', theme: 'wonder', accent: 'gold' },
  { text: 'You are living inside a mystery that is also a gift.', theme: 'wonder', accent: 'lavender' },
  { text: 'The unexplained is not a threat. It is an invitation.', theme: 'wonder', accent: 'lavender' },
  { text: 'Magic is the name we give to things that exceed our expectations.', theme: 'wonder', accent: 'gold' },

  // ── extra beginnings ───────────────────────────────────────────────────────
  { text: 'The next chapter is blank. That is the most exciting thing about it.', theme: 'beginnings', accent: 'gold' },
  { text: 'You are always one decision away from a completely different story.', theme: 'beginnings', accent: 'gold' },
  { text: 'Every sunrise is the universe giving you another draft.', theme: 'beginnings', accent: 'gold' },
  { text: 'The best time to begin was then. The second best time is now.', theme: 'beginnings', accent: 'gold' },
  { text: 'You are not too late for the life you want.', theme: 'beginnings', accent: 'gold' },
  { text: 'Every new moon is an invitation to plant something new.', theme: 'beginnings', accent: 'silver' },
  { text: 'The universe is always offering you a fresh start.', theme: 'beginnings', accent: 'gold' },
  { text: 'You have permission to want something different than what you have.', theme: 'beginnings', accent: 'gold' },
  { text: 'The life you are building is worth every uncertain step.', theme: 'beginnings', accent: 'gold' },
  { text: 'Something new is always possible. That is the most hopeful truth.', theme: 'beginnings', accent: 'gold' },

  // ── extra courage ──────────────────────────────────────────────────────────
  { text: 'You have already done the hardest thing. You kept going.', theme: 'courage', accent: 'gold' },
  { text: 'The version of you that tried is always worth celebrating.', theme: 'courage', accent: 'gold' },
  { text: 'You do not need to be fearless. You just need to be willing.', theme: 'courage', accent: 'gold' },
  { text: 'Every time you chose yourself, the universe took note.', theme: 'courage', accent: 'gold' },
  { text: 'The most courageous thing is often the quietest.', theme: 'courage', accent: 'silver' },
  { text: 'You have faced uncertainty before and found your footing.', theme: 'courage', accent: 'gold' },
  { text: 'The leap of faith is always shorter than it looks from the edge.', theme: 'courage', accent: 'gold' },
  { text: 'You are more capable than the story fear tells about you.', theme: 'courage', accent: 'gold' },
  { text: 'Every time you showed up, something shifted in your favor.', theme: 'courage', accent: 'gold' },
  { text: 'The universe respects the ones who try.', theme: 'courage', accent: 'gold' },

  // ── extra presence ─────────────────────────────────────────────────────────
  { text: 'You do not need to have it all figured out today.', theme: 'general', accent: 'silver' },
  { text: 'The only moment you ever truly have is this one.', theme: 'general', accent: 'silver' },
  { text: 'Breathing slowly is a form of magic available to you right now.', theme: 'general', accent: 'silver' },
  { text: 'You are allowed to simply exist without producing anything today.', theme: 'general', accent: 'silver' },
  { text: 'The present moment is the only place where magic is real.', theme: 'general', accent: 'silver' },
  { text: 'You are here. That is already something remarkable.', theme: 'general', accent: 'silver' },
  { text: 'The most powerful spell is the one you cast with your full attention.', theme: 'general', accent: 'silver' },
  { text: 'Presence is the rarest gift you can give yourself.', theme: 'general', accent: 'silver' },
  { text: 'The quiet is not empty. It is full of what matters.', theme: 'general', accent: 'silver' },
  { text: 'You are allowed to arrive slowly.', theme: 'general', accent: 'silver' },
  // ── additional moonlight ──────────────────────────────────────────────────
  { text: 'The moon does not rush its phases. Neither should you.', theme: 'moonlight', accent: 'silver' },
  { text: 'Even a sliver of moon holds the whole sky together.', theme: 'moonlight', accent: 'silver' },
  { text: 'Moonlight asks nothing of you. It simply arrives.', theme: 'moonlight', accent: 'silver' },
  { text: 'The tide knows your name because the moon told it.', theme: 'moonlight', accent: 'silver' },
  { text: 'A waning moon is not disappearing. It is resting.', theme: 'moonlight', accent: 'silver' },
  // ── additional stars ────────────────────────────────────────────────────────
  { text: 'The stars have been holding your place all along.', theme: 'stars', accent: 'gold' },
  { text: 'Every star you see tonight has been waiting for you.', theme: 'stars', accent: 'gold' },
  { text: 'You are the constellation someone is still learning to read.', theme: 'stars', accent: 'gold' },
  { text: 'Stars do not compete. They simply shine.', theme: 'stars', accent: 'gold' },
  { text: 'The night sky is proof that darkness holds light.', theme: 'stars', accent: 'gold' },
  { text: 'Your light reaches farther than you know.', theme: 'stars', accent: 'gold' },
  { text: 'Some stars are only visible when you stop looking for them.', theme: 'stars', accent: 'gold' },
  // ── additional self ─────────────────────────────────────────────────────────
  { text: 'Your intuition has never once led you somewhere you could not survive.', theme: 'self', accent: 'lavender' },
  { text: 'The version of you that keeps returning is the truest one.', theme: 'self', accent: 'lavender' },
  { text: 'You do not have to earn your place here.', theme: 'self', accent: 'lavender' },
  { text: 'Softness is not weakness. It is how water carves stone.', theme: 'self', accent: 'lavender' },
  { text: 'You are not behind. You are exactly where your path leads.', theme: 'self', accent: 'lavender' },
  { text: 'The magic you seek has always lived inside you.', theme: 'self', accent: 'lavender' },
  { text: 'Rest is not retreat. It is how you gather your power.', theme: 'self', accent: 'lavender' },
  { text: 'Your presence changes the energy of every room you enter.', theme: 'self', accent: 'lavender' },
  // ── additional transformation ───────────────────────────────────────────────
  { text: 'Every ending you have survived has made you more whole.', theme: 'transformation', accent: 'gold' },
  { text: 'You have already transformed more times than you remember.', theme: 'transformation', accent: 'gold' },
  { text: 'The chrysalis does not know it is becoming. Neither do you, yet.', theme: 'transformation', accent: 'gold' },
  { text: 'Change does not erase you. It reveals you.', theme: 'transformation', accent: 'gold' },
  { text: 'You are not the same person who first found this place. That is the point.', theme: 'transformation', accent: 'gold' },
  // ── additional wonder ───────────────────────────────────────────────────────
  { text: 'There is still so much magic left to discover in ordinary moments.', theme: 'wonder', accent: 'lavender' },
  { text: 'The world is stranger and more beautiful than it appears.', theme: 'wonder', accent: 'lavender' },
  { text: 'Wonder is not childish. It is the oldest form of wisdom.', theme: 'wonder', accent: 'lavender' },
  { text: 'Something extraordinary is always quietly unfolding.', theme: 'wonder', accent: 'lavender' },
  { text: 'Pay attention. The universe is always leaving you clues.', theme: 'wonder', accent: 'lavender' },
  // ── additional courage ──────────────────────────────────────────────────────
  { text: 'Courage is not the absence of fear. It is returning anyway.', theme: 'courage', accent: 'gold' },
  { text: 'You have already done the hardest thing. You showed up.', theme: 'courage', accent: 'gold' },
  { text: 'The bravest thing you can do is trust yourself.', theme: 'courage', accent: 'gold' },
  { text: 'Your willingness to begin again is its own kind of magic.', theme: 'courage', accent: 'gold' },
  { text: 'Every time you return here, you are choosing yourself.', theme: 'courage', accent: 'gold' },
  // ── additional celestial ────────────────────────────────────────────────────
  { text: 'The cosmos arranged itself so you could exist. That is not nothing.', theme: 'celestial', accent: 'silver' },
  { text: 'You are made of stardust that chose to become curious.', theme: 'celestial', accent: 'silver' },
  { text: 'The universe has been expanding toward this moment.', theme: 'celestial', accent: 'silver' },
  { text: 'Somewhere in the cosmos, your name is written in light.', theme: 'celestial', accent: 'silver' },
  { text: 'The planets have been in motion your entire life, carrying you here.', theme: 'celestial', accent: 'silver' },
  // ── additional beginnings ───────────────────────────────────────────────────
  { text: 'Every time you open this door, something new becomes possible.', theme: 'beginnings', accent: 'lavender' },
  { text: 'A new beginning does not require a new you. Just a willing one.', theme: 'beginnings', accent: 'lavender' },
  { text: 'The first step is always the most magical.', theme: 'beginnings', accent: 'lavender' },
  { text: 'You are always at the beginning of something you cannot yet name.', theme: 'beginnings', accent: 'lavender' },
  // ── additional general ──────────────────────────────────────────────────────
  { text: 'This is your sanctuary. Everything here belongs to you.', theme: 'general', accent: 'gold' },
  { text: 'You remembered to come back. That matters more than you know.', theme: 'general', accent: 'gold' },
  { text: 'There is no wrong way to practice magic. Only your way.', theme: 'general', accent: 'lavender' },
  { text: 'The work you do here ripples outward in ways you cannot see.', theme: 'general', accent: 'silver' },
  { text: 'You are exactly the kind of person this place was made for.', theme: 'general', accent: 'gold' },
  { text: 'Magic is not something you do. It is something you remember.', theme: 'general', accent: 'lavender' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeHash(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cfg = getDatabaseCredentials();
  const conn = await mysql.createConnection({
    host: cfg.host,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    port: cfg.port,
    ssl: { rejectUnauthorized: false },
  });

  let inserted = 0;
  let skipped = 0;

  for (const q of QUOTES) {
    const hash = normalizeHash(q.text);
    try {
      await conn.execute(
        'INSERT INTO quotes (text, normalized_hash, theme, accent) VALUES (?, ?, ?, ?)',
        [q.text, hash, q.theme, q.accent],
      );
      inserted++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('Duplicate entry')) {
        skipped++;
      } else {
        console.error('Insert error:', msg, '|', q.text.slice(0, 40));
      }
    }
  }

  await conn.end();
  console.log(`Seed complete — inserted: ${inserted}, skipped (duplicate): ${skipped}, total: ${QUOTES.length}`);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
