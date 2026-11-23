import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import GlossaryTerm from '@/components/GlossaryTerm';
import { ASPECT_INTERPRETATIONS } from '@/lib/astro-interpretations';
import { astrology_aspects } from 'virtual:content';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/astrology/aspects`;

const ASPECT_ORDER = ['Conjunction','Sextile','Square','Trine','Opposition','Quincunx'];

const ASPECT_ANGLES: Record<string, number> = {
  Conjunction: 0,
  Sextile: 60,
  Square: 90,
  Trine: 120,
  Opposition: 180,
  Quincunx: 150,
};

const ASPECT_ORBS: Record<string, number> = {
  Conjunction: 8,
  Sextile: 6,
  Square: 8,
  Trine: 8,
  Opposition: 8,
  Quincunx: 3,
};

const NATURE_COLORS: Record<string, string> = {
  Intense:    '--grimoire-ritual',
  Harmonious: '--grimoire-herb',
  Challenging:'--grimoire-ritual',
  Flowing:    '--grimoire-dream',
  Polarizing: '--accent',
  Adjusting:  '--muted-foreground',
};

const NATURE_BG: Record<string, string> = {
  Intense:    '--grimoire-ritual',
  Harmonious: '--grimoire-herb',
  Challenging:'--grimoire-ritual',
  Flowing:    '--grimoire-dream',
  Polarizing: '--accent',
  Adjusting:  '--muted-foreground',
};

/** Draw a simple SVG showing two planets at the given angle */
function AspectDiagram({ angle, color }: { angle: number; color: string }) {
  const cx = 50;
  const cy = 50;
  const r = 36;
  const dotR = 5;
  // Planet A always at top (270° = -90°)
  const aRad = -Math.PI / 2;
  const bRad = aRad + (angle * Math.PI) / 180;
  const ax = cx + r * Math.cos(aRad);
  const ay = cy + r * Math.sin(aRad);
  const bx = cx + r * Math.cos(bRad);
  const by = cy + r * Math.sin(bRad);

  return (
    <svg viewBox="0 0 100 100" width="72" height="72" aria-hidden="true">
      {/* Orbit circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`hsl(var(${color}) / 0.2)`} strokeWidth="1" />
      {/* Aspect line */}
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={`hsl(var(${color}) / 0.7)`} strokeWidth="1.5" strokeDasharray={angle === 0 ? undefined : '3 2'} />
      {/* Planet dots */}
      <circle cx={ax} cy={ay} r={dotR} fill={`hsl(var(${color}))`} />
      <circle cx={bx} cy={by} r={dotR} fill={`hsl(var(${color}))`} />
      {/* Angle label */}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill={`hsl(var(${color}))`} fontFamily="var(--font-sans)">
        {angle}°
      </text>
    </svg>
  );
}

export default function AspectsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#webpage`,
    name: 'Astrological Aspects',
    url: pageUrl,
    isPartOf: { '@id': `${siteUrl}/#website` },
    description: 'Complete guide to the six major astrological aspects — Conjunction, Sextile, Square, Trine, Opposition, and Quincunx.',
  };

  return (
    <>
      <Helmet>
        <title>Astrological Aspects: Conjunction, Trine, Square & More | Spellful</title>
        <meta name="description" content="Learn the six major astrological aspects — Conjunction, Sextile, Square, Trine, Opposition, and Quincunx. Understand how planetary angles shape your birth chart." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Astrological Aspects: Conjunction, Trine, Square & More | Spellful" />
        <meta property="og:description" content="Complete guide to the six major astrological aspects — their angles, orbs, and meanings in birth chart interpretation." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Astrological Aspects | Spellful" />
        <meta name="twitter:description" content="Complete guide to the six major astrological aspects — their angles, orbs, and meanings." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        {/* Hero */}
        <section className="relative pt-16 pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--grimoire-tarot) / 0.08) 0%, transparent 65%)' }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
              style={{ color: 'hsl(var(--grimoire-tarot))', fontFamily: 'var(--font-sans)' }}
            >
              {astrology_aspects.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {astrology_aspects.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {astrology_aspects.hero.subtitle}
            </motion.p>
          </div>
        </section>

        {/* Aspect cards */}
        <section className="py-10 px-6 md:px-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {astrology_aspects.aspects_heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ASPECT_ORDER.map((name, i) => {
                const asp = ASPECT_INTERPRETATIONS[name];
                const angle = ASPECT_ANGLES[name] ?? 0;
                const orb = ASPECT_ORBS[name] ?? 8;
                const colorVar = NATURE_COLORS[asp.nature] ?? '--primary';
                const bgVar = NATURE_BG[asp.nature] ?? '--primary';
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="rounded-2xl p-6"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex-shrink-0">
                        <AspectDiagram angle={angle} color={colorVar} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xl" aria-hidden="true" style={{ color: `hsl(var(${colorVar}))` }}>{asp.symbol}</span>
                          <h3 className="text-xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                            <GlossaryTerm termKey={name.toLowerCase()}>{name}</GlossaryTerm>
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `hsl(var(${bgVar}) / 0.15)`, color: `hsl(var(${bgVar}))`, fontFamily: 'var(--font-sans)' }}
                          >
                            {asp.nature}
                          </span>
                        </div>
                        <div className="flex gap-3 mb-3">
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                            {angle}° angle
                          </span>
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                            ±{orb}° <GlossaryTerm termKey="orb">orb</GlossaryTerm>
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          {asp.meaning}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Orb note */}
        <section className="py-4 px-6 md:px-10">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-center px-4 py-2 rounded-lg" style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', fontFamily: 'var(--font-sans)' }}>
              <GlossaryTerm termKey="orb">Orb</GlossaryTerm>: {astrology_aspects.orb_note}
            </p>
          </div>
        </section>

        {/* Applying vs Separating */}
        <section className="py-12 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {astrology_aspects.applying_heading}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              <GlossaryTerm termKey="applying_aspect">Applying</GlossaryTerm> aspects grow stronger as they approach exactness;{' '}
              <GlossaryTerm termKey="separating_aspect">separating</GlossaryTerm> aspects have already peaked and are fading.{' '}
              {astrology_aspects.applying_body}
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 md:px-10 text-center">
          <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {astrology_aspects.cta_heading}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/birth-chart" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
              {astrology_aspects.cta_button}
            </Link>
            <Link to="/astrology/planets" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              ☉ The Planets →
            </Link>
            <Link to="/astrology/houses" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              ⌂ The Houses →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
