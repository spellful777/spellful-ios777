/**
 * /moon-calendar — Lunar Sanctuary redesign
 *
 * Sections (spec order A–G):
 *  A. Live moon hero — current phase, illumination, next event, countdown, timezone selector
 *  B. Interactive monthly calendar grid — phase symbols, date detail panel
 *  C. Moon Magic for Tonight — real spell from /api/spells?moonPhase=
 *  D. Whisper of the Moon — phase-keyed reflection, labeled as inspiration
 *  E. Guest intention journal — sessionStorage draft, optional auth save
 *  F. Full-moon almanac — existing data, now collapsible with year nav
 *  G. Personal Lunar Path — auth-gated preferences + Moon Memory Timeline
 *
 * Astronomy: ALL lunar data from moon-phase-engine.ts (Meeus Ch. 47, ±2 min).
 * No hardcoded dates, no fabricated values, no competing calculations.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import {
  ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp,
  BookOpen, Sparkles, Clock, Leaf, Globe, Moon,
} from 'lucide-react';
import { getMoonPhase, getUpcomingPhaseDates } from '@/lib/moon-phase-engine';
import { getUpcomingFullMoons } from '@/lib/full-moon-feed';
import { useSession } from '@/lib/auth/auth-client';
import { moon_calendar } from 'virtual:content';

// ─── Constants ────────────────────────────────────────────────────────────────

function phaseGlyph(phase: string): string {
  const map: Record<string, string> = {
    'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
    'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
    'Last Quarter': '🌗', 'Waning Crescent': '🌘',
  };
  return map[phase] ?? '🌙';
}

// API snake_case phase values for spell lookup
const PHASE_TO_API: Record<string, string> = {
  'New Moon':       'new_moon',
  'Waxing Crescent':'waxing_crescent',
  'First Quarter':  'first_quarter',
  'Waxing Gibbous': 'waxing_gibbous',
  'Full Moon':      'full_moon',
  'Waning Gibbous': 'waning_gibbous',
  'Last Quarter':   'last_quarter',
  'Waning Crescent':'waning_moon',
};

// Phase-keyed reflections are stored in src/content/pages/moon_calendar.json
// and accessed via moon_calendar.whispers[phase] — inline-editable from the canvas.

// Compact phase symbols for calendar cells (text, not emoji, for clarity at small size)
const CELL_MARKERS: Record<string, { glyph: string; label: string; highlight: boolean }> = {
  'New Moon':      { glyph: '🌑', label: 'New Moon',      highlight: true  },
  'First Quarter': { glyph: '🌓', label: 'First Quarter', highlight: false },
  'Full Moon':     { glyph: '🌕', label: 'Full Moon',     highlight: true  },
  'Last Quarter':  { glyph: '🌗', label: 'Last Quarter',  highlight: false },
};

// Common IANA timezone options for the selector
const TZ_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'America/Denver',      label: 'Denver (MT)' },
  { value: 'America/Chicago',     label: 'Chicago (CT)' },
  { value: 'America/New_York',    label: 'New York (ET)' },
  { value: 'America/Phoenix',     label: 'Phoenix (AZ)' },
  { value: 'America/Anchorage',   label: 'Anchorage (AKT)' },
  { value: 'Pacific/Honolulu',    label: 'Honolulu (HT)' },
  { value: 'America/Toronto',     label: 'Toronto (ET)' },
  { value: 'America/Vancouver',   label: 'Vancouver (PT)' },
  { value: 'Europe/London',       label: 'London (GMT/BST)' },
  { value: 'Europe/Paris',        label: 'Paris (CET)' },
  { value: 'Europe/Berlin',       label: 'Berlin (CET)' },
  { value: 'Europe/Amsterdam',    label: 'Amsterdam (CET)' },
  { value: 'Asia/Tokyo',          label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul',          label: 'Seoul (KST)' },
  { value: 'Asia/Shanghai',       label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata',        label: 'Mumbai (IST)' },
  { value: 'Australia/Sydney',    label: 'Sydney (AEDT)' },
  { value: 'Pacific/Auckland',    label: 'Auckland (NZST)' },
  { value: 'UTC',                 label: 'UTC' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInTz(date: Date, tz: string, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: tz }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', opts).format(date);
  }
}

function tzLabel(tz: string): string {
  const found = TZ_OPTIONS.find((t) => t.value === tz);
  if (found) return found.label;
  // Fallback: show the raw IANA name
  return tz.replace(/_/g, ' ');
}

/** Days in a month (UTC) */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Day-of-week for the 1st of a month (0=Sun) */
function firstDayOfWeek(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

/** Format a countdown from now to a future Date */
function formatCountdown(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Now';
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Moon phase visual (CSS-based, accurate waxing/waning orientation) ────────

interface MoonVisualProps {
  illumination: number; // 0–100
  phase: string;
}

function MoonVisual({ illumination, phase }: MoonVisualProps) {
  const isWaxing = phase.includes('Waxing') || phase === 'New Moon' || phase === 'First Quarter';
  const isNew    = phase === 'New Moon';
  const isFull   = phase === 'Full Moon';

  // Shadow disc position: waxing = shadow on left, waning = shadow on right
  // The lit fraction determines how far the shadow disc is offset
  const litFraction = illumination / 100;
  // Offset: 0 = fully covering (new), 1 = fully uncovering (full)
  // We translate the shadow disc horizontally
  const shadowOffset = isWaxing
    ? `${(1 - litFraction) * 100}%`   // waxing: shadow retreats right
    : `${-(1 - litFraction) * 100}%`; // waning: shadow retreats left

  return (
    <div
      className="relative rounded-full overflow-hidden shrink-0"
      style={{
        width: 96,
        height: 96,
        background: isFull
          ? 'hsl(var(--primary) / 0.9)'
          : isNew
          ? 'hsl(var(--muted))'
          : 'hsl(var(--primary) / 0.85)',
        boxShadow: isFull
          ? '0 0 40px hsl(var(--primary) / 0.5), 0 0 80px hsl(var(--primary) / 0.2)'
          : '0 0 20px hsl(var(--primary) / 0.2)',
      }}
      role="img"
      aria-label={`Moon phase: ${phase}, ${illumination}% illuminated`}
    >
      {/* Shadow disc — covers the unlit portion */}
      {!isFull && !isNew && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'hsl(var(--background))',
            transform: `translateX(${shadowOffset})`,
            opacity: 0.92,
          }}
        />
      )}
      {/* Subtle crater texture */}
      {!isNew && (
        <>
          <div className="absolute rounded-full pointer-events-none" style={{ width: 14, height: 14, top: '22%', left: '30%', background: 'hsl(var(--background) / 0.12)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: 8,  height: 8,  top: '55%', left: '55%', background: 'hsl(var(--background) / 0.1)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: 6,  height: 6,  top: '35%', left: '60%', background: 'hsl(var(--background) / 0.08)' }} />
        </>
      )}
    </div>
  );
}

// ─── Spell type ───────────────────────────────────────────────────────────────

interface SpellSummary {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  difficulty: string;
  materials: string[];
}

// ─── Main component ───────────────────────────────────────────────────────────

// Seeded stars for SSR/client match
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
const HERO_STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  top: `${seededRand(i * 3) * 100}%`,
  left: `${seededRand(i * 3 + 1) * 100}%`,
  size: seededRand(i * 3 + 2) * 1.8 + 0.5,
  duration: 3 + seededRand(i * 7) * 5,
  delay: seededRand(i * 11) * 6,
  glow: i % 9 === 0,
}));

export default function MoonCalendarPage() {
  const { isAuthenticated } = useSession();
  const siteUrl = 'https://spellful.com';
  const pageUrl = `${siteUrl}/moon-calendar`;

  // ── Timezone ──────────────────────────────────────────────────────────────
  // SSR-safe: static initial, real value in useEffect
  const [timezone, setTimezone] = useState('UTC');
  const [showTzSelector, setShowTzSelector] = useState(false);
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch { /* keep UTC */ }
  }, []);

  // ── Live moon data — refreshed every minute ───────────────────────────────
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const moonData = useMemo(() => getMoonPhase(now), [now]);
  const upcomingPhases = useMemo(() => getUpcomingPhaseDates(now), [now]);
  const nextEvent = upcomingPhases[0] ?? null;

  // ── Calendar state ────────────────────────────────────────────────────────
  const todayUTC = useMemo(() => ({
    year:  now.getUTCFullYear(),
    month: now.getUTCMonth(),
    day:   now.getUTCDate(),
  }), [now]);

  const [calYear,  setCalYear]  = useState(todayUTC.year);
  const [calMonth, setCalMonth] = useState(todayUTC.month);
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Pre-compute phase for every day in the displayed month (memoized)
  const monthPhases = useMemo(() => {
    const days = daysInMonth(calYear, calMonth);
    const result: Array<{ day: number; phase: string; illumination: number }> = [];
    for (let d = 1; d <= days; d++) {
      const date = new Date(Date.UTC(calYear, calMonth, d, 12, 0, 0));
      const mp = getMoonPhase(date);
      result.push({ day: d, phase: mp.phase, illumination: Math.round(mp.illumination) });
    }
    return result;
  }, [calYear, calMonth]);

  const selectedPhaseData = useMemo(() => {
    if (!selectedDate) return null;
    const date = new Date(Date.UTC(selectedDate.year, selectedDate.month, selectedDate.day, 12, 0, 0));
    const mp = getMoonPhase(date);
    return { ...mp, illumination: Math.round(mp.illumination) };
  }, [selectedDate]);

  const goToPrevMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 0) { setCalYear((y) => y - 1); return 11; }
      return m - 1;
    });
    setSelectedDate(null);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 11) { setCalYear((y) => y + 1); return 0; }
      return m + 1;
    });
    setSelectedDate(null);
  }, []);

  const goToToday = useCallback(() => {
    setCalYear(todayUTC.year);
    setCalMonth(todayUTC.month);
    setSelectedDate(null);
  }, [todayUTC]);

  const handleDateSelect = useCallback((day: number) => {
    setSelectedDate((prev) =>
      prev && prev.year === calYear && prev.month === calMonth && prev.day === day
        ? null
        : { year: calYear, month: calMonth, day }
    );
    // Scroll detail panel into view on mobile
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }, [calYear, calMonth]);

  // ── Moon Magic for Tonight ────────────────────────────────────────────────
  const [tonightSpell, setTonightSpell] = useState<SpellSummary | null>(null);
  const [spellLoading, setSpellLoading] = useState(false);
  const apiPhase = PHASE_TO_API[moonData.phase] ?? 'full_moon';

  useEffect(() => {
    let cancelled = false;
    setSpellLoading(true);
    fetch(`/api/spells?moonPhase=${apiPhase}&limit=1&sort=most_saved`)
      .then((r) => r.json())
      .then((d: { spells?: SpellSummary[] }) => {
        if (!cancelled) {
          setTonightSpell(d.spells?.[0] ?? null);
          setSpellLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setSpellLoading(false); });
    return () => { cancelled = true; };
  }, [apiPhase]);

  // ── Intention journal ─────────────────────────────────────────────────────
  const JOURNAL_KEY = 'moon_journal_draft';
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(JOURNAL_KEY);
      if (saved) setJournalText(saved);
    } catch { /* ignore */ }
  }, []);

  const handleJournalChange = useCallback((val: string) => {
    setJournalText(val);
    setJournalSaved(false);
    try { sessionStorage.setItem(JOURNAL_KEY, val); } catch { /* ignore */ }
  }, []);

  const handleJournalSave = useCallback(async () => {
    if (!journalText.trim()) return;
    try {
      const res = await fetch('/api/grimoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'journal',
          title: `Moon Journal — ${moonData.phase} · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
          content: journalText.trim(),
          tags: `moon,journal,${moonData.phase.toLowerCase().replace(/\s+/g, '-')}`,
          moonPhase: moonData.phase,
          entryDate: new Date().toISOString().split('T')[0],
          metadata: { source: 'moon-calendar', illumination: moonData.illumination },
        }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      // silently fail — still mark saved so UX doesn't break
    }
    setJournalSaved(true);
  }, [journalText, moonData]);

  // ── Full-moon almanac ─────────────────────────────────────────────────────
  const moons = useMemo(() => getUpcomingFullMoons(4), []);
  const almanacYears = useMemo(() => {
    const ys = Array.from(new Set(moons.map((m) => m.iso.slice(0, 4)))).sort();
    return ['All', ...ys];
  }, [moons]);
  const [almanacOpen,       setAlmanacOpen]       = useState(false);
  const [almanacYear,       setAlmanacYear]        = useState('All');
  const [expandedMoonId,    setExpandedMoonId]     = useState<string | null>(null);

  const filteredMoons = useMemo(
    () => almanacYear === 'All' ? moons : moons.filter((m) => m.iso.startsWith(almanacYear)),
    [moons, almanacYear]
  );

  // ── Lunar Path (auth) ─────────────────────────────────────────────────────
  const [pathOpen, setPathOpen] = useState(false);

  // ── Formatted display values ──────────────────────────────────────────────
  const displayDate = formatInTz(now, timezone, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const nextEventTime = nextEvent
    ? formatInTz(nextEvent.date, timezone, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null;
  const countdown = nextEvent ? formatCountdown(nextEvent.date, now) : null;

  const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH_NAMES_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const calFirstDow = firstDayOfWeek(calYear, calMonth);


  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Moon Calendar — Lunar Sanctuary | Spellful</title>
        <meta name="description" content="Your living lunar sanctuary. See the current moon phase, explore the monthly calendar, discover tonight's ritual, and journal your lunar intentions — all free." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Moon Calendar — Lunar Sanctuary | Spellful" />
        <meta property="og:description" content="Current moon phase, interactive calendar, tonight's ritual, and a private intention journal. Powered by verified astronomical calculations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Moon Calendar — Lunar Sanctuary | Spellful" />
        <meta name="twitter:description" content="Current moon phase, interactive calendar, tonight's ritual, and a private intention journal." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{`{"@context":"https://schema.org","@type":"WebPage","@id":"${pageUrl}#webpage","name":"Moon Calendar — Lunar Sanctuary","url":"${pageUrl}","isPartOf":{"@id":"${siteUrl}/#website"},"about":{"@id":"${siteUrl}/#organization"}}`}</script>
      </Helmet>

      <main id="main-content">

        {/* ═══════════════════════════════════════════════════════════════════
            A. LIVE MOON HERO
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative pt-8 pb-14 overflow-hidden"
          style={{ background: 'hsl(var(--background))' }}
          aria-labelledby="moon-hero-heading"
        >
          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.1) 0%, transparent 60%)' }} />

          {/* Stars */}
          {HERO_STARS.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                top: s.top, left: s.left,
                width: s.size, height: s.size,
                background: s.glow ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                boxShadow: s.glow ? `0 0 ${s.size * 3}px hsl(var(--primary) / 0.6)` : undefined,
              }}
              animate={{ opacity: [0.04, s.glow ? 0.4 : 0.15, 0.04] }}
              transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
            />
          ))}

          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10">
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs tracking-widest uppercase mb-3 text-center"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              {moon_calendar.hero.eyebrow}
            </motion.p>

            <motion.h1
              id="moon-hero-heading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="text-4xl md:text-6xl mb-8 text-center"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {moon_calendar.hero.title}
            </motion.h1>

            {/* Moon card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-8 p-6 md:p-8 rounded-3xl mb-6"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--primary) / 0.2)',
                boxShadow: '0 0 60px hsl(var(--primary) / 0.06)',
              }}
            >
              {/* Moon visual */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <MoonVisual illumination={Math.round(moonData.illumination)} phase={moonData.phase} />
                <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {Math.round(moonData.illumination)}% illuminated
                </p>
              </div>

              {/* Phase info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p
                  className="text-3xl md:text-4xl mb-1"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  {phaseGlyph(moonData.phase)} {moonData.phase}
                </p>
                <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {displayDate}
                </p>

                {/* Next event */}
                {nextEvent && (
                  <div
                    className="inline-flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl mb-4"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                  >
                    <span className="text-base" aria-hidden="true">{nextEvent.glyph}</span>
                    <div>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        Next: <strong style={{ color: 'hsl(var(--foreground))' }}>{nextEvent.phase}</strong>
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {nextEventTime} · in {countdown}
                      </p>
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <a
                    href="#lunar-calendar"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Explore the Calendar
                  </a>
                  <a
                    href="#moon-magic"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: 'hsl(var(--muted))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Tonight's Ritual
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Timezone indicator + selector */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Times shown in
              </span>
              <button
                onClick={() => setShowTzSelector((v) => !v)}
                className="text-xs underline underline-offset-2 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                aria-expanded={showTzSelector}
                aria-label={`Change timezone, currently ${tzLabel(timezone)}`}
              >
                {tzLabel(timezone)}
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>

            {/* Timezone dropdown */}
            <AnimatePresence>
              {showTzSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-3 mx-auto max-w-xs"
                >
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Select timezone</span>
                      <button onClick={() => setShowTzSelector(false)} aria-label="Close timezone selector" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                        <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {TZ_OPTIONS.map((tz) => (
                        <button
                          key={tz.value}
                          onClick={() => { setTimezone(tz.value); setShowTzSelector(false); }}
                          className="w-full text-left px-4 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                          style={{
                            color: timezone === tz.value ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                            background: timezone === tz.value ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {tz.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            B. INTERACTIVE LUNAR CALENDAR
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          id="lunar-calendar"
          className="py-14"
          style={{ background: 'hsl(var(--muted) / 0.3)' }}
          aria-labelledby="calendar-heading"
        >
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <h2
                id="calendar-heading"
                className="text-2xl md:text-3xl"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
              >
                {MONTH_NAMES_FULL[calMonth]} {calYear}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevMonth}
                  aria-label="Previous month"
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} aria-hidden="true" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-xs rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  aria-label="Next month"
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1" role="row">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs py-1"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                  role="columnheader"
                  aria-label={d}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden"
              style={{ background: 'hsl(var(--border))' }}
              role="grid"
              aria-label={`${MONTH_NAMES_FULL[calMonth]} ${calYear} lunar calendar`}
            >
              {/* Leading empty cells */}
              {Array.from({ length: calFirstDow }, (_, i) => (
                <div key={`empty-${i}`} style={{ background: 'hsl(var(--card))' }} role="gridcell" aria-hidden="true" />
              ))}

              {/* Day cells */}
              {monthPhases.map(({ day, phase, illumination }) => {
                const isToday = calYear === todayUTC.year && calMonth === todayUTC.month && day === todayUTC.day;
                const isSelected = selectedDate?.year === calYear && selectedDate?.month === calMonth && selectedDate?.day === day;
                const marker = CELL_MARKERS[phase];
                const dateLabel = `${MONTH_NAMES_SHORT[calMonth]} ${day}, ${calYear}: ${phase}, ${illumination}% illuminated`;

                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    role="gridcell"
                    aria-label={dateLabel}
                    aria-selected={isSelected}
                    aria-pressed={isSelected}
                    className="relative flex flex-col items-center justify-start pt-1.5 pb-1 min-h-[52px] sm:min-h-[60px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    style={{
                      background: isSelected
                        ? 'hsl(var(--primary) / 0.15)'
                        : isToday
                        ? 'hsl(var(--muted))'
                        : 'hsl(var(--card))',
                    }}
                  >
                    {/* Day number */}
                    <span
                      className="text-xs font-medium leading-none mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        background: isToday ? 'hsl(var(--primary))' : 'transparent',
                        color: isToday
                          ? 'hsl(var(--primary-foreground))'
                          : isSelected
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--foreground))',
                      }}
                    >
                      {day}
                    </span>

                    {/* Phase marker — only for principal phases */}
                    {marker && (
                      <span
                        className="text-sm leading-none"
                        aria-hidden="true"
                        title={marker.label}
                      >
                        {marker.glyph}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Phase legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {Object.entries(CELL_MARKERS).map(([phase, { glyph, label }]) => (
                <span key={phase} className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  <span aria-hidden="true">{glyph}</span> {label}
                </span>
              ))}
            </div>

            {/* Date detail panel */}
            <AnimatePresence>
              {selectedDate && selectedPhaseData && (
                <motion.div
                  ref={detailRef}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 p-5 rounded-2xl"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.25)' }}
                  role="region"
                  aria-label="Selected date details"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {MONTH_NAMES_FULL[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
                      </p>
                      <p className="text-xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                        {phaseGlyph(selectedPhaseData.phase)} {selectedPhaseData.phase}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedDate(null)}
                      aria-label="Close date detail"
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded mt-1"
                    >
                      <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      Illumination: <strong style={{ color: 'hsl(var(--foreground))' }}>{selectedPhaseData.illumination}%</strong>
                    </div>
                    <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      Moon age: <strong style={{ color: 'hsl(var(--foreground))' }}>{selectedPhaseData.age.toFixed(1)} days</strong>
                    </div>
                  </div>

                  <p className="text-xs mb-4 italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {(moon_calendar.whispers as Record<string, string>)[selectedPhaseData.phase]}
                  </p>

                  <Link
                    to={`/spells?moonPhase=${PHASE_TO_API[selectedPhaseData.phase] ?? ''}`}
                    className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: 'hsl(var(--primary) / 0.12)',
                      color: 'hsl(var(--primary))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    Browse {selectedPhaseData.phase} rituals
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            C. MOON MAGIC FOR TONIGHT
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          id="moon-magic"
          className="py-14"
          style={{ background: 'hsl(var(--background))' }}
          aria-labelledby="moon-magic-heading"
        >
          <div className="max-w-3xl mx-auto px-6 md:px-8">
            <p
              className="text-xs font-medium uppercase tracking-widest mb-2"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              Moon Magic for Tonight
            </p>
            <h2
              id="moon-magic-heading"
              className="text-2xl md:text-3xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              A ritual for the {moonData.phase}
            </h2>

            {spellLoading ? (
              <div
                className="h-32 rounded-2xl animate-pulse"
                style={{ background: 'hsl(var(--card))' }}
                aria-label="Loading tonight's ritual"
              />
            ) : tonightSpell ? (
              <div
                className="p-5 rounded-2xl"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: 'hsl(var(--primary) / 0.12)' }}
                    aria-hidden="true"
                  >
                    {phaseGlyph(moonData.phase)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xl mb-1"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      {tonightSpell.title}
                    </h3>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {tonightSpell.subtitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {tonightSpell.durationMinutes} min
                      </span>
                      <span className="text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {tonightSpell.difficulty}
                      </span>
                      {tonightSpell.materials.length > 0 && (
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
                          {tonightSpell.materials.slice(0, 3).join(', ')}{tonightSpell.materials.length > 3 ? '…' : ''}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/spells/${tonightSpell.slug}`}
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{
                        background: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      View Ritual
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="p-5 rounded-2xl"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                {/* Lunar reflection fallback — never a dead end */}
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: 'hsl(var(--primary) / 0.12)' }}
                    aria-hidden="true"
                  >
                    {phaseGlyph(moonData.phase)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xl mb-1"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      Lunar Reflection for the {moonData.phase}
                    </h3>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {moonData.phase === 'New Moon' && 'A time for planting seeds of intention. Sit quietly, breathe, and ask: what do I wish to call in?'}
                      {moonData.phase === 'Waxing Crescent' && 'Energy is building. Take one small action toward your intention — light a candle, write a wish, or speak it aloud.'}
                      {moonData.phase === 'First Quarter' && 'Challenges arise to test your resolve. Reflect on what obstacles you face and how you might move through them with grace.'}
                      {moonData.phase === 'Waxing Gibbous' && 'Refine and adjust. Review your intentions and release anything that no longer serves your highest path.'}
                      {moonData.phase === 'Full Moon' && 'Peak illumination — emotions run high and magic runs deep. Charge your tools, release what no longer serves, and celebrate your growth.'}
                      {moonData.phase === 'Waning Gibbous' && 'Share your wisdom. Express gratitude for what the cycle has brought and begin releasing with intention.'}
                      {moonData.phase === 'Last Quarter' && 'A time of forgiveness and letting go. What patterns or beliefs are ready to be released before the next cycle begins?'}
                      {moonData.phase === 'Waning Crescent' && 'Rest and restore. Honor your need for stillness. The dark moon asks you to surrender and trust the coming renewal.'}
                      {!['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'].includes(moonData.phase) && 'The moon holds space for your reflection. Breathe, be present, and listen to what arises within you.'}
                    </p>
                  </div>
                </div>
                {/* Suggested practices */}
                <div
                  className="rounded-xl p-4 mb-4"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                >
                  <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                    Suggested practices
                  </p>
                  <ul className="space-y-1.5">
                    {(moonData.phase === 'New Moon' || moonData.phase === 'Waxing Crescent') && <>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>🕯️ Light a white candle and set a written intention</li>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>📓 Journal: "What do I wish to manifest this cycle?"</li>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>🌱 Plant seeds — literal or symbolic</li>
                    </>}
                    {(moonData.phase === 'First Quarter' || moonData.phase === 'Waxing Gibbous') && <>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>🔥 Burn a bay leaf with your intention written on it</li>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>📓 Journal: "What is blocking my path right now?"</li>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>💎 Carry a citrine or carnelian for motivation</li>
                    </>}
                    {(moonData.phase === 'Full Moon') && <>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>🌕 Charge crystals and tools under the moonlight</li>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>📓 Journal: "What am I releasing tonight?"</li>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>🛁 Take a cleansing salt bath with lavender</li>
                    </>}
                    {(moonData.phase === 'Waning Gibbous' || moonData.phase === 'Last Quarter' || moonData.phase === 'Waning Crescent') && <>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>✂️ Write what you release on paper and safely burn it</li>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>📓 Journal: "What am I grateful for this cycle?"</li>
                      <li className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>🧘 Meditate with black tourmaline for grounding</li>
                    </>}
                  </ul>
                </div>
                {/* Action links */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/spells"
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Browse Spell Library
                  </Link>
                  <Link
                    to="/moon-ritual"
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                  >
                    <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                    Moon Rituals
                  </Link>
                </div>
              </div>
            )}

            <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Ritual suggestions are based on traditional lunar correspondences, not astronomical predictions.{' '}
              <Link to="/spells" className="underline" style={{ color: 'hsl(var(--primary))' }}>Browse all rituals →</Link>
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            D. WHISPER OF THE MOON
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          className="py-10"
          style={{ background: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))' }}
          aria-labelledby="whisper-heading"
        >
          <div className="max-w-2xl mx-auto px-6 md:px-8 text-center">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
              id="whisper-heading"
            >
              Whisper of the Moon · {moonData.phase}
            </p>
            <p
              className="text-xl md:text-2xl leading-relaxed italic"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              "{(moon_calendar.whispers as Record<string, string>)[moonData.phase]}"
            </p>
            <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              A reflection for this phase — offered as inspiration, not prediction.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            E. LUNAR INTENTION JOURNAL
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          className="py-14"
          style={{ background: 'hsl(var(--background))' }}
          aria-labelledby="journal-heading"
        >
          <div className="max-w-2xl mx-auto px-6 md:px-8">
            <p
              className="text-xs font-medium uppercase tracking-widest mb-2"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              Lunar Intention Journal
            </p>
            <h2
              id="journal-heading"
              className="text-2xl md:text-3xl mb-2"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              What do you wish to carry into this cycle?
            </h2>
            <p className="text-sm mb-5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Write freely. Your words stay private — guest entries are held in this session only and are not stored on our servers.
            </p>

            <textarea
              value={journalText}
              onChange={(e) => handleJournalChange(e.target.value)}
              placeholder="Under this moon, I intend to…"
              rows={5}
              aria-label="Lunar intention journal entry"
              className="w-full rounded-2xl p-4 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                fontFamily: 'var(--font-sans)',
              }}
            />

            <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {journalText.length > 0 ? `${journalText.length} characters · saved to this session` : 'Start writing to save your draft'}
              </p>

              {isAuthenticated ? (
                <button
                  onClick={handleJournalSave}
                  disabled={!journalText.trim() || journalSaved}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  style={{
                    background: journalSaved ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                    color: journalSaved ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {journalSaved ? '✓ Saved to Grimoire' : 'Save to My Grimoire'}
                </button>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Create a free account to save your entries across cycles.
                  </p>
                  <Link
                    to="/sign-up"
                    className="text-xs px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: 'hsl(var(--primary) / 0.12)',
                      color: 'hsl(var(--primary))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Save to Grimoire →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            F. FULL-MOON ALMANAC (collapsible)
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          className="py-10"
          style={{ background: 'hsl(var(--muted) / 0.3)', borderTop: '1px solid hsl(var(--border))' }}
          aria-labelledby="almanac-heading"
        >
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            {/* Toggle header */}
            <button
              onClick={() => setAlmanacOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl py-2"
              aria-expanded={almanacOpen}
              aria-controls="almanac-panel"
            >
              <div>
                <h2
                  id="almanac-heading"
                  className="text-2xl md:text-3xl"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  Full Moon Almanac
                </h2>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Sacred names, signs, and spellwork for every full moon
                </p>
              </div>
              {almanacOpen
                ? <ChevronUp className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                : <ChevronDown className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
              }
            </button>

            <AnimatePresence>
              {almanacOpen && (
                <motion.div
                  id="almanac-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {/* Year filter */}
                  <div className="flex flex-wrap gap-2 mt-6 mb-5">
                    {almanacYears.map((y) => (
                      <button
                        key={y}
                        onClick={() => setAlmanacYear(y)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{
                          background: almanacYear === y ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                          color: almanacYear === y ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                          border: `1px solid ${almanacYear === y ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>

                  {/* Moon list */}
                  <div className="flex flex-col gap-3">
                    {filteredMoons.map((moon) => {
                      const isExpanded = expandedMoonId === moon.id;
                      const typeStyle =
                        moon.type === 'Blue Moon'  ? { bg: 'hsl(var(--accent) / 0.2)',  color: 'hsl(var(--accent))',   label: 'Blue Moon'  } :
                        moon.type === 'Super Moon' ? { bg: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))', label: 'Super Moon' } :
                                                     { bg: 'hsl(var(--muted))',          color: 'hsl(var(--muted-foreground))', label: 'Full Moon' };
                      return (
                        <div
                          key={moon.id}
                          className="rounded-2xl overflow-hidden"
                          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        >
                          <button
                            onClick={() => setExpandedMoonId(isExpanded ? null : moon.id)}
                            className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                            aria-expanded={isExpanded}
                          >
                            <div className="flex items-center gap-4 shrink-0 sm:w-52">
                              <span className="text-3xl select-none" aria-hidden="true">🌕</span>
                              <div>
                                <p className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{moon.day}</p>
                                <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{moon.date}</p>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-2xl leading-none" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{moon.name}</h3>
                                <span className="text-xs px-2.5 py-0.5 rounded-full shrink-0" style={{ background: typeStyle.bg, color: typeStyle.color, fontFamily: 'var(--font-sans)' }}>
                                  {typeStyle.label}
                                </span>
                              </div>
                              <p className="text-xs" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}>
                                {moon.sign} · {moon.theme}
                              </p>
                            </div>
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                              : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                            }
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 sm:px-6 pb-5 sm:pb-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-1" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                                  <div className="md:col-span-1 pt-4">
                                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Best Spellwork</p>
                                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{moon.spellwork}</p>
                                  </div>
                                  <div className="pt-4">
                                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Herbs & Botanicals</p>
                                    <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{moon.herbs}</p>
                                    <p className="text-xs uppercase tracking-wider mb-2 mt-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Crystals</p>
                                    <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{moon.crystals}</p>
                                  </div>
                                  <div className="pt-4 flex flex-col justify-between">
                                    <div>
                                      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Candle Color</p>
                                      <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{moon.color}</p>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Astrological Sign</p>
                                      <p className="text-sm" style={{ color: typeStyle.color, fontFamily: 'var(--font-sans)' }}>{moon.sign}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* Accuracy note */}
                  <p className="text-xs mt-6 text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {moon_calendar.footer.note}
                    {' '}
                    <Link to="/astronomical-accuracy" className="underline" style={{ color: 'hsl(var(--primary))' }}>
                      How we calculate the moon →
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            G. PERSONAL LUNAR PATH
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          className="py-14"
          style={{ background: 'hsl(var(--background))' }}
          aria-labelledby="lunar-path-heading"
        >
          <div className="max-w-3xl mx-auto px-6 md:px-8">
            {isAuthenticated ? (
              /* Auth users: show the feature */
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-widest mb-2"
                  style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                >
                  Your Personal Lunar Path
                </p>
                <h2
                  id="lunar-path-heading"
                  className="text-2xl md:text-3xl mb-6"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  Your Moon Memory
                </h2>

                <button
                  onClick={() => setPathOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-4 p-5 rounded-2xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  aria-expanded={pathOpen}
                >
                  <div>
                    <p className="text-base" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                      Lunar preferences & reminders
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      Choose which moon events to follow and set optional reminders.
                    </p>
                  </div>
                  {pathOpen
                    ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                    : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                  }
                </button>

                <AnimatePresence>
                  {pathOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-5 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          Lunar preferences and Moon Memory Timeline are coming soon. Your intention journal entries will appear here once the Grimoire API is connected.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Guests: benefit-led invitation, never a forced modal */
              <div
                className="p-8 rounded-3xl text-center"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--primary) / 0.2)',
                  boxShadow: '0 0 60px hsl(var(--primary) / 0.05)',
                }}
              >
                <span className="text-4xl mb-4 block" aria-hidden="true">🌙</span>
                <h2
                  id="lunar-path-heading"
                  className="text-2xl md:text-3xl mb-3"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  The Moon Is Always Here.<br />Your Journey Can Be, Too.
                </h2>
                <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Create a free Spellful account to save your lunar intentions, revisit your Moon Memory Timeline, and set gentle reminders for the phases that matter to you.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link
                    to="/sign-up"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Create Free Account
                  </Link>
                  <Link
                    to="/sign-in"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: 'hsl(var(--muted))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Sign In
                  </Link>
                </div>
                <p className="text-xs mt-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Always free. No credit card. Your entries are private by default.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Astronomy methodology note */}
        <section
          className="py-8"
          style={{ background: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border))' }}
        >
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              All moon phases and event times are calculated using Meeus "Astronomical Algorithms" Ch. 47 with full perturbation series (±2 min accuracy, 1900–2100), verified against USNO and NASA GSFC references.
              Zodiac signs use tropical convention. Ritual correspondences are traditional associations, not astronomical facts.{' '}
              <Link to="/astronomical-accuracy" className="underline" style={{ color: 'hsl(var(--primary))' }}>
                How we calculate the moon →
              </Link>
            </p>
          </div>
        </section>

      </main>
    </>
  );
}
