/**
 * /tarot — Interactive Tarot Reading page
 * Spreads: one-card, three-card, love, career, celtic-cross
 * Features: shuffle animation, draw, save to grimoire, share, reading history
 */
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Sparkles, BookOpen, Trash2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { SPREADS as TAROT_SPREADS, drawSpread, getSuitColor, getCardById, getDeeperMeaning, type TarotCard, type SpreadDefinition } from '@/lib/tarot-data';
import { getMoonPhase } from '@/lib/moon-phase-engine';
import ShareTarotModal, { type ShareTarotPayload } from '@/components/ShareTarotModal';
import { tarot } from 'virtual:content';
import { useSession } from '@/lib/auth/auth-client';

const siteUrl = 'https://spellful.com';
const CARD_BACK = '/airo-assets/images/pages/resources/tarot-card-back';

// Use spread definitions from tarot-data

// ── Drawn card type ───────────────────────────────────────────────────────────
interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  position: string;
}

// ── Saved reading type (from API) ─────────────────────────────────────────────
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

// ── Sparkle burst — fires once when a card is revealed ───────────────────────
const SPARKLE_POSITIONS = [
  { x: -28, y: -32, delay: 0.05 },
  { x:  28, y: -32, delay: 0.10 },
  { x: -38, y:   0, delay: 0.08 },
  { x:  38, y:   0, delay: 0.12 },
  { x: -22, y:  30, delay: 0.15 },
  { x:  22, y:  30, delay: 0.07 },
  { x:   0, y: -40, delay: 0.03 },
  { x:   0, y:  38, delay: 0.18 },
];

function SparkleBurst({ color, reduced }: { color: string; reduced: boolean }) {
  if (reduced) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {SPARKLE_POSITIONS.map((sp, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: sp.x, y: sp.y }}
          transition={{ duration: 0.7, delay: sp.delay, ease: 'easeOut' as const }}
          className="absolute"
          style={{ top: '50%', left: '50%', width: 6, height: 6, marginTop: -3, marginLeft: -3 }}
        >
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden="true">
            <path d="M3 0L3.5 2.5L6 3L3.5 3.5L3 6L2.5 3.5L0 3L2.5 2.5Z" fill={color} />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// ── Card face component ───────────────────────────────────────────────────────
function CardFace({ drawn, index, revealed }: { drawn: DrawnCard; index: number; revealed: boolean }) {
  const suitColor = getSuitColor(drawn.card.suit);
  const reduced = useReducedMotion() ?? false;
  const revealDelay = index * 0.22;

  const cardSlug = drawn.card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
      className="flex flex-col items-center gap-2"
    >
      {/* Position label */}
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        {drawn.position}
      </p>

      {/* 3-D flip wrapper — glow lives outside preserve-3d so it anchors correctly */}
      <div style={{ position: 'relative', width: 110 }}>
        {/* Glow ring — outside preserve-3d so absolute positioning works */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={reduced
              ? { opacity: 0.55, scale: 1 }
              : { opacity: [0, 0.85, 0.45, 0.6], scale: [0.88, 1.08, 1.0, 1.03] }
            }
            transition={{ duration: 1.4, delay: revealDelay + 0.6, ease: 'easeOut' as const }}
            className="absolute pointer-events-none"
            style={{
              inset: -14,
              borderRadius: 20,
              background: `radial-gradient(ellipse at center, ${suitColor}70 0%, ${suitColor}33 45%, transparent 72%)`,
              filter: 'blur(8px)',
              zIndex: 0,
            }}
            aria-hidden="true"
          />
        )}

        <div style={{ perspective: '900px', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ rotateY: 180, opacity: 0 }}
            animate={revealed ? { rotateY: 0, opacity: 1 } : { rotateY: 180, opacity: 0 }}
            transition={{
              duration: reduced ? 0.01 : 0.75,
              delay: revealDelay,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
            style={{ transformStyle: 'preserve-3d', position: 'relative' }}
          >
            {/* Sparkle burst on reveal */}
            {revealed && <SparkleBurst color={suitColor} reduced={reduced} />}

            {/* Card image — gentle float after reveal */}
            <motion.div
              className="relative rounded-xl overflow-hidden shadow-xl"
              style={{
                width: 110,
                aspectRatio: '5/9',
                border: `2px solid ${suitColor}`,
                boxShadow: revealed
                  ? `0 0 28px ${suitColor}66, 0 0 8px ${suitColor}44`
                  : `0 0 10px ${suitColor}22`,
              }}
              animate={revealed && !reduced ? { y: [0, -4, 0] } : { y: 0 }}
              transition={revealed && !reduced
                ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const, delay: revealDelay + 0.9 }
                : {}
              }
            >
              <img
                src={drawn.card.image ?? CARD_BACK}
                alt={drawn.card.name}
                className="w-full h-full object-cover"
                style={{
                  transform: drawn.reversed ? 'rotate(180deg)' : 'none',
                  transition: reduced ? 'none' : 'transform 0.4s ease',
                }}
                loading="lazy"
              />
              {drawn.reversed && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--destructive) / 0.85)', color: 'hsl(var(--destructive-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Reversed
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Card name — fades in after flip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4, delay: revealDelay + 0.65 }}
        className="text-center text-sm font-medium mt-1"
        style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)', maxWidth: 120 }}
      >
        {drawn.card.name}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4, delay: revealDelay + 0.75 }}
        className="text-center text-xs"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
      >
        {drawn.reversed ? 'Reversed' : 'Upright'}
      </motion.p>

      {/* Link to full card detail */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4, delay: revealDelay + 0.85 }}
      >
        <Link
          to={`/tarot/cards/${cardSlug}`}
          className="text-xs underline underline-offset-2 mt-0.5"
          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
        >
          Full meaning →
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ── Card back (face-down placeholder) ────────────────────────────────────────
function CardBack({ index }: { index: number }) {
  const reduced = useReducedMotion() ?? false;
  const floatDelay = index * 0.18;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' as const }}
      className="flex flex-col items-center gap-2"
    >
      {/* Outer wrapper holds glow + card together */}
      <div style={{ position: 'relative', width: 110 }}>
        {/* Ambient glow pulse */}
        {!reduced && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              inset: -10,
              borderRadius: 18,
              background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.22) 0%, hsl(var(--accent) / 0.10) 50%, transparent 75%)',
              filter: 'blur(7px)',
              zIndex: 0,
            }}
            animate={{ opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const, delay: floatDelay }}
            aria-hidden="true"
          />
        )}

        {/* Card image with gentle float */}
        <motion.div
          className="relative rounded-xl overflow-hidden shadow-lg"
          style={{
            width: 110,
            aspectRatio: '5/9',
            border: '2px solid hsl(var(--border))',
            zIndex: 1,
          }}
          animate={!reduced ? { y: [0, -5, 0] } : { y: 0 }}
          transition={!reduced
            ? { duration: 3.8, repeat: Infinity, ease: 'easeInOut' as const, delay: floatDelay }
            : {}
          }
        >
          <img src={CARD_BACK} alt="Card back" className="w-full h-full object-cover" loading="lazy" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── History item ──────────────────────────────────────────────────────────────
function HistoryItem({ reading, onDelete }: { reading: SavedReading; onDelete: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const date = new Date(reading.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            {reading.spreadName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {date}{reading.moonPhase ? ` · ${reading.moonPhase}` : ''}
          </p>
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'hsl(var(--muted-foreground))' }} /> : <ChevronDown size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              {reading.intention && (
                <p className="text-xs italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  "{reading.intention}"
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {reading.cards.map((c, i) => {
                  const card = getCardById(c.cardId);
                  return card ? (
                    <Link
                      key={i}
                      to={`/tarot/cards/${card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}
                    >
                      <span style={{ color: getSuitColor(card.suit) }}>✦</span>
                      <span>{c.position}: {card.name}{c.reversed ? ' (R)' : ''}</span>
                    </Link>
                  ) : null;
                })}
              </div>
              {reading.notes && (
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {reading.notes}
                </p>
              )}
              <button
                onClick={() => onDelete(reading.id)}
                className="self-start flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)', background: 'hsl(var(--destructive) / 0.08)' }}
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Deeper meaning panel ──────────────────────────────────────────────────────
function DeeperMeaningPanel({
  cardId,
  reversed,
  suitColor,
  revealDelay,
}: {
  cardId: number;
  reversed: boolean;
  suitColor: string;
  revealDelay: number;
}) {
  const [open, setOpen] = useState(false);
  const deeper = getDeeperMeaning(cardId);
  const reduced = useReducedMotion() ?? false;

  if (!deeper) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: revealDelay + 0.5 }}
      className="mt-3"
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200"
        style={{
          background: open ? `${suitColor}12` : 'hsl(var(--muted) / 0.5)',
          borderColor: open ? suitColor : 'hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: open ? suitColor : 'hsl(var(--foreground))' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 0L7.7 3.3L11 2L8.7 4.7L12 5L8.7 5.3L11 8L7.7 6.7L7 10L6.3 6.7L3 8L5.3 5.3L2 5L5.3 4.7L3 2L6.3 3.3Z" fill={open ? suitColor : 'hsl(var(--muted-foreground))'} />
          </svg>
          Deeper Meaning
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.25, ease: 'easeInOut' as const }}
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 4.5L7 9.5L12 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.38, ease: 'easeInOut' as const }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="flex flex-col gap-5 px-4 pt-4 pb-5 rounded-b-xl border-x border-b"
              style={{ borderColor: suitColor, background: `${suitColor}08` }}
            >
              {/* Reversed interpretation */}
              {reversed && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-widest" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>
                    Reversed Interpretation
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
                    When reversed, this card's energy turns inward or becomes blocked. The themes of this card ask you to examine where resistance, avoidance, or shadow may be at play — and what it would take to restore flow.
                  </p>
                </div>
              )}

              {/* Numerology */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs uppercase tracking-widest" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>
                  Numerology
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                  {deeper.numerology}
                </p>
              </div>

              {/* Elemental association */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs uppercase tracking-widest" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>
                  Elemental Association
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                  {deeper.elementalAssociation}
                </p>
              </div>

              {/* Reflection questions */}
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-widest" style={{ color: suitColor, fontFamily: 'var(--font-sans)' }}>
                  Reflection Questions
                </p>
                <ul className="flex flex-col gap-2.5">
                  {deeper.reflectionQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 text-xs" style={{ color: suitColor }}>✦</span>
                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {q}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TarotPage() {
  const { isAuthenticated } = useSession();
  const moonPhase = getMoonPhase().phase;

  // Spread selection — default to three-card so 3 card backs show on load
  const [selectedSpread, setSelectedSpread] = useState<SpreadDefinition>(
    TAROT_SPREADS.find(s => s.id === 'three-card') ?? TAROT_SPREADS[0]
  );

  // Reading state
  const [intention, setIntention] = useState('');
  const [shuffling, setShuffling] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // History
  const [history, setHistory] = useState<SavedReading[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Load history when authenticated
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/tarot', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as SavedReading[];
        setHistory(data);
      }
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) loadHistory();
  }, [isAuthenticated, loadHistory]);

  // Reset when spread changes
  useEffect(() => {
    setShuffled(false);
    setDrawnCards([]);
    setRevealed(false);
    setSaved(false);
    setSaveError('');
  }, [selectedSpread]);

  function handleShuffle() {
    setShuffling(true);
    setDrawnCards([]);
    setRevealed(false);
    setSaved(false);
    setSaveError('');
    setTimeout(() => {
      setShuffling(false);
      setShuffled(true);
    }, 1200);
  }

  function handleDraw() {
    if (!shuffled) return;
    setDrawing(true);
    setTimeout(() => {
      const raw = drawSpread(selectedSpread.positions.length);
      const cards: DrawnCard[] = raw.map((item, i) => ({
        card: item.card,
        reversed: item.reversed,
        position: selectedSpread.positions[i]?.label ?? `Card ${i + 1}`,
      }));
      setDrawnCards(cards);
      setDrawing(false);
      setTimeout(() => setRevealed(true), 100);
    }, 600);
  }

  async function handleSave() {
    if (!isAuthenticated || drawnCards.length === 0) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        spreadType: selectedSpread.id,
        spreadName: selectedSpread.name,
        intention: intention.trim(),
        cards: drawnCards.map(d => ({
          position: d.position,
          cardId: d.card.id,
          reversed: d.reversed,
        })),
        notes: '',
        moonPhase,
      };
      const res = await fetch('/api/tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Save failed' })) as { error?: string };
        setSaveError(err.error ?? 'Save failed');
      } else {
        setSaved(true);
        await loadHistory();
      }
    } catch {
      setSaveError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/tarot/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) setHistory(h => h.filter(r => r.id !== id));
    } catch {
      // silently fail
    }
  }

  function handleNewReading() {
    setShuffled(false);
    setDrawnCards([]);
    setRevealed(false);
    setSaved(false);
    setSaveError('');
    setIntention('');
  }

  // Share URL (used in OG meta)
  const shareUrl = `${siteUrl}/tarot`;

  return (
    <>
      <Helmet>
        <title>{tarot.seo.title}</title>
        <meta name="description" content={tarot.seo.description} />
        <meta property="og:title" content={tarot.seo.title} />
        <meta property="og:description" content={tarot.seo.description} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${siteUrl}/airo-assets/images/pages/og-image`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={tarot.seo.title} />
        <meta name="twitter:description" content={tarot.seo.description} />
        <meta name="twitter:image" content={`${siteUrl}/airo-assets/images/pages/og-image`} />
      </Helmet>

      <main style={{ background: 'hsl(var(--background))', minHeight: '100vh' }}>

        {/* ── Hero ── */}
        <section className="pt-xxl pb-xl px-6 text-center" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
              {tarot.hero.eyebrow}
            </p>
            <h1 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {tarot.hero.title}
            </h1>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {tarot.hero.subtitle}
            </p>
            <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Moon phase: <span style={{ color: 'hsl(var(--primary))' }}>{moonPhase}</span>
            </p>
          </motion.div>

          {/* Decorative three-card fan */}
          <div className="flex justify-center items-end mt-8 mb-2" style={{ gap: 0, height: 160 }} aria-hidden="true">
            {/* Left card — rotated left */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -18 }}
              animate={{ opacity: 1, y: 0, rotate: -18 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' as const }}
              style={{ width: 72, aspectRatio: '5/9', borderRadius: 10, overflow: 'hidden', border: '2px solid hsl(var(--border))', boxShadow: '0 8px 24px hsl(var(--background) / 0.6)', transformOrigin: 'bottom center', marginRight: -18 }}
            >
              <img src={CARD_BACK} alt="" className="w-full h-full object-cover" loading="eager" />
            </motion.div>
            {/* Center card — upright, slightly larger */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 0 }}
              animate={{ opacity: 1, y: -10, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease: 'easeOut' as const }}
              style={{ width: 82, aspectRatio: '5/9', borderRadius: 10, overflow: 'hidden', border: '2px solid hsl(var(--primary) / 0.6)', boxShadow: '0 0 20px hsl(var(--primary) / 0.25), 0 10px 30px hsl(var(--background) / 0.7)', zIndex: 2, position: 'relative' }}
            >
              <img src={CARD_BACK} alt="" className="w-full h-full object-cover" loading="eager" />
            </motion.div>
            {/* Right card — rotated right */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 18 }}
              animate={{ opacity: 1, y: 0, rotate: 18 }}
              transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' as const }}
              style={{ width: 72, aspectRatio: '5/9', borderRadius: 10, overflow: 'hidden', border: '2px solid hsl(var(--border))', boxShadow: '0 8px 24px hsl(var(--background) / 0.6)', transformOrigin: 'bottom center', marginLeft: -18 }}
            >
              <img src={CARD_BACK} alt="" className="w-full h-full object-cover" loading="eager" />
            </motion.div>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-xl flex flex-col gap-xl">

          {/* ── Spread selector ── */}
          <section>
            <h2 className="text-xl mb-4 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {tarot.spreadSection.heading}
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {tarot.spreadSection.subheading}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {TAROT_SPREADS.map(spread => (
                <button
                  key={spread.id}
                  onClick={() => setSelectedSpread(spread)}
                  className="rounded-xl p-4 text-left transition-all duration-200 border"
                  style={{
                    background: selectedSpread.id === spread.id ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--card))',
                    borderColor: selectedSpread.id === spread.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    boxShadow: selectedSpread.id === spread.id ? '0 0 12px hsl(var(--primary) / 0.2)' : 'none',
                  }}
                >
                  <div className="text-xl mb-2" style={{ color: 'hsl(var(--primary))' }}>{spread.icon}</div>
                  <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{spread.name}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{spread.description}</p>
                  <p className="text-xs mt-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                    {spread.positions.length} card{spread.positions.length > 1 ? 's' : ''}
                  </p>                </button>
              ))}
            </div>
          </section>

          {/* ── Intention input ── */}
          <section className="flex flex-col gap-2">
            <label htmlFor="intention" className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              {tarot.drawSection.intentionLabel}
            </label>
            <textarea
              id="intention"
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder={tarot.drawSection.intentionPlaceholder}
              rows={2}
              maxLength={300}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </section>

          {/* ── Shuffle / Draw controls ── */}
          <section className="flex flex-col items-center gap-4">
            <p className="text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {tarot.drawSection.shufflePrompt}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Shuffle */}
              <motion.button
                onClick={handleShuffle}
                disabled={shuffling}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontFamily: 'var(--font-sans)',
                  opacity: shuffling ? 0.7 : 1,
                }}
              >
                <motion.span
                  animate={shuffling ? { rotate: 360 } : { rotate: 0 }}
                  transition={shuffling ? { duration: 0.8, repeat: Infinity, ease: 'linear' as const } : {}}
                >
                  <Sparkles size={16} />
                </motion.span>
                {shuffling ? tarot.drawSection.shufflingText : tarot.drawSection.shuffleButton}
              </motion.button>

              {/* Draw */}
              <motion.button
                onClick={handleDraw}
                disabled={!shuffled || drawing || drawnCards.length > 0}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: shuffled && drawnCards.length === 0 ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
                  color: shuffled && drawnCards.length === 0 ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))',
                  fontFamily: 'var(--font-sans)',
                  opacity: (!shuffled || drawing || drawnCards.length > 0) ? 0.5 : 1,
                  cursor: (!shuffled || drawing || drawnCards.length > 0) ? 'not-allowed' : 'pointer',
                }}
              >
                {drawing ? tarot.drawSection.drawingText : tarot.drawSection.drawButton}
              </motion.button>

              {/* New reading */}
              {drawnCards.length > 0 && (
                <motion.button
                  onClick={handleNewReading}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                    fontFamily: 'var(--font-sans)',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  <RotateCcw size={14} />
                  {tarot.drawSection.newReadingButton}
                </motion.button>
              )}
            </div>

            {/* Shuffled indicator */}
            <AnimatePresence>
              {shuffled && drawnCards.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs"
                  style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                >
                  ✦ Deck shuffled — draw your cards
                </motion.p>
              )}
            </AnimatePresence>
          </section>

          {/* ── Card display area ── */}
          <AnimatePresence mode="wait">
            {drawnCards.length === 0 && !drawing && (
              <motion.section
                key="backs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap justify-center gap-4 py-4"
              >
                {selectedSpread.positions.map((pos, i) => (
                  <CardBack key={pos.id ?? i} index={i} />
                ))}
              </motion.section>
            )}

            {drawnCards.length > 0 && (
              <motion.section
                key="faces"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-xl"
              >
                {/* Cards */}
                <div className="flex flex-wrap justify-center gap-6 py-4">
                  {drawnCards.map((drawn, i) => (
                    <CardFace key={drawn.card.id} drawn={drawn} index={i} revealed={revealed} />
                  ))}
                </div>

                {/* Meanings */}
                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: drawnCards.length * 0.18 + 0.3, duration: 0.5 }}
                      className="flex flex-col gap-4"
                    >
                      {drawnCards.map((drawn, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-5 border"
                          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-lg" style={{ color: getSuitColor(drawn.card.suit) }}>✦</span>
                            <div>
                              <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                {drawn.position}
                              </p>
                              <h3 className="text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                                {drawn.card.name}{drawn.reversed ? ' — Reversed' : ''}
                              </h3>
                              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                {drawn.card.keywords.join(' · ')}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                            {drawn.reversed ? drawn.card.reversedMeaning : drawn.card.uprightMeaning}
                          </p>
                          <Link
                            to={`/tarot/cards/${drawn.card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                            className="inline-block mt-3 text-xs underline underline-offset-2"
                            style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                          >
                            Explore full meaning →
                          </Link>
                          <DeeperMeaningPanel
                            cardId={drawn.card.id}
                            reversed={drawn.reversed}
                            suitColor={getSuitColor(drawn.card.suit)}
                            revealDelay={i * 0.22}
                          />
                        </div>
                      ))}

                      {/* Save + Share */}
                      <div className="flex flex-col items-center gap-4 pt-2">
                        {isAuthenticated ? (
                          <div className="flex flex-col items-center gap-2">
                            <motion.button
                              onClick={handleSave}
                              disabled={saving || saved}
                              whileTap={{ scale: 0.96 }}
                              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
                              style={{
                                background: saved ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--card))',
                                color: saved ? 'hsl(var(--success))' : 'hsl(var(--foreground))',
                                border: `1px solid ${saved ? 'hsl(var(--success))' : 'hsl(var(--border))'}`,
                                fontFamily: 'var(--font-sans)',
                                opacity: saving ? 0.7 : 1,
                              }}
                            >
                              <BookOpen size={15} />
                              {saving ? tarot.drawSection.savingText : saved ? tarot.drawSection.savedText : tarot.drawSection.saveButton}
                            </motion.button>
                            {saveError && (
                              <p className="text-xs" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>
                                {saveError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                            <Link to="/login" style={{ color: 'hsl(var(--primary))' }}>Sign in</Link> {tarot.drawSection.loginToSave}
                          </p>
                        )}

                        <button
                          onClick={() => setShareModalOpen(true)}
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
                          Share reading
                        </button>                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Reading history ── */}
          {isAuthenticated && (
            <section>
              <button
                onClick={() => {
                  setShowHistory(h => !h);
                  if (!showHistory && history.length === 0) loadHistory();
                }}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl border"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} style={{ color: 'hsl(var(--primary))' }} />
                  <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                    {tarot.historySection.heading}
                  </span>
                  {history.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                      {history.length}
                    </span>
                  )}
                </div>
                {showHistory ? <ChevronUp size={16} style={{ color: 'hsl(var(--muted-foreground))' }} /> : <ChevronDown size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />}
              </button>

              <AnimatePresence initial={false}>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' as const }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="flex flex-col gap-3 pt-3">
                      {historyLoading && (
                        <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          Loading readings…
                        </p>
                      )}
                      {!historyLoading && history.length === 0 && (
                        <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          {tarot.historySection.emptyText}
                        </p>
                      )}
                      {history.map(r => (
                        <HistoryItem key={r.id} reading={r} onDelete={handleDelete} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* ── Browse all cards CTA ── */}
          <section className="text-center py-lg">
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Explore the full 78-card deck
            </p>
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}
            >
              <Sparkles size={15} style={{ color: 'hsl(var(--primary))' }} />
              Browse Tarot Encyclopedia
            </Link>
          </section>

        </div>
      </main>

      {/* Share Tarot Modal */}
      {shareModalOpen && drawnCards.length > 0 && (
        <ShareTarotModal
          payload={{
            spreadType: selectedSpread.id,
            spreadName: selectedSpread.name,
            cards: drawnCards.map((dc, i) => ({
              cardId: dc.card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              position: dc.position,
              reversed: dc.reversed,
              displayOrder: i,
            })) satisfies ShareTarotPayload['cards'],
          }}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </>
  );
}
