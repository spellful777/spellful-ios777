import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  Flag, Pin, Lock, EyeOff, Users, Tag, ScrollText,
  Megaphone, CheckCircle2, XCircle, ChevronRight,
  ToggleLeft, ToggleRight, Search, Award, RefreshCw,
  FileText, ChevronDown, ChevronUp, AlertTriangle, Clock, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/auth-client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { admin_community } from 'virtual:content';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Report {
  id: number;
  targetType: string;
  targetId: number;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporterName: string | null;
  reporterUsername: string | null;
  // enriched fields
  targetTitle: string | null;
  targetSnippet: string | null;
  targetIsHidden: boolean;
  targetAuthorUsername: string | null;
  targetPostId: number | null;
}

interface AdminPost {
  id: number;
  title: string;
  type: string;
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  authorName: string | null;
  categoryName: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

interface ModAction {
  id: number;
  targetType: string;
  targetId: number;
  action: string;
  reason: string | null;
  createdAt: string;
  modName: string | null;
  modUsername: string | null;
}

type Tab = 'reports' | 'posts' | 'categories' | 'badges' | 'modLog' | 'announcements' | 'applications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function ago(ts: string) {
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: '--warning',
    resolved: '--success',
    dismissed: '--muted-foreground',
  };
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
      style={{
        // eslint-disable-next-line security/detect-object-injection
        background: `hsl(var(${map[status] ?? '--muted'}) / 0.15)`,
        // eslint-disable-next-line security/detect-object-injection
        color: `hsl(var(${map[status] ?? '--muted-foreground'}))`,
      }}
    >
      {status}
    </span>
  );
}

// ── Tab: Reports ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/community/reports?status=${filter}`).catch(() => null);
    if (r?.ok) setReports(await r.json() as Report[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, status: 'resolved' | 'dismissed') => {
    setResolving(id);
    await fetch(`/api/admin/community/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setMsg(`Report ${status}`);
    setTimeout(() => setMsg(''), 2500);
    setResolving(null);
    load();
  };

  const hideContent = async (r: Report) => {
    setResolving(r.id);
    const endpoint = r.targetType === 'post'
      ? `/api/admin/community/posts/${r.targetId}`
      : `/api/admin/community/replies/${r.targetId}`;
    const body = r.targetType === 'post'
      ? { isHidden: true, reason: r.reason }
      : { isHidden: true, reason: r.reason };
    await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // Also resolve the report
    await fetch(`/api/admin/community/reports/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    setMsg('Content hidden & report resolved');
    setTimeout(() => setMsg(''), 2500);
    setResolving(null);
    load();
  };

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'resolved', 'dismissed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: filter === s ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              background: filter === s ? 'hsl(var(--primary) / 0.12)' : 'transparent',
              color: filter === s ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
          >
            {admin_community.reports[`status${s.charAt(0).toUpperCase()}${s.slice(1)}` as keyof typeof admin_community.reports]}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {msg && <p className="text-xs text-[hsl(var(--success))] mb-3">{msg}</p>}

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{admin_community.reports.emptyPending}</p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StatusPill status={r.status} />
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {r.targetType} #{r.targetId}
                        {r.targetAuthorUsername && <> · @{r.targetAuthorUsername}</>}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{ago(r.createdAt)}</span>
                      {r.targetIsHidden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">hidden</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground font-medium mb-0.5">
                      {admin_community.reports.reasonLabel}: <span className="font-normal capitalize">{r.reason.replace(/_/g, ' ')}</span>
                    </p>
                    {r.details && <p className="text-xs text-muted-foreground line-clamp-2">{r.details}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {admin_community.reports.reporterLabel}: {r.reporterName ?? r.reporterUsername ?? 'Unknown'}
                    </p>
                  </div>
                  {(r.targetType === 'post' || r.targetType === 'reply') && (
                    <Link
                      to={r.targetType === 'post' ? `/community/post/${r.targetId}` : `/community/post/${r.targetPostId ?? r.targetId}`}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      title="View in community"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {/* Content preview */}
                {(r.targetTitle || r.targetSnippet) && (
                  <div className="rounded-lg px-3 py-2 text-xs border-l-2" style={{ background: 'hsl(var(--muted))', borderLeftColor: 'hsl(var(--border))' }}>
                    {r.targetTitle && <p className="font-semibold text-foreground mb-0.5 line-clamp-1">{r.targetTitle}</p>}
                    {r.targetSnippet && <p className="text-muted-foreground line-clamp-3">{r.targetSnippet}</p>}
                  </div>
                )}

                {/* Action buttons */}
                {r.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    {(r.targetType === 'post' || r.targetType === 'reply') && !r.targetIsHidden && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        style={{ borderColor: 'hsl(var(--destructive) / 0.4)', color: 'hsl(var(--destructive))' }}
                        disabled={resolving === r.id}
                        onClick={() => hideContent(r)}
                      >
                        <EyeOff className="w-3 h-3 mr-1" />Hide content
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-[hsl(var(--success)/0.4)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.1)]"
                      disabled={resolving === r.id}
                      onClick={() => act(r.id, 'resolved')}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />{admin_community.reports.resolveBtn}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-border text-muted-foreground hover:text-foreground"
                      disabled={resolving === r.id}
                      onClick={() => act(r.id, 'dismissed')}
                    >
                      <XCircle className="w-3 h-3 mr-1" />{admin_community.reports.dismissBtn}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Posts ────────────────────────────────────────────────────────────────

function PostsTab() {
  const [query, setQuery] = useState('');
  const [post, setPost] = useState<AdminPost | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const id = parseInt(query.trim());
    if (!isNaN(id)) {
      const r = await fetch(`/api/community/posts/${id}`).catch(() => null);
      if (r?.ok) {
        const d = await r.json() as AdminPost;
        setPost(d);
      } else {
        setPost(null);
        setMsg('Post not found');
        setTimeout(() => setMsg(''), 2500);
      }
    }
    setLoading(false);
  };

  const patch = async (updates: Record<string, unknown>) => {
    if (!post) return;
    const r = await fetch(`/api/admin/community/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, reason: reason || undefined }),
    });
    const d = await r.json() as { message?: string; error?: string };
    setMsg(d.message ?? d.error ?? '');
    setTimeout(() => setMsg(''), 2500);
    // Refresh post state
    const r2 = await fetch(`/api/community/posts/${post.id}`).catch(() => null);
    if (r2?.ok) setPost(await r2.json() as AdminPost);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder={admin_community.posts.searchPlaceholder}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button size="sm" onClick={search} disabled={loading} className="bg-primary text-primary-foreground">
          {loading ? '…' : 'Search'}
        </Button>
      </div>

      {msg && <p className="text-xs text-[hsl(var(--success))] mb-3">{msg}</p>}

      {post ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground line-clamp-2">{post.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                #{post.id} · {post.categoryName} · {post.authorName} · {ago(post.createdAt)}
              </p>
            </div>
            <Link to={`/community/post/${post.id}`} className="text-muted-foreground hover:text-foreground shrink-0">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Status badges */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {post.isPinned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">Pinned</span>}
            {post.isLocked && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-[hsl(var(--warning))] font-semibold">Locked</span>}
            {post.isHidden && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">Hidden</span>}
          </div>

          {/* Reason */}
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={admin_community.posts.reasonPlaceholder}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-3"
          />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1 border-border" onClick={() => patch({ isPinned: !post.isPinned })}>
              <Pin className="w-3 h-3" />{post.isPinned ? admin_community.posts.unpinBtn : admin_community.posts.pinBtn}
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1 border-border" onClick={() => patch({ isLocked: !post.isLocked })}>
              <Lock className="w-3 h-3" />{post.isLocked ? admin_community.posts.unlockBtn : admin_community.posts.lockBtn}
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1 border-border text-destructive hover:bg-destructive/10" onClick={() => patch({ isHidden: !post.isHidden })}>
              <EyeOff className="w-3 h-3" />{post.isHidden ? admin_community.posts.unhideBtn : admin_community.posts.hideBtn}
            </Button>
          </div>
        </motion.div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">{admin_community.posts.emptyState}</p>
      )}
    </div>
  );
}

// ── Tab: Categories ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/community/categories')
      .then((r) => r.ok ? r.json() : [])
      .then((d: Category[]) => setCats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (cat: Category) => {
    setSaving(cat.id);
    await fetch(`/api/admin/community/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cat.name, description: cat.description, isActive: cat.isActive, sortOrder: cat.sortOrder }),
    });
    setMsg('Saved');
    setTimeout(() => setMsg(''), 2000);
    setSaving(null);
  };

  const update = (id: number, field: keyof Category, value: unknown) => {
    setCats((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div>
      {msg && <p className="text-xs text-[hsl(var(--success))] mb-3">{msg}</p>}
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {cats.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{cat.icon}</span>
                <input
                  value={cat.name}
                  onChange={(e) => update(cat.id, 'name', e.target.value)}
                  className="flex-1 text-sm font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary text-foreground"
                />
                <button
                  onClick={() => update(cat.id, 'isActive', !cat.isActive)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={cat.isActive ? admin_community.categories.activeLabel : admin_community.categories.inactiveLabel}
                >
                  {cat.isActive
                    ? <ToggleRight className="w-5 h-5 text-[hsl(var(--success))]" />
                    : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  value={cat.description}
                  onChange={(e) => update(cat.id, 'description', e.target.value)}
                  className="flex-1 text-xs bg-transparent border-b border-border focus:outline-none focus:border-primary text-muted-foreground"
                  placeholder="Description"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{admin_community.categories.sortOrderLabel}</span>
                  <input
                    type="number"
                    value={cat.sortOrder}
                    onChange={(e) => update(cat.id, 'sortOrder', parseInt(e.target.value) || 0)}
                    className="w-12 text-xs text-center bg-muted border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <Button
                  size="sm"
                  className="text-xs h-7 bg-primary text-primary-foreground"
                  disabled={saving === cat.id}
                  onClick={() => save(cat)}
                >
                  {saving === cat.id ? '…' : admin_community.categories.saveBtn}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Applications ─────────────────────────────────────────────────────────

interface Application {
  id: number;
  referenceId: string;
  userId: string;
  status: string;
  requestedAccountType: string;
  creatorName: string;
  contactEmail: string;
  websiteUrl: string;
  instagramHandle: string;
  blueskyHandle: string;
  threadsHandle: string;
  xHandle: string;
  otherSocial: string;
  creatorCategory: string;
  workDescription: string;
  workSamples: string;
  reasonForApplying: string;
  additionalNotes: string;
  reviewDecision: string;
  reviewReason: string;
  notificationSent: number;
  submittedAt: string;
  updatedAt: string;
  applicantUsername: string | null;
  applicantName: string | null;
  applicantImage: string | null;
}

const APP_STATUSES = [
  { value: '', label: 'All' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'info_requested', label: 'More Info Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending_review:  { bg: 'hsl(var(--warning) / 0.15)',    color: 'hsl(var(--warning))',    label: 'Pending Review' },
  info_requested:  { bg: 'hsl(var(--info) / 0.15)',       color: 'hsl(var(--info))',       label: 'More Info Requested' },
  approved:        { bg: 'hsl(var(--success) / 0.15)',    color: 'hsl(var(--success))',    label: 'Approved' },
  rejected:        { bg: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))', label: 'Rejected' },
  withdrawn:       { bg: 'hsl(var(--muted))',              color: 'hsl(var(--muted-foreground))', label: 'Withdrawn' },
};

function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionApp, setActionApp] = useState<Application | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_info' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [selectedCanned, setSelectedCanned] = useState<string | null>(null);
  const [selectedCooldown, setSelectedCooldown] = useState<number>(30);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // ── Canned responses ────────────────────────────────────────────────────────
  const APPROVE_CANNED = [
    { id: 'welcome', label: 'Welcome!', text: 'Welcome to the Creator program! Your profile will now show the Verified Creator badge. We\'re excited to have you sharing your work with the Spellful community.' },
    { id: 'congrats', label: 'Congratulations', text: 'Congratulations — your application has been approved! Your account has been upgraded and your Verified Creator badge is now active.' },
    { id: 'org_welcome', label: 'Organization welcome', text: 'Welcome to Spellful as a Verified Organization! Your badge is now active. We look forward to seeing your presence in the community.' },
  ];

  const REJECT_CANNED = [
    { id: 'insufficient_samples', label: 'Insufficient work samples', text: 'We weren\'t able to verify your work with the samples provided. Please build out your portfolio or online presence and reapply.', cooldownDays: 60 },
    { id: 'not_enough_presence', label: 'Limited online presence', text: 'At this time your online presence doesn\'t meet our threshold for Creator status. We encourage you to grow your community and reapply.', cooldownDays: 90 },
    { id: 'off_topic', label: 'Content not aligned', text: 'Your application content doesn\'t align with Spellful\'s focus on witchcraft, divination, and magical practices. If your work evolves in this direction, you\'re welcome to reapply.', cooldownDays: 90 },
    { id: 'incomplete', label: 'Incomplete application', text: 'Your application was missing key information we need to make a decision. Please reapply with a complete submission including work samples and a full description.', cooldownDays: 14 },
    { id: 'guidelines', label: 'Community guidelines concern', text: 'We\'ve identified a concern with your account history or content that prevents approval at this time. Please review our community guidelines before reapplying.', cooldownDays: 180 },
  ];

  const REQUEST_INFO_CANNED = [
    { id: 'portfolio', label: 'Need portfolio link', text: 'Could you share a direct link to your portfolio, shop, or a representative sample of your work? This will help us complete our review.' },
    { id: 'social', label: 'Need social handle', text: 'We\'d love to see your social media presence. Could you provide a handle or profile link so we can verify your work?' },
    { id: 'describe_work', label: 'Clarify work description', text: 'Could you tell us a bit more about what you create and how it relates to witchcraft, divination, or magical practice? A few more sentences would be really helpful.' },
    { id: 'category', label: 'Clarify category', text: 'The category you selected doesn\'t quite match the work you described. Could you clarify what type of content or products you primarily create?' },
  ];
  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const off = reset ? 0 : offset;
    const params = new URLSearchParams({ limit: '20', offset: String(off) });
    if (statusFilter) params.set('status', statusFilter);
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`/api/admin/applications?${params}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json() as { applications: Application[]; hasMore: boolean };
      setApps(reset ? data.applications : (prev) => [...prev, ...data.applications]);
      setHasMore(data.hasMore);
      if (reset) setOffset(0);
    }
    setLoading(false);
  }, [statusFilter, q, offset]);

  useEffect(() => { load(true); setOffset(0); }, [statusFilter, q]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitAction() {
    if (!actionApp || !actionType) return;
    setActionLoading(true);
    setActionError('');
    const body: Record<string, unknown> = { action: actionType, reason: actionReason };
    if (actionType === 'reject') body.cooldownDays = selectedCooldown;
    const res = await fetch(`/api/admin/applications/${actionApp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok) { setActionError(data.error ?? 'Action failed.'); setActionLoading(false); return; }
    setActionMsg(`Done — application ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'flagged for more info'}.`);
    setActionApp(null);
    setActionType(null);
    setActionReason('');
    setSelectedCanned(null);
    setSelectedCooldown(30);
    setActionLoading(false);
    setTimeout(() => setActionMsg(''), 4000);
    load(true);
  }

  function openAction(app: Application, type: 'approve' | 'reject' | 'request_info') {
    setActionApp(app);
    setActionType(type);
    setActionReason('');
    setSelectedCanned(null);
    setSelectedCooldown(30);
    setActionError('');
  }

  function closeAction() {
    setActionApp(null);
    setActionType(null);
    setActionReason('');
    setSelectedCanned(null);
    setSelectedCooldown(30);
    setActionError('');
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by username or reference ID…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {APP_STATUSES.map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: statusFilter === value ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--muted))',
                color: statusFilter === value ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                border: `1px solid ${statusFilter === value ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                fontWeight: statusFilter === value ? 600 : 400,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 mb-4"
          style={{ background: 'hsl(var(--success) / 0.12)', color: 'hsl(var(--success))', border: '1px solid hsl(var(--success) / 0.3)' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{actionMsg}
        </div>
      )}

      {loading && apps.length === 0 && (
        <div className="space-y-3">
          {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      )}

      {!loading && apps.length === 0 && (
        <div className="text-center py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          No applications found.
        </div>
      )}

      <div className="space-y-3">
        {apps.map((app) => {
          const st = STATUS_STYLES[app.status] ?? STATUS_STYLES.withdrawn;
          const isOpen = expanded === app.id;
          const canAct = ['pending_review', 'info_requested'].includes(app.status);
          return (
            <div key={app.id} className="rounded-xl overflow-hidden"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              {/* Row header */}
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[hsl(var(--muted)/0.5)] transition-colors"
                onClick={() => setExpanded(isOpen ? null : app.id)}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>
                  {(app.applicantUsername ?? app.userId).slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                      {app.creatorName}
                    </span>
                    {app.applicantUsername && (
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>@{app.applicantUsername}</span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <span>{app.creatorCategory}</span>
                    <span>·</span>
                    <span className="font-mono">{app.referenceId.slice(0, 8)}…</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                         : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                  {/* Contact & social */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                    <Detail label="Contact email" value={app.contactEmail} />
                    <Detail label="Website" value={app.websiteUrl || '—'} link={app.websiteUrl} />
                    <Detail label="Instagram" value={app.instagramHandle || '—'} />
                    <Detail label="Bluesky" value={app.blueskyHandle || '—'} />
                    <Detail label="Threads" value={app.threadsHandle || '—'} />
                    <Detail label="X (Twitter)" value={app.xHandle || '—'} />
                    {app.otherSocial && <Detail label="Other social" value={app.otherSocial} />}
                  </div>

                  {/* Long-form fields */}
                  <LongDetail label="Description of work" value={app.workDescription} />
                  <LongDetail label="Work samples / online presence" value={app.workSamples} />
                  <LongDetail label="Reason for applying" value={app.reasonForApplying} />
                  {app.additionalNotes && <LongDetail label="Additional notes" value={app.additionalNotes} />}

                  {/* Prior decision */}
                  {app.reviewDecision && (
                    <div className="rounded-lg p-3 text-sm space-y-1"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                      <p className="font-medium text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Prior decision</p>
                      <p style={{ color: 'hsl(var(--foreground))' }}>{app.reviewDecision}</p>
                      {app.reviewReason && <p style={{ color: 'hsl(var(--muted-foreground))' }}>{app.reviewReason}</p>}
                    </div>
                  )}

                  {/* Reference */}
                  <p className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Ref: {app.referenceId} · Submitted {new Date(app.submittedAt).toLocaleString()}
                  </p>

                  {/* Actions */}
                  {canAct && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button onClick={() => openAction(app, 'approve')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        style={{ background: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))', border: '1px solid hsl(var(--success) / 0.3)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => openAction(app, 'request_info')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        style={{ background: 'hsl(var(--info) / 0.15)', color: 'hsl(var(--info))', border: '1px solid hsl(var(--info) / 0.3)' }}>
                        <Clock className="w-3.5 h-3.5" /> Request more info
                      </button>
                      <button onClick={() => openAction(app, 'reject')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        style={{ background: 'hsl(var(--destructive) / 0.12)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button onClick={() => { setOffset(apps.length); load(false); }}
          className="mt-4 w-full text-sm py-2 rounded-xl transition-colors"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
          Load more
        </button>
      )}

      {/* Action modal */}
      {actionApp && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg" style={{ color: 'hsl(var(--foreground))' }}>
                {actionType === 'approve' ? 'Approve application' :
                 actionType === 'reject' ? 'Reject application' : 'Request more information'}
              </h3>
              <button onClick={closeAction} className="text-xs px-2 py-1 rounded"
                style={{ color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {actionType === 'approve'
                ? `Approving will grant @${actionApp.applicantUsername ?? actionApp.userId} the ${actionApp.requestedAccountType === 'organization' ? 'Organization' : 'Creator'} account type and matching badge. This cannot be undone from this panel.`
                : actionType === 'reject'
                ? 'Select a reason below. The applicant will receive an in-app notification with the message and their reapply date.'
                : 'Select a question below or write your own. The applicant will receive an in-app notification.'}
            </p>

            {/* Canned response chips */}
            {actionType === 'approve' && (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Quick responses</p>
                <div className="flex flex-wrap gap-2">
                  {APPROVE_CANNED.map(opt => (
                    <button key={opt.id} type="button"
                      onClick={() => { setSelectedCanned(opt.id); setActionReason(opt.text); }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: selectedCanned === opt.id ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--muted))',
                        color: selectedCanned === opt.id ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))',
                        border: `1px solid ${selectedCanned === opt.id ? 'hsl(var(--success) / 0.4)' : 'hsl(var(--border))'}`,
                        fontWeight: selectedCanned === opt.id ? 600 : 400,
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionType === 'reject' && (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Rejection reason <span style={{ color: 'hsl(var(--destructive))' }}>*</span></p>
                <div className="space-y-2">
                  {REJECT_CANNED.map(opt => (
                    <button key={opt.id} type="button"
                      onClick={() => { setSelectedCanned(opt.id); setActionReason(opt.text); setSelectedCooldown(opt.cooldownDays); }}
                      className="w-full text-left rounded-xl px-4 py-3 transition-all"
                      style={{
                        background: selectedCanned === opt.id ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--muted))',
                        border: `1px solid ${selectedCanned === opt.id ? 'hsl(var(--destructive) / 0.4)' : 'hsl(var(--border))'}`,
                      }}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{opt.label}</span>
                        <span className="text-xs flex-shrink-0 px-2 py-0.5 rounded-full"
                          style={{ background: 'hsl(var(--muted-foreground) / 0.15)', color: 'hsl(var(--muted-foreground))' }}>
                          Reapply in {opt.cooldownDays}d
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-snug" style={{ color: 'hsl(var(--muted-foreground))' }}>{opt.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionType === 'request_info' && (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Quick questions</p>
                <div className="flex flex-wrap gap-2">
                  {REQUEST_INFO_CANNED.map(opt => (
                    <button key={opt.id} type="button"
                      onClick={() => { setSelectedCanned(opt.id); setActionReason(opt.text); }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: selectedCanned === opt.id ? 'hsl(var(--info) / 0.15)' : 'hsl(var(--muted))',
                        color: selectedCanned === opt.id ? 'hsl(var(--info))' : 'hsl(var(--muted-foreground))',
                        border: `1px solid ${selectedCanned === opt.id ? 'hsl(var(--info) / 0.4)' : 'hsl(var(--border))'}`,
                        fontWeight: selectedCanned === opt.id ? 600 : 400,
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editable message */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {actionType === 'approve' ? 'Message to applicant (optional)' :
                 actionType === 'reject' ? 'Message to applicant — edit if needed' :
                 'Question for applicant — edit if needed'}
              </label>
              <textarea value={actionReason} onChange={e => { setActionReason(e.target.value); setSelectedCanned(null); }}
                rows={4} maxLength={500}
                placeholder={actionType === 'approve' ? 'e.g. Welcome to the Creator program!' :
                             actionType === 'reject' ? 'Select a reason above or write your own…' :
                             'Select a question above or write your own…'}
                className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              {actionType === 'reject' && selectedCooldown > 0 && (
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Reapply window: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{selectedCooldown} days</span> from rejection.
                </p>
              )}
            </div>

            {actionError && (
              <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{actionError}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={closeAction}
                className="text-sm px-4 py-2 rounded-lg"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                Cancel
              </button>
              <button onClick={submitAction}
                disabled={actionLoading || (actionType === 'reject' && !actionReason.trim())}
                className="text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                style={{
                  background: actionType === 'approve' ? 'hsl(var(--success))' :
                              actionType === 'reject' ? 'hsl(var(--destructive))' : 'hsl(var(--info))',
                  color: 'hsl(var(--foreground))',
                }}>
                {actionLoading ? 'Saving…' :
                 actionType === 'approve' ? 'Approve' :
                 actionType === 'reject' ? 'Reject' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="text-sm flex items-center gap-1 hover:underline"
          style={{ color: 'hsl(var(--primary))' }}>
          {value} <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <p className="text-sm break-all" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
      )}
    </div>
  );
}

function LongDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
    </div>
  );
}

// ── Tab: Badges ───────────────────────────────────────────────────────────────

function BadgesTab() {
  const [userId, setUserId] = useState('');
  const [badgeSlug, setBadgeSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const award = async () => {
    if (!userId.trim() || !badgeSlug.trim()) return;
    setLoading(true);
    const r = await fetch('/api/admin/community/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId.trim(), badgeSlug: badgeSlug.trim() }),
    });
    const d = await r.json() as { message?: string; error?: string };
    setIsError(!r.ok);
    setMsg(d.message ?? d.error ?? (r.ok ? admin_community.badges.successMsg : 'Error'));
    setTimeout(() => setMsg(''), 3000);
    if (r.ok) { setUserId(''); setBadgeSlug(''); }
    setLoading(false);
  };

  const BADGE_SLUGS = admin_community.badges.availableBadges.split(', ');

  return (
    <div className="max-w-md">
      <p className="text-xs text-muted-foreground mb-4">{admin_community.badges.availableBadges}</p>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">{admin_community.badges.userIdLabel}</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="user-uuid or username"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">{admin_community.badges.badgeSlugLabel}</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {BADGE_SLUGS.map((slug) => (
              <button
                key={slug}
                onClick={() => setBadgeSlug(slug)}
                className="text-[10px] px-2 py-0.5 rounded-full border transition-colors"
                style={{
                  borderColor: badgeSlug === slug ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  background: badgeSlug === slug ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                  color: badgeSlug === slug ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}
              >
                {slug}
              </button>
            ))}
          </div>
          <input
            value={badgeSlug}
            onChange={(e) => setBadgeSlug(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="or type a badge slug"
          />
        </div>

        {msg && (
          <p className={`text-xs ${isError ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>{msg}</p>
        )}

        <Button
          className="bg-primary text-primary-foreground w-full gap-2"
          disabled={loading || !userId.trim() || !badgeSlug.trim()}
          onClick={award}
        >
          <Award className="w-4 h-4" />{admin_community.badges.awardBtn}
        </Button>
      </div>
    </div>
  );
}

// ── Tab: Mod Log ──────────────────────────────────────────────────────────────

function ModLogTab() {
  const [actions, setActions] = useState<ModAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/community/mod-log')
      .then((r) => r.ok ? r.json() : [])
      .then((d: ModAction[]) => setActions(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : actions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{admin_community.modLog.emptyState}</p>
      ) : (
        <div className="space-y-1.5">
          {actions.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-start gap-3">
              <ScrollText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{a.modName ?? a.modUsername ?? 'Admin'}</span>
                  {' '}<span className="text-primary font-medium">{a.action}</span>
                  {' '}{admin_community.modLog.targetLabel.toLowerCase()} <span className="font-medium">{a.targetType} #{a.targetId}</span>
                </p>
                {a.reason && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{a.reason}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{ago(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Announcements ────────────────────────────────────────────────────────

function AnnouncementsTab() {
  const [cats, setCats] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/community/categories')
      .then((r) => r.ok ? r.json() : [])
      .then((d: Category[]) => setCats(d.filter((c) => c.isActive)))
      .catch(() => {});
  }, []);

  const post = async () => {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    const r = await fetch('/api/admin/community/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), categorySlug: categorySlug || undefined }),
    });
    const d = await r.json() as { ok?: boolean; postId?: number; error?: string };
    setIsError(!r.ok);
    setMsg(r.ok ? `${admin_community.announcements.successMsg} (post #${d.postId})` : (d.error ?? 'Error'));
    setTimeout(() => setMsg(''), 4000);
    if (r.ok) { setTitle(''); setBody(''); setCategorySlug(''); }
    setLoading(false);
  };

  return (
    <div className="max-w-lg">
      <p className="text-xs text-muted-foreground mb-4">{admin_community.announcements.note}</p>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">{admin_community.announcements.titleLabel}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Announcement title…"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">{admin_community.announcements.bodyLabel}</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            placeholder="Write your announcement…"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">{admin_community.announcements.categoryLabel}</label>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All categories (General)</option>
            {cats.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {msg && (
          <p className={`text-xs ${isError ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>{msg}</p>
        )}

        <Button
          className="bg-primary text-primary-foreground w-full gap-2"
          disabled={loading || !title.trim() || !body.trim()}
          onClick={post}
        >
          <Megaphone className="w-4 h-4" />{admin_community.announcements.postBtn}
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'reports',       label: admin_community.tabs.reports,       icon: <Flag className="w-3.5 h-3.5" /> },
  { id: 'posts',         label: admin_community.tabs.posts,         icon: <Pin className="w-3.5 h-3.5" /> },
  { id: 'categories',    label: admin_community.tabs.categories,    icon: <Tag className="w-3.5 h-3.5" /> },
  { id: 'badges',        label: admin_community.tabs.badges,        icon: <Award className="w-3.5 h-3.5" /> },
  { id: 'modLog',        label: admin_community.tabs.modLog,        icon: <ScrollText className="w-3.5 h-3.5" /> },
  { id: 'announcements', label: admin_community.tabs.announcements, icon: <Megaphone className="w-3.5 h-3.5" /> },
  { id: 'applications',  label: 'Applications',                     icon: <FileText className="w-3.5 h-3.5" /> },
];

export default function AdminCommunityPage() {
  const { session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>('reports');

  if (isPending) return null;

  const platformRole = (session?.user as { platformRole?: string })?.platformRole ?? 'member';
  const hasAdminAccess = ['owner', 'admin', 'moderator'].includes(platformRole);
  if (!session || !hasAdminAccess) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Admin access required.</p>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{admin_community.pageTitle} — Spellful</title>
        <meta name="description" content="Spellful community moderation: reports, post controls, categories, badges, mod log, and announcements." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-[hsl(var(--card-deep))]">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-2xl text-foreground">{admin_community.pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/admin/spells" className="hover:text-foreground transition-colors">Spell Admin</Link>
              <span>·</span>
              <span className="text-primary">Community Admin</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 mb-6 border-b border-border pb-3">
            {TAB_CONFIG.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: tab === id ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                  color: tab === id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  fontWeight: tab === id ? 600 : 400,
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'reports'       && <ReportsTab />}
            {tab === 'posts'         && <PostsTab />}
            {tab === 'categories'    && <CategoriesTab />}
            {tab === 'badges'        && <BadgesTab />}
            {tab === 'modLog'        && <ModLogTab />}
            {tab === 'announcements' && <AnnouncementsTab />}
            {tab === 'applications'  && <ApplicationsTab />}
          </motion.div>
        </div>
      </main>
    </>
  );
}
