/**
 * SynastryNarrative — Co-Star / Pattern style full compatibility breakdown.
 * Surfaces archetype, composite identity, relationship patterns, growth edges,
 * and the four key planetary notes in a rich narrative layout.
 */

import type { SynastryResult } from '@/lib/synastry';

interface Props {
  synastry: SynastryResult;
  nameA: string;
  nameB: string;
}

const ARCHETYPE_SYMBOLS: Record<string, string> = {
  'Soulmate Frequency':     '☽',
  'Magnetic Polarity':      '♀♂',
  'Karmic Bond':            '♄',
  'Transformative Catalyst':'♇',
  'Romantic Ideal':         '♆',
  'Kindred Minds':          '☿',
  'Harmonious Union':       '✦',
  'Complex Chemistry':      '◈',
  'Magnetic Tension':       '⊕',
};

export default function SynastryNarrative({ synastry, nameA, nameB }: Props) {
  const you = nameA || 'You';
  const them = nameB || 'Partner';
  const archetypeSymbol = ARCHETYPE_SYMBOLS[synastry.archetype] ?? '✦';

  return (
    <div className="flex flex-col gap-8">

      {/* ── Archetype Banner ── */}
      <div
        className="rounded-2xl p-8 text-center relative overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.4)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 70%)' }}
        />
        <div className="relative">
          <p
            className="text-xs tracking-widest uppercase mb-3"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
          >
            {you} &amp; {them}
          </p>
          <div
            className="text-5xl mb-3"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {archetypeSymbol}
          </div>
          <h3
            className="text-3xl md:text-4xl mb-4"
            style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
          >
            {synastry.archetype}
          </h3>
          <p
            className="text-sm leading-relaxed max-w-lg mx-auto"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
          >
            {synastry.archetypeDescription}
          </p>
        </div>
      </div>

      {/* ── Overall Reading ── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
      >
        <p
          className="text-xs tracking-widest uppercase mb-3"
          style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
        >
          The Reading
        </p>
        <p
          className="text-base leading-relaxed"
          style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}
        >
          {synastry.summary}
        </p>
      </div>

      {/* ── This Relationship As An Entity ── */}
      <div>
        <h4
          className="text-xl mb-4"
          style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
        >
          This Relationship As An Entity
        </h4>
        <p
          className="text-xs mb-4"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          The composite chart blends both your charts into a single map of the relationship itself — not who you are individually, but what you become together.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.3)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: 'hsl(var(--astro-sun-color))' }}>☉</span>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'hsl(var(--astro-sun-color))', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}
              >
                Composite Sun
              </p>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {synastry.compositeSun}
            </p>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--astro-moon) / 0.3)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: 'hsl(var(--astro-moon))' }}>☽</span>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'hsl(var(--astro-moon))', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}
              >
                Composite Moon
              </p>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {synastry.compositeMoon}
            </p>
          </div>
        </div>
      </div>

      {/* ── The Four Pillars ── */}
      <div>
        <h4
          className="text-xl mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
        >
          The Four Pillars
        </h4>
        <p
          className="text-xs mb-4"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          The planetary dynamics that shape how you love, desire, feel, and communicate.
        </p>
        <div className="flex flex-col gap-3">
          {[
            { icon: '♀♂', label: 'Venus & Mars', text: synastry.venusMarsNote, colorVar: '--astro-venus' },
            { icon: '☉☽', label: 'Sun & Moon',   text: synastry.moonSunNote,   colorVar: '--astro-sun-color' },
            { icon: '☿',  label: 'Mercury',       text: synastry.communicationNote, colorVar: '--astro-mercury' },
            { icon: '✦',  label: 'Elements',      text: synastry.elementSynergy, colorVar: '--primary' },
          ].map(({ icon, label, text, colorVar }) => (
            <div
              key={label}
              className="rounded-xl p-5"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: `hsl(var(${colorVar}))` }}>{icon}</span>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: `hsl(var(${colorVar}))`, fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}
                >
                  {label}
                </p>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cosmic Gifts ── */}
      {synastry.highlights.length > 0 && (
        <div>
          <h4
            className="text-xl mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
          >
            Cosmic Gifts
          </h4>
          <p
            className="text-xs mb-4"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
          >
            The strongest harmonious aspects in your synastry — where your charts naturally support and elevate each other.
          </p>
          <div
            className="rounded-2xl p-6"
            style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--primary) / 0.3)' }}
          >
            <div className="flex flex-col gap-4">
              {synastry.highlights.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-sm mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }}>✦</span>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                  >
                    {h}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Relationship Patterns ── */}
      {synastry.relationshipPatterns.length > 0 && (
        <div>
          <h4
            className="text-xl mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
          >
            Signature Patterns
          </h4>
          <p
            className="text-xs mb-4"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
          >
            The defining astrological signatures that give this relationship its particular character and quality.
          </p>
          <div className="flex flex-col gap-3">
            {synastry.relationshipPatterns.map((pattern, i) => (
              <div
                key={i}
                className="rounded-xl p-5 flex gap-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5"
                  style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
                >
                  {i + 1}
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  {pattern}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Where You Will Grow ── */}
      <div>
        <h4
          className="text-xl mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
        >
          Where You Will Grow
        </h4>
        <p
          className="text-xs mb-4"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          Every meaningful relationship has a growing edge. These are the places this connection will ask the most of you — and give the most back.
        </p>
        <div className="flex flex-col gap-3">
          {synastry.growthEdges.map((edge, i) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--accent) / 0.25)' }}
            >
              <div className="flex gap-3">
                <span className="text-sm mt-0.5 shrink-0" style={{ color: 'hsl(var(--accent))' }}>◇</span>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  {edge}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timing ── */}
      <div>
        <h4
          className="text-xl mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
        >
          Timing &amp; Transits
        </h4>
        <p
          className="text-xs mb-4"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          When the cosmos most activates, supports, or tests this connection.
        </p>
        <div className="flex flex-col gap-4">
          {synastry.timingInsights.map((insight, i) => (
            <div key={i} className="flex gap-4">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5"
                style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
              >
                {i + 1}
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                {insight}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
