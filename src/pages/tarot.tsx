import { tarot } from 'virtual:content';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import MoonNightSky from '@/components/MoonNightSky';
import TwinkleStars from '@/components/TwinkleStars';
import {
  Sparkles, RotateCcw, Save, ChevronDown, ChevronUp, Trash2, Clock,
  Search, X, BookOpen, Eye, Shuffle, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/auth/auth-client';
import { ShareBar } from '@/components/ShareBar';
import ShareTarotModal, { type ShareTarotPayload } from '@/components/ShareTarotModal';
import {
  SPREADS, TAROT_CARDS, drawSpread, getSuitColor, getCardById,
  type TarotCard, type SpreadDefinition,
} from '@/lib/tarot-data';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  position: string;
  positionLabel: string;
  positionDescription: string;
}

interface SavedReading {
  id: number;
  spreadType: string;
  spreadName: string;
  intention: string;
  cards: Array<{ position: string; cardId: number; reversed: boolean }>;
  notes: string;
  moonPhase: string;
  createdAt: string;
}

// ── Spread layout diagrams ────────────────────────────────────────────────────
function SpreadDiagram({ spreadId }: { spreadId: string }) {
  const size = 10;
  const gap = 4;
  const cardW = size;
  const cardH = Math.round(size * 1.8);

  const positions: Array<{ x: number; y: number }> = useMemo(() => {
    switch (spreadId) {
      case 'one-card':
        return [{ x: 0, y: 0 }];
      case 'three-card':
        return [
          { x: 0, y: 0 },
          { x: cardW + gap, y: 0 },
          { x: (cardW + gap) * 2, y: 0 },
        ];
      case 'love':
        return [
          { x: 0, y: 0 },
          { x: cardW + gap, y: 0 },
          { x: (cardW + gap) * 2, y: 0 },
          { x: cardW / 2, y: cardH + gap },
          { x: cardW / 2 + cardW + gap, y: cardH + gap },
        ];
      case 'career':
        return [
          { x: cardW + gap, y: 0 },
          { x: 0, y: cardH + gap },
          { x: cardW + gap, y: cardH + gap },
          { x: (cardW + gap) * 2, y: cardH + gap },
          { x: cardW + gap, y: (cardH + gap) * 2 },
        ];
      case 'spiritual':
        return [
          { x: cardW + gap, y: 0 },
          { x: 0, y: cardH + gap },
          { x: (cardW + gap) * 2, y: cardH + gap },
          { x: cardW + gap, y: (cardH + gap) * 2 },
        ];
      default:
        return [{ x: 0, y: 0 }];
    }
  }, [spreadId, cardW, cardH]);

  const maxX = Math.max(...positions.map(p => p.x)) + cardW;
  const maxY = Math.max(...positions.map(p => p.y)) + cardH;

  return (
    <svg width={maxX} height={maxY} viewBox={`0 0 ${maxX} ${maxY}`} aria-hidden="true" style={{ display: 'block' }}>
      {positions.map((pos, i) => (
        <rect
          key={i}
          x={pos.x}
          y={pos.y}
          width={cardW}
          height={cardH}
          rx={2}
          fill="hsl(var(--primary) / 0.25)"
          stroke="hsl(var(--primary) / 0.6)"
          strokeWidth={0.8}
        />
      ))}
    </svg>
  );
}

// ── Card Face ─────────────────────────────────────────────────────────────────
function CardFace({ card, reversed }: { card: TarotCard; reversed: boolean }) {
  const suitColor = getSuitColor(card.suit);
  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden select-none shadow-lg"
      style={{
        transform: reversed ? 'rotate(180deg)' : 'none',
        border: '1px solid hsl(var(--border))',
      }}
    >
      {card.image ? (
        <img
          src={card.image}
          alt={`${card.name}${reversed ? ' (Reversed)' : ''}`}
          className="w-full h-full object-contain"
          style={{ background: 'hsl(var(--card-deep))' }}
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-3"
          style={{ background: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: `${suitColor}22`, border: `1px solid ${suitColor}55` }}
          >
            {card.arcana === 'major' ? '✦' :
              card.suit === 'wands' ? '🔥' :
              card.suit === 'cups' ? '🌊' :
              card.suit === 'swords' ? '⚔️' : '⭐'}
          </div>
          <p
            className="text-center px-3 leading-tight"
            style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)', fontSize: '0.7rem' }}
          >
            {card.name}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Card Back ─────────────────────────────────────────────────────────────────
function CardBack() {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <img
        src="/airo-assets/images/pages/resources/tarot-card-back"
        alt="Tarot card back"
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}

// ── Flip Card ─────────────────────────────────────────────────────────────────
function FlipCard({
  card,
  reversed,
  flipped,
  delay,
  onClick,
  index,
}: {
  card: TarotCard;
  reversed: boolean;
  flipped: boolean;
  delay: number;
  onClick: () => void;
  index: number;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: prefersReduced ? 0 : delay, duration: prefersReduced ? 0.1 : 0.5, ease: 'easeOut' as const }}
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl"
      style={{ perspective: '1000px', width: '100%', height: '100%' }}
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      tabIndex={0}
      role="button"
      aria-label={flipped ? `${card.name}${reversed ? ' reversed' : ''}, position ${index + 1}` : `Card ${index + 1}, tap to reveal`}
      aria-pressed={flipped}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: prefersReduced ? 0.1 : 0.7, ease: 'easeInOut' as const }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}
      >
        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}>
          <CardBack />
        </div>
        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}>
          <CardFace card={card} reversed={reversed} />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Card Lightbox ─────────────────────────────────────────────────────────────
function CardLightbox({ drawn, onClose }: { drawn: DrawnCard; onClose: () => void }) {
  const { card, reversed } = drawn;
  const suitColor = getSuitColor(card.suit);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} detail`}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' as const }}
        className="relative flex flex-col sm:flex-row gap-6 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ background: 'hsl(var(--card))', border: `1px solid ${suitColor}55` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg"
          style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {card.image && (
          <div className="flex-shrink-0 mx-auto sm:mx-0" style={{ width: 120, aspectRatio: '5/9' }}>
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-contain rounded-xl"
              style={{
                background: 'hsl(var(--card-deep))',
                transform: reversed ? 'rotate(180deg)' : 'none',
                border: '1px solid hsl(var(--border))',
              }}
              draggable={false}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {drawn.positionLabel}
          </p>
          <h3 className="text-2xl mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            {card.name}
          </h3>
          {reversed && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-3" style={{ background: 'hsl(var(--astro-mars) / 0.15)', color: 'hsl(var(--astro-mars))' }}>
              Reversed
            </span>
          )}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {card.keywords.map((kw) => (
              <span key={kw} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${suitColor}22`, color: suitColor, fontFamily: 'var(--font-sans)' }}>
                {kw}
              </span>
            ))}
          </div>

          <p className="text-sm leading-relaxed mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
            {reversed ? card.reversedMeaning : card.uprightMeaning}
          </p>

          <div className="flex gap-4 flex-wrap">
            {card.element && (
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Element</p>
                <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{card.element}</p>
              </div>
            )}
            {card.planet && (
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Planet</p>
                <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{card.planet}</p>
              </div>
            )}
            {card.zodiac && (
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Zodiac</p>
                <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{card.zodiac}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Spread Selector ───────────────────────────────────────────────────────────
const SPREAD_DURATIONS: Record<string, string> = {
  'one-card': '2 min',
  'three-card': '5 min',
  'love': '10 min',
  'career': '10 min',
  'spiritual': '8 min',
};

function SpreadSelector({
  selected,
  onSelect,
}: {
  selected: SpreadDefinition;
  onSelect: (s: SpreadDefinition) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {SPREADS.map((spread) => {
        const isActive = spread.id === selected.id;
        const duration = SPREAD_DURATIONS[spread.id] ?? '5 min';
        return (
          <motion.button
            key={spread.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(spread)}
            className="rounded-xl p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: isActive ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
              border: `1px solid ${isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            }}
            aria-pressed={isActive}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-2xl">{spread.icon}</div>
              <SpreadDiagram spreadId={spread.id} />
            </div>
            <p
              className="font-semibold text-sm mb-1"
              style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
            >
              {spread.name}
            </p>
            <p className="text-xs leading-snug mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {spread.description}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
                {spread.positions.length} {spread.positions.length === 1 ? 'card' : 'cards'}
              </span>
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                ~{duration}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Card Detail Panel ─────────────────────────────────────────────────────────
function CardDetailPanel({
  drawn,
  onClose,
  onExpand,
}: {
  drawn: DrawnCard;
  onClose: () => void;
  onExpand: () => void;
}) {
  const { card, reversed } = drawn;
  const suitColor = getSuitColor(card.suit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl p-6"
      style={{ background: 'hsl(var(--card))', border: `1px solid ${suitColor}55` }}
      role="region"
      aria-label={`${card.name} reading`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {drawn.positionLabel}
          </p>
          <h3 className="text-2xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            {card.name}
            {reversed && (
              <span className="text-sm ml-2" style={{ color: 'hsl(var(--astro-mars))' }}>
                {tarot.cardDetail.reversedLabel}
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExpand}
            className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
            style={{ color: 'hsl(var(--accent))', background: 'hsl(var(--accent) / 0.1)', border: '1px solid hsl(var(--accent) / 0.3)' }}
            aria-label="View full card"
          >
            <Eye className="w-3 h-3" />
            Enlarge
          </button>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}
            aria-label="Close card detail"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {card.keywords.map((kw) => (
          <span key={kw} className="text-xs px-2 py-1 rounded-full" style={{ background: `${suitColor}22`, color: suitColor, fontFamily: 'var(--font-sans)' }}>
            {kw}
          </span>
        ))}
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
        {reversed ? card.reversedMeaning : card.uprightMeaning}
      </p>

      <div
        className="rounded-lg p-3 text-sm mb-4"
        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
      >
        <span className="font-semibold" style={{ color: 'hsl(var(--accent))' }}>
          {drawn.positionLabel}:
        </span>{' '}
        {drawn.positionDescription}
      </div>

      <div className="flex gap-4 mt-4 flex-wrap">
        {card.element && (
          <div>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{tarot.cardDetail.elementLabel}</p>
            <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{card.element}</p>
          </div>
        )}
        {card.planet && (
          <div>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{tarot.cardDetail.planetLabel}</p>
            <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{card.planet}</p>
          </div>
        )}
        {card.zodiac && (
          <div>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{tarot.cardDetail.zodiacLabel}</p>
            <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{card.zodiac}</p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <ShareBar
          url={typeof window !== 'undefined' ? window.location.href : 'https://spellful.com/tarot'}
          text={`🃏 ${drawn.positionLabel}: ${card.name}${reversed ? ' (Reversed)' : ''}\n\n${reversed ? card.reversedMeaning : card.uprightMeaning}\n\nFrom my tarot reading on Spellful`}
          label="Share this card"
        />
      </div>
    </motion.div>
  );
}

// ── Shuffle Deck ──────────────────────────────────────────────────────────────
const CARDS = 7;
function ShuffleDeck({ onDone }: { onDone: () => void }) {
  const prefersReduced = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, prefersReduced ? 100 : 3800);
    return () => clearTimeout(t);
  }, [onDone, prefersReduced]);

  if (prefersReduced) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: 120, height: 210 }}>
        {Array.from({ length: CARDS }, (_, i) => {
          const offset = i % 2 === 0 ? 1 : -1;
          return (
            <motion.div
              key={i}
              className="absolute rounded-xl overflow-hidden shadow-xl"
              style={{ width: 120, height: 210, top: 0, left: 0 }}
              initial={{ x: 0, rotate: offset * 3, zIndex: i }}
              animate={{
                x: [0, offset * 28, offset * -28, offset * 22, offset * -22, offset * 16, 0],
                y: [0, -18, -10, -16, -8, -12, 0],
                rotate: [offset * 3, offset * -6, offset * 8, offset * -5, offset * 7, offset * -4, offset * 3],
                zIndex: [i, (i + 3) % CARDS, (i + 1) % CARDS, (i + 5) % CARDS, (i + 2) % CARDS, (i + 4) % CARDS, i],
              }}
              transition={{
                duration: 3.6,
                ease: 'easeInOut' as const,
                times: [0, 0.15, 0.32, 0.48, 0.65, 0.82, 1],
                repeat: 0,
              }}
            >
              <img
                src="/airo-assets/images/pages/resources/tarot-card-back"
                alt="card back"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </motion.div>
          );
        })}
      </div>
      <p className="text-sm animate-pulse" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
        Shuffling the deck…
      </p>
    </div>
  );
}

// ── Story Weaver ──────────────────────────────────────────────────────────────
function buildNarrative(drawn: DrawnCard[]): string {
  if (drawn.length === 0) return '';

  const themes = Array.from(new Set(drawn.flatMap(d => d.card.keywords.slice(0, 2)))).slice(0, 5);
  const themeStr = themes.join(', ');

  const reversedCount = drawn.filter(d => d.reversed).length;
  const reversedNote = reversedCount > 0
    ? ` With ${reversedCount === drawn.length ? 'all' : reversedCount} card${reversedCount > 1 ? 's' : ''} reversed, there is an invitation to look inward — to examine what may be blocked, resisted, or ready to shift.`
    : '';

  const arcanaCount = drawn.filter(d => d.card.arcana === 'major').length;
  const arcanaNote = arcanaCount >= 2
    ? ` The presence of ${arcanaCount} Major Arcana cards signals that larger life forces and soul-level lessons are at work here.`
    : arcanaCount === 1
    ? ` One Major Arcana card anchors this reading in a deeper, archetypal current.`
    : '';

  const firstCard = drawn[0];
  const lastCard = drawn[drawn.length - 1];

  if (drawn.length === 1) {
    return `Your card speaks directly to the energy of this moment. ${firstCard.card.name}${firstCard.reversed ? ' (Reversed)' : ''} brings the themes of ${themeStr} into focus.${reversedNote} Sit with this message and notice where it resonates in your life right now.`;
  }

  return `This reading weaves together the themes of ${themeStr}.${arcanaNote}${reversedNote} The journey begins with ${firstCard.card.name}${firstCard.reversed ? ' (Reversed)' : ''} — ${(firstCard.reversed ? firstCard.card.reversedMeaning : firstCard.card.uprightMeaning).split('.')[0]}. It moves through ${drawn.slice(1, -1).map(d => d.card.name).join(', ')}${drawn.length > 2 ? ',' : ''} and arrives at ${lastCard.card.name}${lastCard.reversed ? ' (Reversed)' : ''} — ${(lastCard.reversed ? lastCard.card.reversedMeaning : lastCard.card.uprightMeaning).split('.')[0]}. Together, these cards suggest a moment of ${themes[0] ?? 'reflection'} and ${themes[1] ?? 'transformation'}.`;
}

const REFLECTION_PROMPTS = [
  'Which card surprised you most, and why?',
  'What emotion arose when you saw your cards?',
  'Where in your body do you feel this reading?',
  'What would you tell a friend who drew these cards?',
  'What is one small action this reading is calling you toward?',
];

function StoryWeaver({ drawn, spreadName, onShare }: { drawn: DrawnCard[]; spreadName: string; onShare: () => void }) {
  const [mode, setMode] = useState<'short' | 'full'>('short');
  const narrative = useMemo(() => buildNarrative(drawn), [drawn]);
  const prompt = useMemo(() => {
    const seed = drawn.reduce((acc, d) => acc + d.card.id, 0);
    return REFLECTION_PROMPTS[seed % REFLECTION_PROMPTS.length];
  }, [drawn]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-6"
      style={{ background: 'hsl(var(--card-deep))', border: '1px solid hsl(var(--primary) / 0.3)' }}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
          <h3 className="text-xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            Your Reading
          </h3>
        </div>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
          <button
            onClick={() => setMode('short')}
            className="px-3 py-1.5 text-xs transition-colors"
            style={{
              background: mode === 'short' ? 'hsl(var(--primary) / 0.2)' : 'transparent',
              color: mode === 'short' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Summary
          </button>
          <button
            onClick={() => setMode('full')}
            className="px-3 py-1.5 text-xs transition-colors"
            style={{
              background: mode === 'full' ? 'hsl(var(--primary) / 0.2)' : 'transparent',
              color: mode === 'full' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Full Reading
          </button>
        </div>
      </div>

      <div
        className="p-4 rounded-xl mb-4"
        style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}
      >
        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
          Collectively, your {drawn.length === 1 ? 'card speaks' : `${drawn.length} cards speak`} to:
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(drawn.flatMap(d => d.card.keywords.slice(0, 2)))).slice(0, 8).map(kw => (
            <span
              key={kw}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-5 p-4 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
          {narrative}
        </p>
      </div>

      <AnimatePresence>
        {mode === 'full' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 mb-5">
              {drawn.map((d, i) => {
                const suitColor = getSuitColor(d.card.suit);
                const meaning = d.reversed ? d.card.reversedMeaning : d.card.uprightMeaning;
                return (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-xl"
                    style={{ background: 'hsl(var(--card))', border: `1px solid ${suitColor}33` }}
                  >
                    {d.card.image && (
                      <img
                        src={d.card.image}
                        alt={d.card.name}
                        className="rounded-lg object-contain flex-shrink-0"
                        style={{ width: 40, height: 72, background: 'hsl(var(--card-deep))', transform: d.reversed ? 'rotate(180deg)' : 'none' }}
                        draggable={false}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          {d.positionLabel}
                        </p>
                        {d.reversed && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(var(--astro-mars) / 0.15)', color: 'hsl(var(--astro-mars))', fontFamily: 'var(--font-sans)' }}>
                            Reversed
                          </span>
                        )}
                      </div>
                      <p className="font-medium mb-1" style={{ color: suitColor, fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                        {d.card.name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {meaning}
                      </p>
                      <p className="text-xs mt-2 italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {d.positionDescription}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="p-4 rounded-xl mb-5"
        style={{ background: 'hsl(var(--accent) / 0.08)', border: '1px solid hsl(var(--accent) / 0.25)' }}
      >
        <p className="text-xs mb-1" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          Reflection prompt
        </p>
        <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
          {prompt}
        </p>
      </div>

      <div className="pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border transition-all"
          style={{
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
            background: 'hsl(var(--card))',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share this reading
        </button>
      </div>
    </motion.div>
  );
}

// ── Reading History ───────────────────────────────────────────────────────────
function ReadingHistory({ readings, onDelete }: { readings: SavedReading[]; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (readings.length === 0) {
    return (
      <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        {tarot.historySection.emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {readings.map((reading) => {
        const isOpen = expanded === reading.id;
        const date = new Date(reading.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return (
          <div key={reading.id} className="rounded-xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setExpanded(isOpen ? null : reading.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{SPREADS.find(s => s.id === reading.spreadType)?.icon ?? '✦'}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                    {reading.spreadName}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {date} · {reading.cards.length} {tarot.historySection.cardsLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(reading.id); }}
                  className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: 'hsl(var(--destructive))' }}
                  aria-label="Delete reading"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isOpen
                  ? <ChevronUp className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                }
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    {reading.intention && (
                      <p className="text-sm pt-3 italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        "{reading.intention}"
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {reading.cards.map((c, i) => {
                        const cardData = getCardById(c.cardId);
                        const spread = SPREADS.find(s => s.id === reading.spreadType);
                        // eslint-disable-next-line security/detect-object-injection
                        const pos = spread?.positions[i];
                        return cardData ? (
                          <div key={i} className="rounded-lg p-2 text-center" style={{ background: 'hsl(var(--muted))' }}>
                            <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                              {pos?.label ?? `Card ${i + 1}`}
                            </p>
                            <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                              {cardData.name}
                            </p>
                            {c.reversed && (
                              <p className="text-xs" style={{ color: 'hsl(var(--astro-mars))', fontFamily: 'var(--font-sans)' }}>
                                Reversed
                              </p>
                            )}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Encyclopedia Drawer ───────────────────────────────────────────────────────
const SUITS = ['all', 'major', 'wands', 'cups', 'swords', 'pentacles'] as const;
type SuitFilter = typeof SUITS[number];

function EncyclopediaDrawer({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [suit, setSuit] = useState<SuitFilter>('all');
  const [selected, setSelected] = useState<TarotCard | null>(null);
  const [showReversed, setShowReversed] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selected) setSelected(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, selected]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return TAROT_CARDS.filter(card => {
      const matchesSuit = suit === 'all' || (suit === 'major' ? card.arcana === 'major' : card.suit === suit);
      if (!matchesSuit) return false;
      if (!q) return true;
      return (
        card.name.toLowerCase().includes(q) ||
        card.keywords.some(k => k.toLowerCase().includes(q)) ||
        (card.element?.toLowerCase().includes(q) ?? false) ||
        (card.planet?.toLowerCase().includes(q) ?? false) ||
        (card.zodiac?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, suit]);

  const suitColor = selected ? getSuitColor(selected.suit) : 'hsl(var(--primary))';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Tarot encyclopedia"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="ml-auto w-full max-w-md h-full flex flex-col overflow-hidden"
        style={{ background: 'hsl(var(--background))', borderLeft: '1px solid hsl(var(--border))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
            <h2 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              Tarot Encyclopedia
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              78 cards
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}
            aria-label="Close encyclopedia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 overflow-y-auto p-4"
            >
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-sm mb-4"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                ← Back to all cards
              </button>

              <div className="flex gap-4 mb-5">
                {selected.image && (
                  <div className="flex-shrink-0" style={{ width: 90, aspectRatio: '5/9' }}>
                    <img
                      src={selected.image}
                      alt={selected.name}
                      className="w-full h-full object-contain rounded-xl"
                      style={{ background: 'hsl(var(--card-deep))', border: '1px solid hsl(var(--border))' }}
                      draggable={false}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {selected.arcana === 'major' ? 'Major Arcana' : (selected.suit ? selected.suit.charAt(0).toUpperCase() + selected.suit.slice(1) : '')}
                  </p>
                  <h3 className="text-2xl mb-2" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                    {selected.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.keywords.map(kw => (
                      <span key={kw} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${suitColor}22`, color: suitColor, fontFamily: 'var(--font-sans)' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex rounded-lg overflow-hidden mb-4" style={{ border: '1px solid hsl(var(--border))' }}>
                <button
                  onClick={() => setShowReversed(false)}
                  className="flex-1 py-2 text-xs transition-colors"
                  style={{
                    background: !showReversed ? 'hsl(var(--primary) / 0.2)' : 'transparent',
                    color: !showReversed ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  ↑ Upright
                </button>
                <button
                  onClick={() => setShowReversed(true)}
                  className="flex-1 py-2 text-xs transition-colors"
                  style={{
                    background: showReversed ? 'hsl(var(--astro-mars) / 0.2)' : 'transparent',
                    color: showReversed ? 'hsl(var(--astro-mars))' : 'hsl(var(--muted-foreground))',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  ↓ Reversed
                </button>
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                {showReversed ? selected.reversedMeaning : selected.uprightMeaning}
              </p>

              <div className="flex gap-4 flex-wrap p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                {selected.element && (
                  <div>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Element</p>
                    <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{selected.element}</p>
                  </div>
                )}
                {selected.planet && (
                  <div>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Planet</p>
                    <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{selected.planet}</p>
                  </div>
                )}
                {selected.zodiac && (
                  <div>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Zodiac</p>
                    <p className="text-sm font-medium" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>{selected.zodiac}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-4 space-y-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search cards, keywords, elements…"
                    className="pl-9 text-sm"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search">
                      <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {SUITS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSuit(s)}
                      className="text-xs px-2.5 py-1 rounded-full capitalize transition-colors"
                      style={{
                        background: suit === s ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
                        color: suit === s ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        border: `1px solid ${suit === s ? 'hsl(var(--primary) / 0.4)' : 'transparent'}`,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {s === 'major' ? 'Major Arcana' : s}
                    </button>
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {filtered.length} card{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-3 gap-2">
                  {filtered.map(card => {
                    const sc = getSuitColor(card.suit);
                    return (
                      <button
                        key={card.id}
                        onClick={() => { setSelected(card); setShowReversed(false); }}
                        className="rounded-xl overflow-hidden text-left transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
                        style={{ border: `1px solid ${sc}33`, background: 'hsl(var(--card))' }}
                        aria-label={card.name}
                      >
                        {card.image ? (
                          <div style={{ aspectRatio: '5/9' }}>
                            <img
                              src={card.image}
                              alt={card.name}
                              className="w-full h-full object-contain"
                              style={{ background: 'hsl(var(--card-deep))' }}
                              loading="lazy"
                              draggable={false}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center" style={{ aspectRatio: '5/9', background: 'hsl(var(--card-deep))' }}>
                            <span className="text-2xl">✦</span>
                          </div>
                        )}
                        <div className="p-1.5">
                          <p className="text-xs leading-tight text-center" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)', fontSize: '0.65rem' }}>
                            {card.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Post-Reading Guest Invite ─────────────────────────────────────────────────
function GuestInvitePanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-2xl p-6 text-center"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.35)' }}
    >
      <div className="text-3xl mb-3">✨</div>
      <h3 className="text-2xl mb-2" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
        Keep your reading
      </h3>
      <p className="text-sm leading-relaxed mb-5 max-w-xs mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        Create a free account to save this reading to your Grimoire, track patterns over time, and unlock your full birth chart, daily horoscope, and more.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/signup"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          <Sparkles className="w-4 h-4" />
          Create free account
        </a>
        <a
          href="/login"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}
        >
          Sign in
        </a>
      </div>
      <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        No credit card · No ads · Always free
      </p>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TarotPage() {
  const { isAuthenticated } = useSession();
  const [selectedSpread, setSelectedSpread] = useState<SpreadDefinition>(SPREADS[0]);
  const [phase, setPhase] = useState<'select' | 'shuffle' | 'draw' | 'reading'>('select');
  const [intention, setIntention] = useState('');
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [selectedCard, setSelectedCard] = useState<DrawnCard | null>(null);
  const [lightboxCard, setLightboxCard] = useState<DrawnCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [allowReversals, setAllowReversals] = useState(true);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [shareTarotOpen, setShareTarotOpen] = useState(false);
  const shuffleDoneRef = useRef(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((msg: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
      requestAnimationFrame(() => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = msg;
      });
    }
  }, []);

  const handleSpreadSelect = (spread: SpreadDefinition) => {
    setSelectedSpread(spread);
    setPhase('select');
    setDrawnCards([]);
    setFlippedCards(new Set());
    setSelectedCard(null);
    setSaved(false);
    setSaveError('');
  };

  const handleShuffle = () => {
    shuffleDoneRef.current = false;
    setPhase('shuffle');
  };

  const handleShuffleDone = useCallback(() => {
    if (shuffleDoneRef.current) return;
    shuffleDoneRef.current = true;
    setTimeout(() => setPhase('draw'), 300);
  }, []);

  const handleDraw = () => {
    const drawn = drawSpread(selectedSpread.positions.length);
    const cards: DrawnCard[] = drawn.map((d, i) => ({
      card: d.card,
      reversed: allowReversals ? d.reversed : false,
      // eslint-disable-next-line security/detect-object-injection
      position: selectedSpread.positions[i].id,
      // eslint-disable-next-line security/detect-object-injection
      positionLabel: selectedSpread.positions[i].label,
      // eslint-disable-next-line security/detect-object-injection
      positionDescription: selectedSpread.positions[i].description,
    }));
    setDrawnCards(cards);
    setFlippedCards(new Set());
    setSelectedCard(null);
    setSaved(false);
    setSaveError('');
    setPhase('reading');
    announce(`${cards.length} card${cards.length > 1 ? 's' : ''} drawn. Tap each card to reveal it.`);
  };

  const handleFlip = (index: number) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    // eslint-disable-next-line security/detect-object-injection
    const drawn = drawnCards[index];
    setSelectedCard(drawn);
    announce(`${drawn.card.name}${drawn.reversed ? ' reversed' : ''} — ${drawn.positionLabel}`);
  };

  const handleRevealAll = () => {
    const all = new Set(drawnCards.map((_, i) => i));
    setFlippedCards(all);
    setSelectedCard(null);
    announce(`All ${drawnCards.length} cards revealed.`);
  };

  const handleNewReading = () => {
    setPhase('select');
    setDrawnCards([]);
    setFlippedCards(new Set());
    setSelectedCard(null);
    setSaved(false);
    setSaveError('');
    setIntention('');
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/tarot', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as SavedReading[];
        setReadings(data);
        setHistoryLoaded(true);
      }
    } catch {
      // silent
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          spreadType: selectedSpread.id,
          spreadName: selectedSpread.name,
          intention,
          cards: drawnCards.map((d, i) => ({
            // eslint-disable-next-line security/detect-object-injection
            position: selectedSpread.positions[i].id,
            cardId: d.card.id,
            reversed: d.reversed,
          })),
          notes: '',
          moonPhase: '',
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      if (showHistory) void loadHistory();
      // Mirror to Grimoire so it appears in the user's Book of Shadows
      void fetch('/api/grimoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'tarot',
          title: `${selectedSpread.name} Reading`,
          content: drawnCards.map((d, i) =>
            `${selectedSpread.positions[i]?.label ?? `Card ${i + 1}`}: ${d.card.name}${d.reversed ? ' (Reversed)' : ''}`
          ).join('\n'),
          notes: intention ? `Intention: ${intention}` : '',
          tags: 'tarot',
          moonPhase: '',
          entryDate: new Date().toISOString().split('T')[0],
          metadata: {
            spreadType: selectedSpread.id,
            cards: drawnCards.map((d, i) => ({
              position: selectedSpread.positions[i]?.id,
              cardId: d.card.id,
              reversed: d.reversed,
            })),
          },
        }),
      });
    } catch {
      setSaveError('Could not save reading. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory && !historyLoaded) void loadHistory();
    setShowHistory(v => !v);
  };

  const handleDeleteReading = async (id: number) => {
    try {
      await fetch(`/api/tarot/${id}`, { method: 'DELETE', credentials: 'include' });
      setReadings(prev => prev.filter(r => r.id !== id));
    } catch {
      // silent
    }
  };

  const cardCount = selectedSpread.positions.length;
  const gridCols =
    cardCount === 1 ? 'grid-cols-1 max-w-[200px] mx-auto' :
    cardCount <= 3 ? 'grid-cols-3 max-w-2xl mx-auto' :
    cardCount === 4 ? 'grid-cols-2 sm:grid-cols-4' :
    'grid-cols-3 sm:grid-cols-5';

  const allFlipped = drawnCards.length > 0 && flippedCards.size === drawnCards.length;
  const someFlipped = flippedCards.size > 0 && !allFlipped;

  const heroCards = useMemo(() =>
    TAROT_CARDS.filter(c => c.arcana === 'major' && c.image).slice(0, 3),
    []
  );

  return (
    <>
      <Helmet>
        <title>{tarot.seo.title}</title>
        <meta name="description" content={tarot.seo.description} />
        <meta property="og:title" content={tarot.seo.title} />
        <meta property="og:description" content={tarot.seo.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/tarot" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={tarot.seo.title} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={tarot.seo.title} />
        <meta name="twitter:description" content={tarot.seo.description} />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content={tarot.seo.title} />
        <link rel="canonical" href="https://spellful.com/tarot" />
      </Helmet>

      {/* Screen reader live region */}
      <div ref={liveRegionRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      <main>
        {/* ── Hero ── */}
        <section className="relative py-20 md:py-28 text-center overflow-hidden">
          <MoonNightSky />
          <TwinkleStars />
          <div className="relative z-10 max-w-3xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' as const }}
            >
              {/* Card art preview */}
              <div className="flex justify-center items-end gap-3 mb-8" aria-hidden="true">
                {heroCards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 30, rotate: (i - 1) * 8 }}
                    animate={{ opacity: 1, y: 0, rotate: (i - 1) * 8 }}
                    transition={{ delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const }}
                    style={{
                      width: i === 1 ? 90 : 72,
                      aspectRatio: '5/9',
                      zIndex: i === 1 ? 2 : 1,
                      position: 'relative',
                    }}
                  >
                    <img
                      src={card.image}
                      alt=""
                      className="w-full h-full object-contain rounded-xl shadow-2xl"
                      style={{ background: 'hsl(var(--card-deep))', border: '1px solid hsl(var(--border))' }}
                      draggable={false}
                    />
                  </motion.div>
                ))}
              </div>

              <div
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full mb-4"
                style={{
                  background: 'hsl(var(--primary) / 0.15)',
                  border: '1px solid hsl(var(--primary) / 0.4)',
                  color: 'hsl(var(--primary))',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                Full 78-card deck · 5 spreads
              </div>

              <h1
                className="text-5xl md:text-6xl mb-4"
                style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
              >
                The Cards Are Waiting.
              </h1>
              <p
                className="text-lg mb-8 max-w-xl mx-auto"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                Shuffle the deck, draw your cards, and receive the wisdom the universe has for you in this moment.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="#reading"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  <Shuffle className="w-4 h-4" />
                  Begin Your Free Reading
                </a>
                <button
                  onClick={() => setShowEncyclopedia(true)}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}
                >
                  <BookOpen className="w-4 h-4" />
                  Explore the Tarot
                </button>
              </div>

              <p className="text-xs mt-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                No account needed · Always free
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Spread Selector ── */}
        <section id="reading" className="max-w-5xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-3xl mb-2 text-center" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              {tarot.spreadSection.heading}
            </h2>
            <p className="text-center mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {tarot.spreadSection.subheading}
            </p>
            <SpreadSelector selected={selectedSpread} onSelect={handleSpreadSelect} />
          </motion.div>
        </section>

        {/* ── Reading Area ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div
            className="rounded-2xl p-6 md:p-10"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            {/* Intention + shuffle */}
            {phase === 'select' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                    {tarot.drawSection.intentionLabel}
                    <span className="ml-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>(optional)</span>
                  </label>
                  <Textarea
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    placeholder="What question or area of life are you seeking guidance on?"
                    rows={2}
                    style={{
                      background: 'hsl(var(--muted))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['What do I need to know today?', 'Where should I focus my energy?', 'What is blocking me?'].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => setIntention(prompt)}
                        className="text-xs px-2.5 py-1 rounded-full transition-colors"
                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reversals toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                      Allow reversed cards
                    </p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      Reversed cards carry a different, often inward energy
                    </p>
                  </div>
                  <button
                    onClick={() => setAllowReversals(v => !v)}
                    className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                    style={{ background: allowReversals ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                    role="switch"
                    aria-checked={allowReversals}
                    aria-label="Allow reversed cards"
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                      style={{ transform: allowReversals ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {tarot.drawSection.shufflePrompt}
                  </p>
                  <Button
                    onClick={handleShuffle}
                    size="lg"
                    className="gap-2 px-8"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    {tarot.drawSection.shuffleButton}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Shuffle animation */}
            {phase === 'shuffle' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <p className="text-sm mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {tarot.drawSection.shufflingText}
                </p>
                <ShuffleDeck onDone={handleShuffleDone} />
                <button
                  onClick={handleShuffleDone}
                  className="mt-6 text-xs underline"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  Skip animation
                </button>
              </motion.div>
            )}

            {/* Draw phase */}
            {phase === 'draw' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <p className="text-lg mb-8" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  The deck is ready. Draw your {selectedSpread.positions.length === 1 ? 'card' : 'cards'}.
                </p>
                <Button
                  onClick={handleDraw}
                  size="lg"
                  className="gap-2 px-10"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                  <Sparkles className="w-4 h-4" />
                  {tarot.drawSection.drawButton}
                </Button>
              </motion.div>
            )}

            {/* Reading */}
            {phase === 'reading' && drawnCards.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {flippedCards.size === 0
                      ? 'Tap each card to reveal it'
                      : someFlipped
                      ? `${flippedCards.size} of ${drawnCards.length} revealed`
                      : 'All cards revealed'}
                  </p>
                  {!allFlipped && (
                    <button
                      onClick={handleRevealAll}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: 'hsl(var(--accent))', background: 'hsl(var(--accent) / 0.1)', border: '1px solid hsl(var(--accent) / 0.3)', fontFamily: 'var(--font-sans)' }}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Reveal all
                    </button>
                  )}
                </div>

                <div className={`grid ${gridCols} gap-4`}>
                  {drawnCards.map((drawn, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-full" style={{ aspectRatio: '5 / 9' }}>
                        <FlipCard
                          card={drawn.card}
                          reversed={drawn.reversed}
                          flipped={flippedCards.has(i)}
                          delay={i * 0.15}
                          onClick={() => handleFlip(i)}
                          index={i}
                        />
                      </div>
                      <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {drawn.positionLabel}
                      </p>
                      {!flippedCards.has(i) && (
                        <p className="text-xs text-center" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                          Tap to reveal
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {selectedCard && !allFlipped && (
                    <CardDetailPanel
                      key={selectedCard.card.id}
                      drawn={selectedCard}
                      onClose={() => setSelectedCard(null)}
                      onExpand={() => setLightboxCard(selectedCard)}
                    />
                  )}
                </AnimatePresence>

                {allFlipped && (
                  <StoryWeaver drawn={drawnCards} spreadName={selectedSpread.name} onShare={() => setShareTarotOpen(true)} />
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleNewReading}
                    className="gap-2"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {tarot.drawSection.newReadingButton}
                  </Button>

                  {isAuthenticated && (
                    <Button
                      onClick={handleSave}
                      disabled={saving || saved}
                      className="gap-2"
                      style={{
                        background: saved ? 'hsl(var(--success))' : 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                      }}
                    >
                      <Save className="w-4 h-4" />
                      {saving
                        ? tarot.drawSection.savingText
                        : saved
                        ? tarot.drawSection.savedText
                        : tarot.drawSection.saveButton}
                    </Button>
                  )}
                </div>

                {saveError && (
                  <p className="text-center text-sm" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>
                    {saveError}
                  </p>
                )}

                {!isAuthenticated && allFlipped && (
                  <GuestInvitePanel />
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* ── Reading History ── */}
        {isAuthenticated && (
          <section className="max-w-5xl mx-auto px-6 pb-20">
            <button
              onClick={handleToggleHistory}
              className="w-full flex items-center justify-between p-4 rounded-xl mb-4"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                <h2 className="text-xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  {tarot.historySection.heading}
                </h2>
              </div>
              {showHistory
                ? <ChevronUp className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                : <ChevronDown className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              }
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <ReadingHistory readings={readings} onDelete={handleDeleteReading} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </main>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxCard && (
          <CardLightbox drawn={lightboxCard} onClose={() => setLightboxCard(null)} />
        )}
      </AnimatePresence>

      {/* ── Encyclopedia Drawer ── */}
      <AnimatePresence>
        {showEncyclopedia && (
          <EncyclopediaDrawer onClose={() => setShowEncyclopedia(false)} />
        )}
      </AnimatePresence>

      {/* ── Share Tarot Modal ── */}
      {shareTarotOpen && drawnCards.length > 0 && (
        <ShareTarotModal
          payload={{
            spreadType: selectedSpread.id,
            spreadName: selectedSpread.name,
            cards: drawnCards.map((dc, i) => ({
              cardId: dc.card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              position: dc.positionLabel,
              reversed: dc.reversed,
              displayOrder: i,
            })) satisfies ShareTarotPayload['cards'],
          }}
          onClose={() => setShareTarotOpen(false)}
        />
      )}
    </>
  );
}
