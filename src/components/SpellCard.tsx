import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Clock, Sparkles, Star, BookmarkPlus } from 'lucide-react';

export interface SpellCardData {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  intention: string;
  difficulty: string;
  durationMinutes: number;
  moonPhase: string;
  saveCount: number;
  ratingCount: number;
  ratingSum: number;
  isFeatured: boolean;
}

const INTENTION_COLORS: Record<string, string> = {
  protection: '--grimoire-ritual',
  love: '--astro-venus',
  abundance: '--primary',
  healing: '--grimoire-herb',
  clarity: '--accent',
  banishing: '--muted-foreground',
  divination: '--grimoire-tarot',
  grounding: '--astro-mercury',
};

const MOON_GLYPHS: Record<string, string> = {
  new_moon: '🌑',
  waxing_crescent: '🌒',
  first_quarter: '🌓',
  waxing_gibbous: '🌔',
  full_moon: '🌕',
  waning_gibbous: '🌖',
  last_quarter: '🌗',
  waning_moon: '🌘',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-3 h-3"
          style={{
            color: s <= Math.round(avg) ? 'hsl(var(--primary))' : 'hsl(var(--border))',
            fill: s <= Math.round(avg) ? 'hsl(var(--primary))' : 'transparent',
          }}
        />
      ))}
      <span className="text-xs ml-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {count > 0 ? `${avg.toFixed(1)} (${count})` : 'No ratings'}
      </span>
    </div>
  );
}

interface SpellCardProps {
  spell: SpellCardData;
  index?: number;
}

export default function SpellCard({ spell, index = 0 }: SpellCardProps) {
  const accentVar = INTENTION_COLORS[spell.intention] ?? '--primary';
  const avg = spell.ratingCount > 0 ? spell.ratingSum / spell.ratingCount : 0;
  const moonGlyph = MOON_GLYPHS[spell.moonPhase] ?? '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
    >
      <Link
        to={`/spells/${spell.slug}`}
        className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = `hsl(var(${accentVar}) / 0.5)`;
          (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))';
          (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Color bar */}
        <div
          className="h-1 w-full"
          style={{ background: `hsl(var(${accentVar}))` }}
        />

        <div className="flex flex-col flex-1 p-5 gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <span
                className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{ background: `hsl(var(${accentVar}) / 0.15)`, color: `hsl(var(${accentVar}))` }}
              >
                {spell.intention}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                {DIFFICULTY_LABELS[spell.difficulty] ?? spell.difficulty}
              </span>
            </div>
            {spell.isFeatured && (
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
            )}
          </div>

          {/* Title */}
          <div>
            <h3
              className="text-lg leading-snug mb-1 group-hover:opacity-80 transition-opacity"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
            >
              {spell.title}
            </h3>
            {spell.subtitle && (
              <p
                className="text-xs leading-relaxed line-clamp-2"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                {spell.subtitle}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-auto">
            <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Clock className="w-3 h-3" />
              {spell.durationMinutes} min
            </span>
            {moonGlyph && (
              <span className="text-xs" title={spell.moonPhase.replace(/_/g, ' ')}>
                {moonGlyph}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <BookmarkPlus className="w-3 h-3" />
              {spell.saveCount}
            </span>
          </div>

          {/* Rating */}
          <StarRating avg={avg} count={spell.ratingCount} />
        </div>
      </Link>
    </motion.div>
  );
}
