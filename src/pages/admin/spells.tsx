import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Star, Sparkles, Flag, Eye, Pencil, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/auth-client';
import { admin_spells } from 'virtual:content';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminSpell {
  id: number;
  slug: string;
  title: string;
  intention: string;
  difficulty: string;
  status: string;
  isFeatured: boolean;
  isAdminCreated: boolean;
  submittedByUserId: string | null;
  saveCount: number;
  ratingCount: number;
  ratingSum: number;
  createdAt: string;
}

interface ReportedReview {
  reportId: number;
  reviewId: number;
  reason: string;
  reportedAt: string;
  reviewBody: string;
  reviewRating: number;
  reviewUserId: string;
  isModerated: boolean;
  spellId: number;
  reportCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  approved: '--grimoire-herb',
  pending: '--primary',
  rejected: '--destructive',
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSpellsPage() {
  const { session, isPending } = useSession();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all' | 'reported_reviews'>('pending');
  const [spells, setSpells] = useState<AdminSpell[]>([]);
  const [reportedReviews, setReportedReviews] = useState<ReportedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editFeatured, setEditFeatured] = useState<{ id: number; featured: boolean } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/spells?tab=${tab}`);
    if (!r.ok) { setLoading(false); return; }
    const d = await r.json() as { spells?: AdminSpell[]; reportedReviews?: ReportedReview[] };
    if (tab === 'reported_reviews') {
      setReportedReviews(d.reportedReviews ?? []);
    } else {
      setSpells(d.spells ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const doAction = async (spellId: number, action: string, extra?: Record<string, unknown>) => {
    const r = await fetch(`/api/admin/spells/${spellId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    const d = await r.json() as { message?: string; error?: string };
    setActionMsg(d.message ?? d.error ?? '');
    setTimeout(() => setActionMsg(''), 3000);
    fetchData();
  };

  const doModerateReview = async (spellId: number, reviewId: number, action: string) => {
    const r = await fetch(`/api/admin/spells/${spellId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reviewId }),
    });
    const d = await r.json() as { message?: string; error?: string };
    setActionMsg(d.message ?? d.error ?? '');
    setTimeout(() => setActionMsg(''), 3000);
    fetchData();
  };

  if (isPending) return null;

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p style={{ color: 'hsl(var(--foreground))' }}>Sign in required</p>
      </main>
    );
  }

  const TABS = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All Spells' },
    { value: 'reported_reviews', label: 'Reported Reviews' },
  ] as const;

  return (
    <>
      <Helmet>
        <title>Admin — Spell Library — Spellful</title>
        <meta name="description" content="Admin panel for managing the Spellful spell library — review submissions, moderate reviews, and feature spells." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8">

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              <h1 className="text-3xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                {admin_spells.title}
              </h1>
            </div>
            <p className="text-sm mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {admin_spells.description}
            </p>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className="text-sm px-4 py-2 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    background: tab === t.value ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                    color: tab === t.value ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    border: `1px solid ${tab === t.value ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {actionMsg && (
              <div
                className="mb-4 p-3 rounded-lg text-sm"
                style={{ background: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))', border: '1px solid hsl(var(--success) / 0.3)' }}
              >
                {actionMsg}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                />
              </div>
            ) : tab === 'reported_reviews' ? (
              /* Reported reviews */
              <div className="flex flex-col gap-4">
                {reportedReviews.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>{admin_spells.noReports}</p>
                ) : reportedReviews.map((r) => (
                  <div
                    key={r.reviewId}
                    className="p-5 rounded-xl"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                          Review #{r.reviewId} · Spell #{r.spellId}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'hsl(var(--destructive) / 0.12)', color: 'hsl(var(--destructive))' }}
                          >
                            {r.reportCount} report{r.reportCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Reason: {r.reason}
                          </span>
                          {r.isModerated && (
                            <span className="text-xs" style={{ color: 'hsl(var(--success))' }}>Already moderated</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!r.isModerated && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => doModerateReview(r.spellId, r.reviewId, 'moderate_review')}
                            className="gap-1.5 text-xs"
                            style={{ color: 'hsl(var(--warning))' }}
                          >
                            <Flag className="w-3 h-3" /> Hide Review
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => doModerateReview(r.spellId, r.reviewId, 'delete_review')}
                          className="gap-1.5 text-xs"
                          style={{ color: 'hsl(var(--destructive))' }}
                        >
                          <XCircle className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3 h-3" style={{
                          color: s <= r.reviewRating ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                          fill: s <= r.reviewRating ? 'hsl(var(--primary))' : 'transparent',
                        }} />
                      ))}
                    </div>
                    <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                      {r.reviewBody}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* Spells table */
              <div className="flex flex-col gap-3">
                {spells.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>{admin_spells.noSpells}</p>
                ) : spells.map((spell) => {
                  const avg = spell.ratingCount > 0 ? (spell.ratingSum / spell.ratingCount).toFixed(1) : '—';
                  return (
                    <div
                      key={spell.id}
                      className="p-4 rounded-xl"
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full capitalize"
                              style={{
                                background: `hsl(var(${STATUS_COLORS[spell.status] ?? '--muted-foreground'}) / 0.12)`,
                                color: `hsl(var(${STATUS_COLORS[spell.status] ?? '--muted-foreground'}))`,
                              }}
                            >
                              {spell.status}
                            </span>
                            {spell.isFeatured && (
                              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                                <Sparkles className="w-2.5 h-2.5" /> {admin_spells.featuredLabel}
                              </span>
                            )}
                            {!spell.isAdminCreated && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--accent))' }}>
                                {admin_spells.memberSubmissionLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-base font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                            {spell.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {spell.intention} · {spell.difficulty} · ★ {avg} ({spell.ratingCount}) · {spell.saveCount} saves
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 shrink-0">
                          <Link to={`/spells/${spell.slug}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              <Eye className="w-3 h-3" /> View
                            </Button>
                          </Link>

                          {spell.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => doAction(spell.id, 'approve')}
                                className="gap-1.5 text-xs"
                                style={{ background: 'hsl(var(--success) / 0.12)', color: 'hsl(var(--success))', border: '1px solid hsl(var(--success) / 0.3)' }}
                              >
                                <CheckCircle className="w-3 h-3" /> {admin_spells.approveCta}
                              </Button>
                              {rejectId === spell.id ? (
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="text"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Reason (optional)"
                                    className="text-xs px-2 py-1 rounded"
                                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => { doAction(spell.id, 'reject', { rejectionReason: rejectReason }); setRejectId(null); setRejectReason(''); }}
                                    className="text-xs"
                                    style={{ background: 'hsl(var(--destructive) / 0.12)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
                                  >
                                    Confirm
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setRejectId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setRejectId(spell.id)}
                                  className="gap-1.5 text-xs"
                                  style={{ background: 'hsl(var(--destructive) / 0.12)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
                                >
                                  <XCircle className="w-3 h-3" /> {admin_spells.rejectCta}
                                </Button>
                              )}
                            </>
                          )}

                          {spell.status === 'approved' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newFeatured = !spell.isFeatured;
                                  setEditFeatured({ id: spell.id, featured: newFeatured });
                                  doAction(spell.id, 'feature', { isFeatured: newFeatured });
                                  setEditFeatured(null);
                                }}
                                className="gap-1.5 text-xs"
                                style={spell.isFeatured ? { color: 'hsl(var(--primary))' } : {}}
                              >
                                <Sparkles className="w-3 h-3" />
                                {editFeatured?.id === spell.id ? '…' : spell.isFeatured ? admin_spells.unfeatureCta : admin_spells.featureCta}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => doAction(spell.id, 'reject', { rejectionReason: 'Removed from library' })}
                                className="gap-1.5 text-xs"
                                style={{ color: 'hsl(var(--destructive))' }}
                              >
                                <XCircle className="w-3 h-3" /> {admin_spells.removeCta}
                              </Button>
                            </>
                          )}

                          {spell.status === 'rejected' && (
                            <Button
                              size="sm"
                              onClick={() => doAction(spell.id, 'approve')}
                              className="gap-1.5 text-xs"
                              style={{ background: 'hsl(var(--success) / 0.12)', color: 'hsl(var(--success))', border: '1px solid hsl(var(--success) / 0.3)' }}
                            >
                              <CheckCircle className="w-3 h-3" /> {admin_spells.reapproveCta}
                            </Button>
                          )}

                          <Link to={`/spells/${spell.slug}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}
