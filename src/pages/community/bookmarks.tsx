import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Bookmark, BookmarkX, MessageSquare,
  HelpCircle, CheckCircle2, Tag, ThumbsUp, Sparkles,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { community_bookmarks } from 'virtual:content';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookmarkedPost {
  bookmarkId: number;
  bookmarkedAt: string;
  id: number | null;
  type: 'discussion' | 'question' | null;
  title: string | null;
  tags: string | null;
  likeCount: number | null;
  replyCount: number | null;
  createdAt: string | null;
  authorName: string | null;
  authorImage: string | null;
  authorUsername: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

// ── Post row ──────────────────────────────────────────────────────────────────

function BookmarkRow({
  item,
  onRemove,
}: {
  item: BookmarkedPost;
  onRemove: (bookmarkId: number) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const tags = item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const ago = item.bookmarkedAt
    ? formatDistanceToNow(new Date(item.bookmarkedAt), { addSuffix: true })
    : '';

  const handleRemove = async () => {
    if (!item.id) return;
    setRemoving(true);
    await fetch(`/api/community/posts/${item.id}/bookmark`, { method: 'POST' });
    onRemove(item.bookmarkId);
  };

  if (!item.id || !item.title) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' as const }}
      className="rounded-xl border border-border bg-card p-4 flex items-start gap-4"
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0 text-muted-foreground">
        {item.type === 'question'
          ? <HelpCircle className="w-4 h-4 text-accent" />
          : <MessageSquare className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {item.categoryName && item.categorySlug && (
            <Link
              to={`/community/${item.categorySlug}`}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {community_bookmarks.categoryLabel} {item.categoryName}
            </Link>
          )}
          <span className="text-[10px] text-muted-foreground">
            {community_bookmarks.savedLabel} {ago}
          </span>
        </div>

        <Link
          to={`/community/post/${item.id}`}
          className="block text-sm font-semibold text-foreground hover:text-primary transition-colors leading-snug mb-2 line-clamp-2"
        >
          {item.title}
          {item.type === 'question' && (
            <CheckCircle2 className="inline w-3.5 h-3.5 ml-1.5 text-[hsl(var(--success))] align-middle" />
          )}
        </Link>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            <Tag className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {item.likeCount ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {item.replyCount ?? 0}
          </span>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        disabled={removing}
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label={community_bookmarks.removeLabel}
        title={community_bookmarks.removeLabel}
      >
        <BookmarkX className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BookmarksPage() {
  const { session, isPending } = useSession();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) { navigate('/login?redirect=/community/bookmarks'); return; }
    fetch('/api/community/bookmarks')
      .then((r) => r.ok ? r.json() : [])
      .then((data: BookmarkedPost[]) => setBookmarks(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isPending, session, navigate]);

  const handleRemove = (bookmarkId: number) => {
    setBookmarks((prev) => prev.filter((b) => b.bookmarkId !== bookmarkId));
  };

  return (
    <>
      <Helmet>
        <title>{community_bookmarks.pageTitle} — Spellful Community</title>
        <meta name="description" content={community_bookmarks.pageSubtitle} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-[hsl(var(--card-deep))]">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <Link
              to="/community"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {community_bookmarks.backLabel}
            </Link>
            <div className="flex items-center gap-3">
              <Bookmark className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-heading text-2xl text-foreground">{community_bookmarks.pageTitle}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{community_bookmarks.pageSubtitle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-12 text-center"
            >
              <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
              <h2 className="font-heading text-lg text-foreground mb-1">{community_bookmarks.emptyTitle}</h2>
              <p className="text-sm text-muted-foreground mb-5">{community_bookmarks.emptyText}</p>
              <Link to="/community">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {community_bookmarks.browseCta}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">{bookmarks.length} saved</p>
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {bookmarks.map((item) => (
                    <BookmarkRow key={item.bookmarkId} item={item} onRemove={handleRemove} />
                  ))}
                </div>
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
    </>
  );
}
