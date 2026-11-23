/**
 * WelcomeQuote
 *
 * Fetches and displays a personalized, never-repeated magical welcome quote
 * for the authenticated user. Renders below the sanctuary greeting heading.
 *
 * Animation sequence (respects prefers-reduced-motion):
 *   1. Quote fades + slides in (300–450 ms)
 *   2. SVG underline draws left-to-right (450–650 ms) with a glint at the tip
 *   3. Brief hold, then underline fades out (400–600 ms)
 *   4. Quote remains legible
 *
 * Accent variants: gold | lavender | silver — each maps to a CSS variable.
 */
import { useState, useEffect, useRef, useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteResult {
  quoteId: number | null;
  text: string;
  theme: string;
  accent: 'gold' | 'lavender' | 'silver';
  fallback: boolean;
}

// ─── Accent palette ───────────────────────────────────────────────────────────

const ACCENT_COLORS: Record<string, string> = {
  gold: 'hsl(var(--primary))',
  lavender: 'hsl(var(--accent))',
  silver: 'hsl(var(--muted-foreground))',
};

const ACCENT_GLOW: Record<string, string> = {
  gold: 'hsl(var(--primary) / 0.55)',
  lavender: 'hsl(var(--accent) / 0.55)',
  silver: 'hsl(var(--muted-foreground) / 0.45)',
};

// ─── Underline SVG component ──────────────────────────────────────────────────

interface UnderlineProps {
  accent: string;
  /** Width of the text container in px — drives the SVG width */
  width: number;
  /** Whether to play the draw animation */
  play: boolean;
  /** Whether to fade out after drawing */
  fadeOut: boolean;
}

function LuminousUnderline({ accent, width, play, fadeOut }: UnderlineProps) {
  const prefersReduced = useReducedMotion();
  const gradId = useId().replace(/:/g, '');
  const glowId = useId().replace(/:/g, '');

  const color = ACCENT_COLORS[accent] ?? ACCENT_COLORS.gold;
  const glow = ACCENT_GLOW[accent] ?? ACCENT_GLOW.gold;

  // SVG dimensions
  const h = 14;
  const w = Math.max(width, 40);
  // Gentle arc: control point slightly above midpoint
  const pathD = `M 4 ${h - 4} Q ${w / 2} ${h - 8} ${w - 4} ${h - 4}`;

  // Approximate path length for stroke-dasharray
  const pathLen = w * 1.02;

  if (prefersReduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none select-none"
      style={{ width: w, height: h, position: 'absolute', left: 0, bottom: -6 }}
      initial={{ opacity: 0 }}
      animate={play ? { opacity: fadeOut ? 0 : 1 } : { opacity: 0 }}
      transition={{ duration: fadeOut ? 0.55 : 0.15, ease: 'easeOut' }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="50%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main arc */}
        <path
          d={pathD}
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: play ? 0 : pathLen,
            transition: play ? `stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1)` : 'none',
          }}
        />

        {/* Glint dot that travels along the leading edge */}
        {play && (
          <motion.circle
            r={2.5}
            fill={color}
            filter={`url(#${glowId})`}
            initial={{ opacity: 0, cx: 4, cy: h - 4 }}
            animate={
              fadeOut
                ? { opacity: 0, cx: w - 4, cy: h - 4 }
                : {
                    opacity: [0, 1, 1, 0],
                    cx: [4, w / 2, w - 4, w - 4],
                    cy: [h - 4, h - 8, h - 4, h - 4],
                  }
            }
            transition={{ duration: 0.6, ease: 'easeInOut', times: [0, 0.4, 0.85, 1] }}
          />
        )}

        {/* Tiny sparkles flanking the glint */}
        {play && !fadeOut && (
          <>
            {[0.25, 0.5, 0.75].map((t, i) => (
              <motion.circle
                key={i}
                r={1}
                fill={glow}
                cx={4 + (w - 8) * t}
                cy={h - 4 - 3}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0] }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease: 'easeOut' }}
              />
            ))}
          </>
        )}
      </svg>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WelcomeQuoteProps {
  /** Stable per-login event key (UUID) — prevents double-consumption */
  eventKey: string;
}

export default function WelcomeQuote({ eventKey }: WelcomeQuoteProps) {
  const prefersReduced = useReducedMotion();
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [phase, setPhase] = useState<'idle' | 'in' | 'draw' | 'hold' | 'fadeout' | 'done'>('idle');
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const fetchedRef = useRef(false);

  // Fetch once per eventKey
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('/api/quotes/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventKey }),
    })
      .then((r) => r.json())
      .then((data: QuoteResult) => {
        setQuote(data);
        setPhase('in');
      })
      .catch(() => {
        // Network failure — show fallback silently
        setQuote({ quoteId: null, text: 'Welcome back to Spellful ✦', theme: 'general', accent: 'gold', fallback: true });
        setPhase('in');
      });
  }, [eventKey]);

  // Measure quote width for underline after it appears
  useEffect(() => {
    if (phase !== 'in') return;
    const timer = setTimeout(() => {
      if (quoteRef.current) {
        setUnderlineWidth(quoteRef.current.offsetWidth);
      }
      setPhase('draw');
    }, 380);
    return () => clearTimeout(timer);
  }, [phase]);

  // Underline draw → hold → fade sequence
  useEffect(() => {
    if (phase !== 'draw' || prefersReduced) return;
    const holdTimer = setTimeout(() => setPhase('hold'), 700);
    return () => clearTimeout(holdTimer);
  }, [phase, prefersReduced]);

  useEffect(() => {
    if (phase !== 'hold') return;
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 900);
    return () => clearTimeout(fadeTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fadeout') return;
    const doneTimer = setTimeout(() => setPhase('done'), 650);
    return () => clearTimeout(doneTimer);
  }, [phase]);

  if (!quote) return null;

  const accentColor = ACCENT_COLORS[quote.accent] ?? ACCENT_COLORS.gold;
  const showUnderline = phase === 'draw' || phase === 'hold' || phase === 'fadeout';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: phase !== 'idle' ? 1 : 0, y: phase !== 'idle' ? 0 : 8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative inline-block max-w-xl mx-auto"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Quote text */}
      <p
        ref={quoteRef}
        className="text-base md:text-lg leading-relaxed text-center"
        style={{
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          color: 'hsl(var(--accent-foreground) / 0.75)',
          letterSpacing: '0.01em',
        }}
      >
        <span
          className="text-sm mr-1.5 not-italic"
          aria-hidden="true"
          style={{ color: accentColor, opacity: 0.7 }}
        >
          ✦
        </span>
        {quote.text}
        <span
          className="text-sm ml-1.5 not-italic"
          aria-hidden="true"
          style={{ color: accentColor, opacity: 0.7 }}
        >
          ✦
        </span>
      </p>

      {/* Luminous underline */}
      {showUnderline && underlineWidth > 0 && (
        <LuminousUnderline
          accent={quote.accent}
          width={underlineWidth}
          play={phase === 'draw' || phase === 'hold'}
          fadeOut={phase === 'fadeout'}
        />
      )}
    </motion.div>
  );
}
