import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ThumbsUp, Bookmark, Flag, MessageSquare,
  HelpCircle, Pin, Lock, CheckCircle2, MoreHorizontal,
  Eye, Tag, Share2, Sparkles, Send, MapPin, Pencil, Trash2,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { BlockUserSheet } from '@/components/BlockUserSheet';
import { ReportModal } from '@/components/ReportModal';
import { usePostDetail, useReplies, type CommunityReply } from '@/hooks/useCommunityPost';
import { community_post } from 'virtual:content';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ name, image, size = 8 }: { name: string | null; image: string | null; size?: number }) {
  const s = `w-${size} h-${size}`;
  if (image) return <img src={image} alt={name ?? ''} className={`${s} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${s} rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0`}>
      {(name ?? '?')[0].toUpperCase()}
    </div>
  );
}

function RichBody({ html }: { html: string }) {
  // Allowlist-based sanitizer: strip every tag not in the safe set,
  // and strip every attribute that could carry executable content.
  const ALLOWED_TAGS = new Set([
    'p','br','strong','em','u','s','h1','h2','h3','h4','h5','h6',
    'ul','ol','li','blockquote','pre','code','hr','a','span','div',
  ]);
  const ALLOWED_ATTRS: Record<string, string[]> = {
    a: ['href', 'target', 'rel'],
    span: ['class'],
    div: ['class'],
    code: ['class'],
    pre: ['class'],
  };

  const safe = html
    // Remove script, style, iframe, object, embed, form, input entirely
    .replace(/<(script|style|iframe|object|embed|form|input|svg|math)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|svg|math)[^>]*\/?>/gi, '')
    // Strip on* event handlers and javascript: hrefs on any tag
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/href\s*=\s*["']\s*javascript:[^"']*/gi, 'href="#"')
    // Strip any tag not in the allowlist
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag: string) => {
      const lower = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(lower)) return '';
      // For allowed tags, strip disallowed attributes
      // eslint-disable-next-line security/detect-object-injection
      const allowed = ALLOWED_ATTRS[lower] ?? [];
      if (allowed.length === 0) return match.replace(/\s+[a-zA-Z][\w-]*\s*=\s*["'][^"']*["']/g, '');
      return match.replace(/\s+([a-zA-Z][\w-]*)\s*=\s*["'][^"']*["']/g, (attrMatch, attr: string) =>
        allowed.includes(attr.toLowerCase()) ? attrMatch : ''
      );
    });

  return (
    <div
      className="prose prose-invert prose-sm max-w-none text-foreground/90 leading-relaxed
        prose-headings:font-heading prose-headings:text-foreground
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-accent
        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

// ── Poll ──────────────────────────────────────────────────────────────────────

function PollBlock({
  poll,
  postId,
  onVoted,
}: {
  poll: NonNullable<ReturnType<typeof usePostDetail>['post']>['poll'];
  postId: number;
  onVoted: () => void;
}) {
  const [voting, setVoting] = useState(false);
  if (!poll) return null;

  const isClosed = poll.closeAt ? new Date(poll.closeAt) < new Date() : false;
  const hasVoted = poll.myVote !== null;
  const showResults = hasVoted || isClosed;

  const vote = async (choiceIndex: number) => {
    if (voting || hasVoted || isClosed) return;
    setVoting(true);
    await fetch(`/api/community/posts/${postId}/poll/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceIndex }),
    });
    setVoting(false);
    onVoted();
  };

  return (
    <div className="rounded-xl border border-border bg-[hsl(var(--card-deep))] p-4 mt-4">
      <p className="text-sm font-semibold text-foreground mb-3">{poll.question}</p>
      <div className="space-y-2">
        {poll.choices.map((choice, i) => {
          // eslint-disable-next-line security/detect-object-injection
          const tally = poll.tallies[i] ?? 0;
          const pct = poll.totalVotes > 0 ? Math.round((tally / poll.totalVotes) * 100) : 0;
          const isMyVote = poll.myVote === i;
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              disabled={showResults || voting}
              className={`relative w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors overflow-hidden ${
                isMyVote
                  ? 'border-primary text-primary'
                  : showResults
                  ? 'border-border text-foreground/70 cursor-default'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
            >
              {showResults && (
                <span
                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-2">
                <span>{choice}</span>
                {showResults && (
                  <span className="text-xs text-muted-foreground shrink-0">{pct}% · {tally}</span>
                )}
                {isMyVote && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
        {isClosed ? ' · Closed' : poll.closeAt ? ` · Closes ${formatDistanceToNow(new Date(poll.closeAt), { addSuffix: true })}` : ''}
      </p>
    </div>
  );
}

// ── Reply card ────────────────────────────────────────────────────────────────

function ReplyCard({
  reply,
  isAccepted,
  isPostAuthor,
  postType,
  postId,
  onAccept,
  onLike,
  onReplyTo,
  onDeleted,
  currentUserId,
  depth = 0,
  children,
}: {
  reply: CommunityReply;
  isAccepted: boolean;
  isPostAuthor: boolean;
  postType: 'discussion' | 'question';
  postId: number;
  onAccept: (replyId: number) => void;
  onLike: (replyId: number) => void;
  onReplyTo: (replyId: number, authorName: string | null) => void;
  onDeleted: (replyId: number) => void;
  currentUserId: string | undefined;
  depth?: number;
  children?: React.ReactNode;
}) {
  const [showActions, setShowActions] = useState(false);
  const [blockSheetOpen, setBlockSheetOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState(reply.body);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMyReply = currentUserId === reply.userId;

  const saveEdit = async () => {
    if (!editBody.trim() || editSaving) return;
    setEditSaving(true);
    await fetch(`/api/community/replies/${reply.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editBody.trim() }),
    });
    setEditSaving(false);
    setEditMode(false);
    reply.body = editBody.trim();
  };

  const deleteReply = async () => {
    setDeleting(true);
    const res = await fetch(`/api/community/replies/${reply.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) onDeleted(reply.id);
  };
  const ago = formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true });
  const indentClass = depth > 0 ? 'ml-6 md:ml-10 border-l-2 border-border pl-4' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      className={indentClass}
    >
      <div className={`rounded-xl border p-4 ${isAccepted ? 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/5' : 'border-border bg-card'}`}>
        {/* Accepted badge */}
        {isAccepted && (
          <div className="flex items-center gap-1.5 text-[hsl(var(--success))] text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {community_post.acceptedAnswerLabel}
          </div>
        )}

        {/* Author row */}
        <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
            <Avatar name={reply.authorName} image={reply.authorImage} size={7} />
            <div>
              <Link
                to={reply.authorUsername ? `/u/${reply.authorUsername}` : '#'}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors"
              >
                {reply.authorName ?? 'Unknown'}
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] text-muted-foreground">{ago}</p>
                {reply.authorLocation && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                    <MapPin className="w-2 h-2" />{reply.authorLocation}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions((v) => !v)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-7 z-10 w-36 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => { onReplyTo(reply.id, reply.authorName); setShowActions(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                  >
                    Reply
                  </button>
                  {isMyReply && (
                    <button
                      onClick={() => { setEditMode(true); setEditBody(reply.body); setShowActions(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-1.5"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                  {isMyReply && (
                    <button
                      onClick={() => { setConfirmDelete(true); setShowActions(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                  {!isMyReply && (
                    <button
                      onClick={() => { setShowActions(false); setReportOpen(true); }}
                      className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted transition-colors"
                    >
                      Report
                    </button>
                  )}
                  {currentUserId && reply.userId !== currentUserId && (
                    <button
                      onClick={() => { setShowActions(false); setBlockSheetOpen(true); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      Restrict member
                    </button>
                  )}
                  {isPostAuthor && postType === 'question' && !isAccepted && (
                    <button
                      onClick={() => { onAccept(reply.id); setShowActions(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-[hsl(var(--success))] hover:bg-muted transition-colors"
                    >
                      {community_post.acceptAnswerLabel}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Block sheet */}
        {reply.userId && reply.userId !== currentUserId && (
          <BlockUserSheet
            open={blockSheetOpen}
            onOpenChange={setBlockSheetOpen}
            displayName={reply.authorName ?? 'this member'}
            userId={reply.userId}
          />
        )}

        {/* Report modal */}
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="reply"
          targetId={reply.id}
        />

        {/* Confirm delete dialog */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex items-center justify-between gap-3"
            >
              <p className="text-xs text-destructive">Delete this reply?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteReply}
                  disabled={deleting}
                  className="text-xs px-2 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body / edit mode */}
        {editMode ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditMode(false)}
                className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving || !editBody.trim()}
                className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {editSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <RichBody html={reply.body} />
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50">
          <button
            onClick={() => onLike(reply.id)}
            className={`flex items-center gap-1 text-xs transition-colors ${reply.liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> {reply.likeCount}
          </button>
          <button
            onClick={() => onReplyTo(reply.id, reply.authorName)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Reply
          </button>
        </div>
      </div>

      {/* Nested children */}
      {children && <div className="mt-2 space-y-2">{children}</div>}
    </motion.div>
  );
}

// ── Reply composer ────────────────────────────────────────────────────────────

function ReplyComposer({
  postId,
  replyTo,
  onClear,
  onSubmitted,
  isLocked,
}: {
  postId: number;
  replyTo: { id: number; authorName: string | null } | null;
  onClear: () => void;
  onSubmitted: () => void;
  isLocked: boolean;
}) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/community/posts/${postId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: trimmed, parentId: replyTo?.id ?? null }),
    });
    setSubmitting(false);
    if (res.ok) {
      setBody('');
      onClear();
      onSubmitted();
    }
  };

  if (isLocked) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Lock className="w-4 h-4" /> {community_post.lockedText}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {replyTo && (
        <div className="flex items-center justify-between mb-2 text-xs text-accent">
          <span>Replying to <strong>{replyTo.authorName ?? 'Unknown'}</strong></span>
          <button onClick={onClear} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={community_post.replyPlaceholder}
        rows={4}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          disabled={!body.trim() || submitting}
          onClick={submit}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="w-3.5 h-3.5" />
          {submitting ? community_post.postingLabel : community_post.postReplyLabel}
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PostThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { session, isPending } = useSession();
  const navigate = useNavigate();
  const postId = id ? parseInt(id) : null;

  const { post, loading: postLoading, error, reload: reloadPost, setPost } = usePostDetail(postId);
  const [sort, setSort] = useState<'chrono' | 'liked'>('chrono');
  const { replies, loading: repliesLoading, reload: reloadReplies } = useReplies(postId, sort);
  const [replyTo, setReplyTo] = useState<{ id: number; authorName: string | null } | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);

  if (!isPending && !session) {
    navigate('/login?redirect=/community');
    return null;
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  const toggleLikePost = async () => {
    if (!post) return;
    await fetch(`/api/community/posts/${post.id}/like`, { method: 'POST' });
    setPost((p) => p ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p);
  };

  const toggleBookmark = async () => {
    if (!post) return;
    await fetch(`/api/community/posts/${post.id}/bookmark`, { method: 'POST' });
    setPost((p) => p ? { ...p, bookmarked: !p.bookmarked } : p);
  };

  const [postReportOpen, setPostReportOpen] = useState(false);
  const [postEditMode, setPostEditMode] = useState(false);
  const [postEditTitle, setPostEditTitle] = useState('');
  const [postEditBody, setPostEditBody] = useState('');
  const [postEditSaving, setPostEditSaving] = useState(false);
  const [postConfirmDelete, setPostConfirmDelete] = useState(false);
  const [postDeleting, setPostDeleting] = useState(false);

  const savePostEdit = async () => {
    if (!post || postEditSaving) return;
    setPostEditSaving(true);
    await fetch(`/api/community/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: postEditTitle, body: postEditBody }),
    });
    setPostEditSaving(false);
    setPostEditMode(false);
    setPost((p) => p ? { ...p, title: postEditTitle, body: postEditBody } : p);
  };

  const deletePost = async () => {
    if (!post) return;
    setPostDeleting(true);
    const res = await fetch(`/api/community/posts/${post.id}`, { method: 'DELETE' });
    setPostDeleting(false);
    if (res.ok) navigate(post.categorySlug ? `/community/${post.categorySlug}` : '/community');
  };

  const handleReplyDeleted = (_replyId: number) => {
    reloadReplies();
    setPost((p) => p ? { ...p, replyCount: Math.max(0, p.replyCount - 1) } : p);
  };

  const acceptAnswer = async (replyId: number) => {
    if (!post) return;
    await fetch(`/api/community/posts/${post.id}/accept-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyId }),
    });
    setPost((p) => p ? { ...p, acceptedReplyId: replyId } : p);
  };

  const likeReply = async (replyId: number) => {
    await fetch(`/api/community/replies/${replyId}/like`, { method: 'POST' });
    reloadReplies();
  };

  const sharePost = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
    // Track share count (fire-and-forget — non-critical)
    if (post?.id) {
      void fetch(`/api/community/posts/${post.id}/share`, {
        method: 'POST',
        credentials: 'include',
      });
    }
  };

  // ── Build threaded reply tree ─────────────────────────────────────────────

  const buildTree = (items: CommunityReply[], parentId: number | null = null, depth = 0): React.ReactNode[] => {
    return items
      .filter((r) => r.parentId === parentId)
      .map((r) => (
        <ReplyCard
          key={r.id}
          reply={r}
          isAccepted={post?.acceptedReplyId === r.id}
          isPostAuthor={session?.user?.id === post?.userId}
          postType={post?.type ?? 'discussion'}
          postId={post?.id ?? 0}
          onAccept={acceptAnswer}
          onLike={likeReply}
          onReplyTo={(rid, name) => setReplyTo({ id: rid, authorName: name })}
          onDeleted={handleReplyDeleted}
          currentUserId={session?.user?.id}
          depth={depth}
        >
          {buildTree(items, r.id, depth + 1)}
        </ReplyCard>
      ));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const tags = post?.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const pageTitle = post ? `${post.title} — Spellful Community` : 'Discussion — Spellful Community';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={post ? `${post.title} — community discussion on Spellful` : 'Community discussion'} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen">
        {/* Top bar */}
        <div className="border-b border-border bg-[hsl(var(--card-deep))]">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <Link
              to={post?.categorySlug ? `/community/${post.categorySlug}` : '/community'}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {post?.categoryName ?? community_post.backLabel}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              ✦ Spellful Home
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* ── Post ── */}
          {postLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">{community_post.notFoundText}</p>
              <Link to="/community"><Button variant="outline" size="sm" className="mt-4">{community_post.backToCommunityLabel}</Button></Link>
            </div>
          ) : post ? (
            <article className="rounded-xl border border-border bg-card p-5 md:p-6">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {post.type === 'question' && (
                  <Badge variant="outline" className="gap-1 text-accent border-accent/40 text-xs">
                    <HelpCircle className="w-3 h-3" /> Question
                  </Badge>
                )}
                {post.acceptedReplyId && (
                  <Badge variant="outline" className="gap-1 text-[hsl(var(--success))] border-[hsl(var(--success))]/40 text-xs">
                    <CheckCircle2 className="w-3 h-3" /> Solved
                  </Badge>
                )}
                {post.isPinned && <Badge variant="outline" className="gap-1 text-primary border-primary/40 text-xs"><Pin className="w-3 h-3" /> Pinned</Badge>}
                {post.isLocked && <Badge variant="outline" className="gap-1 text-muted-foreground text-xs"><Lock className="w-3 h-3" /> Locked</Badge>}
                {post.categoryName && (
                  <Link to={`/community/${post.categorySlug}`}>
                    <Badge variant="secondary" className="text-xs hover:bg-secondary/80 transition-colors">{post.categoryName}</Badge>
                  </Link>
                )}
              </div>

              {/* Title */}
              <h1 className="font-heading text-xl md:text-2xl text-foreground mb-4 leading-snug">{post.title}</h1>

              {/* Author */}
              <div className="flex items-center gap-2 mb-4">
                <Avatar name={post.authorName} image={post.authorImage} size={8} />
                <div>
                  <Link
                    to={post.authorUsername ? `/u/${post.authorUsername}` : '#'}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {post.authorName ?? 'Unknown'}
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      {post.updatedAt !== post.createdAt && ' · edited'}
                    </p>
                    {post.authorLocation && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground/70">
                        <MapPin className="w-2.5 h-2.5" />{post.authorLocation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hero image */}
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt=""
                  className="w-full rounded-lg object-cover max-h-72 mb-4"
                  loading="lazy"
                />
              )}

              {/* Body */}
              <RichBody html={post.body} />

              {/* Poll */}
              {post.poll && (
                <PollBlock poll={post.poll} postId={post.id} onVoted={reloadPost} />
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/50 flex-wrap">
                <button
                  onClick={toggleLikePost}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    post.liked
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> {post.likeCount}
                </button>

                <button
                  onClick={toggleBookmark}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    post.bookmarked
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {post.bookmarked ? community_post.savedLabel : community_post.saveLabel}
                </button>

                <button
                  onClick={sharePost}
                  className="relative flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {community_post.shareLabel}
                  <AnimatePresence>
                    {showShareToast && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-foreground text-background px-2 py-0.5 rounded whitespace-nowrap"
                      >
                        {community_post.copiedLabel}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {session?.user?.id === post.userId ? (
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => { setPostEditTitle(post.title); setPostEditBody(post.body); setPostEditMode(true); }}
                      className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setPostConfirmDelete(true)}
                      className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPostReportOpen(true)}
                    className="ml-auto flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" /> {community_post.reportLabel}
                  </button>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground ml-2">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.viewCount}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.replyCount}</span>
                </div>
              </div>
            </article>
          ) : null}

          {/* Post confirm delete */}
          <AnimatePresence>
            {postConfirmDelete && post && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-center justify-between gap-3"
              >
                <p className="text-sm text-destructive font-medium">Delete this post and all its replies?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPostConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deletePost}
                    disabled={postDeleting}
                    className="text-xs px-3 py-1.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                  >
                    {postDeleting ? 'Deleting…' : 'Delete post'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Post edit form */}
          <AnimatePresence>
            {postEditMode && post && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-primary/40 bg-card p-5 space-y-4"
              >
                <h2 className="text-sm font-semibold text-foreground">Edit post</h2>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={postEditTitle}
                    onChange={(e) => setPostEditTitle(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Body</label>
                  <textarea
                    value={postEditBody}
                    onChange={(e) => setPostEditBody(e.target.value)}
                    rows={8}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setPostEditMode(false)}
                    className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePostEdit}
                    disabled={postEditSaving || !postEditTitle.trim()}
                    className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {postEditSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Post report modal */}
          {post && (
            <ReportModal
              open={postReportOpen}
              onClose={() => setPostReportOpen(false)}
              targetType="post"
              targetId={post.id}
            />
          )}

          {/* ── Replies ── */}
          {post && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {post.replyCount} {post.replyCount === 1 ? 'Reply' : 'Replies'}
                </h2>
                <div className="flex items-center gap-1">
                  {(['chrono', 'liked'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        sort === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {s === 'chrono' ? community_post.sortOldest : community_post.sortTop}
                    </button>
                  ))}
                </div>
              </div>

              {repliesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              ) : replies.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Sparkles className="w-6 h-6 text-primary/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{community_post.noRepliesText}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buildTree(replies)}
                </div>
              )}
            </section>
          )}

          {/* ── Composer ── */}
          {post && (
            <ReplyComposer
              postId={post.id}
              replyTo={replyTo}
              onClear={() => setReplyTo(null)}
              onSubmitted={reloadReplies}
              isLocked={post.isLocked}
            />
          )}
        </div>
      </main>
    </>
  );
}
