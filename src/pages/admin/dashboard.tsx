/**
 * /admin/dashboard — Community Management Inbox
 * Unified moderation inbox: applications, reports, bug reports, and site stats.
 * Requires admin or owner platformRole.
 */
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, Navigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, FileText, AlertTriangle, Bug, Users, RefreshCw,
  ChevronRight, X, CheckCircle2, XCircle, MessageSquare,
  Clock, TrendingUp, Filter, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/auth/auth-client';
import { formatDistanceToNow } from 'date-fns';
import { admin_dashboard } from 'virtual:content';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  pendingApplications: number;
  openReports: number;
  newBugReports: number;
  registrationByProvider?: Array<{ provider: string; n: number }>;
  registrationBySource?: Array<{ source: string; n: number }>;
  topSharedPosts?: Array<{ id: number; title: string; shareCount: number; authorUsername: string | null }>;
  contentShareTotals?: Array<{ type: string; total: number }>;
}

interface ApplicationItem {
  _type: 'application';
  id: number;
  referenceId: string;
  creatorName: string;
  status: string;
  requestedAccountType: string;
  creatorCategory: string;
  workDescription: string;
  contactEmail: string;
  submittedAt: string | null;
  applicantId: string | null;
  applicantUsername: string | null;
  applicantImage: string | null;
}

interface ReportItem {
  _type: 'report';
  id: number;
  targetType: string;
  targetId: number;
  targetStringId: string | null;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string | null;
  reporterName: string | null;
  reporterUsername: string | null;
  targetLabel: string;
}

interface BugItem {
  _type: 'bug';
  id: number;
  title: string;
  description: string;
  pageUrl: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string | null;
  reporterName: string | null;
  reporterUsername: string | null;
}

type InboxItem = ApplicationItem | ReportItem | BugItem;

interface InboxResponse {
  stats: Stats;
  items: InboxItem[];
}

type Category = 'all' | 'applications' | 'reports' | 'bugs';
type SortOrder = 'desc' | 'asc';

// ── Helpers ────────────────────────────────────────────────────────────────────

function ago(ts: string | null | undefined) {
  if (!ts) return '—';
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); }
  catch { return '—'; }
}

function itemTimestamp(item: InboxItem): string | null {
  if (item._type === 'application') return item.submittedAt;
  return item.createdAt;
}

function itemStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending_review: 'bg-warning/15 text-warning border-warning/30',
    info_requested: 'bg-info/15 text-info border-info/30',
    approved: 'bg-success/15 text-success border-success/30',
    rejected: 'bg-destructive/15 text-destructive border-destructive/30',
    pending: 'bg-warning/15 text-warning border-warning/30',
    resolved: 'bg-success/15 text-success border-success/30',
    dismissed: 'bg-muted text-muted-foreground border-border',
    new: 'bg-info/15 text-info border-info/30',
    in_progress: 'bg-primary/15 text-primary border-primary/30',
    withdrawn: 'bg-muted text-muted-foreground border-border',
  };
  return map[status] ?? 'bg-muted text-muted-foreground border-border';
}

function itemStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_review: 'Pending Review',
    info_requested: 'Info Requested',
    approved: 'Approved',
    rejected: 'Declined',
    pending: 'Pending',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
    new: 'New',
    in_progress: 'In Progress',
    withdrawn: 'Withdrawn',
  };
  return map[status] ?? status;
}

function itemTypeIcon(item: InboxItem) {
  if (item._type === 'application') return <FileText className="w-4 h-4" style={{ color: 'hsl(var(--warning))' }} />;
  if (item._type === 'report') return <AlertTriangle className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />;
  return <Bug className="w-4 h-4" style={{ color: 'hsl(var(--info))' }} />;
}

function itemTypeLabel(item: InboxItem): string {
  if (item._type === 'application') return 'Application';
  if (item._type === 'report') return `Report · ${item.targetType}`;
  return 'Bug Report';
}

function itemTitle(item: InboxItem): string {
  if (item._type === 'application') return item.creatorName;
  if (item._type === 'report') return item.targetLabel || `${item.targetType} report`;
  return item.title;
}

function itemSubtitle(item: InboxItem): string {
  if (item._type === 'application') return item.creatorCategory;
  if (item._type === 'report') return item.reason;
  return (item.description ?? '').slice(0, 120);
}

function itemReporter(item: InboxItem): string | null {
  if (item._type === 'application') return item.applicantUsername ? `@${item.applicantUsername}` : null;
  return item.reporterUsername ? `@${item.reporterUsername}` : (item.reporterName ?? null);
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, colorClass, onClick, active,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  colorClass: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        active
          ? 'border-primary/60 bg-primary/10'
          : 'border-border bg-card hover:border-primary/30 hover:bg-card/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground leading-none mb-0.5">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
      </div>
    </button>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  item,
  onClose,
  onAction,
}: {
  item: InboxItem;
  onClose: () => void;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [bugNote, setBugNote] = useState(item._type === 'bug' ? (item.adminNote ?? '') : '');

  async function doAction(action: string) {
    setError('');
    setLoading(true);
    try {
      let url = '';
      let body: Record<string, unknown> = {};

      if (item._type === 'application') {
        url = `/api/admin/applications/${item.id}`;
        body = { action, reason };
      } else if (item._type === 'report') {
        url = `/api/admin/community/reports/${item.id}`;
        body = { status: action, reason };
      } else {
        url = `/api/admin/bug-reports/${item.id}`;
        body = { status: action, adminNote: bugNote };
      }

      const r = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `${r.status}`);
      }
      onAction();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' as const }}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 z-10 bg-card">
          <div className="flex items-center gap-2">
            {itemTypeIcon(item)}
            <span className="text-sm font-medium text-muted-foreground">{itemTypeLabel(item)}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground leading-snug" style={{ fontFamily: 'var(--font-heading)' }}>
              {itemTitle(item)}
            </h2>
            <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${itemStatusColor(item.status)}`}>
              {itemStatusLabel(item.status)}
            </span>
          </div>

          {/* Meta */}
          <div className="text-xs text-muted-foreground space-y-1">
            {itemReporter(item) && <p>Submitted by <span className="text-foreground">{itemReporter(item)}</span></p>}
            <p>Received {ago(itemTimestamp(item))}</p>
            {item._type === 'application' && <p>Contact: <span className="text-foreground">{item.contactEmail}</span></p>}
            {item._type === 'report' && item.details && <p className="text-foreground/80">{item.details}</p>}
            {item._type === 'bug' && item.pageUrl && (
              <p>Page: <span className="text-foreground break-all">{item.pageUrl}</span></p>
            )}
          </div>

          {/* Description */}
          <div className="rounded-xl bg-muted p-3 text-sm text-foreground/80 leading-relaxed">
            {item._type === 'application' ? item.workDescription : item._type === 'bug' ? item.description : item.reason}
          </div>

          {/* Application extra links */}
          {item._type === 'application' && (
            <Link to="/admin/applications" className="text-xs text-primary hover:underline flex items-center gap-1">
              View full application <ChevronRight className="w-3 h-3" />
            </Link>
          )}

          {/* Bug admin note */}
          {item._type === 'bug' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Admin note (internal)</label>
              <textarea
                value={bugNote}
                onChange={(e) => setBugNote(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-muted text-sm text-foreground px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Internal note…"
              />
            </div>
          )}

          {/* Reason field for applications/reports */}
          {(item._type === 'application' || item._type === 'report') && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {item._type === 'application' ? 'Reason / message to applicant' : 'Reason (optional)'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-muted text-sm text-foreground px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Add a note…"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          {(item.status === 'pending_review' || item.status === 'info_requested') ? (
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" disabled={loading} onClick={() => doAction('approve')}
                className="flex-1 min-w-[100px] bg-success text-success-foreground hover:bg-success/90">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" disabled={loading} onClick={() => doAction('request_info')}
                className="flex-1 min-w-[100px] border-info/40 text-info hover:bg-info/10">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Request Info
              </Button>
              <Button size="sm" variant="outline" disabled={loading} onClick={() => doAction('reject')}
                className="flex-1 min-w-[100px] border-destructive/40 text-destructive hover:bg-destructive/10">
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
              </Button>
            </div>
          ) : (item.status === 'pending' && item._type === 'report') ? (
            <div className="flex gap-2">
              <Button size="sm" disabled={loading} onClick={() => doAction('resolved')}
                className="flex-1 bg-success text-success-foreground hover:bg-success/90">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Resolve
              </Button>
              <Button size="sm" variant="outline" disabled={loading} onClick={() => doAction('dismissed')}
                className="flex-1 border-muted-foreground/30 text-muted-foreground hover:bg-muted">
                Dismiss
              </Button>
            </div>
          ) : (item._type === 'bug' && item.status !== 'resolved') ? (
            <div className="flex gap-2 flex-wrap">
              {item.status === 'new' && (
                <Button size="sm" variant="outline" disabled={loading} onClick={() => doAction('in_progress')}
                  className="flex-1 border-primary/40 text-primary hover:bg-primary/10">
                  <Clock className="w-3.5 h-3.5 mr-1.5" /> Mark In Progress
                </Button>
              )}
              <Button size="sm" disabled={loading} onClick={() => doAction('resolved')}
                className="flex-1 bg-success text-success-foreground hover:bg-success/90">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark Resolved
              </Button>
              {bugNote !== (item.adminNote ?? '') && (
                <Button size="sm" variant="outline" disabled={loading} onClick={() => doAction(item.status)}
                  className="flex-1 border-border">
                  Save Note
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-1">No actions available for this status.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Inbox Row ─────────────────────────────────────────────────────────────────

function InboxRow({ item, onClick }: { item: InboxItem; onClick: () => void }) {
  const isUnread = ['pending_review', 'info_requested', 'pending', 'new'].includes(item.status);
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-border/50 hover:bg-muted/40 transition-colors group"
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex-shrink-0">
        {isUnread
          ? <div className="w-2 h-2 rounded-full bg-primary" />
          : <div className="w-2 h-2 rounded-full" />}
      </div>

      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">{itemTypeIcon(item)}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-foreground truncate">{itemTitle(item)}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 ${itemStatusColor(item.status)}`}>
            {itemStatusLabel(item.status)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{itemSubtitle(item)}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground/60">{itemTypeLabel(item)}</span>
          {itemReporter(item) && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground/60">{itemReporter(item)}</span>
            </>
          )}
          <span className="text-muted-foreground/40">·</span>
          <span className="text-xs text-muted-foreground/60">{ago(itemTimestamp(item))}</span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-1 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { session, isPending } = useSession();
  const [data, setData] = useState<InboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [sort, setSort] = useState<SortOrder>('desc');
  const [selected, setSelected] = useState<InboxItem | null>(null);

  const platformRole = (session?.user as { platformRole?: string } | undefined)?.platformRole ?? 'member';
  const isAdmin = ['admin', 'owner'].includes(platformRole);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ category, sort });
    fetch(`/api/admin/inbox?${params}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<InboxResponse>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e: Error) => { setError(`Failed to load: ${e.message}`); setLoading(false); });
  }, [category, sort]);

  useEffect(() => {
    if (!isPending && isAdmin) load();
    else if (!isPending) setLoading(false);
  }, [isPending, isAdmin, load]);

  if (!isPending && !isAdmin) return <Navigate to="/account" replace />;

  const stats = data?.stats;
  const items = data?.items ?? [];

  const CATEGORIES: { id: Category; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: stats ? stats.pendingApplications + stats.openReports + stats.newBugReports : undefined },
    { id: 'applications', label: 'Applications', count: stats?.pendingApplications },
    { id: 'reports', label: 'Reports', count: stats?.openReports },
    { id: 'bugs', label: 'Bug Reports', count: stats?.newBugReports },
  ];

  return (
    <>
      <Helmet>
        <title>{admin_dashboard.meta.title}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={admin_dashboard.meta.description} />
      </Helmet>

      <main className="min-h-screen pb-16">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-border bg-background px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/15">
              <Shield className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                Admin Inbox
              </h1>
              <p className="text-xs text-muted-foreground">Community management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/roles">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5 mr-1" /> Roles
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}
              className="text-muted-foreground">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={load} className="text-destructive hover:bg-destructive/10 flex-shrink-0">
                Retry
              </Button>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))
            ) : (
              <>
                <StatCard
                  icon={<Users className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />}
                  label="Total Members"
                  value={stats?.totalUsers ?? '—'}
                  sub={`+${stats?.newUsersMonth ?? 0} this month`}
                  colorClass="bg-accent/15"
                />
                <StatCard
                  icon={<FileText className="w-4 h-4" style={{ color: 'hsl(var(--warning))' }} />}
                  label="Pending Applications"
                  value={stats?.pendingApplications ?? '—'}
                  colorClass="bg-warning/15"
                  onClick={() => setCategory('applications')}
                  active={category === 'applications'}
                />
                <StatCard
                  icon={<AlertTriangle className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />}
                  label="Open Reports"
                  value={stats?.openReports ?? '—'}
                  colorClass="bg-destructive/15"
                  onClick={() => setCategory('reports')}
                  active={category === 'reports'}
                />
                <StatCard
                  icon={<Bug className="w-4 h-4" style={{ color: 'hsl(var(--info))' }} />}
                  label="New Bug Reports"
                  value={stats?.newBugReports ?? '—'}
                  colorClass="bg-info/15"
                  onClick={() => setCategory('bugs')}
                  active={category === 'bugs'}
                />
              </>
            )}
          </div>

          {/* User growth strip */}
          {!loading && stats && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                <span className="text-xs font-medium text-foreground">New members</span>
              </div>
              {[
                { label: 'Today', value: stats.newUsersToday },
                { label: '7 days', value: stats.newUsersWeek },
                { label: '30 days', value: stats.newUsersMonth },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">{value}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Registration breakdown — how they joined */}
          {!loading && stats && ((stats.registrationByProvider?.length ?? 0) > 0 || (stats.registrationBySource?.length ?? 0) > 0) && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
                <span className="text-xs font-semibold text-foreground">How members joined</span>
              </div>

              {/* Auth provider breakdown */}
              {(stats.registrationByProvider?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sign-up method</p>
                  <div className="flex flex-wrap gap-2">
                    {(stats.registrationByProvider ?? []).map(({ provider, n }) => {
                      const label = provider === 'credential' ? 'Email / Password'
                        : provider === 'google' ? 'Google'
                        : provider === 'apple' ? 'Apple'
                        : provider;
                      const icon = provider === 'google' ? '🔵' : provider === 'apple' ? '🍎' : '✉️';
                      return (
                        <div key={provider} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5">
                          <span className="text-sm">{icon}</span>
                          <span className="text-xs text-foreground font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground ml-1">{n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Signup source breakdown */}
              {(stats.registrationBySource?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Discovery source (self-reported)</p>
                  <div className="space-y-1.5">
                    {(stats.registrationBySource ?? [])
                      .sort((a, b) => b.n - a.n)
                      .map(({ source, n }) => {
                        const total = (stats.registrationBySource ?? []).reduce((s, x) => s + x.n, 0);
                        const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                        const label = source === 'apple_app_store' ? 'App Store'
                          : source === 'google_play_store' ? 'Google Play'
                          : source === 'x_twitter' ? 'X / Twitter'
                          : source === 'friend_referral' ? 'Friend referral'
                          : source === 'google_search' ? 'Google Search'
                          : source === 'blog_article' ? 'Blog / Article'
                          : source.charAt(0).toUpperCase() + source.slice(1).replace(/_/g, ' ');
                        return (
                          <div key={source} className="flex items-center gap-2">
                            <span className="text-xs text-foreground w-28 truncate flex-shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: 'hsl(var(--primary))' }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">{n}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content share totals — tarot, horoscope, birth chart, community */}
          {!loading && stats && (stats.contentShareTotals?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--secondary))' }} />
                <span className="text-xs font-semibold text-foreground">Content shared externally</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(stats.contentShareTotals ?? []).map(({ type, total }) => (
                  <div key={type} className="rounded-lg border border-border bg-muted px-3 py-2">
                    <p className="text-lg font-bold text-foreground">{total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top shared community posts */}
          {!loading && stats && (stats.topSharedPosts?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" style={{ color: 'hsl(var(--secondary))' }} />
                <span className="text-xs font-semibold text-foreground">Most shared community posts</span>
              </div>
              <div className="space-y-2">
                {(stats.topSharedPosts ?? []).map(({ id, title, shareCount, authorUsername }) => (
                  <div key={id} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
                    <div className="min-w-0">
                      <Link
                        to={`/community/post/${id}`}
                        className="text-xs text-foreground hover:text-primary transition-colors truncate block"
                      >
                        {title}
                      </Link>
                      {authorUsername && (
                        <span className="text-xs text-muted-foreground">@{authorUsername}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{shareCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inbox */}
          <Card className="bg-card border-border overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-wrap">
              {/* Category tabs */}
              <div className="flex items-center gap-1 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      category === cat.id
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Filter className="w-3 h-3" />
                    {cat.label}
                    {cat.count !== undefined && cat.count > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 min-w-[1rem]">
                        {cat.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <button
                onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sort === 'desc' ? 'Newest first' : 'Oldest first'}
              </button>
            </div>

            {/* Items */}
            {loading ? (
              <div className="divide-y divide-border/50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3.5 flex items-start gap-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-1.5" />
                    <Skeleton className="w-4 h-4 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20 text-success" />
                <p className="text-sm text-muted-foreground">All clear — nothing needs attention here.</p>
              </div>
            ) : (
              <div>
                {items.map((item) => (
                  <InboxRow
                    key={`${item._type}-${item.id}`}
                    item={item}
                    onClick={() => setSelected(item)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Quick nav */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { to: '/admin/applications', label: 'Applications', icon: <FileText className="w-3.5 h-3.5" /> },
              { to: '/admin/community', label: 'Community', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
              { to: '/admin/roles', label: 'User Roles', icon: <Users className="w-3.5 h-3.5" /> },
              { to: '/admin/spells', label: 'Spells', icon: <Shield className="w-3.5 h-3.5" /> },
            ].map((navItem) => (
              <Link key={navItem.to} to={navItem.to}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-xs font-medium text-muted-foreground hover:text-foreground">
                <span style={{ color: 'hsl(var(--primary))' }}>{navItem.icon}</span>
                {navItem.label}
                <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <DetailDrawer
            item={selected}
            onClose={() => setSelected(null)}
            onAction={load}
          />
        )}
      </AnimatePresence>
    </>
  );
}
