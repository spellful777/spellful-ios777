/**
 * MyCoven — My Coven dashboard tab
 * Shows: All Coven Members, Online Members, Pending Invitations, Sent Invitations
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Users, Clock, UserCheck, UserX, UserMinus, RefreshCw, Moon, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnlineDot } from '@/components/OnlineDot';
import { BlockUserSheet } from '@/components/BlockUserSheet';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CovenMember {
  id: number;
  status: string;
  requesterId: string;
  receiverId: string;
  createdAt: string;
  otherName: string | null;
  otherUsername: string | null;
  otherImage: string | null;
}

type Filter = 'all' | 'online' | 'pending' | 'sent';

// ─── Avatar ───────────────────────────────────────────────────────────────────
function MemberAvatar({ name, image, userId }: { name: string | null; image: string | null; userId: string }) {
  const initials = (name ?? '?').slice(0, 2).toUpperCase();
  return (
    <div className="relative flex-shrink-0">
      {image ? (
        <img
          src={image}
          alt={name ?? 'Member'}
          className="w-11 h-11 rounded-full object-cover"
          style={{ border: '2px solid hsl(var(--border))' }}
        />
      ) : (
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-serif font-bold"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--primary))', border: '2px solid hsl(var(--border))' }}
        >
          {initials}
        </div>
      )}
      <OnlineDot userId={userId} size={10} className="absolute -bottom-0.5 -right-0.5" />
    </div>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────
function MemberRow({
  member,
  currentUserId,
  onAction,
  actionLoading,
}: {
  member: CovenMember;
  currentUserId: string;
  onAction: (connectionId: number, action: 'accept' | 'decline' | 'remove') => void;
  actionLoading: number | null;
}) {
  const otherId = member.requesterId === currentUserId ? member.receiverId : member.requesterId;
  const displayName = member.otherName ?? member.otherUsername ?? 'Witch';
  const isLoading = actionLoading === member.id;
  const [blockSheetOpen, setBlockSheetOpen] = useState(false);

  return (
    <>
      <BlockUserSheet
        open={blockSheetOpen}
        onOpenChange={setBlockSheetOpen}
        displayName={displayName}
        userId={otherId}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <Link to={member.otherUsername ? `/profile/${member.otherUsername}` : '#'} className="flex-shrink-0">
          <MemberAvatar name={member.otherName} image={member.otherImage} userId={otherId} />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={member.otherUsername ? `/profile/${member.otherUsername}` : '#'}
            className="font-medium text-sm leading-tight hover:underline block truncate"
            style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
          >
            {displayName}
          </Link>
          {member.otherUsername && (
            <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
              @{member.otherUsername}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {member.status === 'accepted' && (
            <>
              <Link
                to={member.otherUsername ? `/profile/${member.otherUsername}` : '#'}
                className="text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
              >
                View Profile
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-full"
                title="Remove from Coven"
                disabled={isLoading}
                onClick={() => onAction(member.id, 'remove')}
              >
                <UserMinus className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-full"
                title="Restrict member"
                onClick={() => setBlockSheetOpen(true)}
              >
                <ShieldOff className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </Button>
            </>
          )}

          {member.status === 'pending' && member.receiverId === currentUserId && (
            <>
              <Button
                size="sm"
                disabled={isLoading}
                onClick={() => onAction(member.id, 'accept')}
                className="h-7 text-xs gap-1"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                <UserCheck className="w-3 h-3" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                onClick={() => onAction(member.id, 'decline')}
                className="h-7 text-xs gap-1"
              >
                <UserX className="w-3 h-3" />
                Decline
              </Button>
            </>
          )}

          {member.status === 'pending' && member.requesterId === currentUserId && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isLoading}
              onClick={() => onAction(member.id, 'remove')}
              className="h-7 text-xs gap-1"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <UserX className="w-3 h-3" />
              Cancel
            </Button>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────
function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
        color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
        border: `1px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MyCoven({ currentUserId }: { currentUserId: string }) {
  const [connections, setConnections] = useState<CovenMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  type Suggestion = { id: string; name: string | null; username: string | null; image: string | null; witchPath: string | null; sharedTags: number };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/coven', { credentials: 'include' });
      if (!r.ok) return;
      const data = await r.json() as { connections: CovenMember[] };
      setConnections(data.connections ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Load suggestions once
  useEffect(() => {
    if (suggestionsLoaded) return;
    setSuggestionsLoaded(true);
    fetch('/api/coven/suggestions', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((d: { suggestions?: Suggestion[] } | null) => { if (d?.suggestions) setSuggestions(d.suggestions); })
      .catch(() => undefined);
  }, [suggestionsLoaded]);

  async function handleInvite(userId: string) {
    setInvitingId(userId);
    try {
      const r = await fetch('/api/coven/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: userId }),
      });
      if (r.ok) {
        setInvitedIds(prev => new Set([...prev, userId]));
        setSuggestions(prev => prev.filter(s => s.id !== userId));
      }
    } finally { setInvitingId(null); }
  }

  // Poll online status for accepted members
  useEffect(() => {
    const accepted = connections.filter(c => c.status === 'accepted');
    if (!accepted.length) return;

    async function checkOnline() {
      const results = await Promise.allSettled(
        accepted.map(async (c) => {
          const otherId = c.requesterId === currentUserId ? c.receiverId : c.requesterId;
          const r = await fetch(`/api/presence/${otherId}`, { credentials: 'include' });
          if (!r.ok) return null;
          const d = await r.json() as { online: boolean };
          return d.online ? otherId : null;
        })
      );
      const ids = new Set<string>();
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) ids.add(r.value);
      }
      setOnlineIds(ids);
    }

    void checkOnline();
    const interval = setInterval(() => { void checkOnline(); }, 30_000);
    return () => clearInterval(interval);
  }, [connections, currentUserId]);

  async function handleAction(connectionId: number, action: 'accept' | 'decline' | 'remove') {
    setActionLoading(connectionId);
    try {
      if (action === 'remove') {
        await fetch(`/api/coven/${connectionId}`, { method: 'DELETE', credentials: 'include' });
      } else {
        await fetch('/api/coven/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ connectionId, action }),
        });
      }
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  const accepted = connections.filter(c => c.status === 'accepted');
  const pendingIn = connections.filter(c => c.status === 'pending' && c.receiverId === currentUserId);
  const pendingSent = connections.filter(c => c.status === 'pending' && c.requesterId === currentUserId);
  const onlineMembers = accepted.filter(c => {
    const otherId = c.requesterId === currentUserId ? c.receiverId : c.requesterId;
    return onlineIds.has(otherId);
  });

  const displayed: CovenMember[] = (() => {
    if (filter === 'online') return onlineMembers;
    if (filter === 'pending') return pendingIn;
    if (filter === 'sent') return pendingSent;
    return [...accepted, ...pendingIn, ...pendingSent];
  })();

  const pendingCount = pendingIn.length;

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <Skeleton className="w-11 h-11 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            My Coven
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {accepted.length} {accepted.length === 1 ? 'member' : 'members'}
            {onlineMembers.length > 0 && <span className="ml-2" style={{ color: 'hsl(var(--success))' }}>· {onlineMembers.length} online</span>}
            {pendingCount > 0 && <span className="ml-2" style={{ color: 'hsl(var(--primary))' }}>· {pendingCount} pending {pendingCount === 1 ? 'invitation' : 'invitations'}</span>}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { setLoading(true); void load(); }} className="h-8 w-8 p-0 rounded-full">
          <RefreshCw className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> All Members ({accepted.length})</span>
        </FilterPill>
        <FilterPill active={filter === 'online'} onClick={() => setFilter('online')}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'hsl(var(--success))' }} />
            Online ({onlineMembers.length})
          </span>
        </FilterPill>
        <FilterPill active={filter === 'pending'} onClick={() => setFilter('pending')}>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Invitations
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                {pendingCount}
              </span>
            )}
          </span>
        </FilterPill>
        <FilterPill active={filter === 'sent'} onClick={() => setFilter('sent')}>
          <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> Sent ({pendingSent.length})</span>
        </FilterPill>
      </div>

      {/* Suggested Members */}
      {suggestions.length > 0 && filter === 'all' && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Suggested Members
          </h3>
          {suggestions.slice(0, 5).map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <Link to={s.username ? `/profile/${s.username}` : '#'} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
                  {s.image ? (
                    <img src={s.image} alt={s.name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {(s.name ?? s.username ?? '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={s.username ? `/profile/${s.username}` : '#'} className="font-medium text-sm hover:underline truncate block" style={{ color: 'hsl(var(--foreground))' }}>
                  {s.name ?? s.username ?? 'Witch'}
                </Link>
                {s.witchPath && <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.witchPath}</p>}
                {s.sharedTags > 0 && <p className="text-xs" style={{ color: 'hsl(var(--primary))' }}>{s.sharedTags} shared interest{s.sharedTags > 1 ? 's' : ''}</p>}
              </div>
              <Button
                size="sm"
                disabled={invitingId === s.id || invitedIds.has(s.id)}
                onClick={() => handleInvite(s.id)}
                className="text-xs h-7 shrink-0"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                {invitedIds.has(s.id) ? 'Invited ✓' : invitingId === s.id ? '…' : 'Invite'}
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Member list */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Users className="w-10 h-10 mx-auto" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }} />
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {filter === 'all' && 'Your coven is empty. Invite members from their profiles.'}
            {filter === 'online' && 'No coven members are online right now.'}
            {filter === 'pending' && 'No pending invitations.'}
            {filter === 'sent' && 'No sent invitations.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
