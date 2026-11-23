/**
 * AstroFeed — live scrolling list of upcoming astrological events.
 * Recalculates from the real current date on every mount. No API needed.
 * Each event row has an animated dropdown of aligned practices & spells.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { getUpcomingEvents, formatEventDate, formatEventDay } from '@/lib/astro-feed';
import type { AstroEvent } from '@/lib/astro-feed';

// Category colour tokens
const CATEGORY_COLOR: Record<AstroEvent['category'], string> = {
  moon:    'hsl(var(--accent))',
  planet:  'hsl(var(--primary))',
  sun:     'hsl(var(--astro-sun-color))',
  eclipse: 'hsl(var(--destructive))',
  sabbat:  'hsl(var(--secondary))',
};
const CATEGORY_BG: Record<AstroEvent['category'], string> = {
  moon:    'hsl(var(--accent) / 0.1)',
  planet:  'hsl(var(--primary) / 0.1)',
  sun:     'hsl(var(--astro-sun-color) / 0.1)',
  eclipse: 'hsl(var(--destructive) / 0.1)',
  sabbat:  'hsl(var(--secondary) / 0.1)',
};

// Wand / sparkle icon for practices
function WandIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" />
      <path d="M17.8 11.8 19 13" /><path d="M15 9h.01" /><path d="M17.8 6.2 19 5" />
      <path d="m3 21 9-9" /><path d="M12.2 6.2 11 5" />
    </svg>
  );
}

function ChevronIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <motion.svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  );
}

function EventRow({ event, isToday }: { event: AstroEvent; isToday: boolean }) {
  const [open, setOpen] = useState(false);
  const color = CATEGORY_COLOR[event.category];
  const bg    = CATEGORY_BG[event.category];
  const hasPractices = event.practices.length > 0;

  return (
    <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
      {/* Main row — clickable if practices exist */}
      <div
        className={`flex items-start gap-4 py-4 ${hasPractices ? 'cursor-pointer select-none' : ''}`}
        onClick={() => hasPractices && setOpen(v => !v)}
        role={hasPractices ? 'button' : undefined}
        aria-expanded={hasPractices ? open : undefined}
        tabIndex={hasPractices ? 0 : undefined}
        onKeyDown={hasPractices ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(v => !v); } } : undefined}
      >
        {/* Date */}
        <div className="shrink-0 w-14 text-right">
          <p className="text-xs tabular-nums" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {formatEventDay(event.date)}
          </p>
          <p
            className="text-sm tabular-nums"
            style={{ color: isToday ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.8)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
          >
            {formatEventDate(event.date)}
          </p>
        </div>

        {/* Glyph badge */}
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm mt-0.5"
          style={{ background: bg, color }}
          aria-hidden="true"
        >
          {event.glyph}
        </div>

        {/* Label + detail */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>
            {event.label}
          </p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
            {event.detail}
          </p>
          {/* "Practices" hint text */}
          {hasPractices && (
            <div className="flex items-center gap-1 mt-1.5">
              <WandIcon color={color} size={11} />
              <span className="text-xs" style={{ color, fontFamily: 'var(--font-sans)', fontWeight: 400, opacity: 0.85 }}>
                {open ? 'Hide practices' : 'Show practices'}
              </span>
            </div>
          )}
        </div>

        {/* Right side: category pill + chevron */}
        <div className="shrink-0 flex items-center gap-2 self-start mt-1">
          <span
            className="text-xs px-2 py-0.5 rounded-full hidden sm:block"
            style={{ background: bg, color, fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
          >
            {event.category}
          </span>
          {hasPractices && <ChevronIcon open={open} color={color} />}
        </div>
      </div>

      {/* Practices dropdown */}
      <AnimatePresence initial={false}>
        {open && hasPractices && (
          <motion.div
            key="practices"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="ml-[4.5rem] mb-4 rounded-xl p-4"
              style={{ background: bg, border: `1px solid ${color.replace(')', ' / 0.2)')}` }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5"
                style={{ color, fontFamily: 'var(--font-sans)', letterSpacing: '0.18em' }}
              >
                <WandIcon color={color} size={11} />
                Aligned practices
              </p>
              <ul className="flex flex-col gap-2">
                {event.practices.map((practice, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.045 }}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                    style={{ color: 'hsl(var(--foreground) / 0.85)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                  >
                    <span className="mt-0.5 shrink-0 text-xs" style={{ color }}>✦</span>
                    {practice}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AstroFeed() {
  const [events, setEvents] = useState<AstroEvent[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Always recompute from the real current date on every mount so the calendar
  // never serves a stale or cached result from a previous render.
  useEffect(() => {
    const id = setTimeout(() => {
      setEvents(getUpcomingEvents(new Date(), 30));
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const todayStr = new Date().toDateString();
  const visible  = showAll ? events : events.slice(0, 8);

  return (
    <section className="pb-xxl px-6" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-2xl mx-auto">

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8" aria-hidden="true">
          <div className="h-px flex-1" style={{ background: 'hsl(var(--border))' }} />
          <span className="text-base" style={{ color: 'hsl(var(--primary) / 0.35)' }}>✦</span>
          <div className="h-px flex-1" style={{ background: 'hsl(var(--border))' }} />
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' as const }}
          className="mb-6"
        >
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.22em' }}>
            Cosmic Calendar
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: 'hsl(var(--foreground))' }}>
            Upcoming Events
          </h2>
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.keys(CATEGORY_COLOR) as AstroEvent['category'][]).map(cat => (
            <span
              key={cat}
              className="text-xs px-2.5 py-1 rounded-full capitalize"
              // eslint-disable-next-line security/detect-object-injection
              style={{ background: CATEGORY_BG[cat], color: CATEGORY_COLOR[cat], fontFamily: 'var(--font-sans)' }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* List */}
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Calculating the stars…
            </p>
          </div>
        ) : (
          <>
            <div>
              {visible.map((event, i) => (
                <motion.div
                  key={`${event.kind}-${event.date.toISOString()}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <EventRow event={event} isToday={event.date.toDateString() === todayStr} />
                </motion.div>
              ))}
              <div style={{ borderTop: '1px solid hsl(var(--border))' }} />
            </div>

            {events.length > 8 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="mt-6 text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
                style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showAll ? 'Show less ↑' : `Show all ${events.length} events ↓`}
              </button>
            )}
          </>
        )}

        <div className="mt-8">
          <Link
            to="/moon-calendar"
            className="text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
          >
            Full moon calendar →
          </Link>
        </div>

      </div>
    </section>
  );
}
