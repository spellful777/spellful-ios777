import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Bell, BellOff, CheckCheck, Heart,
  MessageSquare, AtSign, CheckCircle2, UserPlus, Sparkles,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { community_notifications } from 'virtual:content';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommunityNotification {
  id: number;
  type: 'reply' | 'like' | 'mention' | 'answer' | 'follow' | 'system';
  postId: number | null;
  replyId: number | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  actorName: string | null;
  actorImage: string | null;
  actorUsername: string | null;
}

interface NotifResponse {
  notifications: CommunityNotification[];
  unread: number;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: CommunityNotification['type'] }) {
  const cls = 'w-4 h-4 shrink-0';
  switch (type) {
    case 'reply':   return <MessageSquare className={`${cls} text-accent`} />;
    case 'like':    return <Heart className={`${cls} text-destructive`} />;
    case 'mention': return <AtSign className={`${cls} text-primary`} />;
    case 'answer':  return <CheckCircle2 className={`${cls} text-[hsl(var(--success))]`} />;
    case 'follow':  return <UserPlus className={`${cls} text-secondary`} />;
    default:        return <Bell className={`${cls} text-muted-foreground`} />;
  }
}

// ── Notification row ──────────────────────────────────────────────────────────

function NotifRow({
  notif,
  mutedPostIds,
  onRead,
  onToggleMute,
}: {
  notif: CommunityNotification;
  mutedPostIds: Set<number>;
  onRead: (id: number) => void;
  onToggleMute: (postId: number) => void;
}) {
  const ago = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true });
  const isMuted = notif.postId ? mutedPostIds.has(notif.postId) : false;
  const typeLabel = community_notifications.types[notif.type] ?? community_notifications.types.system;

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' as const }}
      className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
        notif.isRead
          ? 'border-border bg-card'
          : 'border-primary/30 bg-primary/5'
      }`}
    >
      {/* Unread dot */}
      <div className="mt-1 shrink-0">
        {notif.isRead
          ? <div className="w-2 h-2 rounded-full bg-transparent" />
          : <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>

      {/* Actor avatar */}
      {notif.actorImage ? (
        <img
          src={notif.actorImage}
          alt={notif.actorName ?? ''}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <NotifIcon type={notif.type} />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          {notif.actorName && (
            <Link
              to={notif.actorUsername ? `/u/${notif.actorUsername}` : '#'}
              className="font-semibold hover:text-primary transition-colors"
              onClick={handleClick}
            >
              {notif.actorName}
            </Link>
          )}{' '}
          <span className="text-muted-foreground">{typeLabel}</span>
        </p>

        {notif.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-muted-foreground">{ago}</span>

          {!notif.isRead && (
            <button
              onClick={() => onRead(notif.id)}
              className="text-[10px] text-primary hover:underline"
            >
              Mark read
            </button>
          )}

          {notif.postId && (
            <button
              onClick={() => onToggleMute(notif.postId!)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              {isMuted
                ? <><Bell className="w-2.5 h-2.5" /> {community_notifications.unmuteThreadLabel}</>
                : <><BellOff className="w-2.5 h-2.5" /> {community_notifications.muteThreadLabel}</>}
            </button>
          )}
        </div>
      </div>

      {/* Link to post */}
      {notif.postId && (
        <Link
          to={`/community/post/${notif.postId}`}
          onClick={handleClick}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="View post"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </Link>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { session, isPending } = useSession();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [mutedPostIds, setMutedPostIds] = useState<Set<number>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (p: number, append = false) => {
    setLoading(true);
    const res = await fetch(`/api/community/notifications?page=${p}`).catch(() => null);
    if (res?.ok) {
      const data = await res.json() as NotifResponse;
      setNotifications((prev) => append ? [...prev, ...data.notifications] : data.notifications);
      setUnread(data.unread);
      setHasMore(data.notifications.length === 30);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) { navigate('/login?redirect=/community/notifications'); return; }
    load(1);
  }, [isPending, session, navigate, load]);

  const markRead = async (id: number) => {
    await fetch('/api/community/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    await fetch('/api/community/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    setMarkingAll(false);
  };

  const toggleMute = async (postId: number) => {
    const res = await fetch('/api/community/mute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    });
    if (res.ok) {
      const data = await res.json() as { muted: boolean };
      setMutedPostIds((prev) => {
        const next = new Set(prev);
        if (data.muted) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  return (
    <>
      <Helmet>
        <title>{community_notifications.pageTitle} — Spellful Community</title>
        <meta name="description" content="Your Spellful Community notifications — replies, likes, and mentions." />
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
              <ArrowLeft className="w-3.5 h-3.5" /> {community_notifications.backLabel}
            </Link>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-6 h-6 text-primary" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="font-heading text-2xl text-foreground">{community_notifications.pageTitle}</h1>
                  {unread > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">{unread} unread</p>
                  )}
                </div>
              </div>

              {unread > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="gap-1.5 text-xs border-border"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {community_notifications.markAllRead}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {loading && notifications.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-12 text-center"
            >
              <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
              <h2 className="font-heading text-lg text-foreground mb-1">{community_notifications.emptyTitle}</h2>
              <p className="text-sm text-muted-foreground">{community_notifications.emptyText}</p>
            </motion.div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <NotifRow
                      key={n.id}
                      notif={n}
                      mutedPostIds={mutedPostIds}
                      onRead={markRead}
                      onToggleMute={toggleMute}
                    />
                  ))}
                </div>
              </AnimatePresence>

              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loading}
                    className="border-border text-muted-foreground"
                  >
                    {loading ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
