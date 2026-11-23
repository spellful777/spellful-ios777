import { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  Search, Shield, Users, ChevronDown, Check, AlertTriangle,
  RefreshCw, Clock, User, Wand2, Globe, CheckCircle2, Award, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/auth/auth-client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { admin_roles as c } from 'virtual:content';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  platformRole: string | null;
  accountType: string | null;
  isAdmin: boolean | null;
  createdAt: string | null;
}

interface AuditEvent {
  id: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: string;
  actorName: string | null;
  actorUsername: string | null;
  targetName: string | null;
  targetUsername: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: 'Platform Owner',
  admin: 'Administrator',
  moderator: 'Moderator',
  support: 'Support',
  member: 'Member',
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  community_member: 'Community Member',
  creator: 'Creator',
  organization: 'Organization',
  official: 'Official Spellful',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'hsl(var(--primary))',
  admin: 'hsl(var(--destructive))',
  moderator: 'hsl(var(--accent))',
  support: 'hsl(var(--info))',
  member: 'hsl(var(--muted-foreground))',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${ROLE_COLORS[role] ?? 'hsl(var(--muted-foreground))'}22`, color: ROLE_COLORS[role] ?? 'hsl(var(--muted-foreground))' }}>
      <Shield className="w-3 h-3" />
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function AccountTypeBadge({ type }: { type: string }) {
  const icon = type === 'creator' ? <Wand2 className="w-3 h-3" /> :
               type === 'organization' ? <Users className="w-3 h-3" /> :
               type === 'official' ? <CheckCircle2 className="w-3 h-3" /> :
               <Globe className="w-3 h-3" />;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
      {icon}
      {ACCOUNT_TYPE_LABELS[type] ?? type}
    </span>
  );
}

// ── Badge definitions ─────────────────────────────────────────────────────────

const ALL_BADGES: { key: string; label: string; emoji: string; type: 'interest' | 'official' }[] = [
  { key: 'interest.lunar_witch', label: 'Lunar Witch', emoji: '🌙', type: 'interest' },
  { key: 'interest.green_witch', label: 'Green Witch', emoji: '🌿', type: 'interest' },
  { key: 'interest.astrology', label: 'Astrology Enthusiast', emoji: '⭐', type: 'interest' },
  { key: 'interest.crystals', label: 'Crystal Lover', emoji: '💎', type: 'interest' },
  { key: 'interest.tarot', label: 'Tarot Enthusiast', emoji: '🃏', type: 'interest' },
  { key: 'interest.candle_magic', label: 'Candle Magic', emoji: '🕯️', type: 'interest' },
  { key: 'official.verified_creator', label: 'Verified Creator', emoji: '✨', type: 'official' },
  { key: 'official.spellful_team', label: 'Spellful Team', emoji: '🔮', type: 'official' },
  { key: 'official.community_guide', label: 'Community Guide', emoji: '🌟', type: 'official' },
];

// ── Badge manager panel ───────────────────────────────────────────────────────

function BadgeManager({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const [badges, setBadges] = useState<{ id: number; badgeKey: string; badgeType: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetch(`/api/admin/badges?userId=${encodeURIComponent(memberId)}`, { credentials: 'include' })
      .then(r => r.json())
      .then((d: { badges?: { id: number; badgeKey: string; badgeType: string }[] }) => setBadges(d.badges ?? []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [memberId]);

  async function toggleBadge(badgeKey: string) {
    const has = badges.some(b => b.badgeKey === badgeKey);
    setSaving(badgeKey);
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetId: memberId, badgeKey, action: has ? 'revoke' : 'grant', reason }),
      });
      if (res.ok) {
        if (has) {
          setBadges(prev => prev.filter(b => b.badgeKey !== badgeKey));
        } else {
          const meta = ALL_BADGES.find(b => b.key === badgeKey);
          setBadges(prev => [...prev, { id: Date.now(), badgeKey, badgeType: meta?.type ?? 'interest' }]);
        }
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-3 rounded-xl p-4 space-y-3"
      style={{ background: 'hsl(var(--card-deep))', border: '1px solid hsl(var(--border))' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.badgeManagementTitle}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/50 transition-colors">
          <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </button>
      </div>

      <Input
        placeholder="Reason (optional, logged in audit)"
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="text-xs bg-muted border-border"
      />

      {loading ? (
        <div className="flex gap-2 flex-wrap">
          {[...Array(6)].map((_, i) => <div key={i} className="h-7 w-24 rounded-full animate-pulse" style={{ background: 'hsl(var(--muted))' }} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {(['interest', 'official'] as const).map(type => (
            <div key={type}>
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{type === 'interest' ? c.interestLabel : c.officialLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_BADGES.filter(b => b.type === type).map(badge => {
                  const active = badges.some(b => b.badgeKey === badge.key);
                  const isSaving = saving === badge.key;
                  return (
                    <button key={badge.key} disabled={isSaving}
                      onClick={() => toggleBadge(badge.key)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all"
                      style={{
                        background: active ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                        border: `1px solid ${active ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                        color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        opacity: isSaving ? 0.5 : 1,
                      }}>
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                      {active && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Role selector dropdown ────────────────────────────────────────────────────

function RoleSelector({
  memberId, currentRole, currentAccountType, actorRole,
  onChanged,
}: {
  memberId: string;
  currentRole: string;
  currentAccountType: string;
  actorRole: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmField, setConfirmField] = useState<{ field: string; value: string } | null>(null);
  const [reason, setReason] = useState('');

  const canGrantOwner = actorRole === 'owner';
  const canGrantAdmin = actorRole === 'owner';

  const ROLES = [
    { value: 'owner', label: 'Platform Owner', disabled: !canGrantOwner },
    { value: 'admin', label: 'Administrator', disabled: !canGrantAdmin },
    { value: 'moderator', label: 'Moderator', disabled: false },
    { value: 'support', label: 'Support', disabled: false },
    { value: 'member', label: 'Member', disabled: false },
  ];

  const ACCOUNT_TYPES = [
    { value: 'community_member', label: 'Community Member' },
    { value: 'creator', label: 'Creator' },
    { value: 'organization', label: 'Organization' },
    { value: 'official', label: 'Official Spellful', disabled: !canGrantOwner },
  ];

  async function applyChange(field: string, value: string, r: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetId: memberId, field, value, reason: r }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      onChanged();
      setOpen(false);
      setConfirmField(null);
      setReason('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(v => !v)}
        className="text-xs gap-1.5 border-border">
        <Shield className="w-3 h-3" />
        {c.manageLabel}
        <ChevronDown className="w-3 h-3" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl shadow-xl overflow-hidden"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

          {confirmField ? (
            <div className="p-4 space-y-3">
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {c.confirmPrefix} {confirmField.field === 'platformRole' ? c.confirmRoleLabel : c.confirmAccountTypeLabel} {c.confirmTo}{' '}
                <strong>{confirmField.field === 'platformRole' ? ROLE_LABELS[confirmField.value] : ACCOUNT_TYPE_LABELS[confirmField.value]}</strong>?
              </p>
              <Input
                placeholder="Reason (optional)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="text-xs bg-muted border-border"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button size="sm" disabled={loading} onClick={() => applyChange(confirmField.field, confirmField.value, reason)}
                  className="flex-1 bg-primary text-primary-foreground text-xs">
                  {loading ? '…' : c.applyLabel}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setConfirmField(null); setError(''); }}
                  className="flex-1 text-xs border-border">
                  {c.cancelLabel}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.roleLabel}</p>
              </div>
              {ROLES.map(r => (
                <button key={r.value}
                  disabled={r.disabled || r.value === currentRole}
                  onClick={() => setConfirmField({ field: 'platformRole', value: r.value })}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50"
                  style={{ color: 'hsl(var(--foreground))' }}>
                  <span>{r.label}</span>
                  {r.value === currentRole && <Check className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />}
                </button>
              ))}
              <div className="p-3 border-t border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.accountTypeLabel}</p>
              </div>
              {ACCOUNT_TYPES.map(t => (
                <button key={t.value}
                  disabled={t.disabled || t.value === currentAccountType}
                  onClick={() => setConfirmField({ field: 'accountType', value: t.value })}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50"
                  style={{ color: 'hsl(var(--foreground))' }}>
                  <span>{t.label}</span>
                  {t.value === currentAccountType && <Check className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />}
                </button>
              ))}
              <div className="p-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                <button onClick={() => setOpen(false)}
                  className="w-full text-xs py-1 rounded hover:bg-muted/50 transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminRolesPage() {
  const { session, isPending } = useSession();
  const actorRole = (session?.user as { platformRole?: string } | undefined)?.platformRole ?? 'member';
  const isAuthorized = actorRole === 'owner' || actorRole === 'admin'
    || (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;

  const [members, setMembers] = useState<Member[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [expandedBadgeMember, setExpandedBadgeMember] = useState<string | null>(null);

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'audit'>('members');

  const LIMIT = 25;

  const loadMembers = useCallback(async (newOffset = 0, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(newOffset) });
      if (q) params.set('q', q);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/admin/roles?${params}`, { credentials: 'include' });
      const data = await res.json() as { members?: Member[]; hasMore?: boolean };
      setMembers(prev => append ? [...prev, ...(data.members ?? [])] : (data.members ?? []));
      setHasMore(data.hasMore ?? false);
      setOffset(newOffset);
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/admin/audit?limit=50', { credentials: 'include' });
      const data = await res.json() as { events?: AuditEvent[] };
      setAuditEvents(data.events ?? []);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    loadMembers(0);
  }, [isAuthorized, loadMembers]);

  useEffect(() => {
    if (activeTab === 'audit' && isAuthorized) loadAudit();
  }, [activeTab, isAuthorized, loadAudit]);

  if (isPending) return null;
  if (!isAuthorized) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.accessDenied}</p>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.accessDeniedDesc}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Roles & Account Types — Spellful Admin</title>
        <meta name="description" content="Manage platform roles, account types, and review the audit trail for Spellful." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              <h1 className="font-serif text-2xl" style={{ color: 'hsl(var(--foreground))' }}>{c.title}</h1>
            </div>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {c.subtitle}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
            {(['members', 'audit'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  background: activeTab === tab ? 'hsl(var(--card))' : 'transparent',
                  color: activeTab === tab ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  boxShadow: activeTab === tab ? '0 1px 3px hsl(var(--background) / 0.5)' : 'none',
                }}>
                {tab === 'members' ? c.tabMembers : c.tabAudit}
              </button>
            ))}
          </div>

          {/* Members tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Search + filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <Input
                    placeholder="Search by username, name, or email…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') loadMembers(0); }}
                    className="pl-9 bg-muted border-border"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:w-44"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                  <option value="">{c.filterAll}</option>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Button onClick={() => loadMembers(0)} disabled={loading} variant="outline" size="sm"
                  className="gap-1.5 border-border">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Member list */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                {loading && members.length === 0 ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-8 text-center">
                    <User className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.noMembers}</p>
                  </div>
                ) : (
                  members.map((m, i) => (
                    <div key={m.id}
                      style={{ borderTop: i > 0 ? '1px solid hsl(var(--border))' : 'none' }}>
                      <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'hsl(var(--muted))' }}>
                        {m.image
                          ? <img src={m.image} alt="" className="w-full h-full object-cover" />
                          : <User className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                            {m.name ?? m.username ?? m.email ?? m.id}
                          </span>
                          {m.username && (
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>@{m.username}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <RoleBadge role={m.platformRole ?? (m.isAdmin ? 'admin' : 'member')} />
                          <AccountTypeBadge type={m.accountType ?? 'community_member'} />
                          {m.createdAt && (
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              Joined {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm"
                          onClick={() => setExpandedBadgeMember(prev => prev === m.id ? null : m.id)}
                          className="text-xs gap-1.5 border-border">
                          <Award className="w-3 h-3" />
                          {c.badgesLabel}
                        </Button>
                        <RoleSelector
                          memberId={m.id}
                          currentRole={m.platformRole ?? (m.isAdmin ? 'admin' : 'member')}
                          currentAccountType={m.accountType ?? 'community_member'}
                          actorRole={actorRole}
                          onChanged={() => loadMembers(offset)}
                        />
                      </div>
                      </div>
                      {expandedBadgeMember === m.id && (
                        <div className="px-4 pb-3">
                          <BadgeManager memberId={m.id} onClose={() => setExpandedBadgeMember(null)} />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {hasMore && (
                  <div className="p-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                    <Button variant="outline" size="sm" disabled={loading} onClick={() => loadMembers(offset + LIMIT, true)}
                      className="w-full text-xs border-border">
                      {loading ? '…' : c.loadMore}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit log tab */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.auditSubtitle}</p>
                <Button onClick={loadAudit} disabled={auditLoading} variant="outline" size="sm"
                  className="gap-1.5 border-border text-xs">
                  <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                {auditLoading && auditEvents.length === 0 ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                  </div>
                ) : auditEvents.length === 0 ? (
                  <div className="p-8 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No audit events yet.</p>
                  </div>
                ) : (
                  auditEvents.map((ev, i) => (
                    <div key={ev.id}
                      className="px-4 py-3 flex items-start gap-3"
                      style={{ borderTop: i > 0 ? '1px solid hsl(var(--border))' : 'none' }}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--warning))' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          <span className="font-medium">{ev.actorName ?? ev.actorUsername ?? 'Unknown'}</span>
                          {' → '}
                          <span className="font-mono text-xs px-1 py-0.5 rounded"
                            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--accent))' }}>
                            {ev.action}
                          </span>
                          {ev.targetName && <> on <span className="font-medium">{ev.targetName}</span></>}
                        </p>
                        {(ev.oldValue || ev.newValue) && (
                          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {ev.oldValue} → {ev.newValue}
                            {ev.reason ? ` · ${ev.reason}` : ''}
                          </p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </motion.div>
      </main>
    </>
  );
}
