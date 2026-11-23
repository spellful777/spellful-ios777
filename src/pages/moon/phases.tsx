import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { moon_phases } from 'virtual:content';
import { ShareBar } from '@/components/ShareBar';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/moon/phases`;

const PHASES = [
  {
    emoji: '🌑',
    name: 'New Moon',
    elongation: '0°',
    illumination: '0%',
    meaning: 'The New Moon marks the beginning of the lunar cycle. The Moon is between Earth and the Sun, with its dark side facing us. This is a time of new beginnings, setting intentions, planting seeds of desire, and initiating new projects. The veil between worlds is thin — your intentions carry extra power.',
    rituals: ['Set intentions for the coming month', 'Begin new projects or relationships', 'Plant seeds (literal or metaphorical)', 'Write in your Grimoire', 'Cleanse your altar'],
    crystals: ['Black Tourmaline', 'Obsidian', 'Labradorite'],
    herbs: ['Mugwort', 'Rosemary', 'Bay Laurel'],
  },
  {
    emoji: '🌒',
    name: 'Waxing Crescent',
    elongation: '45°',
    illumination: '~25%',
    meaning: 'The Waxing Crescent is the first sliver of light after the New Moon. The Moon is growing — and so is your momentum. This is a time to take the first steps toward your intentions, gather resources, and build the foundation for what you wish to create.',
    rituals: ['Take inspired action on New Moon intentions', 'Research and gather information', 'Begin building new habits', 'Attract what you desire'],
    crystals: ['Citrine', 'Green Aventurine', 'Carnelian'],
    herbs: ['Basil', 'Mint', 'Chamomile'],
  },
  {
    emoji: '🌓',
    name: 'First Quarter',
    elongation: '90°',
    illumination: '50%',
    meaning: 'The First Quarter Moon is a moment of decision and action. The Moon is exactly half-illuminated, representing a crossroads. Challenges may arise — this is the universe testing your commitment. Push through obstacles with determination and adjust your course as needed.',
    rituals: ['Overcome obstacles and challenges', 'Make important decisions', 'Strengthen your resolve', 'Take bold action'],
    crystals: ["Tiger's Eye", 'Pyrite', 'Red Jasper'],
    herbs: ['Ginger', 'Cinnamon', 'Black Pepper'],
  },
  {
    emoji: '🌔',
    name: 'Waxing Gibbous',
    elongation: '135°',
    illumination: '~75%',
    meaning: 'The Waxing Gibbous Moon is a time of refinement and patience. You are close to your goal — now is the time to fine-tune, adjust, and prepare for the culmination at the Full Moon. Trust the process and continue nurturing what you have started.',
    rituals: ['Refine and adjust your plans', 'Practice gratitude for progress', 'Strengthen spells and intentions', 'Prepare for the Full Moon'],
    crystals: ['Moonstone', 'Selenite', 'Clear Quartz'],
    herbs: ['Lavender', 'Rose', 'Jasmine'],
  },
  {
    emoji: '🌕',
    name: 'Full Moon',
    elongation: '180°',
    illumination: '100%',
    meaning: 'The Full Moon is the peak of the lunar cycle — a time of maximum energy, illumination, and manifestation. What you set in motion at the New Moon reaches its fullest expression. This is the most powerful time for spellwork, divination, charging crystals, and celebrating your achievements.',
    rituals: ['Charge crystals and tools under moonlight', 'Perform powerful spellwork', 'Divination and tarot readings', 'Release what no longer serves', 'Celebrate achievements'],
    crystals: ['Moonstone', 'Selenite', 'Clear Quartz', 'Amethyst'],
    herbs: ['Mugwort', 'Yarrow', "St. John's Wort"],
  },
  {
    emoji: '🌖',
    name: 'Waning Gibbous',
    elongation: '225°',
    illumination: '~75%',
    meaning: 'The Waning Gibbous Moon is a time of gratitude and sharing. The peak has passed and the Moon begins to release its light. This is a time to share your wisdom, express gratitude for what you have received, and begin the process of letting go.',
    rituals: ['Express gratitude', 'Share knowledge and wisdom', 'Begin releasing what no longer serves', "Reflect on the Full Moon's revelations"],
    crystals: ['Amethyst', 'Lepidolite', 'Blue Lace Agate'],
    herbs: ['Sage', 'Thyme', 'Lemon Balm'],
  },
  {
    emoji: '🌗',
    name: 'Last Quarter',
    elongation: '270°',
    illumination: '50%',
    meaning: 'The Last Quarter Moon is a time of release and forgiveness. The Moon is again half-illuminated, but now waning. This is the moment to let go of what is no longer aligned with your highest good — old habits, toxic relationships, limiting beliefs, and anything that has run its course.',
    rituals: ['Release and banish what no longer serves', 'Forgiveness work', 'Break bad habits', 'Cleanse your space', 'Shadow work'],
    crystals: ['Black Tourmaline', 'Obsidian', 'Smoky Quartz'],
    herbs: ['Sage', 'Palo Santo', 'Frankincense'],
  },
  {
    emoji: '🌘',
    name: 'Waning Crescent',
    elongation: '315°',
    illumination: '~25%',
    meaning: 'The Waning Crescent is the final phase before the New Moon — a time of rest, surrender, and deep inner work. The cycle is completing. Honor the wisdom you have gained, rest and restore your energy, and prepare to begin again with the next New Moon.',
    rituals: ['Rest and restore', 'Deep meditation and inner work', 'Dream journaling', 'Prepare for the New Moon', 'Complete unfinished business'],
    crystals: ['Selenite', 'Lepidolite', 'Moonstone'],
    herbs: ['Valerian', 'Passionflower', 'Mugwort'],
  },
];

export default function MoonPhasesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    name: 'The Eight Moon Phases: Meanings, Rituals & Spiritual Significance',
    headline: 'Complete Guide to the Eight Moon Phases',
    url: pageUrl,
    isPartOf: { '@id': `${siteUrl}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Moon Phases', item: pageUrl },
      ],
    },
  };

  return (
    <>
      <Helmet>
        <title>The Eight Moon Phases: Meanings, Rituals & Spiritual Significance | Spellful</title>
        <meta name="description" content="Complete guide to all eight moon phases — New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Last Quarter, Waning Crescent. Meanings, rituals, crystals, and herbs for each phase." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="The Eight Moon Phases: Meanings & Rituals | Spellful" />
        <meta property="og:description" content="Complete guide to all eight moon phases with spiritual meanings, rituals, crystals, and herbs for each phase." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="The Eight Moon Phases — Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Eight Moon Phases: Meanings &amp; Rituals | Spellful" />
        <meta name="twitter:description" content="Complete guide to all eight moon phases with spiritual meanings, rituals, crystals, and herbs for each phase." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="The Eight Moon Phases — Spellful" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        {/* Hero */}
        <section className="relative pt-16 pb-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.12) 0%, transparent 65%)' }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center justify-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <li><Link to="/" style={{ color: 'hsl(var(--muted-foreground))' }}>Home</Link></li>
                <li>/</li>
                <li style={{ color: 'hsl(var(--foreground))' }}>Moon Phases</li>
              </ol>
            </nav>
            <motion.div className="flex justify-center gap-3 mb-6 text-3xl" aria-hidden="true">
              {PHASES.map((p, i) => (
                <motion.span key={p.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>{p.emoji}</motion.span>
              ))}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {moon_phases.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {moon_phases.hero.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4"
            >
              <Link
                to="/astronomical-accuracy"
                className="text-xs underline"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                How we calculate this →
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Phases */}
        <section className="py-16 px-6 md:px-10">
          <div className="max-w-4xl mx-auto space-y-12">
            {PHASES.map((phase, i) => (
              <motion.div
                key={phase.name}
                id={phase.name.toLowerCase().replace(/\s+/g, '-')}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <div className="p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-5xl flex-shrink-0" aria-hidden="true">{phase.emoji}</span>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        Phase {i + 1} of 8 · Elongation {phase.elongation} · Illumination {phase.illumination}
                      </div>
                      <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{phase.name}</h2>
                    </div>
                  </div>
                  <p className="leading-relaxed mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{phase.meaning}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>Rituals</div>
                      <ul className="text-xs space-y-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {phase.rituals.map((r) => <li key={r}>• {r}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>Crystals</div>
                      <ul className="text-xs space-y-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {phase.crystals.map((c) => <li key={c}>• {c}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--grimoire-herb, var(--secondary)))', fontFamily: 'var(--font-sans)' }}>Herbs</div>
                      <ul className="text-xs space-y-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {phase.herbs.map((h) => <li key={h}>• {h}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Share */}
        <section className="py-8 px-6 md:px-10 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-4xl mx-auto flex justify-center">
            <ShareBar
              text="🌙 The complete guide to all 8 moon phases — rituals, crystals, herbs & spiritual meaning. Free on Spellful."
              url={pageUrl}
              label="Share this guide"
            />
          </div>
        </section>

        {/* Links */}
        <section className="py-16 px-6 md:px-10 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center">
            <Link to="/moon-calendar" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
              Full Moon Calendar
            </Link>
            <Link to="/moon-ritual" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
              Moon Rituals
            </Link>
            <Link to="/astronomical-accuracy" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
              How We Calculate This
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
