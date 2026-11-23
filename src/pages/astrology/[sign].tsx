import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ZODIAC_SIGNS } from '@/lib/zodiac-data';
import { ShareBar } from '@/components/ShareBar';
import { zodiac_sign } from 'virtual:content';

const siteUrl = 'https://spellful.com';

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '--grimoire-ritual',
  Earth: '--grimoire-herb',
  Air: '--accent',
  Water: '--grimoire-dream',
};

export default function ZodiacSignPage() {
  const { sign: signSlug } = useParams<{ sign: string }>();
  const sign = ZODIAC_SIGNS.find((s) => s.slug === signSlug);

  if (!sign) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="text-center px-6">
          <h1 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Sign Not Found</h1>
          <Link to="/astrology" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>Back to Astrology Guide</Link>
        </div>
      </main>
    );
  }

  const idx = ZODIAC_SIGNS.findIndex((s) => s.slug === signSlug);
  const prevSign = idx > 0 ? ZODIAC_SIGNS[idx - 1] : null;
  const nextSign = idx < ZODIAC_SIGNS.length - 1 ? ZODIAC_SIGNS[idx + 1] : null;

  const pageUrl = `${siteUrl}/astrology/${sign.slug}`;
  const title = `${sign.name} (${sign.dates}) — Zodiac Sign Meaning | Spellful`;
  const description = `${sign.name}: ${sign.keywords.join(', ')}. ${sign.description.substring(0, 120)}...`;
  const elementColor = ELEMENT_COLORS[sign.element] ?? '--primary';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    name: `${sign.name} Zodiac Sign`,
    headline: `${sign.name}: Complete Astrology Guide`,
    url: pageUrl,
    isPartOf: { '@id': `${siteUrl}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Astrology', item: `${siteUrl}/astrology` },
        { '@type': 'ListItem', position: 3, name: sign.name, item: pageUrl },
      ],
    },
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        {/* Hero */}
        <section className="relative pt-16 pb-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, hsl(var(${elementColor}) / 0.12) 0%, transparent 65%)` }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center justify-center gap-2 text-xs flex-wrap" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <li><Link to="/" style={{ color: 'hsl(var(--muted-foreground))' }}>Home</Link></li>
                <li>/</li>
                <li><Link to="/astrology" style={{ color: 'hsl(var(--muted-foreground))' }}>Astrology</Link></li>
                <li>/</li>
                <li style={{ color: 'hsl(var(--foreground))' }}>{sign.name}</li>
              </ol>
            </nav>

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-8xl mb-4" aria-hidden="true">
              {sign.symbol}
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-xs tracking-widest uppercase mb-3" style={{ color: `hsl(var(${elementColor}))`, fontFamily: 'var(--font-sans)' }}>
              {sign.element} · {sign.modality} · Ruled by {sign.ruler}
            </motion.p>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl md:text-7xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {sign.name}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {sign.dates}
            </motion.p>

            <div className="flex flex-wrap justify-center gap-2">
              {sign.keywords.map((kw) => (
                <span key={kw} className="px-3 py-1 rounded-full text-xs" style={{ background: `hsl(var(${elementColor}) / 0.15)`, color: `hsl(var(${elementColor}))`, border: `1px solid hsl(var(${elementColor}) / 0.3)`, fontFamily: 'var(--font-sans)' }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="py-12 px-6 md:px-10">
          <div className="max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <p className="text-lg leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{sign.description}</p>
            </div>
          </div>
        </section>

        {/* Strengths & Challenges */}
        <section className="py-12 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="p-6 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h2 className="text-xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{zodiac_sign.labels.strengths}</h2>
              <ul className="space-y-2">
                {sign.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <span style={{ color: `hsl(var(${elementColor}))` }}>✦</span>
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="p-6 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h2 className="text-xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{zodiac_sign.labels.challenges}</h2>
              <ul className="space-y-2">
                {sign.challenges.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>◦</span>
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Love / Career / Spirituality */}
        <section className="py-16 px-6 md:px-10">
          <div className="max-w-4xl mx-auto space-y-6">
            {([
              { title: 'Love & Relationships', content: sign.love, emoji: '💕' },
              { title: 'Career & Ambitions', content: sign.career, emoji: '⚡' },
              { title: 'Spiritual Path', content: sign.spirituality, emoji: '✨' },
            ] as const).map(({ title, content, emoji }) => (
              <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="p-8 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h2 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  <span>{emoji}</span>
                  {title}
                </h2>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{content}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Correspondences */}
        <section className="py-16 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {zodiac_sign.labels.correspondences}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {([
                { label: 'Tarot Card', items: [sign.tarotCard], color: '--grimoire-tarot' },
                { label: 'Crystals', items: sign.crystals, color: '--accent' },
                { label: 'Herbs', items: sign.herbs, color: '--grimoire-herb' },
                { label: 'Colors', items: sign.colors, color: elementColor },
              ] as const).map(({ label, items, color }) => (
                <div key={label} className="p-5 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: `hsl(var(${color}))`, fontFamily: 'var(--font-sans)' }}>{label}</div>
                  <ul className="text-sm space-y-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compatible signs */}
        <section className="py-12 px-6 md:px-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl mb-6 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {zodiac_sign.labels.compatible}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {sign.compatibleWith.map((name) => {
                const s = ZODIAC_SIGNS.find((z) => z.name === name);
                return s ? (
                  <Link key={name} to={`/astrology/${s.slug}`} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                    <span>{s.symbol}</span>
                    {s.name}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        </section>

        {/* Prev / Next */}
        <section className="py-12 px-6 md:px-10 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            {prevSign ? (
              <Link to={`/astrology/${prevSign.slug}`} className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <ArrowLeft size={16} />
                <span>{prevSign.symbol} {prevSign.name}</span>
              </Link>
            ) : <div />}
            <Link to="/astrology" className="px-4 py-2 rounded-full text-sm" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
              {zodiac_sign.labels.all_signs}
            </Link>
            {nextSign ? (
              <Link to={`/astrology/${nextSign.slug}`} className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <span>{nextSign.symbol} {nextSign.name}</span>
                <ArrowRight size={16} />
              </Link>
            ) : <div />}
          </div>
        </section>

        {/* Share */}
        <section className="py-8 px-6 md:px-10 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-3xl mx-auto flex justify-center">
            <ShareBar
              text={`♾️ ${sign.name} (${sign.symbol}) — ${sign.keywords.slice(0, 3).join(', ')}. Explore your zodiac sign on Spellful.`}
              url={`${siteUrl}/astrology/${sign.slug}`}
              label="Share this sign"
            />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 md:px-10 text-center" style={{ background: 'hsl(var(--muted))' }}>
          <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {zodiac_sign.labels.cta_heading}
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {zodiac_sign.labels.cta_body}
          </p>
          <Link to="/birth-chart" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
            {zodiac_sign.labels.cta_button}
          </Link>
        </section>
      </main>
    </>
  );
}
