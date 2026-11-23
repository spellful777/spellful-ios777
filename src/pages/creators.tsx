import { creators } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Sparkles, Star, BookOpen, Wand2, Mic, Video, Feather, Palette,
  CheckCircle2, ChevronDown, ChevronUp, ArrowRight, Users, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Who qualifies as a creator on Spellful?',
    a: 'Anyone who creates original content related to witchcraft, tarot, astrology, herbalism, spiritual wellness, or related practices. This includes tarot readers, educators, herbalists, writers, artists, video creators, podcasters, and spiritual guides. You do not need a large following — quality and authenticity matter most.',
  },
  {
    q: 'What happens after I apply?',
    a: 'Our moderation team reviews your application, typically within a few business days. You may be asked for additional information. You can continue using Spellful as a regular member while your application is under review. We will notify you of the outcome via your account.',
  },
  {
    q: 'Do I need accounts on multiple social platforms?',
    a: 'No. You can provide links to any combination of Instagram, TikTok, YouTube, Bluesky, Threads, X, a personal website, or other platforms. Even a single strong portfolio link is fine.',
  },
  {
    q: 'Is there a follower count requirement?',
    a: 'No minimum follower count is required. We evaluate the quality and authenticity of your work, not raw numbers. A thoughtful herbalism blog with a small dedicated audience is just as welcome as a large social media presence.',
  },
  {
    q: 'What does the Creator badge actually do?',
    a: 'Approved creators receive a visible badge on their public profile and community posts. It signals to the community that your content has been reviewed and meets our standards. It does not grant moderation powers or financial benefits.',
  },
  {
    q: 'Can I apply as both a creator and an organization?',
    a: 'If you run a business or collective in addition to your personal creative work, you should apply as an Organization. The two account types serve different purposes — creator profiles are personal, organization profiles represent a brand or group.',
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

// ── Creator types ─────────────────────────────────────────────────────────────

const CREATOR_TYPES = [
  { icon: Star,     label: 'Tarot Readers',     desc: 'Share readings, card meanings, and spread guides' },
  { icon: BookOpen, label: 'Educators',          desc: 'Teach witchcraft, astrology, herbalism, and more' },
  { icon: Feather,  label: 'Writers',            desc: 'Publish articles, poetry, and spiritual reflections' },
  { icon: Wand2,    label: 'Herbalists',         desc: 'Share plant knowledge, remedies, and correspondences' },
  { icon: Palette,  label: 'Artists',            desc: 'Showcase mystical art, illustrations, and crafts' },
  { icon: Video,    label: 'Video Creators',     desc: 'Tutorials, rituals, and educational video content' },
  { icon: Mic,      label: 'Podcasters',         desc: 'Audio shows on spirituality, magic, and wellness' },
  { icon: Sparkles, label: 'Spiritual Guides',   desc: 'Meditation, energy work, and intuitive practices' },
];

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: '1', title: 'Create your account', desc: 'Sign up as a Community Member or choose Creator at signup.' },
  { n: '2', title: 'Complete your profile', desc: 'Add your bio, specialties, and at least one portfolio or social link.' },
  { n: '3', title: 'Submit your application', desc: 'Tell us about your work and what you want to share with the community.' },
  { n: '4', title: 'Review & approval', desc: 'Our team reviews your application. You can participate normally while you wait.' },
  { n: '5', title: 'Start creating', desc: 'Your Creator badge appears and you can publish resources and share your work.' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreatorsPage() {
  const siteUrl = 'https://spellful.com';
  const url = `${siteUrl}/creators`;
  const title = 'Become a Creator — Spellful';
  const description = 'Share your witchcraft, tarot, herbalism, or spiritual practice with the Spellful community. Apply to become a verified creator and reach fellow practitioners.';

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
          style={{ background: 'linear-gradient(160deg, hsl(var(--hero-midnight)) 0%, hsl(var(--hero-plum)) 60%, hsl(var(--hero-midnight)) 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[...Array(30)].map((_, i) => {
              const a = (i * 1664525 + 1013904223) & 0xffffffff;
              const b = (a * 1664525 + 1013904223) & 0xffffffff;
              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${((a >>> 0) % 10000) / 100}%`,
                    top: `${((b >>> 0) % 10000) / 100}%`,
                    width: 1 + (i % 3),
                    height: 1 + (i % 3),
                    background: i % 3 === 0 ? 'hsl(var(--primary))' : i % 3 === 1 ? 'hsl(var(--accent))' : 'white',
                    opacity: 0.4 + (i % 5) * 0.1,
                  }}
                />
              );
            })}
          </div>

          <div className="relative max-w-4xl mx-auto px-5 md:px-8 py-20 md:py-28 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 mb-6"
                style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                <span className="text-xs font-medium" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                  {creators.hero.badge}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                {creators.hero.heading}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
                {creators.hero.subheading}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/creator-application?type=creator">
                    {creators.hero.ctaPrimary} <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link to="/signup">{creators.hero.ctaSecondary}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Who is a creator ── */}
        <section className="max-w-5xl mx-auto px-5 md:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              {creators.whoSection.heading}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
              {creators.whoSection.subheading}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CREATOR_TYPES.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-border p-4 text-center"
                style={{ background: 'hsl(var(--card))' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'hsl(var(--primary) / 0.12)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="border-y border-border" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-16">
            <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              {creators.benefitsSection.heading}
            </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { title: 'Verified Creator Badge', desc: 'A visible badge on your profile and community posts that signals your content has been reviewed and meets our standards.' },
                { title: 'Creator Profile', desc: 'An enhanced public profile with space for your specialties, portfolio samples, and featured work.' },
                { title: 'Community Presence', desc: 'Your posts and contributions are visible to the full Spellful community of practitioners.' },
                { title: 'Shareable Profile Card', desc: 'A branded profile card you can share on social media to grow your audience.' },
              ].map(({ title: t, desc }) => (
                <div key={t} className="flex gap-3 rounded-xl border border-border p-5" style={{ background: 'hsl(var(--card))' }}>
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--success, 160 84% 39%))' }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How to apply ── */}
        <section className="max-w-3xl mx-auto px-5 md:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              {creators.stepsSection.heading}
            </h2>
          </div>
          <ol className="space-y-4">
            {STEPS.map(({ n, title: t, desc }) => (
              <li key={n} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)' }}>
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
                  <Link to="/creator-application?type=creator">
                    Start Your Application <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
            </Button>
          </div>
        </section>

        {/* ── Community links ── */}
        <section className="border-t border-border" style={{ background: 'hsl(var(--card))' }}>
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                {creators.orgCta.heading}
              </p>
              <p className="text-xs text-muted-foreground">{creators.orgCta.subheading}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button asChild variant="outline" size="sm">
                <Link to="/organizations">
                  <Users className="w-3.5 h-3.5 mr-1.5" /> View Organizations
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
            {creators.faqSection.heading}
          </h2>
          <div className="rounded-xl border border-border px-5" style={{ background: 'hsl(var(--card))' }}>
            {FAQS.map((faq) => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </section>
      </main>
    </>
  );
}
