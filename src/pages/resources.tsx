import { useState } from 'react';

// Seeded star positions so SSR and client match (no hydration mismatch)
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
const HERO_STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  top: `${seededRand(i * 3) * 100}%`,
  left: `${seededRand(i * 3 + 1) * 100}%`,
  size: seededRand(i * 3 + 2) * 2.2 + 0.6,
  duration: 2.5 + seededRand(i * 7) * 5,
  delay: seededRand(i * 11) * 6,
  color: i % 7 === 0 ? 'hsl(var(--primary))' : i % 5 === 0 ? 'hsl(var(--accent))' : 'hsl(var(--foreground))',
  glow: i % 9 === 0,
}));

import { Helmet } from '@dr.pogodin/react-helmet';
import { resources } from 'virtual:content';
import { motion, AnimatePresence } from 'motion/react';

const SPREAD_IMAGES: Record<string, string> = {
  'one-card':    '/airo-assets/images/pages/resources/spread-one-card',
  'three-card':  '/airo-assets/images/pages/resources/spread-three-card',
  'celtic-cross': '/airo-assets/images/pages/resources/spread-celtic-cross',
  'new-moon':   '/airo-assets/images/pages/resources/spread-new-moon',
  'shadow-work': '/airo-assets/images/pages/resources/spread-shadow-work',
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function SectionAccordion({
  defaultOpen = false,
  header,
  children,
}: {
  defaultOpen?: boolean;
  header: (open: boolean) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full py-xl px-6 flex items-center justify-between gap-6 text-left group"
        aria-expanded={open}
      >
        <div className="max-w-content mx-auto w-full flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            {header(open)}
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-shrink-0 text-2xl select-none"
            style={{ color: 'hsl(var(--primary) / 0.6)' }}
            aria-hidden="true"
          >
            ⌄
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-6 pb-xxl">
              <div className="max-w-content mx-auto">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function ResourcesPage() {
  return (
    <>
      <Helmet>
        <title>Free Tarot & Numerology Guide — Minor Arcana, Spreads & Angel Numbers | Spellful</title>
        <meta name="description" content="Free tarot reference: full Minor Arcana meanings, 5 intuitive spreads, numerology personal year cycles, life lesson numbers, and angel numbers. No signup, no ads." />
        <link rel="canonical" href="https://spellful.com/resources" />
        <meta property="og:title" content="Free Tarot &amp; Numerology Guide — Minor Arcana, Spreads &amp; Angel Numbers | Spellful" />
        <meta property="og:description" content="Free tarot card meanings, numerology guide, intuitive spreads, and angel number reference for the modern seeker." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/resources" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Free Tarot &amp; Numerology Guide — Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Tarot &amp; Numerology Guide — Minor Arcana, Spreads &amp; Angel Numbers | Spellful" />
        <meta name="twitter:description" content="Free tarot card meanings, numerology guide, intuitive spreads, and angel number reference for the modern seeker." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Free Tarot &amp; Numerology Guide — Spellful" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': 'https://spellful.com/resources#webpage',
          name: 'Free Tarot & Numerology Guide — Spellful',
          url: 'https://spellful.com/resources',
          description: 'Free tarot reference with full Minor Arcana meanings, 5 intuitive spreads, numerology personal year cycles, life lesson numbers, and angel numbers. No signup required.',
          isAccessibleForFree: true,
          isPartOf: { '@id': 'https://spellful.com/#website' },
          about: { '@id': 'https://spellful.com/#organization' },
          keywords: 'tarot, minor arcana, numerology, moon magic, witchcraft, spellcraft, intuitive reading',
        }).replace(/</g, '\u003c')}</script>
      </Helmet>

      <main>
        {/* ── HERO ── */}
        <section
          className="relative flex flex-col items-center justify-center text-center px-6 py-xxxl overflow-hidden"
          style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)' }}
        >
          {HERO_STARS.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                background: s.color,
                boxShadow: s.glow ? `0 0 ${s.size * 2}px 0.5px ${s.color}` : undefined,
              }}
              animate={{ opacity: [0.04, s.glow ? 0.35 : 0.18, 0.04], scale: [1, s.glow ? 1.3 : 1.1, 1] }}
              transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
            />
          ))}

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative z-10 max-w-2xl"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
            >
              Spellful Resources
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {resources.hero.title}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg leading-relaxed"
              style={{ color: 'hsl(var(--foreground) / 0.7)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
            >
              {resources.hero.subtitle}
            </motion.p>
          </motion.div>

          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full opacity-10 pointer-events-none"
            style={{
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
            }}
          />
        </section>

        {/* Share bar */}
        <div className="flex justify-center py-5 border-b border-border" style={{ background: 'hsl(var(--card))' }}>
        </div>

        {/* ── MINOR ARCANA ── */}
        <SectionAccordion defaultOpen={true} header={(open) => (<>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Tarot</p>
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{resources.tarot.sectionTitle}</h2>
          {!open && <p className="mt-2 text-sm leading-relaxed max-w-2xl" style={{ color: 'hsl(var(--foreground) / 0.5)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{resources.tarot.intro}</p>}
        </>)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-base mb-xl">
              {resources.tarot.suits.map((suit) => (
                <div
                  key={suit.id}
                  className="rounded-2xl p-lg border relative overflow-hidden group"
                  style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--accent) / 0.08) 0%, transparent 70%)' }}
                  />
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs px-3 py-1 rounded-full"
                      style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}
                    >
                      {suit.element}
                    </span>
                    <h3 className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                      {suit.name}
                    </h3>
                  </div>
                  <p className="text-sm italic mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                    {suit.theme}
                  </p>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'hsl(var(--foreground) / 0.65)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                    {suit.description}
                  </p>
                  <p className="text-xs tracking-wide" style={{ color: 'hsl(var(--foreground) / 0.4)', fontFamily: 'var(--font-sans)' }}>
                    {suit.keywords}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-lg border text-center" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <h3 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {resources.tarot.courtCards.title}
              </h3>
              <p className="max-w-2xl mx-auto text-base leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.65)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                {resources.tarot.courtCards.description}
              </p>
            </div>
        </SectionAccordion>

        {/* ── SPREADS ── */}
        <SectionAccordion header={(open) => (<>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Intuitive Practice</p>
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{resources.spreads.sectionTitle}</h2>
          {!open && <p className="mt-2 text-sm leading-relaxed max-w-2xl" style={{ color: 'hsl(var(--foreground) / 0.5)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{resources.spreads.intro}</p>}
        </>)}>
            <div className="flex flex-col gap-base">
              {resources.spreads.items.map((spread) => {
                const imgSrc = SPREAD_IMAGES[spread.id];
                return (
                  <div
                    key={spread.id}
                    className="rounded-2xl border overflow-hidden group relative"
                    style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: 'radial-gradient(circle at 0% 50%, hsl(var(--primary) / 0.05) 0%, transparent 60%)' }}
                    />
                    {imgSrc && (
                      <div className="relative w-full" style={{ height: 280, background: 'hsl(var(--background))' }}>
                        <img src={imgSrc} alt={`${spread.name} card layout diagram`} width={800} height={280} className="w-full h-full object-cover object-center" loading="lazy" />
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 55%, hsl(var(--card)) 100%)' }} />
                      </div>
                    )}
                    <div className="p-lg">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                          {spread.name}
                        </h3>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                          {spread.positions}
                        </span>
                      </div>
                      <p className="text-sm italic mb-3" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                        {spread.purpose}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.65)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                        {spread.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
        </SectionAccordion>

        {/* ── NUMEROLOGY ── */}
        <SectionAccordion header={(open) => (<>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Numerology</p>
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{resources.numerology.sectionTitle}</h2>
          {!open && <p className="mt-2 text-sm leading-relaxed max-w-2xl" style={{ color: 'hsl(var(--foreground) / 0.5)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{resources.numerology.intro}</p>}
        </>)}>
            {/* Personal Year */}
            <div className="mb-xxl">
              <h3 className="text-3xl mb-4 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {resources.numerology.personalYear.title}
              </h3>
              <p className="max-w-2xl mx-auto text-base leading-relaxed text-center mb-4" style={{ color: 'hsl(var(--foreground) / 0.65)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                {resources.numerology.personalYear.intro}
              </p>
              <div className="max-w-xl mx-auto rounded-xl p-base border text-center mb-xl" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--primary) / 0.3)' }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>How to Calculate</p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.7)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                  {resources.numerology.personalYear.howTo}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
                {resources.numerology.personalYear.years.map((year) => (
                  <div key={year.id} className="rounded-2xl p-base border group relative overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 100%, hsl(var(--accent) / 0.07) 0%, transparent 70%)' }} />
                    <div className="text-5xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--primary))' }}>{year.number}</div>
                    <h4 className="text-lg mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{year.theme}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.6)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{year.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Life Lesson */}
            <div>
              <h3 className="text-3xl mb-4 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {resources.numerology.lifeLesson.title}
              </h3>
              <p className="max-w-2xl mx-auto text-base leading-relaxed text-center mb-4" style={{ color: 'hsl(var(--foreground) / 0.65)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                {resources.numerology.lifeLesson.intro}
              </p>
              <div className="max-w-xl mx-auto rounded-xl p-base border text-center mb-xl" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--accent) / 0.3)' }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>How to Calculate</p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.7)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                  {resources.numerology.lifeLesson.howTo}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
                {resources.numerology.lifeLesson.numbers.map((num) => (
                  <div key={num.id} className="rounded-2xl p-base border flex gap-5 group relative overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(circle at 0% 50%, hsl(var(--primary) / 0.05) 0%, transparent 60%)' }} />
                    <div className="flex-shrink-0 text-4xl font-light w-12 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--accent))' }}>{num.number}</div>
                    <div>
                      <h4 className="text-lg mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{num.lesson}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.6)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{num.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </SectionAccordion>

        {/* ── ANGEL NUMBERS ── */}
        <SectionAccordion header={(open) => (<>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>Divine Messages</p>
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{resources.angelNumbers.sectionTitle}</h2>
          {!open && <p className="mt-2 text-sm leading-relaxed max-w-2xl" style={{ color: 'hsl(var(--foreground) / 0.5)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{resources.angelNumbers.intro}</p>}
        </>)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base">
              {resources.angelNumbers.numbers.map((angel) => (
                <div key={angel.id} className="rounded-2xl p-lg border relative overflow-hidden group" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.08) 0%, transparent 70%)' }} />
                  <div className="mb-4">
                    <span className="text-5xl font-light" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--primary) / 0.9)', lineHeight: 1 }}>
                      {angel.number}
                    </span>
                  </div>
                  <h3 className="text-xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                    {angel.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'hsl(var(--foreground) / 0.7)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                    {angel.meaning}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}>
                    {angel.keywords}
                  </p>
                </div>
              ))}
            </div>
        </SectionAccordion>

        {/* ── CLOSING ── */}
        <section
          className="py-xxl px-6 text-center"
          style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)' }}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-xl mx-auto"
          >
            <motion.div variants={fadeUp} className="text-4xl mb-6" style={{ color: 'hsl(var(--primary))' }}>
              ☽
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {resources.closing.title}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-base leading-relaxed"
              style={{ color: 'hsl(var(--foreground) / 0.65)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
            >
              {resources.closing.text}
            </motion.p>
          </motion.div>
        </section>
      </main>
    </>
  );
}
