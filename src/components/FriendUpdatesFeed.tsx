/**
 * FriendUpdatesFeed — Friend Updates tab content for the Community page.
 *
 * Displays a paginated feed of friend_feed_events from followed members,
 * with emoji reactions, hide controls, and privacy settings link.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import {
  Cake, Star, FileText, Trophy, MoreHorizontal, EyeOff, Settings,
  Users, ChevronDown,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FeedActor {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  accountType: string | null;
}

interface FeedEvent {
  id: number;
  actorId: string;
  eventType: string;
  payload: Record<string, unknown> | null;
  audience: string;
  createdAt: string;
  actor: FeedActor;
  myReaction: string | null;
  reactionCount: number;
}

interface FeedResponse {
  events: FeedEvent[];
  hasMore: boolean;
  total: number;
}

// ── Allowed reaction emojis ───────────────────────────────────────────────────
const REACTION_EMOJIS = ['✨', '🌙', '💜', '🔥', '🌿', '⭐', '🫶', '🌸'];

// ── Avatar ────────────────────────────────────────────────────────────────────
function ActorAvatar({ actor }: { actor: FeedActor }) {
  const initials = (actor.name ?? actor.username ?? '?')[0]?.toUpperCase() ?? '?';
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-muted">
      {actor.image ? (
        <img src={actor.image} alt={actor.name ?? ''} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}

// ── Event type badge ──────────────────────────────────────────────────────────
function EventTypeBadge({ eventType }: { eventType: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    birthday: {
      icon: <Cake className="w-3 h-3" />,
      label: 'Birthday',
      className: 'bg-primary/15 text-primary',
    },
    post: {
      icon: <FileText className="w-3 h-3" />,
      label: 'New Post',
      className: 'bg-accent/15 text-accent',
    },
    milestone: {
      icon: <Star className="w-3 h-3" />,
      label: 'Milestone',
      className: 'bg-secondary/15 text-secondary-foreground',
    },
    achievement: {
      icon: <Trophy className="w-3 h-3" />,
      label: 'Achievement',
      className: 'bg-warning/15 text-warning',
    },
  };
  const c = config[eventType] ?? config['post']!;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ── Event text ────────────────────────────────────────────────────────────────
function EventText({ event }: { event: FeedEvent }) {
  const name = event.actor.name ?? event.actor.username ?? 'A member';
  switch (event.eventType) {
    case 'birthday':
      return (
        <p className="text-sm text-foreground leading-snug">
          <span className="font-medium">{name}</span>
          {' '}is celebrating their birthday this week. 🎂
        </p>
      );
    case 'post': {
      const title = typeof event.payload?.title === 'string' ? event.payload.title : null;
      const postId = typeof event.payload?.postId === 'number' ? event.payload.postId : null;
      return (
        <p className="text-sm text-foreground leading-snug">
          <span className="font-medium">{name}</span>
          {' '}shared a new post
          {title && postId ? (
            <>: <Link to={`/community/post/${postId}`} className="text-primary hover:underline">{title}</Link></>
          ) : '.'}
        </p>
      );
    }
    case 'milestone': {
      const milestoneTitle = typeof event.payload?.title === 'string' ? event.payload.title : 'a milestone';
      return (
        <p className="text-sm text-foreground leading-snug">
          <span className="font-medium">{name}</span>
          {' '}reached a milestone: <span className="italic">{milestoneTitle}</span>
        </p>
      );
    }
    case 'achievement': {
      const achievementName = typeof event.payload?.name === 'string' ? event.payload.name : 'an achievement';
      return (
        <p className="text-sm text-foreground leading-snug">
          <span className="font-medium">{name}</span>
          {' '}earned: <span className="font-medium text-primary">{achievementName}</span>
        </p>
      );
    }
    default:
      return (
        <p className="text-sm text-foreground leading-snug">
          <span className="font-medium">{name}</span>
          {' '}shared an update.
        </p>
      );
  }
}

// ── Reaction picker ───────────────────────────────────────────────────────────
function ReactionPicker({
  eventId,
  myReaction,
  reactionCount,
  onReact,
}: {
  eventId: number;
  myReaction: string | null;
  reactionCount: number;
  onReact: (eventId: number, emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 transition-colors hover:bg-muted"
        style={{ color: myReaction ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
        aria-label="React to this update"
        aria-expanded={open}
      >
        <span>{myReaction ?? '✨'}</span>
        {reactionCount > 0 && <span>{reactionCount}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute bottom-full left-0 mb-1 z-20 flex gap-1 p-2 rounded-xl shadow-lg"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onReact(eventId, emoji); setOpen(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-base transition-colors hover:bg-muted"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Feed card ─────────────────────────────────────────────────────────────────
function FeedCard({
  event,
  onReact,
  onHide,
}: {
  event: FeedEvent;
  onReact: (eventId: number, emoji: string) => void;
  onHide: (eventId: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ago = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex gap-3"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Avatar */}
      <Link to={`/u/${event.actor.username ?? event.actor.id}`} aria-label={`View ${event.actor.name ?? 'profile'}`}>
        <ActorAvatar actor={event.actor} />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <Link
              to={`/u/${event.actor.username ?? event.actor.id}`}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
            >
              {event.actor.name ?? event.actor.username ?? 'Member'}
            </Link>
            {event.actor.username && (
              <span className="text-xs text-muted-foreground truncate">@{event.actor.username}</span>
            )}
            <EventTypeBadge eventType={event.eventType} />
          </div>

          {/* More menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="More options"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div
                  className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <button
                    onClick={() => { onHide(event.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide this update
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Event text */}
        <div className="mt-1.5">
          <EventText event={event} />
        </div>

        {/* Footer */}
        <div className="mt-2.5 flex items-center gap-3">
          <ReactionPicker
            eventId={event.id}
            myReaction={event.myReaction}
            reactionCount={event.reactionCount}
            onReact={onReact}
          />
          <span className="text-[11px] text-muted-foreground">{ago}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main feed component ───────────────────────────────────────────────────────
export default function FriendUpdatesFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(async (p: number, append = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    setError(false);
    try {
      const r = await fetch(`/api/community/friend-updates?page=${p}&limit=20`, { credentials: 'include' });
      if (!r.ok) throw new Error('failed');
      const data = await r.json() as FeedResponse;
      setEvents((prev) => append ? [...prev, ...data.events] : data.events);
      setHasMore(data.hasMore);
      setPage(p);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { void loadPage(1); }, [loadPage]);

  const handleReact = useCallback(async (eventId: number, emoji: string) => {
    // Optimistic update
    setEvents((prev) => prev.map((e) => {
      if (e.id !== eventId) return e;
      const removing = e.myReaction === emoji;
      return {
        ...e,
        myReaction: removing ? null : emoji,
        reactionCount: removing ? Math.max(0, e.reactionCount - 1) : e.reactionCount + 1,
      };
    }));
    try {
      await fetch('/api/community/friend-updates/react', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, emoji }),
      });
    } catch {
      // Rollback on failure
      void loadPage(page);
    }
  }, [loadPage, page]);

  const handleHide = useCallback(async (eventId: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    try {
      await fetch('/api/community/friend-updates/hide', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
    } catch {
      // Non-fatal
    }
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl p-4 flex gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">Couldn't load friend updates right now.</p>
        <button
          onClick={() => void loadPage(1)}
          className="text-xs text-primary underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-14 text-center px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-muted">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="font-serif text-lg text-foreground">No updates yet</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Follow more members to see their updates here. Updates appear when people you follow share posts, milestones, or opt to share their birthday.
          </p>
        </div>
        <Link
          to="/community/discover"
          className="mt-1 px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Discover Members
        </Link>
        <Link
          to="/account/profile"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Manage your sharing settings
        </Link>
      </div>
    );
  }

  // ── Feed ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Privacy note */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          Updates from people you follow
        </p>
        <Link
          to="/account/profile"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Settings className="w-3 h-3" />
          Settings
        </Link>
      </div>

      {events.map((event) => (
        <FeedCard
          key={event.id}
          event={event}
          onReact={handleReact}
          onHide={handleHide}
        />
      ))}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => void loadPage(page + 1, true)}
            disabled={loadingMore}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
