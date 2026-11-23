import { useState, useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import GlossaryTerm from '@/components/GlossaryTerm';
import {
  PLANET_INTERPRETATIONS,
} from '@/lib/astro-interpretations';
import { calculateChart } from '@/lib/astro-calculator';
import type { PlanetPosition } from '@/lib/astro-calculator';
import { astrology_planets } from 'virtual:content';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/astrology/planets`;

// Ordered list for display
const PLANET_ORDER = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

const PLANET_COLORS: Record<string, string> = {
  sun:     '--grimoire-ritual',
  moon:    '--grimoire-dream',
  mercury: '--accent',
  venus:   '--grimoire-herb',
  mars:    '--grimoire-ritual',
  jupiter: '--primary',
  saturn:  '--muted-foreground',
  uranus:  '--grimoire-dream',
  neptune: '--grimoire-tarot',
  pluto:   '--grimoire-ritual',
};

interface LivePosition {
  sign: string;
  degree: number;
  minute: number;
  retrograde: boolean;
}

function formatDeg(p: LivePosition): string {
  return `${p.degree}°${String(p.minute).padStart(2, '0')}' ${p.sign}${p.retrograde ? ' ℞' : ''}`;
}

export default function PlanetsPage() {
  const [livePositions, setLivePositions] = useState<Record<string, LivePosition> | null>(null);

  useEffect(() => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const mo = now.getUTCMonth() + 1;
    const d = now.getUTCDate();
    // Use UTC hours/minutes; lat/lon 0,0 doesn't affect ecliptic longitudes
    try {
      const chart = calculateChart(y, mo, d, now.getUTCHours(), now.getUTCMinutes(), 0, 0, 0);
      const positions: Record<string, LivePosition> = {};
      const keys: (keyof typeof chart)[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
      for (const k of keys) {
        const p = chart[k] as PlanetPosition;
        positions[k] = { sign: p.sign, degree: p.degree, minute: p.minute, retrograde: p.retrograde };
      }
      setLivePositions(positions);
    } catch {
      // silently fail — live positions are a bonus
    }
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#webpage`,
    name: 'Planets in Astrology',
    url: pageUrl,
    isPartOf: { '@id': `${siteUrl}/#website` },
    description: 'Complete guide to the 10 planets in astrology — their symbols, rulerships, and meanings in birth chart interpretation.',
  };

  return (
    <>
      <Helmet>
        <title>Planets in Astrology: Meanings, Symbols & Rulerships | Spellful</title>
        <meta name="description" content="Explore all 10 planets in astrology — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto. Learn their symbols, rulerships, and birth chart meanings." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Planets in Astrology: Meanings, Symbols & Rulerships | Spellful" />
        <meta property="og:description" content="Complete guide to the 10 planets in astrology — their symbols, rulerships, and meanings in birth chart interpretation." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Planets in Astrology | Spellful" />
        <meta name="twitter:description" content="Complete guide to the 10 planets in astrology — their symbols, rulerships, and meanings." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        {/* Hero */}
        <section className="relative pt-16 pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 65%)' }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/astrology"
                className="inline-flex items-center gap-2 text-xs mb-6"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                <ArrowLeft size={12} />
                Astrology Guide
              </Link>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              {astrology_planets.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {astrology_planets.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {astrology_planets.hero.subtitle}
            </motion.p>
          </div>
        </section>

        {/* Live Sky Now */}
        <section className="py-10 px-6 md:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl p-6 md:p-8" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl" aria-hidden="true">✦</span>
                <div>
                  <h2 className="text-xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                    {astrology_planets.live_sky.heading}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {astrology_planets.live_sky.subheading}
                  </p>
                </div>
              </div>
              {livePositions ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {PLANET_ORDER.map((key) => {
                    const interp = PLANET_INTERPRETATIONS[key];
                    const pos = livePositions[key];
                    const colorVar = PLANET_COLORS[key] ?? '--primary';
                    return (
                      <div key={key} className="rounded-xl p-3 text-center" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                        <div className="text-2xl mb-1" aria-hidden="true" style={{ color: `hsl(var(${colorVar}))` }}>{interp.symbol}</div>
                        <div className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{interp.title}</div>
                        <div className="text-xs" style={{ color: `hsl(var(${colorVar}))`, fontFamily: 'var(--font-sans)' }}>
                          {pos.degree}°{String(pos.minute).padStart(2, '0')}' {pos.sign}
                        </div>
                        {pos.retrograde && (
                          <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>℞ <GlossaryTerm termKey="retrograde">retrograde</GlossaryTerm></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {PLANET_ORDER.map((key) => (
                    <div key={key} className="rounded-xl p-3 h-20 animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Planet Cards */}
        <section className="py-10 px-6 md:px-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {astrology_planets.planets_heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PLANET_ORDER.map((key, i) => {
                const p = PLANET_INTERPRETATIONS[key];
                const colorVar = PLANET_COLORS[key] ?? '--primary';
                const livePos = livePositions?.[key];
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="rounded-2xl p-6"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                        style={{ background: `hsl(var(${colorVar}) / 0.15)`, border: `1px solid hsl(var(${colorVar}) / 0.3)` }}
                        aria-hidden="true"
                      >
                        {p.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                            {p.title}
                          </h3>
                          {livePos && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: `hsl(var(${colorVar}) / 0.15)`, color: `hsl(var(${colorVar}))`, fontFamily: 'var(--font-sans)' }}
                            >
                              {formatDeg(livePos)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mb-3" style={{ color: `hsl(var(${colorVar}))`, fontFamily: 'var(--font-sans)' }}>
                          <GlossaryTerm termKey="rulership">Rules</GlossaryTerm>: {p.rules}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          {p.meaning}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Inner vs Outer */}
        <section className="py-12 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {astrology_planets.groups_heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {astrology_planets.groups.map((group) => {
                const colorMap: Record<string, string> = { personal: '--primary', social: '--accent', transpersonal: '--grimoire-tarot' };
                const glossaryMap: Record<string, string> = { personal: 'inner_planets', social: 'outer_planets', transpersonal: 'outer_planets' };
                const colorVar = colorMap[group.id] ?? '--primary';
                return (
                  <div key={group.id} className="rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <h3 className="text-base font-semibold mb-2" style={{ color: `hsl(var(${colorVar}))`, fontFamily: 'var(--font-sans)' }}>
                      <GlossaryTerm termKey={glossaryMap[group.id] ?? 'inner_planets'}>{group.label}</GlossaryTerm>
                    </h3>
                    <p className="text-sm font-medium mb-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                      {group.planets}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {group.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Nav links */}
        <section className="py-12 px-6 md:px-10">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4">
            <Link to="/astrology/houses" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              ⌂ The 12 Houses →
            </Link>
            <Link to="/astrology/aspects" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              ☌ Aspects →
            </Link>
            <Link to="/birth-chart" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
              Calculate Your Birth Chart →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
