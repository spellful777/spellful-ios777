import { useState, useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { useNavigate, useLocation, Link } from 'react-router';
import { Wand2, CheckCircle2, AlertTriangle, ChevronLeft, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/auth/auth-client';
import { creator_application as c } from 'virtual:content';

export default function CreatorApplicationPage() {
  const { session, isPending, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const typeParam = new URLSearchParams(location.search).get('type');
  const initialAccountType: 'creator' | 'organization' = typeParam === 'organization' ? 'organization' : 'creator';

  // Pre-check: fetch existing application status before showing the form
  interface AppCheck { status: string; referenceId: string; requestedAccountType: string; reviewReason: string; updatedAt: string; }
  const [appCheck, setAppCheck] = useState<AppCheck | null>(null);
  const [appCheckLoading, setAppCheckLoading] = useState(true);
  const [cooldownDaysLeft, setCooldownDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { setAppCheckLoading(false); return; }
    fetch('/api/creator-applications', { credentials: 'include' })
      .then(r => r.json())
      .then((d: { applications?: AppCheck[] }) => {
        const latest = d.applications?.[0] ?? null;
        setAppCheck(latest);
        if (latest?.status === 'rejected') {
          // Calculate cooldown remaining (30 days)
          const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
          const elapsed = Date.now() - new Date(latest.updatedAt).getTime();
          if (elapsed < COOLDOWN_MS) {
            setCooldownDaysLeft(Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000)));
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setAppCheckLoading(false));
  }, [isAuthenticated]);

  const [form, setForm] = useState({
    requestedAccountType: initialAccountType,
    creatorName: '',
    contactEmail: '',
    websiteUrl: '',
    instagramHandle: '',
    blueskyHandle: '',
    threadsHandle: '',
    xHandle: '',
    otherSocial: '',
    creatorCategory: '',
    workDescription: '',
    workSamples: '',
    reasonForApplying: '',
    additionalNotes: '',
    agreedToGuidelines: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<{ referenceId: string } | null>(null);

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/creator-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json() as { ok?: boolean; referenceId?: string; error?: string };
      if (!res.ok) { setError(data.error ?? 'Submission failed. Please try again.'); return; }
      setSubmitted({ referenceId: data.referenceId ?? '' });
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isPending || appCheckLoading) return null;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <Wand2 className="w-10 h-10 mx-auto" style={{ color: 'hsl(var(--primary))' }} />
          <h1 className="font-serif text-2xl" style={{ color: 'hsl(var(--foreground))' }}>{c.signInRequired}</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.signInDesc}</p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/auth/sign-in">{c.signInButton}</Link>
          </Button>
        </div>
      </main>
    );
  }

  // Gate: active application already under review
  if (appCheck && ['pending_review', 'info_requested'].includes(appCheck.status)) {
    const isInfoRequested = appCheck.status === 'info_requested';
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-5 p-8 rounded-2xl"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <Clock className="w-10 h-10 mx-auto" style={{ color: isInfoRequested ? 'hsl(var(--info))' : 'hsl(var(--warning))' }} />
          <h2 className="font-serif text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
            {isInfoRequested ? 'More information needed' : 'Application under review'}
          </h2>
          {isInfoRequested && appCheck.reviewReason && (
            <div className="rounded-xl px-4 py-3 text-sm text-left"
              style={{ background: 'hsl(var(--info) / 0.1)', border: '1px solid hsl(var(--info) / 0.3)', color: 'hsl(var(--foreground))' }}>
              <p className="font-medium text-xs mb-1" style={{ color: 'hsl(var(--info))' }}>Message from the review team</p>
              <p>{appCheck.reviewReason}</p>
            </div>
          )}
          {!isInfoRequested && (
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Your application is being reviewed. You'll receive a notification when a decision is made.
            </p>
          )}
          <p className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Ref: {appCheck.referenceId}
          </p>
          <Button asChild variant="outline" className="border-border">
            <Link to="/account">View in Account Settings</Link>
          </Button>
        </motion.div>
      </main>
    );
  }

  // Gate: rejected within cooldown window
  if (appCheck?.status === 'rejected' && cooldownDaysLeft !== null && cooldownDaysLeft > 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-5 p-8 rounded-2xl"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <AlertTriangle className="w-10 h-10 mx-auto" style={{ color: 'hsl(var(--warning))' }} />
          <h2 className="font-serif text-2xl" style={{ color: 'hsl(var(--foreground))' }}>Reapplication cooldown</h2>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            You can submit a new application in{' '}
            <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {cooldownDaysLeft} day{cooldownDaysLeft === 1 ? '' : 's'}
            </span>.
          </p>
          {appCheck.reviewReason && (
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{appCheck.reviewReason}</p>
          )}
          <Button asChild variant="outline" className="border-border">
            <Link to="/account">Back to Account Settings</Link>
          </Button>
        </motion.div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-5 p-8 rounded-2xl"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--success))' }} />
          <h2 className="font-serif text-2xl" style={{ color: 'hsl(var(--foreground))' }}>{c.successTitle}</h2>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.successDesc}</p>
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.referenceLabel} </span>
            <span className="font-mono text-xs">{submitted.referenceId}</span>
          </div>
          <Button variant="outline" className="border-border" onClick={() => navigate('/community')}>
            {c.backToCommunity}
          </Button>
        </motion.div>
      </main>
    );
  }

  const username = (session?.user as { username?: string } | undefined)?.username ?? '';

  return (
    <>
      <Helmet>
        <title>Apply to Become a Creator — Spellful</title>
        <meta name="description" content="Apply for Creator status on Spellful. Share your witchcraft, divination, or magical arts with our community." />
        <meta name="robots" content="noindex" />
        <meta property="og:title" content="Apply to Become a Creator — Spellful" />
        <meta property="og:description" content="Share your witchcraft, divination, or magical arts with the Spellful community. Apply for verified Creator status." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/creator-application" />
        <meta property="og:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Apply to Become a Creator — Spellful" />
        <meta name="twitter:description" content="Share your witchcraft, divination, or magical arts with the Spellful community." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
      </Helmet>

      <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {/* Back */}
          <Link to="/community" className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:opacity-80"
            style={{ color: 'hsl(var(--muted-foreground))' }}>
            <ChevronLeft className="w-4 h-4" />
            {c.backLink}
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                <Wand2 className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h1 className="font-serif text-3xl" style={{ color: 'hsl(var(--foreground))' }}>{c.pageTitle}</h1>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.pageSubtitle}</p>
          </div>

          {/* Eligibility info */}
          <div className="rounded-xl p-4 mb-6 text-sm space-y-1"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
            <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.eligibilityTitle}</p>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>{c.eligibilityDesc}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Immutable identity */}
            <div className="rounded-xl p-4 space-y-1"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.identityLabel}</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>@{username}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>{c.identityNote}</span>
              </div>
            </div>

            {/* Account type */}
            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {c.accountTypeLabel} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { value: 'creator', label: c.accountTypeCreatorLabel, desc: c.accountTypeCreatorDesc },
                  { value: 'organization', label: c.accountTypeOrgLabel, desc: c.accountTypeOrgDesc },
                ] as { value: 'creator' | 'organization'; label: string; desc: string }[]).map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => set('requestedAccountType', opt.value)}
                    className="text-left rounded-xl p-4 transition-all"
                    style={{
                      background: form.requestedAccountType === opt.value ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--card))',
                      border: `2px solid ${form.requestedAccountType === opt.value ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                    }}>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'hsl(var(--foreground))' }}>{opt.label}</p>
                    <p className="text-xs leading-snug" style={{ color: 'hsl(var(--muted-foreground))' }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Creator/business name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {c.creatorNameLabel} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <Input value={form.creatorName} onChange={e => set('creatorName', e.target.value)}
                placeholder="e.g. Moon & Herb Studio" required maxLength={255}
                className="bg-muted border-border" />
            </div>

            {/* Contact email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {c.contactEmailLabel} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)}
                placeholder="your@email.com" required maxLength={255}
                className="bg-muted border-border" />
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.contactEmailNote}</p>
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.websiteLabel}</label>
              <Input value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)}
                placeholder="https://yoursite.com" maxLength={500}
                className="bg-muted border-border" />
            </div>

            {/* Social handles */}
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.socialsLabel}</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.socialsNote}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { field: 'instagramHandle', label: 'Instagram', placeholder: '@yourhandle' },
                  { field: 'blueskyHandle', label: 'Bluesky', placeholder: '@you.bsky.social' },
                  { field: 'threadsHandle', label: 'Threads', placeholder: '@yourhandle' },
                  { field: 'xHandle', label: 'X (Twitter)', placeholder: '@yourhandle' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</label>
                    <Input value={form[field as keyof typeof form] as string}
                      onChange={e => set(field, e.target.value)}
                      placeholder={placeholder} maxLength={100}
                      className="bg-muted border-border text-sm" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.otherSocialLabel}</label>
                <Input value={form.otherSocial} onChange={e => set('otherSocial', e.target.value)}
                  placeholder="e.g. TikTok @handle, YouTube channel URL" maxLength={300}
                  className="bg-muted border-border text-sm" />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {c.categoryLabel} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <select required value={form.creatorCategory} onChange={e => set('creatorCategory', e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: form.creatorCategory ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                <option value="">{c.categoryPlaceholder}</option>
                {['Astrology & Horoscopes', 'Tarot & Divination', 'Spells & Rituals', 'Herbalism & Apothecary', 'Crystal Work', 'Moon Magic', 'Witchcraft & Wicca', 'Spiritual Coaching', 'Art & Illustration', 'Writing & Poetry', 'Music & Sound Healing', 'Shop / Products', 'Community & Education', 'Other'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Work description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {c.workDescLabel} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <textarea required value={form.workDescription} onChange={e => set('workDescription', e.target.value)}
                placeholder="Tell us about what you create, who it's for, and what makes it unique…" maxLength={3000} rows={5}
                className="w-full rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>

            {/* Work samples */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {c.samplesLabel} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.samplesNote}</p>
              <textarea required value={form.workSamples} onChange={e => set('workSamples', e.target.value)}
                placeholder={"https://etsy.com/shop/yourshop\nhttps://instagram.com/p/example"} maxLength={3000} rows={4}
                className="w-full rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>

            {/* Reason for applying */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {c.reasonLabel} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <textarea required value={form.reasonForApplying} onChange={e => set('reasonForApplying', e.target.value)}
                placeholder="Tell us what you hope to share with the Spellful community and how Creator status would support your work…" maxLength={2000} rows={4}
                className="w-full rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>

            {/* Additional notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.notesLabel}</label>
              <textarea value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)}
                placeholder="Anything else you'd like us to know…" maxLength={1000} rows={3}
                className="w-full rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>

            {/* Privacy notice */}
            <div className="rounded-xl p-4 text-sm space-y-2"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
              <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.privacyTitle}</p>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>{c.privacyDesc}</p>
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required checked={form.agreedToGuidelines}
                onChange={e => set('agreedToGuidelines', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-primary flex-shrink-0" />
              <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                {c.agreementText}{' '}
                <Link to="/creator-guidelines" className="underline" style={{ color: 'hsl(var(--primary))' }}
                  target="_blank" rel="noopener noreferrer">
                  {c.guidelinesLink} <ExternalLink className="inline w-3 h-3" />
                </Link>
                {' '}{c.agreementAnd}{' '}
                <Link to="/privacy" className="underline" style={{ color: 'hsl(var(--primary))' }}
                  target="_blank" rel="noopener noreferrer">
                  {c.privacyLink} <ExternalLink className="inline w-3 h-3" />
                </Link>.
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl p-3 text-sm"
                style={{ background: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={submitting || !form.agreedToGuidelines}
              className="w-full bg-primary text-primary-foreground gap-2">
              <Wand2 className="w-4 h-4" />
              {submitting ? c.submitting : c.submitButton}
            </Button>

          </form>
        </motion.div>
      </main>
    </>
  );
}
