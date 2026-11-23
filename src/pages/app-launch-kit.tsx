import { Helmet } from '@dr.pogodin/react-helmet';
import { useState } from 'react';
import {
  Check, Copy, Download, Mail, FileText, Megaphone, Sparkles, ExternalLink,
} from 'lucide-react';
import { app_launch_kit } from 'virtual:content';

// ─── Bluesky SVG icon ────────────────────────────────────────────────────────
function BlueSkyIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  );
}

// ─── Inline copy button — receives only a static string, never a content ref ──
function InlineCopy({ copyText, label = 'Copy' }: { copyText: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 shrink-0"
      style={{
        background: copied ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--primary) / 0.12)',
        color: copied ? 'hsl(var(--success))' : 'hsl(var(--primary))',
        border: `1px solid ${copied ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--primary) / 0.25)'}`,
      }}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Banner preview ───────────────────────────────────────────────────────────
function BannerPreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl"
      style={{
        aspectRatio: '1024 / 500',
        border: '1px solid hsl(var(--border))',
        background: `linear-gradient(135deg, hsl(var(--banner-bg-start)) 0%, hsl(var(--banner-bg-mid)) 50%, hsl(var(--banner-bg-end)) 100%)`,
      }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: i % 5 === 0 ? '3px' : '2px', height: i % 5 === 0 ? '3px' : '2px',
            background: i % 3 === 0 ? 'hsl(var(--primary) / 0.9)' : 'hsl(var(--foreground) / 0.5)',
            top: `${(i * 37 + 11) % 100}%`, left: `${(i * 53 + 7) % 100}%`,
          }} />
      ))}
      <div className="absolute pointer-events-none" style={{ top: '10%', left: '5%', width: '200px', height: '200px', background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '5%', right: '8%', width: '180px', height: '180px', background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="absolute" style={{ top: '8%', right: '12%', width: '80px', height: '80px' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'hsl(var(--primary) / 0.25)', border: '2px solid hsl(var(--primary) / 0.4)' }} />
        <div className="absolute bg-[hsl(var(--banner-bg-start))]" style={{ top: '8px', left: '12px', width: '64px', height: '64px', borderRadius: '50%' }} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none">
        <img src="/airo-assets/images/logo/horizontal" alt="Spellful" className="h-auto object-contain mb-4" style={{ maxHeight: '48px', maxWidth: '200px' }} />
        <h2 className="font-bold leading-tight mb-2 text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(18px, 3.5vw, 36px)' }}>
          {app_launch_kit.banner.headline}
        </h2>
        <p className="mb-4" style={{ color: 'hsl(var(--accent))', fontSize: 'clamp(10px, 1.8vw, 16px)', letterSpacing: '0.1em' }}>
          {app_launch_kit.banner.subheadline}
        </p>
        <p className="mb-5 text-muted-foreground" style={{ fontSize: 'clamp(8px, 1.3vw, 13px)', maxWidth: '500px' }}>
          {app_launch_kit.banner.tagline}
        </p>
        <div className="px-5 py-2 rounded-full font-semibold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 'clamp(9px, 1.4vw, 14px)' }}>
          {app_launch_kit.banner.cta}
        </div>
      </div>
    </div>
  );
}

// ─── Instagram preview ────────────────────────────────────────────────────────
function InstagramPreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl"
      style={{
        aspectRatio: '1 / 1', maxWidth: '480px', margin: '0 auto',
        background: `linear-gradient(160deg, hsl(var(--banner-bg-start)) 0%, hsl(var(--insta-bg-mid)) 60%, hsl(var(--banner-bg-start)) 100%)`,
        border: '1px solid hsl(var(--border))',
      }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: '2px', height: '2px',
            background: i % 4 === 0 ? 'hsl(var(--primary) / 0.9)' : 'hsl(var(--foreground) / 0.4)',
            top: `${(i * 43 + 9) % 100}%`, left: `${(i * 61 + 13) % 100}%`,
          }} />
      ))}
      <div className="absolute pointer-events-none" style={{ top: '20%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="absolute" style={{ top: '6%', right: '8%', width: '60px', height: '60px' }}>
        <div className="w-full h-full rounded-full" style={{ background: 'hsl(var(--primary) / 0.3)', border: '1.5px solid hsl(var(--primary) / 0.5)' }} />
        <div className="absolute bg-[hsl(var(--banner-bg-start))]" style={{ top: '6px', left: '10px', width: '48px', height: '48px', borderRadius: '50%' }} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none">
        <div className="mb-3 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' }}>
          ✨ Now Available
        </div>
        <img src="/airo-assets/images/logo/horizontal" alt="Spellful" className="h-auto object-contain mb-4" style={{ maxHeight: '44px', maxWidth: '180px' }} />
        <p className="text-lg font-bold mb-2 text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Your Witchcraft Companion</p>
        <p className="text-xs mb-5" style={{ color: 'hsl(var(--accent))', letterSpacing: '0.12em' }}>TAROT · ASTROLOGY · MOON MAGIC · GRIMOIRE</p>
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-5">
          {['Daily Horoscope', '78-Card Tarot', 'Moon Rituals', 'Grimoire'].map((f) => (
            <div key={f} className="px-2 py-1.5 rounded-lg text-xs font-medium text-center bg-card text-foreground" style={{ border: '1px solid hsl(var(--border))' }}>{f}</div>
          ))}
        </div>
        <div className="px-5 py-2 rounded-full text-xs font-semibold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
          Free Download — Link in Bio
        </div>
      </div>
    </div>
  );
}

// ─── Email preview ────────────────────────────────────────────────────────────
function EmailPreview() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
      <div className="px-4 py-3 flex items-center gap-3 bg-muted" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="flex gap-1.5">
          {['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--success))'].map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{ background: c, opacity: 0.7 }} />
          ))}
        </div>
        <p className="flex-1 text-center text-xs font-medium text-muted-foreground">{app_launch_kit.email.subject}</p>
      </div>
      <div className="bg-[hsl(var(--banner-bg-start))]" style={{ padding: '32px 24px' }}>
        <div className="text-center mb-8 pb-6" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <img src="/airo-assets/images/logo/horizontal" alt="Spellful" className="h-auto object-contain mx-auto mb-4" style={{ maxHeight: '40px', maxWidth: '160px' }} />
          <div className="w-12 h-px mx-auto" style={{ background: 'hsl(var(--primary) / 0.5)' }} />
        </div>
        <p className="text-sm mb-4 text-foreground">{app_launch_kit.email.greeting}</p>
        <p className="text-sm mb-4 leading-relaxed text-muted-foreground">{app_launch_kit.email.body1}</p>
        <p className="text-sm mb-6 leading-relaxed text-muted-foreground">{app_launch_kit.email.body2}</p>
        <p className="text-sm font-semibold mb-4 text-foreground">{app_launch_kit.email.featuresHeading}</p>
        <div className="flex flex-col gap-3 mb-8">
          {app_launch_kit.email.features.map((f) => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg bg-card">
              <span className="text-lg shrink-0">{f.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs mt-0.5 text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mb-8">
          <a href={app_launch_kit.email.ctaUrl} className="inline-block px-8 py-3 rounded-full text-sm font-semibold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            {app_launch_kit.email.ctaText}
          </a>
        </div>
        <p className="text-sm mb-2 leading-relaxed text-muted-foreground">{app_launch_kit.email.closing}</p>
        <p className="text-sm whitespace-pre-line text-foreground">{app_launch_kit.email.signature}</p>
        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <p className="text-xs text-muted-foreground">
            © 2026 Spellful ·{' '}
            <a href="https://spellful.com/privacy" style={{ color: 'hsl(var(--accent))' }}>Privacy Policy</a>
            {' · '}
            <a href="https://spellful.com" style={{ color: 'hsl(var(--accent))' }}>spellful.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Press release preview ────────────────────────────────────────────────────
function PressReleasePreview() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
      <div className="px-6 py-4 bg-muted" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <p className="text-xs font-mono font-semibold" style={{ color: 'hsl(var(--primary))' }}>{app_launch_kit.pressRelease.dateline}</p>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 leading-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          {app_launch_kit.pressRelease.headline}
        </h3>
        <p className="text-sm mb-5 italic" style={{ color: 'hsl(var(--accent))' }}>{app_launch_kit.pressRelease.subheadline}</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-5 text-muted-foreground">{app_launch_kit.pressRelease.body}</p>
        <div className="p-4 rounded-xl mb-4 bg-muted" style={{ border: '1px solid hsl(var(--border))' }}>
          <p className="text-xs font-semibold mb-1 text-foreground">Boilerplate</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">{app_launch_kit.pressRelease.boilerplate}</p>
        </div>
        <div className="p-4 rounded-xl bg-muted" style={{ border: '1px solid hsl(var(--border))' }}>
          <p className="text-xs font-semibold mb-1 text-foreground">Contact</p>
          <p className="text-xs whitespace-pre-line" style={{ color: 'hsl(var(--accent))' }}>{app_launch_kit.pressRelease.contact}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AppLaunchKitPage() {
  // All copy strings are assembled here as plain JS strings — not passed as props
  const fullPressRelease = [
    app_launch_kit.pressRelease.dateline, '',
    app_launch_kit.pressRelease.headline,
    app_launch_kit.pressRelease.subheadline, '',
    app_launch_kit.pressRelease.body, '', '###', '',
    app_launch_kit.pressRelease.boilerplate, '',
    app_launch_kit.pressRelease.contact,
  ].join('\n');

  const fullEmail = [
    `Subject: ${app_launch_kit.email.subject}`,
    `Preheader: ${app_launch_kit.email.preheader}`, '',
    app_launch_kit.email.greeting, '',
    app_launch_kit.email.body1, '',
    app_launch_kit.email.body2, '',
    app_launch_kit.email.featuresHeading,
    ...app_launch_kit.email.features.map((f) => `${f.emoji} ${f.title} — ${f.desc}`), '',
    app_launch_kit.email.ctaText, app_launch_kit.email.ctaUrl, '',
    app_launch_kit.email.closing, '', app_launch_kit.email.signature,
  ].join('\n');

  const fullBluesky = [
    `Post 1:\n${app_launch_kit.bluesky.post1}`,
    `\nPost 2:\n${app_launch_kit.bluesky.post2}`,
    `\nPost 3:\n${app_launch_kit.bluesky.post3}`,
  ].join('\n');

  return (
    <>
      <Helmet>
        <title>App Launch Marketing Kit — Spellful</title>
        <meta name="description" content="Marketing assets for the Spellful app store launch." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen py-12 px-4 bg-background">
        <div className="max-w-4xl mx-auto">

          {/* ── Header ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
              <Sparkles className="w-3 h-3" />
              <span>{app_launch_kit.hero.badge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              {app_launch_kit.hero.title}
            </h1>
            <p className="text-lg max-w-xl mx-auto text-muted-foreground">
              {app_launch_kit.hero.subtitle}
            </p>
          </div>

          {/* ── Jump nav ── */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { href: '#banner', label: '🖼 Banner' },
              { href: '#instagram', label: '📸 Instagram' },
              { href: '#bluesky', label: '🦋 Bluesky' },
              { href: '#email', label: '✉️ Email' },
              { href: '#press', label: '📰 Press Release' },
            ].map((n) => (
              <a key={n.href} href={n.href} className="px-3 py-1.5 rounded-full text-xs font-medium bg-card text-muted-foreground" style={{ border: '1px solid hsl(var(--border))' }}>
                {n.label}
              </a>
            ))}
            <a href="/app-store-submission" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
              <ExternalLink className="w-3 h-3" /> Submission Metadata
            </a>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              1. PROMOTIONAL BANNER
          ══════════════════════════════════════════════════════════════════ */}
          <section id="banner" className="mb-14 scroll-mt-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                <Download className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {app_launch_kit.banner.sectionTitle}
                </h2>
                <p className="text-sm mt-0.5 text-muted-foreground">{app_launch_kit.banner.sectionNote}</p>
              </div>
            </div>

            <BannerPreview />

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {app_launch_kit.banner.specs.map((s) => (
                <div key={s.id} className="p-3 rounded-xl text-center bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                  <p className="text-xs font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs font-mono mt-1" style={{ color: 'hsl(var(--primary))' }}>{s.size}</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">{s.format}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-foreground">Banner Headline</p>
                  <InlineCopy copyText="Your Witchcraft Companion Has Arrived" />
                </div>
                <p className="text-sm text-card-foreground">{app_launch_kit.banner.headline}</p>
              </div>
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-foreground">Subheadline</p>
                  <InlineCopy copyText="Tarot · Astrology · Moon Magic · Grimoire" />
                </div>
                <p className="text-sm text-card-foreground">{app_launch_kit.banner.subheadline}</p>
              </div>
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-foreground">CTA Button Text</p>
                  <InlineCopy copyText="Download Free on iOS & Android" />
                </div>
                <p className="text-sm text-card-foreground">{app_launch_kit.banner.cta}</p>
              </div>
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-foreground">Supporting Tagline</p>
                  <InlineCopy copyText="Personalized horoscopes. 78-card tarot. Lunar rituals. All in one sacred space." />
                </div>
                <p className="text-sm text-card-foreground">{app_launch_kit.banner.tagline}</p>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              2. INSTAGRAM
          ══════════════════════════════════════════════════════════════════ */}
          <section id="instagram" className="mb-14 scroll-mt-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'hsl(var(--primary))' }} aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {app_launch_kit.instagram.sectionTitle}
                </h2>
                <p className="text-sm mt-0.5 text-muted-foreground">{app_launch_kit.instagram.sectionNote}</p>
              </div>
            </div>

            <InstagramPreview />

            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Feed Post Caption</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">Paste directly into Instagram — includes hashtags</p>
                  </div>
                  <InlineCopy copyText="✨ Spellful is now available on iOS & Android ✨\n\nYour complete witchcraft companion is here. Personalized daily horoscopes tailored to your birth chart. All 78 tarot cards with original artwork. Moon rituals for every lunar phase. A private grimoire to hold your practice.\n\nThis is the app we've been building for you — and it's finally ready.\n\n🌙 Download free at the link in bio\n\n#Spellful #WitchcraftApp #TarotApp #Astrology #MoonMagic #Grimoire #DailyHoroscope #WitchesOfInstagram #SpiritualApp #NewApp #AppLaunch #Tarot #BirthChart #LunarCalendar #WitchTok" />
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">{app_launch_kit.instagram.postCaption}</p>
              </div>
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Story Caption / Swipe-Up Text</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">For Instagram Stories with link sticker</p>
                  </div>
                  <InlineCopy copyText="Spellful is LIVE 🌙\n\nSwipe up to download your witchcraft companion — tarot, horoscopes, moon rituals & grimoire journaling, all in one place.\n\nFree on iOS & Android." />
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">{app_launch_kit.instagram.storyCaption}</p>
              </div>
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Image Alt Text (accessibility)</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">Add in Instagram's alt text field when posting</p>
                  </div>
                  <InlineCopy copyText="Spellful app launch announcement — dark mystical background with gold text reading Your Witchcraft Companion Has Arrived, featuring tarot card and moon phase imagery" />
                </div>
                <p className="text-sm text-card-foreground">{app_launch_kit.instagram.altText}</p>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              3. BLUESKY
          ══════════════════════════════════════════════════════════════════ */}
          <section id="bluesky" className="mb-14 scroll-mt-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                <BlueSkyIcon className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {app_launch_kit.bluesky.sectionTitle}
                </h2>
                <p className="text-sm mt-0.5 text-muted-foreground">{app_launch_kit.bluesky.sectionNote}</p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
              <div className="px-4 py-3 flex items-center gap-2 bg-muted" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <BlueSkyIcon className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
                <span className="text-xs font-semibold text-foreground">@spellful.com · Thread (3 posts)</span>
                <div className="ml-auto">
                  <InlineCopy copyText={fullBluesky} label="Copy all 3" />
                </div>
              </div>
              {/* Post 1 */}
              <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.2)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-foreground">spellful.com</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{app_launch_kit.bluesky.post1.length}/300</span>
                        <InlineCopy copyText="✨ Spellful is live on iOS & Android ✨\n\nPersonalized daily horoscopes. 78-card tarot with original artwork. Moon rituals. A private grimoire. Your complete witchcraft companion is finally here.\n\nFree to download 🌙" />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">{app_launch_kit.bluesky.post1}</p>
                  </div>
                </div>
              </div>
              {/* Post 2 */}
              <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.2)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-foreground">spellful.com</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{app_launch_kit.bluesky.post2.length}/300</span>
                        <InlineCopy copyText="What's inside Spellful:\n\n🃏 78-card tarot deck — 5 spreads, original artwork\n⭐ Birth chart & synastry (VSOP87 accuracy)\n🌙 Moon ritual planner — 48 rituals\n📖 Personal grimoire & dream journal\n🔮 Spellful Academy — 22 lessons\n\nAll free. No ads." />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">{app_launch_kit.bluesky.post2}</p>
                  </div>
                </div>
              </div>
              {/* Post 3 */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.2)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>3</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-foreground">spellful.com</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{app_launch_kit.bluesky.post3.length}/300</span>
                        <InlineCopy copyText="We built Spellful for practitioners of every level — curious beginners to seasoned witches.\n\nAstronomically accurate. Original artwork. Private & secure.\n\nDownload at spellful.com 🌙\n\n#Spellful #Witchcraft #Tarot #Astrology #MoonMagic" />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">{app_launch_kit.bluesky.post3}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              4. EMAIL
          ══════════════════════════════════════════════════════════════════ */}
          <section id="email" className="mb-14 scroll-mt-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                <Mail className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {app_launch_kit.email.sectionTitle}
                </h2>
                <p className="text-sm mt-0.5 text-muted-foreground">{app_launch_kit.email.sectionNote}</p>
              </div>
            </div>

            <div className="flex justify-end mb-3">
              <InlineCopy copyText={fullEmail} label="Copy full email" />
            </div>

            <EmailPreview />

            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Subject Line</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">Paste into your email platform's subject field</p>
                  </div>
                  <InlineCopy copyText="Spellful is live — your witchcraft companion has arrived 🌙" />
                </div>
                <p className="text-sm text-card-foreground">{app_launch_kit.email.subject}</p>
              </div>
              <div className="rounded-xl p-4 bg-card" style={{ border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Preheader Text</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">Preview text shown in inbox before opening</p>
                  </div>
                  <InlineCopy copyText="Personalized horoscopes, 78-card tarot, moon rituals, and your private grimoire. Download free today." />
                </div>
                <p className="text-sm text-card-foreground">{app_launch_kit.email.preheader}</p>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              5. PRESS RELEASE
          ══════════════════════════════════════════════════════════════════ */}
          <section id="press" className="mb-14 scroll-mt-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                <FileText className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {app_launch_kit.pressRelease.sectionTitle}
                </h2>
                <p className="text-sm mt-0.5 text-muted-foreground">{app_launch_kit.pressRelease.sectionNote}</p>
              </div>
            </div>

            <div className="flex justify-end mb-3">
              <InlineCopy copyText={fullPressRelease} label="Copy full press release" />
            </div>

            <PressReleasePreview />

            <div className="mt-4 rounded-xl p-4" style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>
                <Megaphone className="w-4 h-4 inline mr-1.5" />
                Suggested press targets
              </p>
              <div className="flex flex-wrap gap-2">
                {['TechCrunch', 'The Verge', 'Mashable', 'Bustle', 'Refinery29', 'Well+Good', 'Autostraddle', 'Witch Way Magazine', 'Sabat Magazine', 'Nylon', 'Allure'].map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-card text-muted-foreground" style={{ border: '1px solid hsl(var(--border))' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── Footer ── */}
          <div className="text-center pb-8 flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-3">
              <a href="/app-store-submission"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
                <ExternalLink className="w-4 h-4" /> App Store Metadata
              </a>
              <a href="/app-store-screenshots"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-card text-muted-foreground"
                style={{ border: '1px solid hsl(var(--border))' }}>
                <ExternalLink className="w-4 h-4" /> Screenshot Guide
              </a>
            </div>
            <p className="text-xs text-muted-foreground">This page is noindexed and for internal use only.</p>
          </div>

        </div>
      </main>
    </>
  );
}
