import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, Moon, Star, Leaf, Users, ArrowRight, Lock } from 'lucide-react';
import MoonNightSky from '@/components/MoonNightSky';
import TwinkleStars from '@/components/TwinkleStars';
import { home } from 'virtual:content';
import { ContentListContext } from '@airo/content';
import AstroFeed from '@/components/AstroFeed';
import CommandCenter from '@/components/CommandCenter';
import { useSession } from '@/lib/auth/auth-client.tsx';
import { getMoonPhase } from '@/lib/moon-phase-engine';
import { InstallBanner } from '@/components/InstallSpellful';

// ─── Seeded stars (SSR-safe) ──────────────────────────────────────────────────
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  top: `${seededRand(i * 3) * 100}%`,
  left: `${seededRand(i * 3 + 1) * 100}%`,
  size: seededRand(i * 3 + 2) * 2.4 + 0.5,
  duration: 2.5 + seededRand(i * 7) * 5,
  delay: seededRand(i * 11) * 6,
  color: i % 7 === 0 ? 'hsl(var(--primary))' : i % 5 === 0 ? 'hsl(var(--accent))' : 'hsl(var(--foreground))',
  glow: i % 9 === 0,
}));

// ─── Moon phase glyph ─────────────────────────────────────────────────────────
function moonGlyph(phase: string) {
  const map: Record<string, string> = {
    'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
    'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
    'Last Quarter': '🌗', 'Waning Crescent': '🌘',
  };
  // eslint-disable-next-line security/detect-object-injection
  return map[phase] ?? '🌙';
}

// ─── Feature accent map ───────────────────────────────────────────────────────
const FEATURE_ACCENTS: Record<string, string> = {
  spells:  '--primary',
  tarot:   '--grimoire-tarot',
  moon:    '--accent',
  chart:   '--primary',
  herbs:   '--grimoire-herb',
  journal: '--grimoire-dream',
  academy: '--accent',
};

// ─── Live moon data hook ──────────────────────────────────────────────────────
function useLiveMoon() {
  const [data, setData] = useState<{ phaseName: string; illumination: number } | null>(null);
  useEffect(() => {
    try {
      const result = getMoonPhase(new Date());
      setData({ phaseName: result.phase, illumination: Math.round(result.illumination) });
    } catch {
      // fall back to content layer value
    }
  }, []);
  return data;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase mb-4" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.22em' }}>
      {children}
    </p>
  );
}

// ─── Try Something Magical cards ─────────────────────────────────────────────
function MagicCard({ to, icon: Icon, label, desc, accent, badge }: {
  to: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  accent: string;
  badge?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link
        to={to}
        className="group flex flex-col h-full rounded-2xl p-6 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{
          background: 'hsl(var(--card))',
          border: `1px solid hsl(var(${accent}) / 0.25)`,
          boxShadow: `0 0 32px 0 hsl(var(${accent}) / 0.06)`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `hsl(var(${accent}) / 0.15)`, color: `hsl(var(${accent}))` }}
          >
            <Icon size={20} strokeWidth={1.5} />
          </span>
          {badge && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: `hsl(var(${accent}) / 0.15)`, color: `hsl(var(${accent}))`, fontFamily: 'var(--font-sans)' }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="mb-2" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 400, color: 'hsl(var(--foreground))' }}>
          {label}
        </p>
        <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
          {desc}
        </p>
        <span
          className="inline-flex items-center gap-1.5 text-xs transition-all duration-200 group-hover:gap-2.5"
          style={{ color: `hsl(var(${accent}))`, fontFamily: 'var(--font-sans)' }}
        >
          Try it now <ArrowRight size={12} />
        </span>
      </Link>
    </motion.div>
  );
}

// ─── Member benefit row ───────────────────────────────────────────────────────
function BenefitRow({ icon: Icon, title, desc, accent }: {
  icon: React.ElementType;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `hsl(var(${accent}) / 0.15)`, color: `hsl(var(${accent}))` }}
      >
        <Icon size={18} strokeWidth={1.5} />
      </span>
      <div>
        <p className="mb-1" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 400, color: 'hsl(var(--foreground))' }}>
          {title}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { session } = useSession();
  const heroRef = useRef<HTMLDivElement>(null);
  const liveMoon = useLiveMoon();
  const siteUrl = 'https://spellful.com';

  const moon = home.moon;
  const phaseName = liveMoon?.phaseName ?? moon.phase ?? 'New Moon';
  const _moonExtra = moon as unknown as Record<string, unknown>;
  const moonSign: string = typeof _moonExtra.sign === 'string' ? _moonExtra.sign : '';
  const moonMessage: string = typeof _moonExtra.message === 'string' ? _moonExtra.message : '';
  const moonSpellwork: Array<{ id: string; tag: string }> = Array.isArray(_moonExtra.spellwork) ? (_moonExtra.spellwork as Array<{ id: string; tag: string }>) : [];
  const moonCta: string = typeof _moonExtra.cta === 'string' ? _moonExtra.cta : 'Explore moon magic';
  const illumination = liveMoon?.illumination ?? moon.illumination;

  return (
    <>
      <Helmet>
        <title>Spellful — Free Witchcraft Tools, Tarot, Birth Charts &amp; Moon Rituals</title>
        <meta name="description" content="Free witchcraft tools, tarot readings, birth chart calculator, spell library, moon ritual planner, dream journal, and the Spellful Academy — 22 free guided lessons in astrology, tarot, numerology, witchcraft, and more. No ads, no paywalls." />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:title" content="Spellful — Free Witchcraft Tools, Tarot, Birth Charts &amp; Moon Rituals" />
        <meta property="og:description" content="Free tarot readings, birth chart calculator, spell library, moon ritual planner, and more. No signup, no ads, no app needed." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Spellful — Free Witchcraft Tools, Tarot, Birth Charts &amp; Moon Rituals" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spellful — Free Witchcraft Tools, Tarot, Birth Charts &amp; Moon Rituals" />
        <meta name="twitter:description" content="Free tarot readings, birth chart calculator, spell library, moon ritual planner, and more. No signup, no ads, no app needed." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Spellful — Free Witchcraft Tools, Tarot, Birth Charts &amp; Moon Rituals" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              url: siteUrl,
              name: 'Spellful',
              description: 'Free witchcraft tools — tarot readings, birth charts, spell library, moon rituals, dream journal, and daily cosmic dashboard.',
            },
            {
              '@type': 'Organization',
              '@id': `${siteUrl}/#organization`,
              name: 'Spellful',
              url: siteUrl,
              foundingDate: '2026',
              logo: { '@type': 'ImageObject', url: `${siteUrl}/airo-assets/images/logo/horizontal` },
              image: { '@type': 'ImageObject', url: 'https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png', width: 1200, height: 630 },
              contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'hello@spellful.com', url: `${siteUrl}/about` },
              sameAs: ['https://www.threads.net/@spellful', 'https://bsky.app/profile/spellful.com', 'https://www.facebook.com/spellful', 'https://x.com/spellful'],
            },
            {
              '@type': 'WebPage',
              '@id': `${siteUrl}/#webpage`,
              url: siteUrl,
              name: 'Spellful — Witchcraft & Intuitive Resources',
              isPartOf: { '@id': `${siteUrl}/#website` },
              about: { '@id': `${siteUrl}/#organization` },
            },
          ],
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>

        {/* ══════════════════════════════════════════════════════════════
            SIGNED-IN: Command Center shortcut
        ══════════════════════════════════════════════════════════════ */}
        {session && (
          <section className="pt-8 pb-0 px-6" style={{ background: 'hsl(var(--background))' }}>
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-between mb-6"
              >
                <div>
                  <p className="text-xs uppercase mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.22em' }}>
                    Welcome back
                  </p>
                  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: 'hsl(var(--foreground))' }}>
                    {session.user.name?.split(' ')[0] ?? 'Seeker'}'s Sanctuary
                  </h1>
                </div>
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs transition-all duration-200"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
                >
                  <Sparkles size={13} />
                  My Sanctuary
                </Link>
              </motion.div>
              <CommandCenter />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            INSTALL BANNER — all visitors (dismissed per-session)
        ══════════════════════════════════════════════════════════════ */}
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <InstallBanner />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            1. HERO — guests only
        ══════════════════════════════════════════════════════════════ */}
        {!session && (
          <section
            ref={heroRef}
            className="relative min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)] flex flex-col items-center justify-center overflow-hidden"
            style={{ background: 'hsl(var(--background))' }}
            aria-label="Welcome to Spellful"
          >
            {/* Background video */}
            <div className="absolute inset-0 pointer-events-none">
              <video
                src="/airo-assets/videos/pages/home/hero-video"
                autoPlay muted loop playsInline
                className="w-full h-full object-cover"
                style={{ opacity: 0.35 }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, hsl(var(--background) / 0.3) 0%, hsl(var(--background) / 0.05) 35%, hsl(var(--background) / 0.65) 80%, hsl(var(--background)) 100%)' }}
              />
            </div>

            {/* Stars */}
            {STARS.map((s) => (
              <motion.div
                key={s.id}
                className="absolute rounded-full pointer-events-none"
                style={{ top: s.top, left: s.left, width: s.size, height: s.size, background: s.color, boxShadow: s.glow ? `0 0 ${s.size * 2}px 0.5px ${s.color}` : undefined }}
                animate={{ opacity: [0.04, s.glow ? 0.35 : 0.18, 0.04], scale: [1, s.glow ? 1.3 : 1.1, 1] }}
                transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
              />
            ))}

            <MoonNightSky moonPosition="top-right" moonSize={96} starField={false} />
            <TwinkleStars count={38} opacity={0.5} />

            {/* Hero content */}
            <div className="relative z-10 text-center px-6 max-w-3xl mx-auto w-full">

              {/* Live moon badge */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                style={{ background: 'hsl(var(--card) / 0.7)', border: '1px solid hsl(var(--border))', backdropFilter: 'blur(8px)' }}
              >
                <span className="text-base leading-none" aria-hidden="true">{moonGlyph(phaseName)}</span>
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {home.moonBar.label} · <span style={{ color: 'hsl(var(--foreground))' }}>{phaseName}</span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}> · {illumination}% illuminated</span>
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="text-xs uppercase mb-6"
                style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.25em' }}
              >
                {home.hero.eyebrow}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, delay: 0.65, ease: 'easeOut' }}
                className="mb-6"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(3.2rem, 10vw, 6.5rem)',
                  fontWeight: 400,
                  lineHeight: 1.05,
                  color: 'hsl(var(--foreground))',
                  whiteSpace: 'pre-line',
                }}
              >
                Your Magic Begins Here.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 1.0 }}
                className="text-base md:text-lg mb-10 leading-relaxed mx-auto"
                style={{ color: 'hsl(var(--foreground) / 0.55)', fontFamily: 'var(--font-sans)', fontWeight: 300, maxWidth: '36rem' }}
              >
                Discover the moon, explore your intuition, learn the craft, and find your place in a world of magic.
              </motion.p>

              {/* Two primary CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.25 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}
                >
                  <Sparkles size={15} />
                  Create Your Free Sanctuary
                </Link>
                <a
                  href="#explore"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm transition-all duration-200 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'transparent', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground) / 0.8)', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}
                >
                  Explore Spellful
                </a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                className="mt-5 text-xs"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                Free forever · No credit card required
              </motion.p>
            </div>

            {/* Scroll indicator */}
            <motion.div
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              <div className="w-px h-12" style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.4))' }} />
            </motion.div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            2. TRY SOMETHING MAGICAL — guests only
        ══════════════════════════════════════════════════════════════ */}
        {!session && (
          <section id="explore" className="py-xxl px-6" style={{ background: 'hsl(var(--muted))' }}>
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-12"
              >
                <SectionLabel>Try Something Magical</SectionLabel>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'hsl(var(--foreground))' }}>
                  No account needed to begin
                </h2>
                <p className="mt-3 text-sm leading-relaxed mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300, maxWidth: '36rem' }}>
                  Explore real tools — draw a tarot card, check tonight's moon, discover a spell. Save your results when you're ready to create a free account.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { to: '/tarot', icon: Star, label: 'Draw a Tarot Card', desc: 'Pull a card from the full 78-card deck and explore its meaning for today.', accent: '--grimoire-tarot', badge: 'Free' },
                  { to: '/moon-calendar', icon: Moon, label: "Tonight's Moon", desc: `The moon is currently in its ${phaseName} phase — ${illumination}% illuminated. See what it means for your practice.`, accent: '--accent', badge: 'Live' },
                  { to: '/spells', icon: Sparkles, label: 'Discover a Spell', desc: 'Browse curated spells for every intention, season, and lunar phase.', accent: '--primary', badge: 'Free' },
                  { to: '/herbs', icon: Leaf, label: 'Explore the Grimoire', desc: 'Discover the magical properties of herbs, crystals, and candles.', accent: '--grimoire-herb', badge: 'Free' },
                ].map((card, i) => (
                  <motion.div
                    key={card.to}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="h-full"
                  >
                    <MagicCard {...card} />
                  </motion.div>
                ))}
              </div>

              {/* Natural save-to-account nudge */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-10 text-center"
              >
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Want to save your readings and personalize your experience?{' '}
                  <Link to="/signup" className="transition-colors hover:opacity-80" style={{ color: 'hsl(var(--primary))' }}>
                    Create a free account →
                  </Link>
                </p>
              </motion.div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            3. DISCOVER YOUR PATH — guests only
        ══════════════════════════════════════════════════════════════ */}
        {!session && (
          <section className="py-xxl px-6" style={{ background: 'hsl(var(--background))' }}>
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="mb-12"
              >
                <SectionLabel>{home.features.eyebrow}</SectionLabel>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'hsl(var(--foreground))', whiteSpace: 'pre-line' }}>
                  {home.features.heading}
                </h2>
              </motion.div>

              <ContentListContext field="home.features.items">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {home.features.items.map((item, i) => {
                    // eslint-disable-next-line security/detect-object-injection
                    const accent = FEATURE_ACCENTS[item.id] ?? '--primary';
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                      >
                        <div
                          className="group flex flex-col h-full rounded-2xl p-6 transition-all duration-300 cursor-pointer"
                          style={{ background: 'hsl(var(--card))', border: `1px solid hsl(var(${accent}) / 0.2)` }}
                          onClick={() => { window.location.href = item.href; }}
                          role="link"
                          tabIndex={0}
                          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') window.location.href = item.href; }}
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-lg"
                            style={{ background: `hsl(var(${accent}) / 0.15)`, color: `hsl(var(${accent}))` }}
                          >
                            {item.glyph}
                          </div>
                          <p className="mb-2" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 400, color: 'hsl(var(--foreground))' }}>
                            {item.label}
                          </p>
                          <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                            {item.desc}
                          </p>
                          <span
                            className="inline-flex items-center gap-1.5 text-xs transition-all duration-200 group-hover:gap-2.5"
                            style={{ color: `hsl(var(${accent}))`, fontFamily: 'var(--font-sans)' }}
                          >
                            Explore <ArrowRight size={12} />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ContentListContext>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            4. TONIGHT'S MOON + COSMIC FEED — guests only
        ══════════════════════════════════════════════════════════════ */}
        {!session && (
          <section style={{ background: 'hsl(var(--card))' }}>
            <div className="max-w-6xl mx-auto px-6 pt-xxl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12 mb-12"
              >
                {/* Moon data */}
                <div className="flex items-center gap-5 shrink-0">
                  <span className="text-6xl leading-none select-none" aria-hidden="true">{moonGlyph(phaseName)}</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>
                      {home.moonBar.label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 400, color: 'hsl(var(--foreground))' }}>
                      {phaseName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
                      {moonSign ? `${moonSign} · ` : ''}{illumination}% illuminated
                    </p>
                  </div>
                </div>
                <div className="hidden md:block w-px self-stretch" style={{ background: 'hsl(var(--border))' }} />
                <div className="flex-1">
                  <p className="text-sm md:text-base leading-relaxed mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                    {moonMessage}
                  </p>
                  <ContentListContext field="moon.spellwork">
                    <div className="flex flex-wrap gap-2">
                      {moonSpellwork.map((sw) => (
                        <span
                          key={sw.id}
                          className="text-xs px-3 py-1 rounded-full"
                          style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--primary) / 0.3)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                        >
                          {sw.tag}
                        </span>
                      ))}
                    </div>
                  </ContentListContext>
                </div>
                <div className="shrink-0">
                  <Link
                    to="/moon-calendar"
                    className="text-xs uppercase tracking-widest whitespace-nowrap transition-opacity duration-200 hover:opacity-70"
                    style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                  >
                    {moonCta} →
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-10"
              >
                <SectionLabel>{home.todaySection?.eyebrow}</SectionLabel>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'hsl(var(--foreground))' }}>
                  {home.todaySection?.heading}
                </h2>
                <p className="mt-4 text-sm leading-relaxed mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300, maxWidth: '38rem' }}>
                  {home.todaySection?.description}
                </p>
              </motion.div>
            </div>
            <AstroFeed />
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            5. WHY JOIN SPELLFUL — guests only
        ══════════════════════════════════════════════════════════════ */}
        {!session && (
          <section className="py-xxl px-6" style={{ background: 'hsl(var(--background))' }}>
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-14"
              >
                <SectionLabel>{home.memberSection?.eyebrow}</SectionLabel>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'hsl(var(--foreground))', whiteSpace: 'pre-line' }}>
                  {home.memberSection.heading}
                </h2>
                <p className="mt-4 text-sm leading-relaxed mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300, maxWidth: '36rem' }}>
                  {home.memberSection.body}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
                {[
                  { icon: Sparkles, title: 'My Sanctuary', desc: 'A customizable private daily dashboard — moon phase, birth chart, tarot of the day, and your personal cosmic weather.', accent: '--primary' },
                  { icon: BookOpen, title: 'Living Grimoire', desc: 'Save tarot readings, moon rituals, dream journal entries, and spell discoveries. Your private Book of Shadows, always with you.', accent: '--grimoire-tarot' },
                  { icon: Users, title: 'My Coven', desc: 'Connect with witches, pagans, and seekers. Share readings, ask questions, and grow your practice in a warm community.', accent: '--accent' },
                  { icon: Star, title: 'Personal Journey', desc: 'Track your learning progress through the Spellful Academy, save favorites, and personalize every tool to your path.', accent: '--grimoire-herb' },
                ].map((benefit, i) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <BenefitRow {...benefit} />
                  </motion.div>
                ))}
              </div>

              {/* Guest vs member comparison note */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <Lock size={18} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                  All tools on Spellful are free to explore without an account. Creating a free account unlocks saving, personalization, the community, and your private Grimoire — no credit card, no subscription required.
                </p>
              </motion.div>

              {/* Single clear CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
                >
                  <Sparkles size={15} />
                  {home.memberSection.cta}
                </Link>
                <p className="mt-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Free forever · No credit card required
                </p>
              </motion.div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            6. COMMUNITY — guests only
        ══════════════════════════════════════════════════════════════ */}
        {!session && (
          <section className="py-xxl px-6 relative overflow-hidden" style={{ background: 'hsl(var(--card))' }}>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                >
                  <SectionLabel>{home.communityBanner.eyebrow}</SectionLabel>
                  <h2 className="mb-5" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'hsl(var(--foreground))', lineHeight: 1.15 }}>
                    {home.communityBanner.heading}
                  </h2>
                  <p className="text-sm leading-relaxed mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                    {home.communityBanner.body}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/community"
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}
                    >
                      <Users size={14} />
                      {home.communityBanner.cta}
                    </Link>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{ background: 'transparent', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}
                    >
                      {home.communityBanner.ctaSecondary}
                    </Link>
                  </div>
                  <p className="mt-6 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Community discussions are visible to members only. We never display private messages or friend lists publicly.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className="relative"
                >
                  <div
                    className="rounded-2xl overflow-hidden aspect-[4/3]"
                    style={{ border: '1px solid hsl(var(--border))' }}
                  >
                    <img
                      src="/airo-assets/images/pages/home/community-banner"
                      alt="Spellful community — witches and seekers gathered together"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width={600}
                      height={450}
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, hsl(var(--card) / 0.6) 0%, transparent 50%)' }} />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            7. EXPLORE THE CRAFT — all users (editorial cards)
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-xxl px-6" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-6xl mx-auto">

            {/* Section intro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-10 max-w-2xl"
            >
              <p
                className="text-xs font-semibold mb-3"
                style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em' }}
              >
                {home.exploreSection.eyebrow}
              </p>
              <h2
                style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'hsl(var(--foreground))', lineHeight: 1.15 }}
              >
                {home.exploreSection.heading}
              </h2>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
              >
                {home.exploreSection.subheading}
              </p>
            </motion.div>

            {/* Two-column card grid */}
            <ContentListContext field="home.resources.items">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {home.resources.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <Link
                      to={item.href}
                      className="group flex flex-col rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 no-underline"
                      style={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--accent) / 0.45)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px hsl(var(--accent) / 0.2), 0 8px 32px hsl(var(--accent) / 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      {/* Image — 16:9 on mobile, 3:2 on sm+ */}
                      <div className="aspect-video sm:aspect-[3/2] overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                          width={600}
                          height={400}
                        />
                      </div>

                      {/* Content panel */}
                      <div className="flex flex-col flex-1 p-6">
                        {/* Eyebrow */}
                        <p
                          className="text-[10px] font-semibold mb-2"
                          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em' }}
                        >
                          {item.category}
                        </p>
                        {/* Heading */}
                        <p
                          className="mb-3 leading-snug"
                          style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', fontWeight: 400, color: 'hsl(var(--foreground))' }}
                        >
                          {item.title}
                        </p>
                        {/* Description */}
                        <p
                          className="text-sm leading-relaxed flex-1 mb-5"
                          style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                        >
                          {item.desc}
                        </p>
                        {/* CTA button — pinned to bottom */}
                        <span
                          className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-lg text-sm font-medium"
                          style={{
                            background: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {item.buttonLabel}
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </ContentListContext>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            8. SPELLFUL PLUS — all users
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-xxl px-6 relative overflow-hidden" style={{ background: 'hsl(var(--card))' }}>
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full" style={{ background: 'hsl(var(--primary) / 0.07)', filter: 'blur(90px)' }} />
            <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full" style={{ background: 'hsl(var(--accent) / 0.06)', filter: 'blur(80px)' }} />
          </div>
          <div className="relative max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-12"
            >
              <p className="text-xs font-semibold mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em' }}>
                SPELLFUL PLUS
              </p>
              <h2 className="mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'hsl(var(--foreground))', lineHeight: 1.15 }}>
                Deepen your practice
              </h2>
              <p className="text-sm leading-relaxed mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300, maxWidth: '36rem' }}>
                Spellful is free forever. Plus unlocks advanced tools for practitioners who want to go deeper — exclusive themes, expanded rituals, and a Supporter badge to show your commitment to the community.
              </p>
            </motion.div>

            {/* Benefit tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {[
                { icon: '✦', title: 'Practice Studio', desc: 'A customizable personal practice home with rearrangeable widgets — tarot, moon phase, journal, and routines your way.' },
                { icon: '🎨', title: 'Celestial Themes', desc: 'Additional celestial color palettes and alternate dashboard layouts to make Spellful feel uniquely yours.' },
                { icon: '📅', title: 'Routine Builder Pro', desc: 'Unlimited custom practice routines, flexible reminder schedules, and saved templates.' },
                { icon: '✦', title: 'Supporter Badge', desc: 'An optional celestial emblem you can choose to display on your profile — showing your support for free spiritual education.' },
              ].map((tile, i) => (
                <motion.div
                  key={tile.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl p-6 flex flex-col gap-3"
                  style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                >
                  <span className="text-2xl leading-none" aria-hidden="true">{tile.icon}</span>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 400, color: 'hsl(var(--foreground))' }}>{tile.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{tile.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Link
                to="/plus"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
              >
                <Star size={15} />
                Explore Spellful Plus
              </Link>
              <p className="mt-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Available in the Spellful iOS app · Free tools stay free forever
              </p>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            9. FINAL JOIN CTA — guests only
        ══════════════════════════════════════════════════════════════ */}
        {!session && (
          <section className="py-xxl px-6 relative overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full" style={{ background: 'hsl(var(--primary) / 0.06)', filter: 'blur(80px)' }} />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative max-w-2xl mx-auto text-center"
            >
              <span className="text-5xl mb-6 block" aria-hidden="true">✦</span>
              <h2 className="mb-5" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 400, color: 'hsl(var(--foreground))', lineHeight: 1.1 }}>
                Your magic begins here.
              </h2>
              <p className="text-sm leading-relaxed mb-10 mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300, maxWidth: '32rem' }}>
                Join thousands of witches, pagans, and seekers who have made Spellful their sacred digital home. Free forever.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
                >
                  <Sparkles size={15} />
                  Create Your Free Sanctuary
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'transparent', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
                >
                  {home.memberSection.ctaSecondary}
                </Link>
              </div>
              <p className="mt-6 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Free forever · No credit card required · Privacy-first
              </p>
            </motion.div>
          </section>
        )}

      </main>
    </>
  );
}
