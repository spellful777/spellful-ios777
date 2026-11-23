import { useState, useEffect, useId } from 'react';
import { Link, useLocation } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Sparkles, Star, Moon, Clock, Heart,
  User, ChevronRight, Wand2, CloudMoon, ScrollText,
  Gem, Leaf, NotebookPen, Users, Lock, ArrowRight,
} from 'lucide-react';
import { getCurrentMoonPhase, getMoonPhaseInfo } from '@/lib/moon-ritual-data';
import { sanctuary } from 'virtual:content';
import WelcomeQuote from '@/components/WelcomeQuote';
import ShootingStar from '@/components/ShootingStar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SanctuarySummary {
  counts: {
    grimoire: number;
    tarot: number;
    rituals: number;
    timeline: number;
    connections: number;
  };
  recent: {
    grimoire: Array<{ id: number; type: string; title: string; moonPhase: string; isFavorite: boolean; updatedAt: string }>;
    tarot: Array<{ id: number; spreadName: string; spreadType: string; intention: string; moonPhase: string; createdAt: string }>;
    rituals: Array<{ id: number; ritualName: string; moonPhase: string; intention: string; createdAt: string }>;
    timeline: Array<{ id: number; type: string; title: string; eventDate: string; moonPhase: string; updatedAt: string }>;
    connections: Array<{ id: number; partnerName: string; createdAt: string }>;
  };
  favorites: Array<{ id: number; type: string; title: string; moonPhase: string; isFavorite: boolean; updatedAt: string }>;
  continueItems: Array<{ type: string; title: string; href: string; date: string; badge: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRIMOIRE_TYPE_COLORS: Record<string, string> = {
  spell: 'hsl(var(--primary))',
  herb: 'hsl(var(--grimoire-herb))',
  crystal: 'hsl(var(--accent))',
  ritual: 'hsl(var(--grimoire-ritual))',
  tarot: 'hsl(var(--grimoire-tarot))',
  dream: 'hsl(var(--grimoire-dream))',
  journal: 'hsl(var(--muted-foreground))',
};

const GRIMOIRE_TYPE_ICONS: Record<string, React.ReactNode> = {
  spell: <Sparkles className="w-3.5 h-3.5" />,
  herb: <Leaf className="w-3.5 h-3.5" />,
  crystal: <Gem className="w-3.5 h-3.5" />,
  ritual: <Wand2 className="w-3.5 h-3.5" />,
  tarot: <Star className="w-3.5 h-3.5" />,
  dream: <CloudMoon className="w-3.5 h-3.5" />,
  journal: <NotebookPen className="w-3.5 h-3.5" />,
};

const CONTINUE_ICONS: Record<string, React.ReactNode> = {
  grimoire: <BookOpen className="w-4 h-4" />,
  tarot: <Star className="w-4 h-4" />,
  ritual: <Moon className="w-4 h-4" />,
  timeline: <ScrollText className="w-4 h-4" />,
};

// ─── Hub feature cards ────────────────────────────────────────────────────────

interface HubCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accentVar: string;
  authRequired: boolean;
  countKey?: keyof SanctuarySummary['counts'];
}

const HUB_CARDS: HubCard[] = [
  {
    title: 'My Grimoire',
    description: 'Your Book of Shadows — spells, herbs, crystals, rituals, and more.',
    href: '/grimoire',
    icon: <BookOpen className="w-6 h-6" />,
    accentVar: '--primary',
    authRequired: true,
    countKey: 'grimoire',
  },
  {
    title: 'Saved Spells',
    description: 'Browse and revisit every spell you have crafted and saved.',
    href: '/grimoire',
    icon: <Sparkles className="w-6 h-6" />,
    accentVar: '--primary',
    authRequired: true,
    countKey: 'grimoire',
  },
  {
    title: 'Saved Tarot',
    description: 'Revisit your past readings and track the cards that speak to you.',
    href: '/tarot',
    icon: <Star className="w-6 h-6" />,
    accentVar: '--grimoire-tarot',
    authRequired: true,
    countKey: 'tarot',
  },
  {
    title: 'Dream Journal',
    description: 'Record your dreams, explore symbols, and do shadow work.',
    href: '/dream-journal',
    icon: <CloudMoon className="w-6 h-6" />,
    accentVar: '--grimoire-dream',
    authRequired: true,
  },
  {
    title: 'Cosmic Timeline',
    description: 'Your personal life story mapped to the cosmos.',
    href: '/timeline',
    icon: <ScrollText className="w-6 h-6" />,
    accentVar: '--accent',
    authRequired: true,
    countKey: 'timeline',
  },
  {
    title: 'Saved Connections',
    description: 'Synastry charts and relationship readings you have saved.',
    href: '/birth-chart',
    icon: <Users className="w-6 h-6" />,
    accentVar: '--astro-venus',
    authRequired: true,
    countKey: 'connections',
  },
  {
    title: 'Account Settings',
    description: 'Update your profile, astrological data, and preferences.',
    href: '/account',
    icon: <User className="w-6 h-6" />,
    accentVar: '--muted-foreground',
    authRequired: true,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
    />
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-2xl md:text-3xl mb-6"
      style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
    >
      {children}
    </h2>
  );
}



// ─── Guest view ───────────────────────────────────────────────────────────────

function GuestSanctuary({ returnTo }: { returnTo: string }) {
  return (
    <>
      <Helmet>
        <title>My Sanctuary — Spellful</title>
        <meta name="description" content="Your private member hub on Spellful. Sign in to access your Grimoire, Tarot readings, Dream Journal, Cosmic Timeline, and more." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Stars bg */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: 40 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: 'hsl(var(--foreground))',
              }}
              animate={{ opacity: [0.03, 0.18, 0.03] }}
              transition={{ duration: 3 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 4 }}
            />
          ))}
        </div>

        <div className="relative max-w-2xl mx-auto px-5 sm:px-6 py-32 flex flex-col items-center text-center gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.3)' }}
          >
            <Lock className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1
              className="text-4xl md:text-5xl mb-4"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
            >
              {sanctuary.guest.title}
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {sanctuary.guest.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
          >
            <Link to={`/login?return=${encodeURIComponent(returnTo)}`} className="flex-1">
              <Button
                className="w-full gap-2"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                <Sparkles className="w-4 h-4" />
                {sanctuary.guest.signIn}
              </Button>
            </Link>
            <Link to={`/signup?return=${encodeURIComponent(returnTo)}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                {sanctuary.guest.createAccount}
              </Button>
            </Link>
          </motion.div>

          {/* Preview of what awaits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mt-4"
          >
            {HUB_CARDS.slice(0, 6).map((card, i) => (
              <div
                key={card.title}
                className="rounded-xl p-4 flex flex-col items-center gap-2 text-center opacity-60"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  style={{ color: `hsl(var(${card.accentVar}))` }}
                >
                  {card.icon}
                </motion.span>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {card.title}
                </p>
              </div>
            ))}
          </motion.div>

          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.6)', fontFamily: 'var(--font-sans)' }}>
            {sanctuary.guest.browseNote}{' '}
            <Link to="/" className="underline" style={{ color: 'hsl(var(--primary) / 0.8)' }}>{sanctuary.guest.browseLink}</Link>
          </p>
        </div>
      </main>
    </>
  );
}

// ─── Main Sanctuary (authenticated) ──────────────────────────────────────────

export default function SanctuaryPage() {
  const { session, isPending } = useSession();
  const location = useLocation();
  const [summary, setSummary] = useState<SanctuarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [moonPhase, setMoonPhase] = useState<{ name: string; glyph: string } | null>(null);

  // Moon phase for greeting
  useEffect(() => {
    try {
      const mp = getCurrentMoonPhase(new Date());
      const info = getMoonPhaseInfo(mp.phase);
      setMoonPhase({ name: info.name, glyph: info.glyph });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch('/api/sanctuary')
      .then((r) => r.json())
      .then((data: SanctuarySummary) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [session]);

  // useId must be called unconditionally — before any early returns — to keep
  // the hook count stable across session state changes (avoids React error #310).
  const rawId = useId();

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </main>
    );
  }

  if (!session) {
    return <GuestSanctuary returnTo={location.pathname} />;
  }

  const firstName = session.user.name?.split(' ')[0] ?? 'Seeker';
  // Stable per-mount event key — prevents double-consumption on re-renders
  const eventKey = `${session.user.id}-${rawId.replace(/:/g, '')}`;
  const hasAnyContent =
    summary &&
    (summary.counts.grimoire > 0 ||
      summary.counts.tarot > 0 ||
      summary.counts.rituals > 0 ||
      summary.counts.timeline > 0 ||
      summary.counts.connections > 0);

  return (
    <>
      <Helmet>
        <title>My Sanctuary — Spellful</title>
        <meta name="description" content="Your private member hub on Spellful — Grimoire, Tarot, Dream Journal, Cosmic Timeline, and more." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        {/* Ambient stars */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: 50 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: 'hsl(var(--foreground))',
              }}
              animate={{ opacity: [0.03, 0.15, 0.03] }}
              transition={{ duration: 4 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 5 }}
            />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-8">

          {/* ── Hero greeting ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mb-12 text-center overflow-hidden"
          >
            {/* Shooting star — fires once on sign-in, replays every 30–60 s */}
            <ShootingStar initialDelay={900} replayMin={35000} replayMax={65000} />
            {moonPhase && (
              <p
                className="text-4xl mb-3"
                aria-label={`Tonight's moon: ${moonPhase.name}`}
              >
                {moonPhase.glyph}
              </p>
            )}
            <h1
              className="text-4xl md:text-6xl mb-3"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
            >
              {sanctuary.greeting.title}, {firstName}
            </h1>
            <p
              className="text-base md:text-lg mb-5"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {moonPhase ? `The ${moonPhase.name} ${sanctuary.greeting.moonSubtitle}` : sanctuary.greeting.subtitle}
            </p>
            {/* Personalized magical quote */}
            <WelcomeQuote eventKey={eventKey} />
          </motion.div>

          {/* ── Continue Where You Left Off ── */}
          <AnimatePresence>
            {!loading && summary && summary.continueItems.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-12"
                aria-label="Continue where you left off"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                  <SectionHeading>{sanctuary.continueSection}</SectionHeading>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.continueItems.map((item, i) => (
                    <motion.div
                      key={`${item.type}-${i}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.07 }}
                    >
                      <Link
                        to={item.href}
                        className="group flex items-start gap-3 p-4 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--primary) / 0.4)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))'; }}
                      >
                        <span
                          className="mt-0.5 shrink-0"
                          style={{ color: 'hsl(var(--primary))' }}
                        >
                          {CONTINUE_ICONS[item.type] ?? <BookOpen className="w-4 h-4" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate mb-1"
                            style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                          >
                            {item.title}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full capitalize"
                            style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'hsl(var(--primary))' }}
                        />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Hub Cards ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
            aria-label="My Sanctuary features"
          >
            <SectionHeading>{sanctuary.sanctuarySection}</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {HUB_CARDS.map((card, i) => {
                const count = card.countKey && summary ? summary.counts[card.countKey] : undefined;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                  >
                    <Link
                      to={card.href}
                      className="group flex flex-col gap-3 p-5 rounded-2xl h-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = `hsl(var(${card.accentVar}) / 0.5)`;
                        (e.currentTarget as HTMLAnchorElement).style.background = `hsl(var(${card.accentVar}) / 0.06)`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))';
                        (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(var(--card))';
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: `hsl(var(${card.accentVar}) / 0.12)`,
                            color: `hsl(var(${card.accentVar}))`,
                          }}
                        >
                          {card.icon}
                        </div>
                        {count !== undefined && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                      <div>
                        <p
                          className="text-base mb-1"
                          style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                        >
                          {card.title}
                        </p>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                        >
                          {card.description}
                        </p>
                      </div>
                      <div className="mt-auto flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: `hsl(var(${card.accentVar}))` }}>
                        Open <ArrowRight className="w-3 h-3" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* ── Favorites ── */}
          <AnimatePresence>
            {!loading && summary && summary.favorites.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-12"
                aria-label="Favorites"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Heart className="w-4 h-4" style={{ color: 'hsl(var(--grimoire-ritual))' }} />
                  <SectionHeading>{sanctuary.favoritesSection}</SectionHeading>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.favorites.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                    >
                      <Link
                        to="/grimoire"
                        className="group flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--grimoire-ritual) / 0.4)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))'; }}
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: `${GRIMOIRE_TYPE_COLORS[entry.type] ?? 'hsl(var(--primary))'  }1a`,
                            color: GRIMOIRE_TYPE_COLORS[entry.type] ?? 'hsl(var(--primary))',
                          }}
                        >
                          {GRIMOIRE_TYPE_ICONS[entry.type] ?? <BookOpen className="w-3.5 h-3.5" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm truncate"
                            style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                          >
                            {entry.title}
                          </p>
                          <p
                            className="text-xs capitalize"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            {entry.type}
                          </p>
                        </div>
                        <Heart
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: 'hsl(var(--grimoire-ritual))' }}
                          fill="currentColor"
                        />
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link to="/grimoire">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      View all favorites <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Recent Activity ── */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              aria-label="Recent activity"
            >
              <SectionHeading>{sanctuary.recentSection}</SectionHeading>

              {!hasAnyContent ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl text-center"
                    style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px dashed hsl(var(--border))' }}
                  >
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}><BookOpen className="w-8 h-8" /></span>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{sanctuary.empty.grimoire}</p>
                    <Link to="/grimoire"><Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">{sanctuary.empty.grimoireCta} <ArrowRight className="w-3 h-3" /></Button></Link>
                  </div>
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl text-center"
                    style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px dashed hsl(var(--border))' }}
                  >
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}><Star className="w-8 h-8" /></span>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{sanctuary.empty.tarot}</p>
                    <Link to="/tarot"><Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">{sanctuary.empty.tarotCta} <ArrowRight className="w-3 h-3" /></Button></Link>
                  </div>
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl text-center"
                    style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px dashed hsl(var(--border))' }}
                  >
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}><Moon className="w-8 h-8" /></span>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{sanctuary.empty.ritual}</p>
                    <Link to="/moon-ritual"><Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">{sanctuary.empty.ritualCta} <ArrowRight className="w-3 h-3" /></Button></Link>
                  </div>
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl text-center"
                    style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px dashed hsl(var(--border))' }}
                  >
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}><ScrollText className="w-8 h-8" /></span>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{sanctuary.empty.timeline}</p>
                    <Link to="/timeline"><Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">{sanctuary.empty.timelineCta} <ArrowRight className="w-3 h-3" /></Button></Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Grimoire */}
                  {summary && summary.recent.grimoire.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className="text-lg"
                          style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                        >
                          {sanctuary.recentGrimoire}
                        </h3>
                        <Link
                          to="/grimoire"
                          className="text-xs flex items-center gap-1 transition-colors"
                          style={{ color: 'hsl(var(--primary))' }}
                        >
                          View all <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex flex-col gap-2">
                        {summary.recent.grimoire.map((entry) => (
                          <Link
                            key={entry.id}
                            to="/grimoire"
                            className="flex items-center gap-3 p-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))'; }}
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                background: `${GRIMOIRE_TYPE_COLORS[entry.type] ?? 'hsl(var(--primary))'}1a`,
                                color: GRIMOIRE_TYPE_COLORS[entry.type] ?? 'hsl(var(--primary))',
                              }}
                            >
                              {GRIMOIRE_TYPE_ICONS[entry.type] ?? <BookOpen className="w-3 h-3" />}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                {entry.title}
                              </p>
                              <p className="text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {entry.type} {entry.moonPhase ? `· ${entry.moonPhase}` : ''}
                              </p>
                            </div>
                            {entry.isFavorite && (
                              <Heart className="w-3 h-3 shrink-0" style={{ color: 'hsl(var(--grimoire-ritual))' }} fill="currentColor" />
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Tarot */}
                  {summary && summary.recent.tarot.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                          {sanctuary.recentTarot}
                        </h3>
                        <Link to="/tarot" className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--primary))' }}>
                          View all <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex flex-col gap-2">
                        {summary.recent.tarot.map((reading) => (
                          <Link
                            key={reading.id}
                            to="/tarot"
                            className="flex items-center gap-3 p-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--grimoire-tarot) / 0.3)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))'; }}
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: 'hsl(var(--grimoire-tarot) / 0.12)', color: 'hsl(var(--grimoire-tarot))' }}
                            >
                              <Star className="w-3.5 h-3.5" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                {reading.spreadName}
                              </p>
                              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {reading.intention ? reading.intention.slice(0, 40) + (reading.intention.length > 40 ? '…' : '') : reading.spreadType}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Timeline */}
                  {summary && summary.recent.timeline.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                          {sanctuary.recentTimeline}
                        </h3>
                        <Link to="/timeline" className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--primary))' }}>
                          View all <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex flex-col gap-2">
                        {summary.recent.timeline.map((entry) => (
                          <Link
                            key={entry.id}
                            to="/timeline"
                            className="flex items-center gap-3 p-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--accent) / 0.3)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))'; }}
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--accent))' }}
                            >
                              <ScrollText className="w-3.5 h-3.5" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                {entry.title}
                              </p>
                              <p className="text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {entry.type} · {entry.eventDate}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Saved Connections */}
                  {summary && summary.recent.connections.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                          {sanctuary.recentConnections}
                        </h3>
                        <Link to="/birth-chart" className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--primary))' }}>
                          View all <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex flex-col gap-2">
                        {summary.recent.connections.map((partner) => (
                          <Link
                            key={partner.id}
                            to="/birth-chart"
                            className="flex items-center gap-3 p-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--astro-venus) / 0.3)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))'; }}
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: 'hsl(var(--astro-venus) / 0.12)', color: 'hsl(var(--astro-venus))' }}
                            >
                              <Users className="w-3.5 h-3.5" />
                            </span>
                            <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                              {partner.partnerName}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          )}

          {/* ── Quick nav to Dashboard ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center"
          >
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {sanctuary.dashboardCta}
            </p>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                {sanctuary.dashboardButton}
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}
