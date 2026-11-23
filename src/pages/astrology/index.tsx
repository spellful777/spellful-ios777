import { useState } from 'react';
import GlossaryTerm from '@/components/GlossaryTerm';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { astrology_index } from 'virtual:content';
import { ZODIAC_SIGNS } from '@/lib/zodiac-data';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/astrology`;

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '--grimoire-ritual',
  Earth: '--grimoire-herb',
  Air: '--accent',
  Water: '--grimoire-dream',
};

const ELEMENTS = ['All', 'Fire', 'Earth', 'Air', 'Water'] as const;
type ElementFilter = typeof ELEMENTS[number];

const REFERENCE_CARDS = [
  { to: '/astrology/planets', symbol: '☉', label: 'The Planets', desc: 'Sun through Pluto — meanings, rulerships, and live sky positions', glossaryKey: undefined as string | undefined },
  { to: '/astrology/houses', symbol: '⌂', label: 'The 12 Houses', desc: 'Each sector of the birth chart and the life area it governs', glossaryKey: 'house_system' as string | undefined },
  { to: '/astrology/aspects', symbol: '☌', label: 'Aspects', desc: 'Conjunction, Trine, Square, and more — how planets interact', glossaryKey: 'aspect' },
  { to: '/astrology/live-sky', symbol: '✦', label: 'Live Sky Explorer', desc: 'Real-time sky dome — current planetary positions, constellations, and rise/set times for your location', glossaryKey: undefined },
  { to: '/astrology/cosmic-connections', symbol: '♡', label: 'Cosmic Connections', desc: 'Synastry aspects, compatibility scores, and a full relationship reading between two birth charts', glossaryKey: undefined },
  { to: '/astrology/celestial-time-machine', symbol: '⏳', label: 'Celestial Time Machine', desc: 'Travel to any date and time to explore the night sky, planetary positions, and astronomical events', glossaryKey: undefined },
];

export default function AstrologyIndexPage() {
  const [elementFilter, setElementFilter] = useState<ElementFilter>('All');
  const filteredSigns = elementFilter === 'All'
    ? ZODIAC_SIGNS
    : ZODIAC_SIGNS.filter((s) => s.element === elementFilter);

  return (
    <>
      <Helmet>
        <title>Astrology Guide: Zodiac Signs, Planets & Houses | Spellful</title>
        <meta name="description" content="Complete astrology guide covering all 12 zodiac signs, planetary meanings, astrological houses, and birth chart interpretation. Deepen your spiritual practice with celestial wisdom." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Astrology Guide: Zodiac Signs, Planets & Houses | Spellful" />
        <meta property="og:description" content="Complete astrology guide covering all 12 zodiac signs, planetary meanings, and astrological houses." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Astrology Guide: Zodiac Signs, Planets &amp; Houses | Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Astrology Guide: Zodiac Signs, Planets &amp; Houses | Spellful" />
        <meta name="twitter:description" content="Complete astrology guide covering all 12 zodiac signs, planetary meanings, and astrological houses." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Astrology Guide — Spellful" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${pageUrl}#webpage`,
          name: 'Astrology Guide',
          url: pageUrl,
          isPartOf: { '@id': `${siteUrl}/#website` },
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        {/* Hero */}
        <section className="relative pt-16 pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 65%)' }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              {astrology_index.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {astrology_index.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {astrology_index.hero.subtitle}
            </motion.p>
          </div>
        </section>

        {/* Reference nav cards */}
        <section className="py-8 px-6 md:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {REFERENCE_CARDS.map(({ to, symbol, label, desc, glossaryKey }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-start gap-4 p-5 rounded-2xl transition-transform hover:scale-[1.02]"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <span className="text-3xl flex-shrink-0" aria-hidden="true" style={{ color: 'hsl(var(--primary))' }}>{symbol}</span>
                  <div>
                    <div className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                      {glossaryKey ? <GlossaryTerm termKey={glossaryKey}>{label}</GlossaryTerm> : label}
                    </div>
                    <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Zodiac grid */}
        <section className="py-10 px-6 md:px-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl mb-6 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {astrology_index.sections.zodiac_heading}
            </h2>
            {/* Element filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-8" role="group" aria-label="Filter zodiac signs by element">
              {ELEMENTS.map((el) => {
                const active = elementFilter === el;
                const colorVar = el === 'All' ? '--primary' : (ELEMENT_COLORS[el] ?? '--primary');
                return (
                  <button
                    key={el}
                    onClick={() => setElementFilter(el)}
                    className="px-4 py-1.5 rounded-full text-sm transition-all"
                    style={{
                      background: active ? `hsl(var(${colorVar}))` : `hsl(var(${colorVar}) / 0.12)`,
                      color: active ? 'hsl(var(--primary-foreground))' : `hsl(var(${colorVar}))`,
                      border: `1px solid hsl(var(${colorVar}) / 0.4)`,
                      fontFamily: 'var(--font-sans)',
                    }}
                    aria-pressed={active}
                  >
                    {el}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSigns.map((sign, i) => (
                <motion.div
                  key={sign.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <Link
                    to={`/astrology/${sign.slug}`}
                    className="block p-5 rounded-2xl transition-transform hover:scale-[1.02]"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl" aria-hidden="true">{sign.symbol}</span>
                      <div>
                        <div className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{sign.name}</div>
                        <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{sign.dates}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `hsl(var(${ELEMENT_COLORS[sign.element]}) / 0.15)`, color: `hsl(var(${ELEMENT_COLORS[sign.element]}))`, fontFamily: 'var(--font-sans)' }}>
                        <GlossaryTerm termKey="element">{sign.element}</GlossaryTerm>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        <GlossaryTerm termKey="modality">{sign.modality}</GlossaryTerm>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        ♟ {sign.ruler}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sign.keywords.map((kw) => (
                        <span key={kw} className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{kw}</span>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="py-16 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {astrology_index.sections.explore_heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { to: '/birth-chart', label: 'Birth Chart Calculator', desc: 'Calculate your natal chart with 10 planets, ASC, and MC' },
                { to: '/moon-calendar', label: 'Moon Calendar', desc: 'Full moon dates, names, and spiritual themes' },
                { to: '/moon/phases', label: 'Moon Phase Guide', desc: 'All eight phases with rituals and correspondences' },
              ].map(({ to, label, desc }) => (
                <Link key={to} to={to} className="block p-5 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div className="font-semibold mb-1" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}>{label}</div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
