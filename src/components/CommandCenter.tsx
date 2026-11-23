/**
 * CommandCenter — signed-in dashboard, mobile-first compact layout.
 *
 * Order (matches design spec):
 *  1. Top header bar — logo centered, hamburger left, profile right
 *  2. Welcome — "Welcome back, [Name] ✦", italic subtitle, moon-phase dot strip
 *  3. Tonight's Moon — compact card, clickable → /moon-ritual
 *  4. Your Daily Guidance — compact card, clickable → /horoscope
 *  5. Your Inner Universe — 3×2 icon grid + "Explore All →"
 *  6. Private Correspondence — full-width row → /messages
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Menu, User } from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import type { DailyHoroscope } from '@/lib/horoscope-engine';
import { getUpcomingEvents, formatEventDate, formatEventDay } from '@/lib/astro-feed';
import type { AstroEvent } from '@/lib/astro-feed';
import HoroscopeShareMenu from '@/components/HoroscopeShareMenu';
import { getMoonPhase } from '@/lib/moon-phase-engine';
import TwinkleStars from '@/components/TwinkleStars';

// ─── Moon glyph ───────────────────────────────────────────────────────────────
function moonGlyph(phase: string): string {
  const p = phase.toLowerCase();
  if (p.includes('new'))             return '🌑';
  if (p.includes('waxing crescent')) return '🌒';
  if (p.includes('first quarter'))   return '🌓';
  if (p.includes('waxing gibbous'))  return '🌔';
  if (p.includes('full'))            return '🌕';
  if (p.includes('waning gibbous'))  return '🌖';
  if (p.includes('last quarter') || p.includes('third quarter')) return '🌗';
  if (p.includes('waning crescent')) return '🌘';
  return '🌙';
}

// Moon phase dot strip — decorative ◐ ● ◑ ○ style
const PHASE_DOTS = ['◯', '◔', '◑', '◕', '●', '◕', '◑', '◔'];

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

// ─── Inner Universe grid items ────────────────────────────────────────────────
const UNIVERSE_ITEMS = [
  { id: 'tarot',    href: '/tarot',         glyph: '🃏', label: 'Tarot' },
  { id: 'rituals',  href: '/moon-ritual',   glyph: '🌙', label: 'Rituals' },
  { id: 'grimoire', href: '/grimoire',      glyph: '📖', label: 'Grimoire' },
  { id: 'astro',    href: '/astrology',     glyph: '⭐', label: 'Astrology' },
  { id: 'journal',  href: '/dream-journal', glyph: '💭', label: 'Journal' },
  { id: 'birth-chart', href: '/birth-chart', glyph: '🌌', label: 'Birth Chart' },
  { id: 'messages', href: '/messages',      glyph: '✉️', label: 'Inbox' },
];

// ─── Compact card wrapper ─────────────────────────────────────────────────────
function CompactCard({
  children, href, delay = 0,
}: {
  children: React.ReactNode;
  href: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' as const }}
    >
      <Link
        to={href}
        className="flex items-center justify-between w-full rounded-2xl px-4 py-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--primary) / 0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))';
        }}
        onTouchStart={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.classList.remove('tile-magical-glow');
          void el.offsetWidth;
          el.classList.add('tile-magical-glow');
          el.style.borderColor = 'hsl(var(--primary) / 0.6)';
        }}
        onTouchEnd={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))';
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

// ─── Tonight's Moon card ──────────────────────────────────────────────────────
interface MoonProps {
  phaseName: string;
  sign: string;
  illumination: number;
  message: string;
  moonBarLabel: string;
}

function MoonCard({ moon }: { moon: MoonProps }) {
  return (
    <CompactCard href="/moon-ritual" delay={0.1}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Moon glyph in a soft circle */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-4xl shrink-0"
          style={{
            background: 'hsl(var(--primary) / 0.12)',
            border: '1px solid hsl(var(--primary) / 0.25)',
          }}
          aria-hidden="true"
        >
          {moonGlyph(moon.phaseName)}
        </div>
        <div className="min-w-0">
          <p
            className="text-xs uppercase tracking-widest mb-0.5"
            style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em', fontSize: '0.65rem' }}
          >
            {moon.moonBarLabel}
          </p>
          <p
            className="leading-tight truncate"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 400, color: 'hsl(var(--foreground))' }}
          >
            {moon.phaseName}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
          >
            {moon.sign ? `${moon.sign} · ` : ''}{moon.illumination}% illuminated
          </p>
          <p
            className="text-xs mt-1 line-clamp-1"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}
          >
            {moon.message}
          </p>
        </div>
      </div>
      <span className="text-sm ml-3 shrink-0" style={{ color: 'hsl(var(--primary) / 0.5)' }} aria-hidden="true">›</span>
    </CompactCard>
  );
}

// ─── Your Daily Guidance card — full inline layout, no extra click ────────────
function DailyGuidanceCard() {
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const [noBirthDate, setNoBirthDate] = useState(false);

  const fetchHoroscope = useCallback(async () => {
    try {
      const res = await fetch('/api/horoscope/today');
      if (res.status === 400) {
        const data = await res.json() as { error: string };
        if (data.error === 'no_birth_date') { setNoBirthDate(true); return; }
      }
      if (!res.ok) return;
      const data = await res.json() as DailyHoroscope;
      setHoroscope(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void fetchHoroscope(); }, [fetchHoroscope]);

  // ── No birth date ──
  if (noBirthDate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl px-5 py-5"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em', fontSize: '0.65rem' }}>
          Your Day at a Glance
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontStyle: 'italic', color: 'hsl(var(--foreground))' }}>
          Add your birth date to unlock your daily reading.
        </p>
        <Link
          to="/account"
          className="inline-block mt-4 text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em' }}
        >
          Update Account →
        </Link>
      </motion.div>
    );
  }

  // ── Loading skeleton ──
  if (!horoscope) {
    return (
      <div
        className="rounded-2xl px-5 py-5 animate-pulse"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="h-2.5 w-32 rounded mb-5" style={{ background: 'hsl(var(--muted))' }} />
        <div className="h-10 w-4/5 rounded mb-4" style={{ background: 'hsl(var(--muted))' }} />
        <div className="h-4 w-full rounded mb-2" style={{ background: 'hsl(var(--muted))' }} />
        <div className="h-4 w-5/6 rounded mb-2" style={{ background: 'hsl(var(--muted))' }} />
        <div className="h-4 w-3/4 rounded mb-5" style={{ background: 'hsl(var(--muted))' }} />
        <div className="h-14 w-full rounded mb-5" style={{ background: 'hsl(var(--muted))' }} />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded" style={{ background: 'hsl(var(--muted))' }} />
          <div className="h-24 rounded" style={{ background: 'hsl(var(--muted))' }} />
        </div>
      </div>
    );
  }

  const signSymbol = SIGN_SYMBOLS[horoscope.sign] ?? '✦';
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="rounded-2xl px-5 pt-5 pb-4"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Eyebrow row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-0.5"
            style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em', fontSize: '0.65rem' }}
          >
            Your Day at a Glance
          </p>
          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
          >
            {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{signSymbol}</span>
            <span
              style={{
                color: 'hsl(var(--accent))',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                fontStyle: 'italic',
              }}
            >
              {horoscope.sign}
            </span>
          </div>
          <HoroscopeShareMenu horoscope={horoscope} />
        </div>
      </div>

      {/* Large italic headline */}
      <h3
        className="mb-5 leading-tight"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.8rem, 7vw, 2.6rem)',
          fontWeight: 300,
          fontStyle: 'italic',
          color: 'hsl(var(--foreground))',
        }}
      >
        {horoscope.headline}
      </h3>

      {/* Body paragraph */}
      <p
        className="mb-5 leading-relaxed"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1rem',
          fontWeight: 400,
          color: 'hsl(var(--foreground) / 0.85)',
          lineHeight: 1.75,
        }}
      >
        {horoscope.body}
      </p>

      {/* Planet note blockquote */}
      {horoscope.planetNote && (
        <blockquote
          className="mb-5 pl-4"
          style={{ borderLeft: '2px solid hsl(var(--primary) / 0.4)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.95rem',
              fontStyle: 'italic',
              color: 'hsl(var(--muted-foreground))',
              lineHeight: 1.65,
            }}
          >
            {horoscope.planetNote}
          </p>
        </blockquote>
      )}

      {/* How we calculate link */}
      <div className="flex justify-end mb-5">
        <Link
          to="/horoscope"
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          How we calculate this →
        </Link>
      </div>

      {/* Divider */}
      <div className="mb-5" style={{ borderTop: '1px solid hsl(var(--border))' }} />

      {/* DO / DON'T full columns */}
      <div className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <p
            className="text-xs uppercase mb-4"
            style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.28em', fontSize: '0.65rem' }}
          >
            Do
          </p>
          <div className="flex flex-col gap-3">
            {horoscope.do.map((item, i) => (
              <p
                key={i}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.05rem',
                  fontWeight: 400,
                  color: 'hsl(var(--foreground))',
                  lineHeight: 1.3,
                }}
              >
                {item}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p
            className="text-xs uppercase mb-4"
            style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.28em', fontSize: '0.65rem' }}
          >
            Don&apos;t
          </p>
          <div className="flex flex-col gap-3">
            {horoscope.dont.map((item, i) => (
              <p
                key={i}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.05rem',
                  fontStyle: 'italic',
                  color: 'hsl(var(--accent))',
                  lineHeight: 1.3,
                }}
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-4" style={{ borderTop: '1px solid hsl(var(--border))' }} />

      {/* Footer */}
      <p
        className="text-xs text-center"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
      >
        Updates at midnight · Returns tomorrow
      </p>
    </motion.div>
  );
}

// ─── Inner Universe grid ──────────────────────────────────────────────────────
function InnerUniverseGrid() {
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) return;
      const raw = (await res.json()) as { conversations?: Array<{ unreadCount: number }> } | Array<{ unreadCount: number }>;
      const data = Array.isArray(raw) ? raw : (raw.conversations ?? []);
      setUnread(data.reduce((s, c) => s + c.unreadCount, 0));
    } catch { /* badge stays 0 */ }
  }, []);

  useEffect(() => {
    void loadUnread();
    const id = setInterval(() => { void loadUnread(); }, 30_000);
    return () => clearInterval(id);
  }, [loadUnread]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.22 }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'hsl(var(--foreground))' }}
        >
          Your Inner Universe
        </p>
        <Link
          to="/dashboard"
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
        >
          Explore All →
        </Link>
      </div>

      {/* 3-column grid — 7 items, last tile full width */}
      <div className="grid grid-cols-3 gap-2.5">
        {UNIVERSE_ITEMS.map((item, i) => {
          const isInbox = item.id === 'messages';
          const isLast = i === UNIVERSE_ITEMS.length - 1 && UNIVERSE_ITEMS.length % 3 !== 0;
          return (
            <motion.div
              key={item.id}
              className={isLast ? 'col-span-3' : ''}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.93 }}
              transition={{ duration: 0.35, delay: 0.22 + i * 0.05, ease: 'easeOut' as const }}
            >
              <Link
                to={item.href}
                className="relative flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  minHeight: '80px',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--primary) / 0.4)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(var(--primary) / 0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(var(--card))';
                }}
                onTouchStart={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.classList.remove('tile-magical-glow');
                  // Force reflow so re-adding the class restarts the animation
                  void el.offsetWidth;
                  el.classList.add('tile-magical-glow');
                  el.style.borderColor = 'hsl(var(--primary) / 0.6)';
                  el.style.background = 'hsl(var(--primary) / 0.07)';
                }}
                onTouchEnd={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = 'hsl(var(--border))';
                  el.style.background = 'hsl(var(--card))';
                }}
                aria-label={isInbox && unread > 0 ? `${item.label} — ${unread} unread` : item.label}
              >
                {isInbox && unread > 0 && (
                  <span
                    className="absolute top-2 right-2 text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none"
                    style={{
                      background: 'hsl(var(--destructive) / 0.85)',
                      color: 'hsl(var(--destructive-foreground))',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.6rem',
                    }}
                    aria-hidden="true"
                  >
                    {unread}
                  </span>
                )}
                <span className="text-2xl leading-none" aria-hidden="true">{item.glyph}</span>
                <span
                  className="text-center leading-tight"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.7rem',
                    color: 'hsl(var(--foreground) / 0.85)',
                    fontWeight: 400,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Cosmic Weather Strip — brief atmospheric blurb between grid and calendar ──
// Rotating fallback phrases shown when no personalised horoscope is available
const COSMIC_WEATHER_FALLBACKS = [
  'The veil between worlds is thin tonight — trust what stirs beneath the surface.',
  'Celestial currents are shifting. Stay open to what the stars are whispering.',
  'A quiet magic moves through the cosmos. Let intuition be your compass today.',
  'The universe is rearranging itself in your favour. Breathe and receive.',
  'Ancient rhythms pulse through the sky. Your inner knowing is your greatest tool.',
  'Something is completing its cycle. Release what no longer serves your path.',
  'The cosmos invites stillness. In the pause, clarity finds you.',
];

function CosmicWeatherStrip() {
  // Start with index 0 on both server and client to avoid SSR hydration mismatch.
  // The useEffect immediately picks the correct day-based phrase and fetches live data.
  const [weather, setWeather] = useState<string>(COSMIC_WEATHER_FALLBACKS[0]!);

  useEffect(() => {
    // Set the day-based fallback first (client-only, safe from hydration mismatch)
    const fallbackIndex = new Date().getDate() % COSMIC_WEATHER_FALLBACKS.length;
    // eslint-disable-next-line security/detect-object-injection
    setWeather(COSMIC_WEATHER_FALLBACKS[fallbackIndex] ?? COSMIC_WEATHER_FALLBACKS[0]!);

    // Then try to fetch a personalised reading
    void (async () => {
      try {
        const res = await fetch('/api/horoscope/today');
        if (!res.ok) return; // keep fallback
        const data = await res.json() as DailyHoroscope;
        if (data.planetNote) {
          setWeather(data.planetNote);
        } else if (data.body) {
          const dotIdx = data.body.search(/[.!?]/);
          const firstSentence = dotIdx > 0 ? data.body.slice(0, dotIdx + 1) : data.body.slice(0, 120);
          setWeather(firstSentence);
        }
      } catch { /* keep fallback */ }
    })();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.24 }}
      className="rounded-2xl px-5 py-4 flex items-start gap-3"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">🌌</span>
      <div className="min-w-0">
        <p
          className="text-xs uppercase tracking-widest mb-1.5"
          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em', fontSize: '0.62rem' }}
        >
          Cosmic Weather
        </p>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.95rem',
            fontStyle: 'italic',
            color: 'hsl(var(--foreground) / 0.85)',
            lineHeight: 1.6,
          }}
        >
          {weather}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Cosmic Calendar card ─────────────────────────────────────────────────────
// Category colour map for compact calendar rows
const CAL_COLOR: Record<AstroEvent['category'], string> = {
  moon:    'hsl(var(--accent))',
  planet:  'hsl(var(--primary))',
  sun:     'hsl(var(--astro-sun-color))',
  eclipse: 'hsl(var(--destructive))',
  sabbat:  'hsl(var(--secondary))',
};

function CosmicCalendarCard() {
  const [events, setEvents] = useState<AstroEvent[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    const id = setTimeout(() => {
      setEvents(getUpcomingEvents(new Date(), 30));
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const visible = events.slice(0, 5);
  const todayStr = new Date().toDateString();

  function toggleExpand(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.27 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'hsl(var(--foreground))' }}>
          Cosmic Calendar
        </p>
        <Link
          to="/calendar"
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
        >
          View All →
        </Link>
      </div>

      {/* Event rows */}
      <div className="px-5 pb-5 flex flex-col">
        {visible.length === 0 && (
          <p className="text-xs py-4 text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            Loading events…
          </p>
        )}
        {visible.map((ev, i) => {
          const isToday = ev.date.toDateString() === todayStr;
          const color = CAL_COLOR[ev.category];
          const isOpen = expanded.has(i);
          const hasPractices = ev.practices && ev.practices.length > 0;

          return (
            <div
              key={`${ev.label}-${i}`}
              style={{ borderTop: i > 0 ? '1px solid hsl(var(--border))' : undefined }}
            >
              {/* Main row */}
              <button
                type="button"
                onClick={() => { if (hasPractices) toggleExpand(i); }}
                className="w-full flex items-start gap-3 text-left"
                style={{
                  cursor: hasPractices ? 'pointer' : 'default',
                  background: 'none',
                  border: 'none',
                  padding: '12px 0',
                  width: '100%',
                }}
                aria-expanded={hasPractices ? isOpen : undefined}
              >
                {/* Date column */}
                <div className="shrink-0 w-10 text-right">
                  <p className="text-xs font-semibold leading-tight" style={{ color, fontFamily: 'var(--font-sans)' }}>
                    {formatEventDay(ev.date)}
                  </p>
                  <p className="text-xs leading-tight" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {formatEventDate(ev.date)}
                  </p>
                </div>
                {/* Dot */}
                <div className="shrink-0 mt-1.5 w-2 h-2 rounded-full" style={{ background: color }} />
                {/* Label + glyph */}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm leading-snug"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontStyle: 'italic',
                      color: isToday ? color : 'hsl(var(--foreground))',
                    }}
                  >
                    <span className="mr-1.5 not-italic">{ev.glyph}</span>
                    {ev.label}
                    {isToday && (
                      <span className="ml-2 text-xs not-italic" style={{ color, fontFamily: 'var(--font-sans)' }}>
                        Today
                      </span>
                    )}
                  </p>
                  {ev.detail && (
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {ev.detail}
                    </p>
                  )}
                </div>
                {/* Chevron */}
                {hasPractices && (
                  <div
                    className="shrink-0 mt-1 transition-transform duration-200"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Expandable practices drawer */}
              {hasPractices && isOpen && (
                <div
                  className="pb-3 pl-14 pr-1"
                  style={{ borderTop: '1px dashed hsl(var(--border))' }}
                >
                  <p
                    className="pt-2 pb-1.5 font-semibold uppercase"
                    style={{ color, fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.06em' }}
                  >
                    ✦ Practices &amp; Rituals
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {ev.practices.map((p, pi) => (
                      <li
                        key={pi}
                        className="flex items-start gap-2 text-xs leading-snug"
                        style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                      >
                        <span style={{ color, flexShrink: 0, marginTop: '0.1em' }}>◆</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


// ─── Main component ───────────────────────────────────────────────────────────
export default function CommandCenter() {
  const { session } = useSession();
  const navigate = useNavigate();

  // Compute moon data internally — safe on SSR (static initial) and hydrates client-side
  const [moon, setMoon] = useState<{
    phaseName: string;
    sign: string;
    illumination: number;
    message: string;
    moonBarLabel: string;
  }>({
    phaseName: 'Full Moon',
    sign: '',
    illumination: 100,
    message: 'The moon illuminates your path.',
    moonBarLabel: "Tonight's Moon",
  });

  useEffect(() => {
    try {
      const result = getMoonPhase(new Date());
      setMoon(prev => ({
        ...prev,
        phaseName: result.phase,
        illumination: Math.round(result.illumination),
      }));
    } catch {
      // keep defaults
    }
  }, []);

  if (!session) return null;

  const user = session.user;
  const displayName = user.name ?? user.email?.split('@')[0] ?? 'Witch';
  const firstName = displayName.split(' ')[0];
  const userImage = (user as { image?: string | null }).image ?? null;

  // Pick a phase dot index based on phase name
  const phaseIndex = (() => {
    const p = moon.phaseName.toLowerCase();
    if (p.includes('new'))             return 0;
    if (p.includes('waxing crescent')) return 1;
    if (p.includes('first quarter'))   return 2;
    if (p.includes('waxing gibbous'))  return 3;
    if (p.includes('full'))            return 4;
    if (p.includes('waning gibbous'))  return 5;
    if (p.includes('last quarter') || p.includes('third quarter')) return 6;
    if (p.includes('waning crescent')) return 7;
    return 4;
  })();

  return (
    <section
      aria-label="Your magical sanctuary"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* ── Top header bar ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{
          background: 'hsl(var(--background) / 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        {/* Hamburger */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ color: 'hsl(var(--foreground) / 0.7)' }}
          aria-label="Open menu"
          onClick={() => { /* nav drawer hook point */ }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center" aria-label="Spellful home">
          <img
            src="/airo-assets/images/logo/horizontal"
            alt="Spellful"
            className="h-auto w-auto object-contain"
            style={{ maxHeight: '32px', maxWidth: '140px' }}
          />
        </Link>

        {/* Profile */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ color: 'hsl(var(--foreground) / 0.7)' }}
          aria-label="Account"
          onClick={() => { void navigate('/account'); }}
        >
          {userImage ? (
            <img
              src={userImage}
              alt={user.name ?? 'Profile'}
              className="w-7 h-7 rounded-full object-cover"
              style={{ outline: '1.5px solid hsl(var(--primary) / 0.5)', outlineOffset: '1px' }}
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* ── Welcome + moon dots ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative px-5 pt-6 pb-5 text-center overflow-hidden"
      >
        <TwinkleStars count={32} opacity={0.55} />
        <h2
          className="leading-tight mb-1"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
            fontWeight: 400,
            color: 'hsl(var(--foreground))',
          }}
        >
          Welcome back, {firstName} ✦
        </h2>
        <p
          className="mb-4"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.95rem',
            fontStyle: 'italic',
            color: 'hsl(var(--muted-foreground))',
            fontWeight: 300,
          }}
        >
          The stars are brighter with you here.
        </p>
        {/* Moon phase dot strip */}
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {PHASE_DOTS.map((dot, i) => (
            <span
              key={i}
              style={{
                fontSize: i === phaseIndex ? '1rem' : '0.65rem',
                color: i === phaseIndex ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)',
                transition: 'all 0.2s',
                lineHeight: 1,
              }}
            >
              {dot}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Cards stack ── */}
      <div className="px-4 pb-8 flex flex-col gap-3">
        <MoonCard moon={moon} />
        <DailyGuidanceCard />
        <InnerUniverseGrid />
        <CosmicWeatherStrip />
        <CosmicCalendarCard />
      </div>
    </section>
  );
}
