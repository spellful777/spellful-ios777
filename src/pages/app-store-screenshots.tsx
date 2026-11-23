import { Helmet } from '@dr.pogodin/react-helmet';
import { Smartphone, Tablet, Download, ExternalLink } from 'lucide-react';
import { app_store_screenshots } from 'virtual:content';

interface ScreenMockupProps {
  number: string;
  headline: string;
  subheadline: string;
  description: string;
  url: string;
  tags: string;
  device: string;
}

function ScreenMockup({ number, headline, subheadline, description, url, tags, device }: ScreenMockupProps) {
  const isTablet = device === 'tablet';
  const accentStyle = isTablet ? 'hsl(var(--accent))' : 'hsl(var(--primary))';
  const tagList = tags.split(',').map((t) => t.trim());

  return (
    <div className="flex flex-col" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '1.25rem', overflow: 'hidden' }}>
      {/* Mockup frame */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
          minHeight: isTablet ? '220px' : '280px',
          padding: '24px',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 50% 50%, ${accentStyle}18 0%, transparent 70%)`,
        }} />

        {/* Device shell */}
        <div
          className="relative flex flex-col bg-[hsl(var(--device-shell))]"
          style={{
            width: isTablet ? '200px' : '140px',
            height: isTablet ? '150px' : '240px',
            borderRadius: isTablet ? '12px' : '20px',
            border: '2px solid hsl(var(--border))',
            boxShadow: '0 20px 60px hsl(var(--background) / 0.9), 0 0 0 1px hsl(var(--border))',
            overflow: 'hidden',
          }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0 bg-[hsl(var(--device-statusbar))]">
            <span className="text-[8px] font-semibold" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>9:41</span>
            <div className="w-3 h-1.5 rounded-sm" style={{ background: 'hsl(var(--success))', opacity: 0.8 }} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accentStyle}20` }}>
              {isTablet ? <Tablet className="w-5 h-5" style={{ color: accentStyle }} /> : <Smartphone className="w-5 h-5" style={{ color: accentStyle }} />}
            </div>
            <div className="w-full flex flex-col gap-1.5">
              <div className="h-1.5 rounded-full w-3/4 mx-auto" style={{ background: `${accentStyle}40` }} />
              <div className="h-1 rounded-full w-full" style={{ background: 'hsl(var(--border))' }} />
              <div className="h-1 rounded-full w-5/6" style={{ background: 'hsl(var(--border))' }} />
              <div className="h-1 rounded-full w-4/6" style={{ background: 'hsl(var(--border))' }} />
            </div>
            <div className="grid grid-cols-2 gap-1 w-full mt-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-6 rounded-md" style={{ background: i % 2 === 0 ? `${accentStyle}15` : 'hsl(var(--muted))' }} />
              ))}
            </div>
          </div>
          <div className="flex justify-center pb-2 shrink-0">
            <div className="w-8 h-1 rounded-full" style={{ background: 'hsl(var(--foreground) / 0.2)' }} />
          </div>
        </div>

        {/* Number badge */}
        <div className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: accentStyle, color: 'hsl(var(--primary-foreground))' }}>
          {number}
        </div>

        {/* Device badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          {isTablet ? <Tablet className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
          {isTablet ? 'iPad' : 'iPhone'}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2">
        <div>
          <p className="text-base font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {headline}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: accentStyle }}>
            {subheadline}
          </p>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tagList.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-xs"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              {tag}
            </span>
          ))}
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs mt-1 w-fit"
          style={{ color: 'hsl(var(--accent))' }}>
          <ExternalLink className="w-3 h-3" />
          <span>Preview: {url}</span>
        </a>
      </div>
    </div>
  );
}

export default function AppStoreScreenshotsPage() {

  return (
    <>
      <Helmet>
        <title>App Store Screenshots — Spellful</title>
        <meta name="description" content="App Store screenshot guide for Spellful." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen py-12 px-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
              <Smartphone className="w-3 h-3" />
              <span>{app_store_screenshots.hero.badge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {app_store_screenshots.hero.title}
            </h1>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {app_store_screenshots.hero.subtitle}
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {app_store_screenshots.sizes.map((s) => (
                <div key={s.id} className="px-3 py-2 rounded-lg text-center"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <p className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>{s.label}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.size}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tools note */}
          <div className="rounded-xl p-4 mb-10 flex flex-wrap items-center gap-3"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <Download className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{app_store_screenshots.toolsNote.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{app_store_screenshots.toolsNote.tools}</p>
            </div>
          </div>

          {/* iPhone screens */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                iPhone Screens
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                6 screens
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {app_store_screenshots.screens.map((s) => (
                <div key={s.id} className={s.device === 'tablet' ? 'hidden' : undefined}>
                  <ScreenMockup {...s} />
                </div>
              ))}
            </div>
          </div>

          {/* iPad screens */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Tablet className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                iPad Screens
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--accent))' }}>
                3 screens
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {app_store_screenshots.screens.map((s) => (
                <div key={s.id} className={s.device === 'phone' ? 'hidden' : undefined}>
                  <ScreenMockup {...s} />
                </div>
              ))}
            </div>
          </div>

          {/* Caption copy */}
          <div className="rounded-xl p-5 mb-8" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {app_store_screenshots.captionsSectionTitle}
            </h3>
            <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {app_store_screenshots.captionsSectionNote}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {app_store_screenshots.screens.map((s) => (
                <div key={s.id} className="p-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Screen {s.number}</p>
                  <p className="text-sm font-bold leading-tight" style={{ color: 'hsl(var(--foreground))' }}>{s.headline}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--accent))' }}>{s.subheadline}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pb-8">
            <a href="/app-store-submission"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
              <ExternalLink className="w-4 h-4" />
              <span>{app_store_screenshots.footerLink}</span>
            </a>
            <p className="text-xs mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {app_store_screenshots.footerNote}
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
