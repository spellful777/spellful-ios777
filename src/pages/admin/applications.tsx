/**
 * /admin/applications — Application Review Console
 * Full reviewer UI for creator/organization applications.
 * Visible to moderator+ roles.
 */
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Navigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Check, X, MessageSquare, ChevronLeft, ChevronRight,
  RefreshCw, ExternalLink, Clock, User, Wand2, Globe, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth/auth-client';
import { admin_applications } from 'virtual:content';
import { formatDistanceToNow } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

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
  submittedAt: string;
  updatedAt: string;
  applicantUsername: string | null;
  applicantName: string | null;
  applicantImage: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ago(ts: string) {
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  pending_review: { bg: 'hsl(var(--warning) / 0.15)', text: 'hsl(var(--warning))', label: 'Pending Review' },
  info_requested: { bg: 'hsl(var(--info) / 0.15)', text: 'hsl(var(--info))', label: 'Info Requested' },
  approved: { bg: 'hsl(var(--success) / 0.15)', text: 'hsl(var(--success))', label: 'Approved' },
  rejected: { bg: 'hsl(var(--destructive) / 0.15)', text: 'hsl(var(--destructive))', label: 'Declined' },
  withdrawn: { bg: 'hsl(var(--muted-foreground) / 0.15)', text: 'hsl(var(--muted-foreground))', label: 'Withdrawn' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: status };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminApplicationsPage() {
  const { session, isPending } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const platformRole = (session?.user as { platformRole?: string } | undefined)?.platformRole ?? 'member';
  const canReview = ['moderator', 'admin', 'owner'].includes(platformRole);

  const [apps, setApps] = useState<Application[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [reason, setReason] = useState('');
  const [confirmAction, setConfirmAction] = useState<'approved' | 'rejected' | 'info_requested' | null>(null);

  const load = useCallback((status: string, off: number) => {
    setLoading(true);
    setError('');
    fetch(`/api/admin/applications?status=${status}&limit=${LIMIT}&offset=${off}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<{ applications: Application[]; hasMore: boolean }>;
      })
      .then((d) => {
        setApps(d.applications);
        setHasMore(d.hasMore);
        setLoading(false);
      })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!isPending && canReview) {
      const idParam = searchParams.get('id');
      load(statusFilter, offset);
      if (idParam) {
        // Pre-select application from URL param
        fetch(`/api/admin/applications?limit=1&offset=0`, { credentials: 'include' })
          .then((r) => r.json() as Promise<{ applications: Application[] }>)
          .then((d) => {
            const found = d.applications.find((a) => a.id === parseInt(idParam, 10));
            if (found) setSelected(found);
          })
          .catch(() => {});
      }
    } else if (!isPending) {
      setLoading(false);
    }
  }, [isPending, canReview, statusFilter, offset, load, searchParams]);

  async function submitDecision(decision: 'approved' | 'rejected' | 'info_requested') {
    if (!selected) return;
    if (!reason.trim() && decision !== 'approved') {
      setActionMsg('Please provide a reason.');
      return;
    }
    setActionLoading(true);
    setActionMsg('');
    try {
      const r = await fetch(`/api/admin/applications/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: decision, reason: reason.trim() }),
      });
      if (!r.ok) {
        const d = await r.json() as { error?: string };
        throw new Error(d.error ?? `${r.status}`);
      }
      setActionMsg(
        decision === 'approved' ? 'Application approved.' :
        decision === 'rejected' ? 'Application declined.' :
        'More information requested.'
      );
      setConfirmAction(null);
      setReason('');
      // Refresh list and deselect
      setTimeout(() => {
        setSelected(null);
        setActionMsg('');
        load(statusFilter, offset);
      }, 1500);
    } catch (e) {
      setActionMsg((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  if (!isPending && !canReview) return <Navigate to="/account" replace />;

  const STATUSES = [
    { value: 'pending_review', label: 'Pending' },
    { value: 'info_requested', label: 'Info Needed' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Declined' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ];

  return (
    <>
      <Helmet>
        <title>{admin_applications.meta.title}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={admin_applications.meta.description} />
      </Helmet>

      <main className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.15)' }}>
            <FileText className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Application Review
            </h1>
            <p className="text-sm text-muted-foreground">Creator and organization applications</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => load(statusFilter, offset)} disabled={loading}
            className="ml-auto text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map((s) => (
            <button key={s.value}
              onClick={() => { setStatusFilter(s.value); setOffset(0); setSelected(null); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{
                borderColor: statusFilter === s.value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                background: statusFilter === s.value ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                color: statusFilter === s.value ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Application list */}
          <div className="lg:col-span-2 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
            ) : apps.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Check className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No applications with this status</p>
              </div>
            ) : (
              apps.map((app) => (
                <motion.button key={app.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  onClick={() => { setSelected(app); setConfirmAction(null); setReason(''); setActionMsg(''); setSearchParams({}); }}
                  className="w-full text-left p-3 rounded-xl border transition-colors"
                  style={{
                    borderColor: selected?.id === app.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    background: selected?.id === app.id ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--card))',
                  }}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                      {app.applicantImage
                        ? <img src={app.applicantImage} alt="" className="w-full h-full object-cover" />
                        : <User className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{app.creatorName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{app.applicantUsername ?? 'unknown'} · {app.requestedAccountType}
                      </p>
                      <p className="text-xs text-muted-foreground">{ago(app.submittedAt)}</p>
                    </div>
                    <StatusPill status={app.status} />
                  </div>
                </motion.button>
              ))
            )}

            {/* Pagination */}
            {(offset > 0 || hasMore) && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={!hasMore}
                  onClick={() => setOffset(offset + LIMIT)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 rounded-xl border border-border bg-card text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Select an application to review</p>
                </motion.div>
              ) : (
                <motion.div key={selected.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-xl border border-border bg-card overflow-hidden">

                  {/* App header */}
                  <div className="p-5 border-b border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                        {selected.applicantImage
                          ? <img src={selected.applicantImage} alt="" className="w-full h-full object-cover" />
                          : <User className="w-5 h-5 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-semibold text-foreground">{selected.creatorName}</h2>
                          <StatusPill status={selected.status} />
                          <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground capitalize">
                            {selected.requestedAccountType}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          @{selected.applicantUsername ?? 'unknown'} · Ref: {selected.referenceId}
                        </p>
                        <p className="text-xs text-muted-foreground">Submitted {ago(selected.submittedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Application fields */}
                  <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
                    <Field label="Contact Email" value={selected.contactEmail} />
                    <Field label="Category" value={selected.creatorCategory} />
                    <Field label="Website" value={selected.websiteUrl} />
                    {(selected.instagramHandle || selected.blueskyHandle || selected.threadsHandle || selected.xHandle || selected.otherSocial) && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Social Links</p>
                        <div className="flex flex-wrap gap-2">
                          {selected.instagramHandle && <span className="text-xs text-foreground">IG: {selected.instagramHandle}</span>}
                          {selected.blueskyHandle && <span className="text-xs text-foreground">BSky: {selected.blueskyHandle}</span>}
                          {selected.threadsHandle && <span className="text-xs text-foreground">Threads: {selected.threadsHandle}</span>}
                          {selected.xHandle && <span className="text-xs text-foreground">X: {selected.xHandle}</span>}
                          {selected.otherSocial && <span className="text-xs text-foreground">{selected.otherSocial}</span>}
                        </div>
                      </div>
                    )}
                    <Field label="Work Description" value={selected.workDescription} />
                    <Field label="Work Samples" value={selected.workSamples} />
                    <Field label="Reason for Applying" value={selected.reasonForApplying} />
                    <Field label="Additional Notes" value={selected.additionalNotes} />
                    {selected.reviewReason && (
                      <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Previous Decision Note</p>
                        <p className="text-sm text-foreground">{selected.reviewReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions — only for pending/info_requested */}
                  {['pending_review', 'info_requested'].includes(selected.status) && (
                    <div className="p-5 border-t border-border space-y-3">
                      {actionMsg && (
                        <p className={`text-sm ${actionMsg.includes('approved') || actionMsg.includes('declined') || actionMsg.includes('requested') ? 'text-success' : 'text-destructive'}`}>
                          {actionMsg}
                        </p>
                      )}

                      {!confirmAction ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => setConfirmAction('approved')}
                            className="bg-success/15 text-success hover:bg-success/25 border border-success/30">
                            <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
                          </Button>
                          <Button size="sm" onClick={() => setConfirmAction('info_requested')}
                            className="bg-info/15 text-info hover:bg-info/25 border border-info/30">
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Request Info
                          </Button>
                          <Button size="sm" onClick={() => setConfirmAction('rejected')}
                            className="bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30">
                            <X className="w-3.5 h-3.5 mr-1.5" /> Decline
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground">
                            {confirmAction === 'approved' ? 'Approve this application?' :
                             confirmAction === 'rejected' ? 'Decline this application?' :
                             'Request more information?'}
                          </p>
                          <Textarea
                            placeholder={confirmAction === 'approved'
                              ? 'Optional note to applicant…'
                              : 'Reason (required for decline/info request)…'}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-muted border-border text-sm resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" disabled={actionLoading}
                              onClick={() => submitDecision(confirmAction)}
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  );
}
