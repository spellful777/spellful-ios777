/**
 * /community/discover — Discover Members
 * Searchable member directory with follow, coven, and Instagram support.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Search, Users, Sparkles, X, UserPlus, UserCheck } from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { community_discover } from 'virtual:content';

const INTEREST_TAGS = [
  'Tarot', 'Astrology', 'Crystals', 'Herbalism', 'Divination',
  'Moon Magic', 'Spellwork', 'Meditation', 'Numerology', 'Runes',
  'Candle Magic', 'Dream Work', 'Shadow Work', 'Green Witch', 'Hedge Witch',
];

// Official Instagram glyph (Meta brand-approved SVG)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Instagram"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

interface Member {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  bio: string | null;
  interestTags: string[];
  witchPath: string | null;
  accountType: string;
  covenStatus: string | null;
  covenConnectionId: number | null;
  isFollowing: boolean;
  publicInstagramUrl: string | null;
}

export default function DiscoverPage() {
  const { session } = useSession();
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [covenLoading, setCovenLoading] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchMembers = useCallback(async (reset = false) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    const params = new URLSearchParams({ limit: '20', offset: String(currentOffset) });
    if (query.trim()) params.set('q', query.trim());
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    try {
      const res = await fetch('/api/community/discover?' + params.toString(), {
        credentials: 'include',
        signal: ctrl.signal,
      });
      if (!res.ok) return;
      const data = await res.json() as { members: Member[]; hasMore: boolean };
      setMembers(reset ? data.members : (prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...data.members.filter((m) => !ids.has(m.id))];
      });
      setHasMore(data.hasMore);
      setOffset(currentOffset + data.members.length);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  }, [query, selectedTags, offset]);

  useEffect(() => {
    setOffset(0);
    setMembers([]);
    const timer = setTimeout(() => fetchMembers(true), 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // ── Coven actions ─────────────────────────────────────────────────────────

  async function sendCovenRequest(memberId: string) {
    setCovenLoading(memberId);
    try {
      const res = await fetch('/api/coven/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: memberId }),
      });
      if (res.ok || res.status === 409) {
        setMembers((prev) =>
          prev.map((m) => m.id === memberId ? { ...m, covenStatus: 'pending_sent' } : m)
        );
      }
    } finally {
      setCovenLoading(null);
    }
  }

  async function acceptCovenRequest(memberId: string, connectionId: number) {
    setCovenLoading(memberId);
    try {
      const res = await fetch('/api/coven/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ connectionId, action: 'accept' }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => m.id === memberId ? { ...m, covenStatus: 'accepted' } : m)
        );
      }
    } finally {
      setCovenLoading(null);
    }
  }

  // ── Follow action ─────────────────────────────────────────────────────────

  async function toggleFollow(memberId: string, currentlyFollowing: boolean) {
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => m.id === memberId ? { ...m, isFollowing: !currentlyFollowing } : m)
    );
    setFollowLoading(memberId);
    try {
      const res = await fetch('/api/community/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: memberId }),
      });
      if (!res.ok) {
        // Rollback on failure
        setMembers((prev) =>
          prev.map((m) => m.id === memberId ? { ...m, isFollowing: currentlyFollowing } : m)
        );
      }
    } catch {
      setMembers((prev) =>
        prev.map((m) => m.id === memberId ? { ...m, isFollowing: currentlyFollowing } : m)
      );
    } finally {
      setFollowLoading(null);
    }
  }

  const accent = 'hsl(var(--primary))';

  return (
    <>
      <Helmet>
        <title>Discover Members — Spellful</title>
        <meta name="description" content="Find and connect with witches and magical practitioners who share your interests." />
        <meta property="og:title" content="Discover Members — Spellful" />
        <meta property="og:description" content="Find and connect with witches and magical practitioners who share your interests." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/community/discover" />
        <meta property="og:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Discover Members — Spellful" />
        <meta name="twitter:description" content="Find and connect with witches and magical practitioners who share your interests." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
      </Helmet>

      <main className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" style={{ color: accent }} />
            <h1 className="text-3xl font-serif" style={{ color: 'hsl(var(--foreground))' }}>{community_discover.title}</h1>
          </div>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {community_discover.subtitle}
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={community_discover.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </button>
          )}
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {INTEREST_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={selectedTags.includes(tag)
                ? { background: accent, color: 'hsl(var(--primary-foreground))' }
                : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }
              }
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && members.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl p-4 animate-pulse"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full" style={{ background: 'hsl(var(--muted))' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded w-2/3" style={{ background: 'hsl(var(--muted))' }} />
                    <div className="h-3 rounded w-1/3" style={{ background: 'hsl(var(--muted))' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && members.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {selectedTags.length > 0 || query ? community_discover.noResults : community_discover.noMembers}
            </p>
          </div>
        )}

        {/* Member cards */}
        {members.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 5) * 0.04 }}
                className="rounded-2xl p-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Link to={m.username ? '/u/' + m.username : '#'} className="shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
                      style={{ background: 'hsl(var(--muted))' }}>
                      {m.image ? (
                        <img src={m.image} alt={m.name ?? ''} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-lg font-semibold" style={{ color: accent }}>
                          {(m.name ?? m.username ?? '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link to={m.username ? '/u/' + m.username : '#'} className="hover:opacity-80 transition-opacity min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                          {m.name ?? m.username ?? 'Unknown'}
                        </p>
                      </Link>
                      {/* Instagram icon */}
                      {m.publicInstagramUrl && (
                        <a
                          href={m.publicInstagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open Instagram profile"
                          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                          <InstagramIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {m.username && (
                      <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>@{m.username}</p>
                    )}
                    {m.witchPath && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: accent }}>{m.witchPath}</p>
                    )}
                    {m.bio && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{m.bio}</p>
                    )}
                    {m.interestTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.interestTags.slice(0, 4).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: 'hsl(var(--primary) / 0.1)', color: accent }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {session && (
                  <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    {/* Follow button */}
                    <Button
                      size="sm"
                      variant={m.isFollowing ? 'outline' : 'outline'}
                      className="text-xs h-7 px-2.5"
                      disabled={followLoading === m.id}
                      onClick={() => toggleFollow(m.id, m.isFollowing)}
                      aria-label={m.isFollowing ? 'Unfollow' : 'Follow'}
                    >
                      {m.isFollowing
                        ? <><UserCheck className="w-3 h-3 mr-1" style={{ color: accent }} />Following</>
                        : <><UserPlus className="w-3 h-3 mr-1" />Follow</>
                      }
                    </Button>

                    {/* View profile */}
                    <Link to={m.username ? '/u/' + m.username : '#'} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs h-7">{community_discover.viewProfile}</Button>
                    </Link>

                    {/* Coven button */}
                    {m.covenStatus === 'accepted' ? (
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2.5" disabled>
                        <span style={{ color: accent }}>✓</span>&nbsp;Coven
                      </Button>
                    ) : m.covenStatus === 'pending_sent' ? (
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2.5" disabled>
                        {community_discover.invited}
                      </Button>
                    ) : m.covenStatus === 'pending_received' ? (
                      <Button
                        size="sm"
                        className="text-xs h-7 px-2.5"
                        style={{ background: accent, color: 'hsl(var(--primary-foreground))' }}
                        onClick={() => acceptCovenRequest(m.id, m.covenConnectionId!)}
                        disabled={covenLoading === m.id}
                      >
                        {community_discover.accept}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs h-7 px-2.5"
                        style={{ background: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--accent-foreground))' }}
                        onClick={() => sendCovenRequest(m.id)}
                        disabled={covenLoading === m.id}
                      >
                        {covenLoading === m.id ? '…' : community_discover.inviteToCoven}
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => fetchMembers(false)} className="text-sm">
              {community_discover.loadMore}
            </Button>
          </div>
        )}
        {loading && members.length > 0 && (
          <p className="text-center text-sm mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
        )}
      </main>
    </>
  );
}
