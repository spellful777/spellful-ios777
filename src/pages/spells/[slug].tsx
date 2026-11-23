import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, Star, BookmarkPlus, BookmarkCheck, ChevronLeft,
  Leaf, Gem, Sparkles, AlertTriangle, ThumbsUp, Flag,
  MessageCircle, ChevronDown, ChevronUp, Send, Pencil, Trash2,
  CheckCircle, BookOpen, ChevronRight, ListChecks, Timer, X as XIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/auth/auth-client';
import { type SpellCardData } from '@/components/SpellCard';
import { spell_detail } from 'virtual:content';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpellStep {
  order: number;
  title: string;
  description: string;
}

interface SpellDetail {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  purpose: string;
  intention: string;
  difficulty: string;
  durationMinutes: number;
  moonPhase: string;
  bestTiming: string;
  materials: string[];
  steps: SpellStep[];
  safetyNotes: string;
  herbCorrespondences: string[];
  crystalCorrespondences: string[];
  elementCorrespondences: string[];
  isFeatured: boolean;
  saveCount: number;
  ratingCount: number;
  ratingSum: number;
}

interface ReviewReply {
  id: number;
  reviewId: number;
  userId: string;
  body: string;
  createdAt: string;
  isOwn: boolean;
}

interface Review {
  id: number;
  userId: string;
  rating: number;
  body: string;
  helpfulCount: number;
  createdAt: string;
  authorName: string;
  isOwn: boolean;
  replies: ReviewReply[];
  userMarkedHelpful: boolean;
}

interface RatingDist {
  star: number;
  count: number;
}

interface SpellDetailResponse {
  spell: SpellDetail;
  relatedSpells: SpellCardData[];
  reviews: Review[];
  ratingDistribution: RatingDist[];
  userState: { reviewId: number | null; rating: number | null; saved: boolean };
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
  new_moon: '🌑', waxing_crescent: '🌒', first_quarter: '🌓',
  waxing_gibbous: '🌔', full_moon: '🌕', waning_gibbous: '🌖',
  last_quarter: '🌗', waning_moon: '🌘',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Select rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${s} star${s !== 1 ? 's' : ''}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <Star
            className="w-6 h-6 transition-colors"
            style={{
              color: s <= (hover || value) ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              fill: s <= (hover || value) ? 'hsl(var(--primary))' : 'transparent',
            }}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ avg, count, size = 'sm' }: { avg: number; count: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cls}
            style={{
              color: s <= Math.round(avg) ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              fill: s <= Math.round(avg) ? 'hsl(var(--primary))' : 'transparent',
            }}
          />
        ))}
      </div>
      <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {count > 0 ? `${avg.toFixed(1)} · ${count} rating${count !== 1 ? 's' : ''}` : 'No ratings yet'}
      </span>
    </div>
  );
}

// ─── Review component ─────────────────────────────────────────────────────────

function ReviewItem({
  review,
  spellSlug,
  onUpdate,
}: {
  review: Review;
  spellSlug: string;
  onUpdate: () => void;
}) {
  const { session } = useSession();
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(review.body);
  const [editRating, setEditRating] = useState(review.rating);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const doHelpful = async () => {
    if (!session) return;
    setBusy(true);
    const r = await fetch(`/api/spells/${spellSlug}/reviews/${review.id}/helpful`, { method: 'POST' });
    if (r.ok) onUpdate();
    setBusy(false);
  };

  const doDelete = async () => {
    if (!confirm('Delete this review?')) return;
    setBusy(true);
    await fetch(`/api/spells/${spellSlug}/reviews/${review.id}`, { method: 'DELETE' });
    onUpdate();
    setBusy(false);
  };

  const doEdit = async () => {
    setBusy(true);
    const r = await fetch(`/api/spells/${spellSlug}/reviews/${review.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: editRating, body: editBody }),
    });
    if (r.ok) { setEditing(false); onUpdate(); }
    setBusy(false);
  };

  const doReply = async () => {
    if (!replyBody.trim()) return;
    setBusy(true);
    const r = await fetch(`/api/spells/${spellSlug}/reviews/${review.id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyBody }),
    });
    if (r.ok) { setReplyBody(''); setShowReply(false); onUpdate(); }
    setBusy(false);
  };

  const doReport = async () => {
    if (!reportReason) return;
    setBusy(true);
    const r = await fetch(`/api/spells/${spellSlug}/reviews/${review.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    });
    const data = await r.json() as { message?: string; error?: string };
    setMsg(data.message ?? data.error ?? '');
    setShowReport(false);
    setBusy(false);
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
            {review.authorName}
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-3.5 h-3.5" style={{
              color: s <= review.rating ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              fill: s <= review.rating ? 'hsl(var(--primary))' : 'transparent',
            }} />
          ))}
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div className="flex flex-col gap-3 mt-2">
          <StarPicker value={editRating} onChange={setEditRating} />
          <Textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={doEdit} disabled={busy}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
          {review.body}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mt-3">
        {session && !review.isOwn && (
          <button
            onClick={doHelpful}
            disabled={busy}
            className="flex items-center gap-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            style={{ color: review.userMarkedHelpful ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
          >
            <ThumbsUp className="w-3 h-3" />
            Helpful ({review.helpfulCount})
          </button>
        )}
        {!session && review.helpfulCount > 0 && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <ThumbsUp className="w-3 h-3" /> {review.helpfulCount} found helpful
          </span>
        )}
        {session && (
          <button
            onClick={() => setShowReply((v) => !v)}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <MessageCircle className="w-3 h-3" /> Reply
          </button>
        )}
        {review.isOwn && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={doDelete}
              disabled={busy}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'hsl(var(--destructive))' }}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </>
        )}
        {session && !review.isOwn && (
          <button
            onClick={() => setShowReport((v) => !v)}
            className="flex items-center gap-1 text-xs ml-auto"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <Flag className="w-3 h-3" /> Report
          </button>
        )}
      </div>

      {/* Report form */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex gap-2 flex-wrap">
              {['spam', 'harassment', 'misinformation', 'inappropriate', 'other'].map((r) => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  className="text-xs px-2 py-1 rounded-full capitalize"
                  style={{
                    background: reportReason === r ? 'hsl(var(--destructive) / 0.15)' : 'hsl(var(--muted))',
                    color: reportReason === r ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
                    border: `1px solid ${reportReason === r ? 'hsl(var(--destructive) / 0.4)' : 'hsl(var(--border))'}`,
                  }}
                >
                  {r}
                </button>
              ))}
              <Button size="sm" variant="outline" onClick={doReport} disabled={!reportReason || busy} className="text-xs">
                Submit Report
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {msg && (
        <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{msg}</p>
      )}

      {/* Replies */}
      {review.replies.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="flex items-center gap-1 text-xs mb-2"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {review.replies.length} repl{review.replies.length !== 1 ? 'ies' : 'y'}
          </button>
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pl-4" style={{ borderLeft: '2px solid hsl(var(--border))' }}>
                  {review.replies.map((reply) => (
                    <div key={reply.id}>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {reply.body}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Reply form */}
      <AnimatePresence>
        {showReply && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex gap-2">
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write a reply…"
                rows={2}
                className="flex-1 text-sm"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              />
              <Button size="sm" onClick={doReply} disabled={busy || !replyBody.trim()} className="self-end">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SpellDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useSession();
  const [data, setData] = useState<SpellDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // ── Guided Ritual Mode ────────────────────────────────────────────────────
  const [guidedMode, setGuidedMode] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);
  const [checkedMaterials, setCheckedMaterials] = useState<Record<number, boolean>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Persist guided progress in sessionStorage (guests included)
  const saveGuidedProgress = useCallback((slug: string, step: number) => {
    try { sessionStorage.setItem(`guided_${slug}`, String(step)); } catch { /* ignore */ }
  }, []);

  const loadGuidedProgress = useCallback((slug: string) => {
    try { return parseInt(sessionStorage.getItem(`guided_${slug}`) ?? '0', 10) || 0; } catch { return 0; }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const resetTimer = () => { setTimerSeconds(0); setTimerRunning(false); };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const fetchData = () => {
    if (!slug) return;
    fetch(`/api/spells/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d: SpellDetailResponse | null) => {
        if (!d) return;
        setData(d);
        setSaved(d.userState.saved);
        setSaveCount(d.spell.saveCount);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const doSave = async () => {
    if (!session) return;
    setSaveBusy(true);
    const r = await fetch(`/api/spells/${slug}/save`, { method: 'POST' });
    const d = await r.json() as { saved: boolean; saveCount: number };
    setSaved(d.saved);
    setSaveCount(d.saveCount);
    setSaveMsg(d.saved ? 'Saved to your Grimoire!' : 'Removed from Grimoire');
    // Mirror save (not unsave) to Grimoire so it appears in Book of Shadows
    if (d.saved && spell) {
      void fetch('/api/grimoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'spell',
          title: spell.title,
          content: spell.subtitle || spell.intention || '',
          notes: spell.intention ? `Intention: ${spell.intention}` : '',
          tags: `spell,${spell.moonPhase ? spell.moonPhase.toLowerCase() : ''}`.replace(/,$/, ''),
          moonPhase: spell.moonPhase ?? '',
          entryDate: new Date().toISOString().split('T')[0],
          metadata: { spellSlug: slug, difficulty: spell.difficulty, durationMinutes: spell.durationMinutes },
        }),
      });
    }
    setTimeout(() => setSaveMsg(''), 3000);
    setSaveBusy(false);
  };

  const doReview = async () => {
    if (!reviewRating || !reviewBody.trim()) return;
    setReviewBusy(true);
    const r = await fetch(`/api/spells/${slug}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: reviewRating, body: reviewBody }),
    });
    const d = await r.json() as { message?: string; error?: string };
    if (r.ok) {
      setReviewMsg('Review submitted!');
      setReviewBody('');
      setReviewRating(0);
      fetchData();
    } else {
      setReviewMsg(d.error ?? 'Error submitting review');
    }
    setReviewBusy(false);
  };

  const siteUrl = 'https://spellful.com';

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{spell_detail.notFoundTitle}</p>
        <Link to="/spells"><Button variant="outline">Back to Spell Library</Button></Link>
      </main>
    );
  }

  const { spell, relatedSpells, reviews, ratingDistribution, userState } = data;
  const accentVar = INTENTION_COLORS[spell.intention] ?? '--primary';
  const avg = spell.ratingCount > 0 ? spell.ratingSum / spell.ratingCount : 0;
  const moonGlyph = MOON_GLYPHS[spell.moonPhase] ?? '';
  const totalReviewRatings = ratingDistribution.reduce((s, r) => s + r.count, 0);

  return (
    <>
      <Helmet>
        <title>{spell.title} — Spell Library — Spellful</title>
        <meta name="description" content={spell.subtitle || spell.purpose.slice(0, 155)} />
        <meta property="og:title" content={`${spell.title} — Spellful Spell Library`} />
        <meta property="og:description" content={spell.subtitle || spell.purpose.slice(0, 155)} />
        <meta property="og:url" content={`${siteUrl}/spells/${spell.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          '@id': `${siteUrl}/spells/${spell.slug}#howto`,
          name: spell.title,
          description: spell.purpose,
          url: `${siteUrl}/spells/${spell.slug}`,
          totalTime: `PT${spell.durationMinutes}M`,
          supply: spell.materials.map((m) => ({ '@type': 'HowToSupply', name: m })),
          step: spell.steps.map((s) => ({
            '@type': 'HowToStep',
            position: s.order,
            name: s.title,
            text: s.description,
          })),
          isPartOf: { '@id': `${siteUrl}/#website` },
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 pt-8">

          {/* ── Breadcrumb ── */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              to="/spells"
              className="flex items-center gap-1.5 text-sm transition-colors w-fit"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(var(--foreground))'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(var(--muted-foreground))'; }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {spell_detail.breadcrumb}
            </Link>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Main content ── */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full capitalize"
                    style={{ background: `hsl(var(${accentVar}) / 0.15)`, color: `hsl(var(${accentVar}))` }}
                  >
                    {spell.intention}
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                  >
                    {DIFFICULTY_LABELS[spell.difficulty] ?? spell.difficulty}
                  </span>
                  {spell.isFeatured && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
                    >
                      <Sparkles className="w-3 h-3" /> {spell_detail.featuredLabel}
                    </span>
                  )}
                </div>

                <h1
                  className="text-4xl md:text-5xl mb-3"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                >
                  {spell.title}
                </h1>
                {spell.subtitle && (
                  <p
                    className="text-lg mb-4"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                  >
                    {spell.subtitle}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <Clock className="w-4 h-4" /> {spell.durationMinutes} min
                  </span>
                  {moonGlyph && (
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {moonGlyph} {spell.moonPhase.replace(/_/g, ' ')}
                    </span>
                  )}
                  {spell.bestTiming && (
                    <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      ✦ {spell.bestTiming}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <BookmarkPlus className="w-4 h-4" /> {saveCount} saved
                  </span>
                </div>

                <StarDisplay avg={avg} count={spell.ratingCount} size="lg" />
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                  {spell_detail.ratingsDisclaimer}
                </p>
              </motion.div>

              {/* Purpose */}
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <h2 className="text-2xl mb-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>{spell_detail.purposeHeading}</h2>
                <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                  {spell.purpose}
                </p>
              </motion.section>

              {/* Materials */}
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                <h2 className="text-2xl mb-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  {spell_detail.materialsHeading}
                </h2>
                <ul className="flex flex-col gap-2">
                  {spell.materials.map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                        style={{ background: `hsl(var(${accentVar}))` }}
                      />
                      <span className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {m}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.section>

              {/* Steps — reading mode + guided ritual mode */}
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                {/* Mode toggle header */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-2xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                    {spell_detail.stepsHeading}
                  </h2>
                  {spell.steps.length > 0 && (
                    <button
                      onClick={() => {
                        const next = !guidedMode;
                        setGuidedMode(next);
                        if (next) {
                          const saved = loadGuidedProgress(spell.slug);
                          setGuidedStep(Math.min(saved, spell.steps.length - 1));
                          resetTimer();
                        }
                      }}
                      className="flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{
                        background: guidedMode ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                        color: guidedMode ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                        border: `1px solid ${guidedMode ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      {guidedMode ? 'Reading Mode' : 'Guided Ritual'}
                    </button>
                  )}
                </div>

                {/* ── Reading mode ── */}
                {!guidedMode && (
                  <ol className="flex flex-col gap-3">
                    {spell.steps.map((step) => (
                      <li key={step.order}>
                        <button
                          onClick={() => setExpandedStep(expandedStep === step.order ? null : step.order)}
                          className="w-full text-left flex items-start gap-4 p-4 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          style={{
                            background: expandedStep === step.order ? `hsl(var(${accentVar}) / 0.08)` : 'hsl(var(--card))',
                            border: `1px solid ${expandedStep === step.order ? `hsl(var(${accentVar}) / 0.3)` : 'hsl(var(--border))'}`,
                          }}
                        >
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shrink-0 mt-0.5"
                            style={{ background: `hsl(var(${accentVar}) / 0.15)`, color: `hsl(var(${accentVar}))` }}
                          >
                            {step.order}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-base" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                              {step.title}
                            </p>
                            <AnimatePresence>
                              {expandedStep === step.order && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-sm leading-relaxed mt-2 overflow-hidden"
                                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                                >
                                  {step.description}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                          {expandedStep === step.order
                            ? <ChevronUp className="w-4 h-4 shrink-0 mt-1" style={{ color: 'hsl(var(--muted-foreground))' }} />
                            : <ChevronDown className="w-4 h-4 shrink-0 mt-1" style={{ color: 'hsl(var(--muted-foreground))' }} />
                          }
                        </button>
                      </li>
                    ))}
                  </ol>
                )}

                {/* ── Guided ritual mode ── */}
                {guidedMode && spell.steps.length > 0 && (() => {
                  const step = spell.steps[guidedStep];
                  const isLast = guidedStep === spell.steps.length - 1;
                  const progress = ((guidedStep + 1) / spell.steps.length) * 100;
                  return (
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ border: `1px solid hsl(var(${accentVar}) / 0.3)`, background: 'hsl(var(--card))' }}
                    >
                      {/* Progress bar */}
                      <div className="h-1 w-full" style={{ background: 'hsl(var(--border))' }}>
                        <motion.div
                          className="h-full"
                          style={{ background: `hsl(var(${accentVar}))` }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' as const }}
                        />
                      </div>

                      <div className="p-6">
                        {/* Step counter */}
                        <div className="flex items-center justify-between mb-5">
                          <span
                            className="text-xs font-medium"
                            style={{ color: `hsl(var(${accentVar}))`, fontFamily: 'var(--font-sans)' }}
                          >
                            Step {guidedStep + 1} of {spell.steps.length}
                          </span>
                          <button
                            onClick={() => { setGuidedMode(false); resetTimer(); }}
                            className="flex items-center gap-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                            aria-label="Exit guided mode"
                          >
                            <XIcon className="w-3.5 h-3.5" aria-hidden="true" /> Exit
                          </button>
                        </div>

                        {/* Step content */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={guidedStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                          >
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium mb-4"
                              style={{ background: `hsl(var(${accentVar}) / 0.15)`, color: `hsl(var(${accentVar}))` }}
                              aria-hidden="true"
                            >
                              {step.order}
                            </div>
                            <h3
                              className="text-xl mb-3"
                              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                            >
                              {step.title}
                            </h3>
                            <p
                              className="text-base leading-relaxed"
                              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                            >
                              {step.description}
                            </p>
                          </motion.div>
                        </AnimatePresence>

                        {/* Timer */}
                        <div className="flex items-center gap-3 mt-5 pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                          <Timer className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                          <span
                            className="text-sm tabular-nums"
                            style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                            aria-live="polite"
                            aria-label={`Timer: ${formatTimer(timerSeconds)}`}
                          >
                            {formatTimer(timerSeconds)}
                          </span>
                          <button
                            onClick={() => setTimerRunning((r) => !r)}
                            className="text-xs px-3 py-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{
                              background: timerRunning ? 'hsl(var(--muted))' : `hsl(var(${accentVar}) / 0.15)`,
                              color: timerRunning ? 'hsl(var(--muted-foreground))' : `hsl(var(${accentVar}))`,
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {timerRunning ? 'Pause' : 'Start'}
                          </button>
                          {timerSeconds > 0 && (
                            <button
                              onClick={resetTimer}
                              className="text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                              style={{ color: 'hsl(var(--muted-foreground))' }}
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-6 gap-3">
                          <button
                            onClick={() => {
                              const prev = Math.max(0, guidedStep - 1);
                              setGuidedStep(prev);
                              saveGuidedProgress(spell.slug, prev);
                              resetTimer();
                            }}
                            disabled={guidedStep === 0}
                            className="flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
                            style={{
                              background: 'hsl(var(--muted))',
                              color: 'hsl(var(--foreground))',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous
                          </button>

                          {!isLast ? (
                            <button
                              onClick={() => {
                                const next = guidedStep + 1;
                                setGuidedStep(next);
                                saveGuidedProgress(spell.slug, next);
                                resetTimer();
                              }}
                              className="flex items-center gap-2 text-sm px-5 py-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              style={{
                                background: `hsl(var(${accentVar}))`,
                                color: 'hsl(var(--primary-foreground))',
                                fontFamily: 'var(--font-sans)',
                              }}
                            >
                              Continue <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                saveGuidedProgress(spell.slug, 0);
                                setGuidedMode(false);
                                resetTimer();
                              }}
                              className="flex items-center gap-2 text-sm px-5 py-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              style={{
                                background: `hsl(var(${accentVar}))`,
                                color: 'hsl(var(--primary-foreground))',
                                fontFamily: 'var(--font-sans)',
                              }}
                            >
                              <CheckCircle className="w-4 h-4" aria-hidden="true" /> Complete Ritual
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Materials checklist — shown in guided mode */}
                      {spell.materials.length > 0 && (
                        <div
                          className="px-6 pb-6"
                          style={{ borderTop: '1px solid hsl(var(--border))' }}
                        >
                          <button
                            onClick={() => {}}
                            className="flex items-center gap-2 text-sm font-medium mt-4 mb-3 focus-visible:outline-none"
                            style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                            aria-label="Materials checklist"
                          >
                            <ListChecks className="w-4 h-4" style={{ color: `hsl(var(${accentVar}))` }} aria-hidden="true" />
                            Materials
                          </button>
                          <ul className="flex flex-col gap-2">
                            {spell.materials.map((m, i) => (
                              <li key={i} className="flex items-center gap-3">
                                <button
                                  role="checkbox"
                                  aria-checked={!!checkedMaterials[i]}
                                  onClick={() => setCheckedMaterials((prev) => ({ ...prev, [i]: !prev[i] }))}
                                  className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  style={{
                                    background: checkedMaterials[i] ? `hsl(var(${accentVar}))` : 'transparent',
                                    border: `1.5px solid ${checkedMaterials[i] ? `hsl(var(${accentVar}))` : 'hsl(var(--border))'}`,
                                  }}
                                  aria-label={`Mark ${m} as gathered`}
                                >
                                  {checkedMaterials[i] && <CheckCircle className="w-3 h-3" style={{ color: 'hsl(var(--primary-foreground))' }} aria-hidden="true" />}
                                </button>
                                <span
                                  className="text-sm transition-colors"
                                  style={{
                                    color: checkedMaterials[i] ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                                    textDecoration: checkedMaterials[i] ? 'line-through' : 'none',
                                    fontFamily: 'var(--font-sans)',
                                  }}
                                >
                                  {m}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.section>

              {/* Safety */}
              {spell.safetyNotes && (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                  <div
                    className="flex gap-3 p-4 rounded-xl"
                    style={{ background: 'hsl(var(--warning) / 0.08)', border: '1px solid hsl(var(--warning) / 0.3)' }}
                  >
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--warning))' }} />
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--warning))', fontFamily: 'var(--font-sans)' }}>
                        {spell_detail.safetyHeading}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {spell.safetyNotes}
                      </p>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ── Reviews ── */}
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <h2 className="text-2xl mb-5" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  {spell_detail.reviewsHeading}
                </h2>

                {/* Rating summary */}
                {spell.ratingCount > 0 && (
                  <div
                    className="p-5 rounded-xl mb-6 flex flex-col sm:flex-row gap-6"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="text-center shrink-0">
                      <p className="text-5xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                        {avg.toFixed(1)}
                      </p>
                      <StarDisplay avg={avg} count={spell.ratingCount} />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const dist = ratingDistribution.find((d) => d.star === star);
                        const count = dist?.count ?? 0;
                        const pct = totalReviewRatings > 0 ? (count / totalReviewRatings) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs w-3 text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>{star}</span>
                            <Star className="w-3 h-3" style={{ color: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' }} />
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: 'hsl(var(--primary))' }}
                              />
                            </div>
                            <span className="text-xs w-6" style={{ color: 'hsl(var(--muted-foreground))' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Write a review */}
                {session && !userState.reviewId && (
                  <div
                    className="p-5 rounded-xl mb-6"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <h3 className="text-lg mb-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                      {spell_detail.writeReviewHeading}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {spell_detail.writeReviewNote}
                    </p>
                    <div className="flex flex-col gap-3">
                      <StarPicker value={reviewRating} onChange={setReviewRating} />
                      <Textarea
                        value={reviewBody}
                        onChange={(e) => setReviewBody(e.target.value)}
                        placeholder="Describe your experience with this spell…"
                        rows={4}
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={doReview}
                          disabled={reviewBusy || !reviewRating || reviewBody.trim().length < 10}
                          className="gap-2"
                          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          {spell_detail.submitReviewCta}
                        </Button>
                        {reviewMsg && (
                          <p className="text-sm" style={{ color: reviewMsg.includes('!') ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
                            {reviewMsg}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {session && userState.reviewId && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl mb-4"
                    style={{ background: 'hsl(var(--success) / 0.08)', border: '1px solid hsl(var(--success) / 0.3)' }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} />
                    <p className="text-sm" style={{ color: 'hsl(var(--success))' }}>
                      {spell_detail.alreadyReviewed}
                    </p>
                  </div>
                )}

                {!session && (
                  <div
                    className="p-4 rounded-xl mb-4 text-center"
                    style={{ background: 'hsl(var(--muted) / 0.5)', border: '1px dashed hsl(var(--border))' }}
                  >
                    <p className="text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {spell_detail.signInToReview}
                    </p>
                    <Link to="/login">
                      <Button size="sm" variant="outline">Sign In</Button>
                    </Link>
                  </div>
                )}

                {/* Review list */}
                {reviews.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                      <ReviewItem
                        key={review.id}
                        review={review}
                        spellSlug={slug ?? ''}
                        onUpdate={fetchData}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {spell_detail.noReviews}
                  </p>
                )}
              </motion.section>
            </div>

            {/* ── Sidebar ── */}
            <div className="flex flex-col gap-6">

              {/* Save button */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                {session ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={doSave}
                      disabled={saveBusy}
                      className="w-full gap-2"
                      style={saved
                        ? { background: 'hsl(var(--success) / 0.12)', color: 'hsl(var(--success))', border: '1px solid hsl(var(--success) / 0.4)' }
                        : { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
                      }
                    >
                      {saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                      {saved ? '{spell_detail.savedCta}' : '{spell_detail.saveCta}'}
                    </Button>
                    {saveMsg && (
                      <p className="text-xs text-center" style={{ color: 'hsl(var(--success))' }}>{saveMsg}</p>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="block">
                    <Button variant="outline" className="w-full gap-2">
                      <BookmarkPlus className="w-4 h-4" />
                      {spell_detail.signInToSave}
                    </Button>
                  </Link>
                )}
              </motion.div>

              {/* Correspondences */}
              {(spell.herbCorrespondences.length > 0 || spell.crystalCorrespondences.length > 0 || spell.elementCorrespondences.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-5 rounded-xl"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <h3 className="text-lg mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                    {spell_detail.correspondencesHeading}
                  </h3>
                  {spell.herbCorrespondences.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Leaf className="w-3.5 h-3.5" style={{ color: 'hsl(var(--grimoire-herb))' }} />
                        <p className="text-xs font-medium" style={{ color: 'hsl(var(--grimoire-herb))' }}>Herbs</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {spell.herbCorrespondences.map((h) => (
                          <Link
                            key={h}
                            to={`/herbs?search=${encodeURIComponent(h)}`}
                            className="text-xs px-2 py-0.5 rounded-full capitalize transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ background: 'hsl(var(--grimoire-herb) / 0.12)', color: 'hsl(var(--grimoire-herb))' }}
                          >
                            {h}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {spell.crystalCorrespondences.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Gem className="w-3.5 h-3.5" style={{ color: 'hsl(var(--accent))' }} />
                        <p className="text-xs font-medium" style={{ color: 'hsl(var(--accent))' }}>Crystals</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {spell.crystalCorrespondences.map((c) => (
                          <Link
                            key={c}
                            to={`/grimoire?type=crystal&search=${encodeURIComponent(c)}`}
                            className="text-xs px-2 py-0.5 rounded-full capitalize transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ background: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--accent))' }}
                          >
                            {c}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {spell.elementCorrespondences.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Elements</p>
                      <div className="flex flex-wrap gap-1.5">
                        {spell.elementCorrespondences.map((e) => (
                          <span
                            key={e}
                            className="text-xs px-2 py-0.5 rounded-full capitalize"
                            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Related spells */}
              {relatedSpells.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg mb-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                    {spell_detail.relatedHeading}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {relatedSpells.map((s) => (
                      <Link
                        key={s.id}
                        to={`/spells/${s.slug}`}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'hsl(var(--border))'; }}
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        <div className="min-w-0">
                          <p className="text-sm truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                            {s.title}
                          </p>
                          <p className="text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {s.difficulty}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
