import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import GlossaryTerm from '@/components/GlossaryTerm';
import { HOUSE_INTERPRETATIONS } from '@/lib/astro-interpretations';
import { astrology_houses } from 'virtual:content';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/astrology/houses`;

// Angular, Succedent, Cadent groupings
const HOUSE_QUALITY: Record<number, string> = {
  1: 'Angular', 4: 'Angular', 7: 'Angular', 10: 'Angular',
  2: 'Succedent', 5: 'Succedent', 8: 'Succedent', 11: 'Succedent',
  3: 'Cadent', 6: 'Cadent', 9: 'Cadent', 12: 'Cadent',
};

const QUALITY_COLORS: Record<string, string> = {
  Angular: '--grimoire-ritual',
  Succedent: '--grimoire-herb',
  Cadent: '--grimoire-dream',
};

const HOUSE_NUMBERS = [1,2,3,4,5,6,7,8,9,10,11,12] as const;

export default function HousesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#webpage`,
    name: 'The 12 Astrological Houses',
    url: pageUrl,
    isPartOf: { '@id': `${siteUrl}/#website` },
    description: 'Complete guide to the 12 astrological houses — their meanings, keywords, and role in birth chart interpretation.',
  };

  return (
    <>
      <Helmet>
        <title>The 12 Astrological Houses: Meanings & Keywords | Spellful</title>
        <meta name="description" content="Explore all 12 astrological houses — from the 1st House of Self to the 12th House of the Hidden Realm. Learn what each house governs in your birth chart." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="The 12 Astrological Houses: Meanings & Keywords | Spellful" />
        <meta property="og:description" content="Complete guide to the 12 astrological houses — their meanings, keywords, and role in birth chart interpretation." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The 12 Astrological Houses | Spellful" />
        <meta name="twitter:description" content="Complete guide to the 12 astrological houses — their meanings, keywords, and role in birth chart interpretation." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        {/* Hero */}
        <section className="relative pt-16 pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.08) 0%, transparent 65%)' }} />
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
              style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
            >
              {astrology_houses.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {astrology_houses.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {astrology_houses.hero.subtitle}
            </motion.p>
          </div>
        </section>

        {/* Chart wheel diagram */}
        <section className="py-6 px-6 md:px-10 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
            style={{ width: 260, height: 260 }}
            role="img"
            aria-label="Astrological house wheel diagram showing 12 equal sectors"
          >
            <svg viewBox="0 0 260 260" width="260" height="260">
              {HOUSE_NUMBERS.map((n) => {
                const startAngle = ((n - 1) * 30 - 90) * (Math.PI / 180);
                const endAngle = (n * 30 - 90) * (Math.PI / 180);
                const r = 120;
                const cx = 130;
                const cy = 130;
                const x1 = cx + r * Math.cos(startAngle);
                const y1 = cy + r * Math.sin(startAngle);
                const x2 = cx + r * Math.cos(endAngle);
                const y2 = cy + r * Math.sin(endAngle);
                const midAngle = ((n - 0.5) * 30 - 90) * (Math.PI / 180);
                const tx = cx + 88 * Math.cos(midAngle);
                const ty = cy + 88 * Math.sin(midAngle);
                const quality = HOUSE_QUALITY[n] ?? 'Cadent';
                const colorVar = QUALITY_COLORS[quality] ?? '--primary';
                return (
                  <g key={n}>
                    <path
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                      fill={`hsl(var(${colorVar}) / 0.08)`}
                      stroke={`hsl(var(${colorVar}) / 0.3)`}
                      strokeWidth="1"
                    />
                    <text
                      x={tx}
                      y={ty}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="11"
                      fill={`hsl(var(${colorVar}))`}
                      fontFamily="var(--font-sans)"
                    >
                      {n}
                    </text>
                  </g>
                );
              })}
              {/* Inner circle */}
              <circle cx="130" cy="130" r="40" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
              <text x="130" y="127" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="var(--font-sans)">Birth</text>
              <text x="130" y="139" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="var(--font-sans)">Chart</text>
            </svg>
          </motion.div>
        </section>

        {/* Legend */}
        <section className="pb-6 px-6 md:px-10">
          <div className="max-w-sm mx-auto flex justify-center gap-6">
            {(['Angular','Succedent','Cadent'] as const).map((q) => (
              <div key={q} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: `hsl(var(${QUALITY_COLORS[q]}) / 0.4)` }} />
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  <GlossaryTerm termKey={q === 'Angular' ? 'angular_house' : q === 'Succedent' ? 'succedent_house' : 'cadent_house'}>{q}</GlossaryTerm>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Method note */}
        <section className="pb-4 px-6 md:px-10">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-center px-4 py-2 rounded-lg" style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', fontFamily: 'var(--font-sans)' }}>
              <GlossaryTerm termKey="house_system">House system</GlossaryTerm>: {astrology_houses.method_note}
            </p>
          </div>
        </section>

        {/* House cards */}
        <section className="py-10 px-6 md:px-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {astrology_houses.houses_heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {HOUSE_NUMBERS.map((n, i) => {
                const h = HOUSE_INTERPRETATIONS[n];
                const quality = HOUSE_QUALITY[n] ?? 'Cadent';
                const colorVar = QUALITY_COLORS[quality] ?? '--primary';
                return (
                  <motion.div
                    key={n}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="rounded-2xl p-5"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ background: `hsl(var(${colorVar}) / 0.15)`, color: `hsl(var(${colorVar}))`, fontFamily: 'var(--font-heading)' }}
                        aria-hidden="true"
                      >
                        {n}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                            {h.title}
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `hsl(var(${colorVar}) / 0.15)`, color: `hsl(var(${colorVar}))`, fontFamily: 'var(--font-sans)' }}
                          >
                            <GlossaryTerm termKey={quality === 'Angular' ? 'angular_house' : quality === 'Succedent' ? 'succedent_house' : 'cadent_house'}>
                              {quality}
                            </GlossaryTerm>
                          </span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: `hsl(var(${colorVar}))`, fontFamily: 'var(--font-sans)' }}>
                          {h.keywords}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          {h.meaning}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Angular / Succedent / Cadent explainer */}
        <section className="py-12 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl mb-6 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              House Qualities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { quality: 'Angular', houses: '1st · 4th · 7th · 10th', desc: 'The most powerful houses — planets here are prominent and active, directly shaping your identity, home, relationships, and public life.', color: '--grimoire-ritual' },
                { quality: 'Succedent', houses: '2nd · 5th · 8th · 11th', desc: 'Stabilizing houses that consolidate the energy of the angular houses. They govern resources, creativity, transformation, and community.', color: '--grimoire-herb' },
                { quality: 'Cadent', houses: '3rd · 6th · 9th · 12th', desc: 'Transitional houses that prepare for the next angular house. They govern the mind, service, philosophy, and the hidden realm.', color: '--grimoire-dream' },
              ].map((q) => (
                <div key={q.quality} className="rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <h3 className="text-base font-semibold mb-1" style={{ color: `hsl(var(${q.color}))`, fontFamily: 'var(--font-sans)' }}>
                    <GlossaryTerm termKey={q.quality === 'Angular' ? 'angular_house' : q.quality === 'Succedent' ? 'succedent_house' : 'cadent_house'}>{q.quality}</GlossaryTerm>
                  </h3>
                  <p className="text-xs font-medium mb-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{q.houses}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{q.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 md:px-10 text-center">
          <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {astrology_houses.cta_heading}
          </h2>
          <p className="mb-6 text-sm max-w-md mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {astrology_houses.cta_body}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/birth-chart" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
              {astrology_houses.cta_button}
            </Link>
            <Link to="/astrology/planets" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              ☉ The Planets →
            </Link>
            <Link to="/astrology/aspects" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              ☌ Aspects →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
