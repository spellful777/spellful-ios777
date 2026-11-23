/**
 * /account/applications — My Applications (applicant view)
 * Shows the signed-in user's own creator/organization application history.
 * Status, last-updated, applicant-safe decision notes, withdraw button, reapply link.
 */
import { useState, useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, Navigate } from 'react-router';
import { motion } from 'motion/react';
import {
  FileText, Clock, CheckCircle2, XCircle, MessageSquare, ChevronLeft,
  RefreshCw, AlertTriangle, Wand2, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth/auth-client';
import { account_applications } from 'virtual:content';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ApplicationSummary {
  id: number;
  referenceId: string;
  status: string;
  requestedAccountType: string;
  creatorName: string;
  creatorCategory: string;
  reviewReason: string;
  submittedAt: string;
  updatedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ago(ts: string) {
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

const STATUS_INFO: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string; description: string }> = {
  pending_review: {
    icon: <Clock className="w-5 h-5" />,
    bg: 'hsl(var(--warning) / 0.12)',
    text: 'hsl(var(--warning))',
    label: 'Pending Review',
    description: 'Your application has been submitted and is awaiting review by our team.',
  },
  info_requested: {
    icon: <MessageSquare className="w-5 h-5" />,
    bg: 'hsl(var(--info) / 0.12)',
    text: 'hsl(var(--info))',
    label: 'More Information Needed',
    description: 'Our team has reviewed your application and needs additional information before making a decision.',
  },
  approved: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    bg: 'hsl(var(--success) / 0.12)',
    text: 'hsl(var(--success))',
    label: 'Approved',
    description: 'Congratulations! Your application has been approved.',
  },
  rejected: {
    icon: <XCircle className="w-5 h-5" />,
    bg: 'hsl(var(--destructive) / 0.12)',
    text: 'hsl(var(--destructive))',
    label: 'Declined',
    description: 'Your application was not approved at this time. You may reapply after 30 days.',
  },
  withdrawn: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bg: 'hsl(var(--muted-foreground) / 0.12)',
    text: 'hsl(var(--muted-foreground))',
    label: 'Withdrawn',
    description: 'You withdrew this application.',
  },
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function MyApplicationsPage() {
  const { session, isPending, isAuthenticated } = useSession();
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState<number | null>(null);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  function load() {
    setLoading(true);
    setError('');
    fetch('/api/creator-applications', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<{ applications: ApplicationSummary[] }>;
      })
      .then((d) => { setApps(d.applications ?? []); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }

  useEffect(() => {
    if (!isPending && isAuthenticated) load();
    else if (!isPending) setLoading(false);
  }, [isPending, isAuthenticated]);

  async function withdraw(id: number) {
    setWithdrawing(id);
    setWithdrawMsg('');
    try {
      const r = await fetch(`/api/creator-applications/${id}/withdraw`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!r.ok) {
        const d = await r.json() as { error?: string };
        throw new Error(d.error ?? `${r.status}`);
      }
      setWithdrawMsg('Application withdrawn.');
      load();
    } catch (e) {
      setWithdrawMsg((e as Error).message);
    } finally {
      setWithdrawing(null);
    }
  }

  if (!isPending && !isAuthenticated) return <Navigate to="/login?redirect=/account/applications" replace />;

  // Determine if user can reapply (30-day cooldown after rejection)
  const latestRejected = apps.find((a) => a.status === 'rejected');
  const cooldownDaysLeft = latestRejected
    ? Math.max(0, 30 - differenceInDays(new Date(), new Date(latestRejected.updatedAt)))
    : 0;
  const canApply = !apps.some((a) => ['pending_review', 'info_requested'].includes(a.status))
    && cooldownDaysLeft === 0;

  return (
    <>
      <Helmet>
        <title>{account_applications.meta.title}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={account_applications.meta.description} />
      </Helmet>

      <main className="min-h-screen py-8 px-4 max-w-2xl mx-auto">
        {/* Back link */}
        <Link to="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Account
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(var(--primary) / 0.15)' }}>
              <FileText className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                My Applications
              </h1>
              <p className="text-sm text-muted-foreground">Creator and organization applications</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}
            className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {withdrawMsg && (
          <div className="mb-4 p-3 rounded-lg border border-success/30 bg-success/10 text-success text-sm">
            {withdrawMsg}
          </div>
        )}

        {/* Apply CTA */}
        {canApply && (
          <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Apply to become a Creator or Organization</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share your work with the Spellful community
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link to="/creator-application?type=creator">
                <Button size="sm" className="bg-primary text-primary-foreground">
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  Creator
                </Button>
              </Link>
              <Link to="/creator-application?type=organization">
                <Button size="sm" variant="outline" className="border-border">
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  Organization
                </Button>
              </Link>
            </div>
          </div>
        )}

        {cooldownDaysLeft > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/5">
            <p className="text-sm text-warning font-medium">Reapplication cooldown</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You can reapply in {cooldownDaysLeft} day{cooldownDaysLeft !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        {/* Application list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : apps.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-base font-medium text-foreground mb-1">No applications yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Apply to become a Creator or Organization to share your work with the community.
              </p>
              <div className="flex gap-2">
                <Link to="/creator-application?type=creator">
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    Apply as Creator
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => {
              const info = STATUS_INFO[app.status] ?? STATUS_INFO['pending_review'];
              const canWithdraw = ['pending_review', 'info_requested'].includes(app.status);
              return (
                <motion.div key={app.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-card border-border overflow-hidden">
                    {/* Status bar */}
                    <div className="h-1" style={{ background: info.text }} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: info.bg, color: info.text }}>
                          {info.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base text-foreground">{app.creatorName}</CardTitle>
                            <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground capitalize">
                              {app.requestedAccountType}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Ref: {app.referenceId} · {app.creatorCategory}
                          </p>
                        </div>
                        <span className="text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full"
                          style={{ background: info.bg, color: info.text }}>
                          {info.label}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{info.description}</p>

                      {/* Applicant-safe decision note */}
                      {app.reviewReason && app.status !== 'pending_review' && (
                        <div className="p-3 rounded-lg border border-border bg-muted/30">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Note from reviewer
                          </p>
                          <p className="text-sm text-foreground">{app.reviewReason}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>Submitted {ago(app.submittedAt)}</p>
                          <p>Last updated {ago(app.updatedAt)}</p>
                        </div>
                        {canWithdraw && (
                          <Button size="sm" variant="ghost"
                            disabled={withdrawing === app.id}
                            onClick={() => withdraw(app.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            {withdrawing === app.id ? 'Withdrawing…' : 'Withdraw'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
