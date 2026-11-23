import { organizations } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Building2, ShoppingBag, GraduationCap, Users, Heart, CalendarDays,
  Globe, CheckCircle2, ChevronDown, ChevronUp, ArrowRight, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'What types of organizations are accepted?',
    a: 'We welcome metaphysical shops, spiritual studios, witchcraft collectives, event organizers, nonprofits, learning platforms, and community groups. Both commercial and nonprofit organizations are eligible. We evaluate each application individually.',
  },
  {
    q: 'Does my organization need a website?',
    a: 'A website is helpful but not required. You can provide a social media presence, an Etsy shop, or another verifiable online presence as part of your application.',
  },
  {
    q: 'Can I promote my products or services?',
    a: 'Organizations can share information about their offerings within community guidelines. Promotional posts must be clearly labeled and must follow our rules around advertising. Spam or aggressive promotion will result in moderation action.',
  },
  {
    q: 'How does team access work?',
    a: 'The organization owner can invite team members to help manage the organization profile. Team roles and permissions are managed through the organization settings. All team changes are logged for accountability.',
  },
  {
    q: 'What is the review process?',
    a: 'Our team reviews your application, verifies your organization details, and may request additional information. You will be notified of the outcome. Approval grants the Organization badge and profile type; it does not imply endorsement by Spellful.',
  },
  {
    q: 'Can an individual also be a creator?',
    a: 'Yes. If you run an organization AND create personal content, you can apply for both. Your personal profile and your organization profile are separate.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

const ORG_TYPES = [
  { icon: ShoppingBag,   label: 'Metaphysical Shops',  desc: 'Crystals, herbs, candles, and ritual supplies' },
  { icon: GraduationCap, label: 'Learning Platforms',  desc: 'Courses, workshops, and educational programs' },
  { icon: Users,         label: 'Collectives',         desc: 'Covens, circles, and practitioner groups' },
  { icon: CalendarDays,  label: 'Event Organizers',    desc: 'Sabbat gatherings, retreats, and workshops' },
  { icon: Heart,         label: 'Nonprofits',          desc: 'Community service and spiritual wellness orgs' },
  { icon: Building2,     label: 'Studios & Practices', desc: 'Healing centers, reading studios, and spas' },
];

const STEPS = [
  { n: '1', title: 'Create your account', desc: 'Sign up as a Community Member or choose Organization at signup.' },
  { n: '2', title: 'Prepare your details', desc: 'Gather your organization name, type, website or social presence, and a brief description of your mission.' },
  { n: '3', title: 'Submit your application', desc: 'Fill out the organization application with your details and intended use of Spellful.' },
  { n: '4', title: 'Review & verification', desc: 'Our team reviews and may request additional verification. You can participate normally while you wait.' },
  { n: '5', title: 'Launch your organization profile', desc: 'Your Organization badge appears and you can set up your profile, invite team members, and start contributing.' },
];

export default function OrganizationsPage() {
  const siteUrl = 'https://spellful.com';
  const url = `${siteUrl}/organizations`;
  const title = 'Organizations on Spellful — Shops, Studios & Collectives';
  const description = 'Bring your metaphysical shop, spiritual studio, coven, or learning platform to the Spellful community. Apply for an Organization profile and connect with practitioners.';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={`${siteUrl}/airo-assets/images/pages/og-image`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}/airo-assets/images/pages/og-image`} />
        <link rel="canonical" href={url} />
      </Helmet>

      <main>
        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden border-b border-border"
          style={{ background: `linear-gradient(160deg, hsl(var(--hero-midnight)) 0%, hsl(var(--banner-bg-mid)) 60%, hsl(var(--hero-midnight)) 100%)` }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[...Array(30)].map((_, i) => {
              const a = (i * 1664525 + 1013904223) & 0xffffffff;
              const b = (a * 1664525 + 1013904223) & 0xffffffff;
              return (
                <div key={i} className="absolute rounded-full" style={{
                  left: `${((a >>> 0) % 10000) / 100}%`,
                  top: `${((b >>> 0) % 10000) / 100}%`,
                  width: 1 + (i % 3), height: 1 + (i % 3),
                  background: i % 3 === 0 ? 'hsl(var(--accent))' : i % 3 === 1 ? 'hsl(var(--primary))' : 'white',
                  opacity: 0.35 + (i % 5) * 0.1,
                }} />
              );
            })}
          </div>

          <div className="relative max-w-4xl mx-auto px-5 md:px-8 py-20 md:py-28 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 mb-6"
                style={{ background: 'hsl(var(--accent) / 0.1)' }}>
                <Building2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--accent))' }} />
                <span className="text-xs font-medium" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
                  {organizations.hero.badge}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                {organizations.hero.heading}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
                {organizations.hero.subheading}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/creator-application?type=organization">
                    {organizations.hero.ctaPrimary} <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link to="/signup">{organizations.hero.ctaSecondary}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Org types ── */}
        <section className="max-w-5xl mx-auto px-5 md:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              {organizations.typesSection.heading}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
              {organizations.typesSection.subheading}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ORG_TYPES.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-border p-5"
                style={{ background: 'hsl(var(--card))' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'hsl(var(--accent) / 0.12)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="border-y border-border" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                {organizations.benefitsSection.heading}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { title: 'Organization Profile', desc: 'A dedicated profile page with your logo, mission, website, contact, and public resources — distinct from individual creator profiles.' },
                { title: 'Verified Organization Badge', desc: 'A badge that signals your organization has been reviewed. It does not imply endorsement by Spellful.' },
                { title: 'Team Access', desc: 'Invite team members to help manage your organization profile, with role-based permissions and an audit log.' },
                { title: 'Community Presence', desc: 'Contribute to discussions, share resources, and connect with practitioners who are interested in what your organization offers.' },
              ].map(({ title: t, desc }) => (
                <div key={t} className="flex gap-3 rounded-xl border border-border p-5" style={{ background: 'hsl(var(--card))' }}>
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--success))' }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="max-w-3xl mx-auto px-5 md:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              {organizations.stepsSection.heading}
            </h2>
          </div>
          <ol className="space-y-4">
            {STEPS.map(({ n, title: t, desc }) => (
              <li key={n} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-heading)' }}>
                  {n}
                </div>
                <div className="pt-1">
                  <p className="text-sm font-semibold text-foreground mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>{t}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link to="/creator-application?type=organization">
                Apply as Organization <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ── Creator CTA ── */}
        <section className="border-t border-border" style={{ background: 'hsl(var(--card))' }}>
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                {organizations.creatorCta.heading}
              </p>
              <p className="text-xs text-muted-foreground">{organizations.creatorCta.subheading}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button asChild variant="outline" size="sm">
                <Link to="/creators">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> View Creators
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/community">
                  <Globe className="w-3.5 h-3.5 mr-1.5" /> Browse Community
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto px-5 md:px-8 py-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center" style={{ fontFamily: 'var(--font-heading)' }}>
            {organizations.faqSection.heading}
          </h2>
          <div className="rounded-xl border border-border px-5" style={{ background: 'hsl(var(--card))' }}>
            {FAQS.map((faq) => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </section>
      </main>
    </>
  );
}
