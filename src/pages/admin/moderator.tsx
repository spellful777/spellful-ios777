/**
 * /admin/moderator — Moderator Console
 * Shows the signed-in moderator's assigned forums and a scoped report queue.
 * Visible to moderator+ roles.
 */
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Navigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Shield, AlertTriangle, RefreshCw, Check, X, ChevronUp, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth/auth-client';
import { admin_moderator } from 'virtual:content';
import { formatDistanceToNow } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Report {
  id: number;
  targetType: string;
  targetId: number;
  targetStringId: string | null;
  reason: string;
  status: string;
  createdAt: string;
  details: string | null;
  categorySlug: string | null;
}

interface QueueResponse {
  reports: Report[];
  hasMore: boolean;
  assignedForums: string[] | 'all';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ago(ts: string) {
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ModeratorConsolePage() {
  const { session, isPending } = useSession();

  const platformRole = (session?.user as { platformRole?: string } | undefined)?.platformRole ?? 'member';
  const canModerate = ['moderator', 'admin', 'owner'].includes(platformRole);

  const [statusFilter, setStatusFilter] = useState('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [assignedForums, setAssignedForums] = useState<string[] | 'all'>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [reason, setReason] = useState('');
  const [confirmAction, setConfirmAction] = useState<'resolved' | 'dismissed' | 'escalate' | null>(null);

  const load = useCallback((status: string) => {
    setLoading(true);
    setError('');
    fetch(`/api/admin/moderator/queue?status=${status}&limit=25`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<QueueResponse>;
      })
      .then((d) => {
        setReports(d.reports);
        setHasMore(d.hasMore);
        setAssignedForums(d.assignedForums);
        setLoading(false);
      })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!isPending && canModerate) load(statusFilter);
    else if (!isPending) setLoading(false);
  }, [isPending, canModerate, statusFilter, load]);

  async function submitAction(action: 'resolved' | 'dismissed' | 'escalate') {
    if (!selected) return;
    if (!reason.trim() && action !== 'dismissed') {
      setActionMsg('Please provide a reason.');
      return;
    }
    setActionLoading(true);
    setActionMsg('');
    try {
      const status = action === 'escalate' ? 'pending' : action;
      const r = await fetch(`/api/admin/community/reports/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, reason: reason.trim(), escalated: action === 'escalate' }),
      });
      if (!r.ok) {
        const d = await r.json() as { error?: string };
        throw new Error(d.error ?? `${r.status}`);
      }
      setActionMsg(
        action === 'resolved' ? 'Report resolved.' :
        action === 'dismissed' ? 'Report dismissed.' :
        'Escalated to platform admin.'
      );
      setConfirmAction(null);
      setReason('');
      setTimeout(() => {
        setSelected(null);
        setActionMsg('');
        load(statusFilter);
      }, 1500);
    } catch (e) {
      setActionMsg((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  if (!isPending && !canModerate) return <Navigate to="/account" replace />;

  return (
    <>
      <Helmet>
        <title>{admin_moderator.meta.title}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={admin_moderator.meta.description} />
      </Helmet>

      <main className="min-h-screen py-8 px-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(var(--accent) / 0.15)' }}>
            <Shield className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Moderator Console
            </h1>
            <p className="text-sm text-muted-foreground">
              {assignedForums === 'all'
                ? 'All forums (admin view)'
                : assignedForums.length === 0
                  ? 'No forum assignments'
                  : `Assigned: ${assignedForums.join(', ')}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => load(statusFilter)} disabled={loading}
            className="ml-auto text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'resolved', 'dismissed'] as const).map((s) => (
            <button key={s}
              onClick={() => { setStatusFilter(s); setSelected(null); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors"
              style={{
                borderColor: statusFilter === s ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                background: statusFilter === s ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                color: statusFilter === s ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}>
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* No assignments notice */}
        {!loading && assignedForums !== 'all' && assignedForums.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Shield className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-base font-medium text-foreground mb-1">No forum assignments</p>
            <p className="text-sm text-muted-foreground">
              You have not been assigned to moderate any forums yet. Contact a platform admin.
            </p>
          </div>
        )}

        {/* Report list */}
        {(assignedForums === 'all' || (assignedForums as string[]).length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Check className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No reports with this status</p>
                </div>
              ) : (
                reports.map((r) => (
                  <motion.button key={r.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => { setSelected(r); setConfirmAction(null); setReason(''); setActionMsg(''); }}
                    className="w-full text-left p-3 rounded-xl border transition-colors"
                    style={{
                      borderColor: selected?.id === r.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      background: selected?.id === r.id ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--card))',
                    }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--warning))' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize">{r.targetType} report</p>
                        <p className="text-xs text-muted-foreground truncate">{r.reason}</p>
                        {r.categorySlug && (
                          <p className="text-xs text-muted-foreground">Forum: {r.categorySlug}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{ago(r.createdAt)}</p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-3">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-border bg-card text-center">
                  <AlertTriangle className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Select a report to review</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground capitalize mb-1">
                      {selected.targetType} Report #{selected.id}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Target ID: {selected.targetId || selected.targetStringId} · {ago(selected.createdAt)}
                    </p>
                    {selected.categorySlug && (
                      <p className="text-xs text-muted-foreground">Forum: {selected.categorySlug}</p>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
                      <p className="text-sm text-foreground">{selected.reason}</p>
                    </div>
                    {selected.details && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Details</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selected.details}</p>
                      </div>
                    )}
                  </div>

                  {selected.status === 'pending' && (
                    <div className="p-5 border-t border-border space-y-3">
                      {actionMsg && (
                        <p className={`text-sm ${actionMsg.includes('.') && !actionMsg.includes('Please') ? 'text-success' : 'text-destructive'}`}>
                          {actionMsg}
                        </p>
                      )}
                      {!confirmAction ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => setConfirmAction('resolved')}
                            className="bg-success/15 text-success hover:bg-success/25 border border-success/30">
                            <Check className="w-3.5 h-3.5 mr-1.5" /> Resolve
                          </Button>
                          <Button size="sm" onClick={() => setConfirmAction('dismissed')}
                            className="bg-muted text-muted-foreground hover:bg-muted/80 border border-border">
                            <X className="w-3.5 h-3.5 mr-1.5" /> Dismiss
                          </Button>
                          <Button size="sm" onClick={() => setConfirmAction('escalate')}
                            className="bg-warning/15 text-warning hover:bg-warning/25 border border-warning/30">
                            <ChevronUp className="w-3.5 h-3.5 mr-1.5" /> Escalate
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground">
                            {confirmAction === 'resolved' ? 'Mark as resolved?' :
                             confirmAction === 'dismissed' ? 'Dismiss this report?' :
                             'Escalate to platform admin?'}
                          </p>
                          <Textarea
                            placeholder={confirmAction === 'dismissed' ? 'Optional note…' : 'Reason (required)…'}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-muted border-border text-sm resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" disabled={actionLoading}
                              onClick={() => submitAction(confirmAction)}
                              className="bg-primary text-primary-foreground">
                              {actionLoading ? 'Saving…' : 'Confirm'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setConfirmAction(null); setReason(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
