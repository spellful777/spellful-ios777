import { Helmet } from '@dr.pogodin/react-helmet';
import { useState } from 'react';
import { Check, Copy, ExternalLink, Smartphone, Tablet, Tag, FileText, Globe, Star, BookOpen, Moon, Users, Sparkles } from 'lucide-react';
import { app_store_submission } from 'virtual:content';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
      style={{
        background: copied ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--primary) / 0.12)',
        color: copied ? 'hsl(var(--success))' : 'hsl(var(--primary))',
        border: `1px solid ${copied ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--primary) / 0.25)'}`,
      }}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

interface InlineMetaFieldProps {
  label: string;
  children: string;
  limit?: number;
  multiline?: boolean;
  note?: string;
}

function InlineMetaField({ label, children, limit, multiline, note }: InlineMetaFieldProps) {
  const charCount = children.length;
  const overLimit = limit ? charCount > limit : false;
  return (
    <div className="rounded-xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{label}</p>
          {note && <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{note}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {limit && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{
                background: overLimit ? 'hsl(var(--destructive) / 0.15)' : 'hsl(var(--muted))',
                color: overLimit ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {charCount}/{limit}
            </span>
          )}
          <CopyButton text={children} />
        </div>
      </div>
      {multiline ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'hsl(var(--card-foreground))' }}>{children}</p>
      ) : (
        <p className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>{children}</p>
      )}
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ icon, title, subtitle, children }: SectionProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
          <span style={{ color: 'hsl(var(--primary))' }}>{icon}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{title}</h2>
          {subtitle && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

const GOOGLE_KEYWORDS = [
  'tarot card reading', 'daily horoscope', 'birth chart calculator', 'moon phase calendar',
  'grimoire journal', 'astrology app', 'witchcraft app', 'numerology reading',
  'rune casting', 'lunar calendar', 'zodiac signs', 'spell book',
  'moon ritual', 'crystal guide', 'shadow work journal',
];

export default function AppStoreSubmissionPage() {
  if (!app_store_submission.identity) return null;

  return (
    <>
      <Helmet>
        <title>App Store Submission — Spellful</title>
        <meta name="description" content="Complete App Store submission metadata for Spellful." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen py-12 px-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
              <Sparkles className="w-3 h-3" />
              <span>{app_store_submission.hero.badge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {app_store_submission.hero.title}
            </h1>
            <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {app_store_submission.hero.subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-5">
              {[
                { icon: <Smartphone className="w-3.5 h-3.5" />, label: 'iOS / App Store' },
                { icon: <Tablet className="w-3.5 h-3.5" />, label: 'Android / Google Play' },
              ].map((badge) => (
                <span key={badge.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'hsl(var(--card))', color: 'hsl(var(--accent))', border: '1px solid hsl(var(--border))' }}>
                  {badge.icon}{badge.label}
                </span>
              ))}
            </div>
          </div>

          {/* App Identity */}
          <Section icon={<Star className="w-4 h-4" />} title="App Identity" subtitle="Core listing fields — used on both stores">
            <InlineMetaField label="App Name" limit={30}>{app_store_submission.identity.appName}</InlineMetaField>
            <InlineMetaField label="Subtitle (iOS) / Short Description (Google Play)" limit={30} note="Appears below the app name in search results">{app_store_submission.identity.subtitle}</InlineMetaField>
            <InlineMetaField label="Bundle ID / Package Name">{app_store_submission.identity.bundleId}</InlineMetaField>
          </Section>

          {/* Category */}
          <Section icon={<Tag className="w-4 h-4" />} title="Category" subtitle="Primary and secondary app categories">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InlineMetaField label="Primary Category (iOS)">{app_store_submission.categories.iosPrimary}</InlineMetaField>
              <InlineMetaField label="Secondary Category (iOS)">{app_store_submission.categories.iosSecondary}</InlineMetaField>
              <InlineMetaField label="Primary Category (Google Play)">{app_store_submission.categories.googlePrimary}</InlineMetaField>
              <InlineMetaField label="Content Rating" note="No objectionable content">{app_store_submission.categories.contentRating}</InlineMetaField>
            </div>
          </Section>

          {/* Descriptions */}
          <Section icon={<FileText className="w-4 h-4" />} title="Descriptions" subtitle="Copy-ready for both stores">
            <InlineMetaField label="Promotional Text (iOS only — 170 chars)" limit={170}>
              {app_store_submission.descriptions.promotional}
            </InlineMetaField>
            <InlineMetaField label="Short Description (Google Play — 80 chars)" limit={80} note="Appears in search results on Google Play">
              {app_store_submission.descriptions.short}
            </InlineMetaField>
            <InlineMetaField label="Full Description (both stores — 4000 chars max)" limit={4000} multiline note="Apple App Store & Google Play — paste as-is">
              {app_store_submission.descriptions.full}
            </InlineMetaField>
            <InlineMetaField label="What's New / Release Notes" multiline note="For version 1.0 initial release">
              {app_store_submission.descriptions.whatsNew}
            </InlineMetaField>
          </Section>

          {/* Keywords */}
          <Section icon={<BookOpen className="w-4 h-4" />} title="Keywords & Discoverability" subtitle="Optimized for search ranking on both stores">
            <InlineMetaField label="iOS Keywords (100 chars max — comma separated, no spaces)" limit={100} note="Apple App Store Connect keyword field">
              {app_store_submission.keywords.ios}
            </InlineMetaField>
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Google Play Keywords</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Weave naturally into your full description — Google indexes the description text</p>
                </div>
                <CopyButton text={GOOGLE_KEYWORDS.join(', ')} />
              </div>
              <div className="flex flex-wrap gap-2">
                {GOOGLE_KEYWORDS.map((kw) => (
                  <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--accent))' }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </Section>

          {/* URLs */}
          <Section icon={<Globe className="w-4 h-4" />} title="URLs" subtitle="Required links for both stores">
            {[
              { label: 'Marketing URL', value: app_store_submission.urls.marketing, note: 'Your main website' },
              { label: 'Support URL', value: app_store_submission.urls.support, note: 'Required by Apple — must be a working URL' },
              { label: 'Privacy Policy URL', value: app_store_submission.urls.privacy, note: 'Required by both stores — GDPR & CCPA compliant' },
            ].map((u) => (
              <div key={u.label} className="rounded-xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{u.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{u.note}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={u.value} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md"
                      style={{ color: 'hsl(var(--accent))', background: 'hsl(var(--accent) / 0.1)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                      <ExternalLink className="w-3 h-3" /> Verify
                    </a>
                    <CopyButton text={u.value} />
                  </div>
                </div>
                <p className="text-sm font-medium mt-2" style={{ color: 'hsl(var(--primary))' }}>{u.value}</p>
              </div>
            ))}
          </Section>

          {/* Screenshot Requirements */}
          <Section icon={<Smartphone className="w-4 h-4" />} title="Screenshot Requirements" subtitle="Sizes required for App Store Connect & Google Play">
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Apple App Store — Required Sizes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {app_store_submission.SCREENSHOT_SIZES_APPLE.map((s) => (
                  <div key={s.device} className="p-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{s.device}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'hsl(var(--primary))' }}>{s.size}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.note}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Google Play — Required Sizes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {app_store_submission.SCREENSHOT_SIZES_GOOGLE.map((s) => (
                  <div key={s.device} className="p-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{s.device}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'hsl(var(--primary))' }}>{s.size}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Recommended Screenshot Screens */}
          <Section icon={<Moon className="w-4 h-4" />} title="Recommended Screenshot Screens" subtitle="6 screens that showcase Spellful's core value">
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex flex-col gap-3">
                {app_store_submission.SCREENSHOT_SCREENS.map((s, idx) => (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                    <span className="text-2xl font-bold shrink-0 w-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--primary) / 0.4)' }}>{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{s.screen}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Age Rating */}
          <Section icon={<Users className="w-4 h-4" />} title="Age Rating & Content" subtitle="For App Store Connect questionnaire">
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {app_store_submission.AGE_RATING.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.question}</p>
                    <span className="text-xs font-semibold shrink-0"
                      style={{ color: item.answer === 'None' ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                      {item.answer}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: 'hsl(var(--success) / 0.1)', border: '1px solid hsl(var(--success) / 0.2)' }}>
                <Check className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--success))' }} />
                <p className="text-xs font-medium" style={{ color: 'hsl(var(--success))' }}>
                  Recommended rating: <strong>4+ (iOS)</strong> / <strong>Everyone (Google Play)</strong>
                </p>
              </div>
            </div>
          </Section>

          {/* Pre-Submission Checklist */}
          <Section icon={<Check className="w-4 h-4" />} title="Pre-Submission Checklist" subtitle="Verify before submitting to either store">
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex flex-col gap-2">
                {app_store_submission.CHECKLIST.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 py-1.5">
                    <div className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    </div>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {item.item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Footer */}
          <div className="text-center mt-8 pb-8 flex flex-col items-center gap-4">
            <a href="/app-store-screenshots"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
              <Smartphone className="w-4 h-4" />
              View Screenshot Guide
            </a>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {app_store_submission.footer}
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
