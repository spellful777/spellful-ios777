import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ASTRO_GLOSSARY } from '@/lib/astro-glossary';
import { BookOpen } from 'lucide-react';

interface GlossaryTermProps {
  /** Key into ASTRO_GLOSSARY, e.g. "retrograde" */
  termKey: string;
  /** The display text — defaults to the entry's term name */
  children?: ReactNode;
}

/**
 * Inline astrological glossary tooltip.
 * Opens on click/tap (mobile-friendly) and also on hover via focus.
 * Renders a gold-underlined trigger and a gold-bordered popover with
 * a brief definition and a link to the full Encyclopedia.
 */
export default function GlossaryTerm({ termKey, children }: GlossaryTermProps) {
  const entry = ASTRO_GLOSSARY[termKey];
  const [open, setOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!entry) return <>{children}</>;

  const displayText = children ?? entry.term;

  function handleMouseEnter() {
    hoverTimer.current = setTimeout(() => setOpen(true), 180);
  }
  function handleMouseLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // Small delay so user can move into the popover
    hoverTimer.current = setTimeout(() => setOpen(false), 220);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setOpen((v) => !v)}
          className="inline cursor-help border-b border-dashed pb-px focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1"
          style={{
            borderColor: 'hsl(var(--primary) / 0.6)',
            color: 'inherit',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 'inherit',
            background: 'none',
            padding: 0,
          }}
          aria-label={`Glossary: ${entry.term}`}
        >
          {displayText}
        </button>
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={() => {
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
        }}
        onMouseLeave={handleMouseLeave}
        className="w-72 p-0 overflow-hidden"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--primary) / 0.5)',
          boxShadow: '0 0 18px hsl(var(--primary) / 0.15)',
        }}
        sideOffset={6}
      >
        {/* Gold header bar */}
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'hsl(var(--primary) / 0.12)', borderBottom: '1px solid hsl(var(--primary) / 0.25)' }}
        >
          <span className="text-base" aria-hidden="true">✦</span>
          <span
            className="text-sm font-semibold"
            style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)' }}
          >
            {entry.term}
          </span>
        </div>

        {/* Definition */}
        <div className="px-4 py-3">
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
          >
            {entry.definition}
          </p>
        </div>

        {/* Encyclopedia link */}
        {entry.learnMorePath && (
          <div
            className="px-4 py-2.5 flex justify-end"
            style={{ borderTop: '1px solid hsl(var(--border))' }}
          >
            <Link
              to={entry.learnMorePath}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              <BookOpen size={11} />
              Learn more
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
