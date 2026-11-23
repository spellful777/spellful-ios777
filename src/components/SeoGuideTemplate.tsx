/**
 * Chrome pieces for the 12 standalone SEO guide pages at /seo-guides/*.
 * SeoGuideShell: wraps the page with branded header, footer, and styles.
 * SeoGuideCtaButton: gold CTA button (chrome — no content props).
 * SeoGuideClosingPanel: closing invitation panel (chrome — no content props).
 *
 * No content values are passed as props here. Each page renders its own
 * Helmet, h1, intro, and sections inline using virtual:content leaf expressions.
 */

import { Helmet } from '@dr.pogodin/react-helmet';
import { type ReactNode } from 'react';

// ── Deterministic star positions ──────────────────────────────────────────────

const STARS: Array<{ top: string; left: string; size: number; delay: number; dur: number }> = [
  { top: '8%',  left: '12%', size: 2, delay: 0,   dur: 5 },
  { top: '15%', left: '78%', size: 1, delay: 1.2, dur: 7 },
  { top: '22%', left: '45%', size: 2, delay: 2.4, dur: 6 },
  { top: '6%',  left: '60%', size: 1, delay: 0.8, dur: 8 },
  { top: '30%', left: '88%', size: 2, delay: 3.1, dur: 5 },
  { top: '18%', left: '25%', size: 1, delay: 1.7, dur: 9 },
  { top: '12%', left: '92%', size: 2, delay: 0.4, dur: 6 },
  { top: '35%', left: '5%',  size: 1, delay: 2.9, dur: 7 },
  { top: '5%',  left: '35%', size: 2, delay: 1.5, dur: 5 },
  { top: '28%', left: '68%', size: 1, delay: 3.8, dur: 8 },
  { top: '40%', left: '50%', size: 1, delay: 0.6, dur: 6 },
  { top: '10%', left: '55%', size: 2, delay: 4.2, dur: 7 },
  { top: '20%', left: '8%',  size: 1, delay: 2.0, dur: 9 },
  { top: '32%', left: '82%', size: 2, delay: 1.1, dur: 5 },
  { top: '7%',  left: '72%', size: 1, delay: 3.5, dur: 8 },
  { top: '25%', left: '38%', size: 2, delay: 0.9, dur: 6 },
  { top: '42%', left: '20%', size: 1, delay: 4.6, dur: 7 },
  { top: '14%', left: '95%', size: 2, delay: 2.7, dur: 5 },
  { top: '38%', left: '62%', size: 1, delay: 1.3, dur: 9 },
  { top: '3%',  left: '48%', size: 2, delay: 3.3, dur: 6 },
];

// ── Shared scoped styles ──────────────────────────────────────────────────────

const GUIDE_STYLES = `
  .spellful-seo-guide-page header:not(.spellful-seo-guide__header),
  .spellful-seo-guide-page footer:not(.spellful-seo-guide__footer),
  .spellful-seo-guide-page nav[aria-label="Main navigation"],
  .spellful-seo-guide-page [data-mobile-bottom-nav],
  .spellful-seo-guide-page [data-back-to-top],
  .spellful-seo-guide-page [data-recently-visited],
  .spellful-seo-guide-page [data-breadcrumbs] {
    display: none !important;
  }
  .spellful-seo-guide {
    min-height: 100vh;
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: var(--font-sans);
  }
  .spellful-seo-guide__header {
    position: relative;
    overflow: hidden;
    padding: 3rem 1.25rem 2.5rem;
    text-align: center;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, hsl(259 39% 14% / 0.9) 0%, hsl(var(--background)) 100%);
    border-bottom: 1px solid hsl(var(--border));
  }
  .spellful-seo-guide__logo-halo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 320px;
    height: 120px;
    background: radial-gradient(ellipse at center, hsl(44 54% 54% / 0.18) 0%, transparent 70%);
    pointer-events: none;
    animation: seo-guide-halo-shimmer 6s ease-in-out infinite;
  }
  @keyframes seo-guide-halo-shimmer {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .spellful-seo-guide__logo-halo { animation: none; }
  }
  .spellful-seo-guide__logo-link {
    position: relative;
    display: inline-block;
    z-index: 1;
  }
  .spellful-seo-guide__logo-img {
    display: block;
    width: auto;
    height: auto;
    max-height: 56px;
    max-width: 220px;
    object-fit: contain;
  }
  @media (min-width: 640px) {
    .spellful-seo-guide__logo-img {
      max-height: 72px;
      max-width: 320px;
    }
  }
  .spellful-seo-guide__stars {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .spellful-seo-guide__star {
    position: absolute;
    border-radius: 50%;
    background: hsl(44 54% 80%);
    animation: seo-guide-twinkle var(--dur, 6s) ease-in-out infinite;
    animation-delay: var(--delay, 0s);
  }
  @keyframes seo-guide-twinkle {
    0%, 100% { opacity: 0.15; transform: scale(0.8); }
    50% { opacity: 0.9; transform: scale(1.2); }
  }
  @media (prefers-reduced-motion: reduce) {
    .spellful-seo-guide__star { animation: none; opacity: 0.4; }
  }
  .spellful-seo-guide__hero {
    padding: 2.5rem 1.25rem 0;
    text-align: center;
    max-width: 760px;
    margin: 0 auto;
  }
  .spellful-seo-guide__eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: hsl(var(--primary));
    font-family: var(--font-sans);
    margin-bottom: 0.75rem;
  }
  .spellful-seo-guide__h1 {
    font-family: var(--font-heading);
    font-size: clamp(1.75rem, 5vw, 2.75rem);
    line-height: 1.2;
    color: hsl(var(--foreground));
    margin-bottom: 0;
  }
  .spellful-seo-guide__article {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.25rem 3rem;
  }
  .spellful-seo-guide__intro {
    font-size: 1.0625rem;
    line-height: 1.75;
    color: hsl(var(--muted-foreground));
    font-weight: 300;
    margin-bottom: 1.5rem;
  }
  .spellful-seo-guide__section-heading {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    color: hsl(var(--foreground));
    margin: 2.25rem 0 0.75rem;
    padding-top: 0.25rem;
    border-top: 1px solid hsl(var(--border));
  }
  .spellful-seo-guide__section-body {
    font-size: 1rem;
    line-height: 1.75;
    color: hsl(var(--muted-foreground));
    font-weight: 300;
  }
  .spellful-seo-guide__cta-wrap {
    margin: 2rem 0;
    text-align: center;
  }
  .spellful-seo-guide__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0.75rem 2rem;
    border-radius: 9999px;
    font-family: var(--font-sans);
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-decoration: none;
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border: 2px solid hsl(var(--primary));
    box-shadow: 0 0 18px hsl(44 54% 54% / 0.25);
    transition: box-shadow 0.2s ease, background 0.2s ease;
  }
  .spellful-seo-guide__cta:hover,
  .spellful-seo-guide__cta:focus-visible {
    background: hsl(44 54% 62%);
    box-shadow: 0 0 28px hsl(44 54% 54% / 0.45);
    outline: 2px solid hsl(var(--primary));
    outline-offset: 3px;
  }
  .spellful-seo-guide__cta-sub {
    margin-top: 0.6rem;
    font-size: 0.8125rem;
    color: hsl(var(--muted-foreground));
    font-family: var(--font-sans);
  }
  .spellful-seo-guide__closing {
    position: relative;
    overflow: hidden;
    max-width: 720px;
    margin: 0 auto 3rem;
    padding: 2.5rem 1.5rem;
    border-radius: 1rem;
    text-align: center;
    background: linear-gradient(135deg, hsl(259 39% 12%) 0%, hsl(248 41% 10%) 100%);
    border: 1px solid hsl(44 54% 54% / 0.25);
  }
  .spellful-seo-guide__closing-star {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: hsl(44 54% 80%);
    animation: seo-guide-twinkle 5s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .spellful-seo-guide__closing-star { animation: none; opacity: 0.4; }
  }
  .spellful-seo-guide__closing-invite {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    color: hsl(var(--foreground));
    margin-bottom: 1.25rem;
  }
  .spellful-seo-guide__footer {
    text-align: center;
    padding: 1.5rem 1.25rem 2rem;
    border-top: 1px solid hsl(var(--border));
    font-size: 0.8125rem;
    color: hsl(var(--muted-foreground));
    font-family: var(--font-sans);
  }
  .spellful-seo-guide__footer a {
    color: hsl(var(--primary));
    text-decoration: underline;
    text-underline-offset: 2px;
    margin: 0 0.5rem;
  }
  .spellful-seo-guide__footer a:hover,
  .spellful-seo-guide__footer a:focus-visible {
    color: hsl(44 54% 70%);
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
    border-radius: 2px;
  }
  .spellful-seo-guide__sep {
    border: none;
    border-top: 1px solid hsl(var(--border));
    margin: 2rem 0;
  }
`;

// ── CTA Button — chrome only, slug is a static string literal from the page ──

export function SeoGuideCtaButton({ position, slug }: { position: 'intro' | 'conclusion'; slug: string }) {
  function handleClick() {
    if (typeof window !== 'undefined' && window._allowCT) {
      window._signalsDataLayer = window._signalsDataLayer || [];
      window._signalsDataLayer.push({
        schema: 'add_event',
        version: 'v1',
        data: { event: 'seo_guide_cta_click', article_slug: slug, cta_position: position },
      });
    }
  }
  return (
    <div className="spellful-seo-guide__cta-wrap">
      <a href="https://spellful.com/" className="spellful-seo-guide__cta" onClick={handleClick}>
        Join Spellful Free
      </a>
      <p className="spellful-seo-guide__cta-sub">
        Explore tarot, astrology, moon guidance, and more on Spellful.
      </p>
    </div>
  );
}

// ── Closing panel — chrome only ───────────────────────────────────────────────

export function SeoGuideClosingPanel({ slug }: { slug: string }) {
  return (
    <div className="spellful-seo-guide__closing">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="spellful-seo-guide__closing-star"
          style={{ left: `${10 + i * 20}%`, top: `${15 + (i % 3) * 25}%`, animationDelay: `${i * 0.8}s` }}
          aria-hidden="true"
        />
      ))}
      <p className="spellful-seo-guide__closing-invite">Ready to explore your own magical practice?</p>
      <SeoGuideCtaButton position="conclusion" slug={slug} />
    </div>
  );
}

// ── Page shell — chrome only, no content props ────────────────────────────────

interface SeoGuideShellProps {
  /** Static string literals from the page — NOT content-rooted values */
  canonicalUrl: string;
  slug: string;
  children: ReactNode;
}

export function SeoGuideShell({ canonicalUrl, slug, children }: SeoGuideShellProps) {
  return (
    <>
      <Helmet>
        <body className="spellful-seo-guide-page" />
        <style>{GUIDE_STYLES}</style>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index,follow" />
      </Helmet>

      <div className="spellful-seo-guide">
        <header className="spellful-seo-guide__header" role="banner">
          <div className="spellful-seo-guide__stars" aria-hidden="true">
            {STARS.map((s, i) => (
              <span
                key={i}
                className="spellful-seo-guide__star"
                style={{
                  top: s.top,
                  left: s.left,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  ['--delay' as string]: `${s.delay}s`,
                  ['--dur' as string]: `${s.dur}s`,
                }}
              />
            ))}
          </div>
          <div className="spellful-seo-guide__logo-halo" aria-hidden="true" />
          <a href="https://spellful.com/" className="spellful-seo-guide__logo-link" aria-label="Spellful — Home">
            <img
              src="/airo-assets/images/logo/horizontal"
              alt="Spellful"
              className="spellful-seo-guide__logo-img"
              width="260"
              height="72"
              loading="eager"
              fetchPriority="high"
            />
          </a>
        </header>

        <main id="main-content">
          {children}
          <SeoGuideClosingPanel slug={slug} />
        </main>

        <footer className="spellful-seo-guide__footer" role="contentinfo">
          <p><strong>Spellful</strong> &mdash; Free magical tools and learning.</p>
          <p style={{ marginTop: '0.5rem' }}>
            <a href="https://spellful.com/privacy">Privacy Policy</a>
            <a href="https://spellful.com/terms">Terms of Use</a>
            <a href="https://spellful.com/">Visit Spellful</a>
          </p>
          <p style={{ marginTop: '0.5rem' }}>&copy; {new Date().getFullYear()} Spellful. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
