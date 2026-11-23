import { useState, type ReactElement } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { about } from 'virtual:content';
import { ContentListContext } from '@airo/content';

// ── Route maps (keep content values off Link props) ───────────────────────────

const TOOL_ROUTES: Record<string, string> = {
  t1: '/birth-chart',
  t2: '/moon-calendar',
  t3: '/tarot',
  t4: '/numerology',
  t5: '/spells',
  t6: '/learn',
};

const CLOSING_ROUTES: Record<string, string> = {
  cl1: '/resources',
  cl2: '/learn',
  cl3: '/community',
};

const PRIVACY_ROUTES: Record<string, string> = {
  l1: '/privacy',
  l2: '/terms',
};

// ── Small inline icons ────────────────────────────────────────────────────────

function IconAstrology() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
    </svg>
  );
}
function IconMoon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
function IconTarot() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M12 7v5m0 0l-2-2m2 2l2-2"/>
    </svg>
  );
}
function IconNumerology() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h10"/>
    </svg>
  );
}
function IconSpells() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z"/>
    </svg>
  );
}
function IconLearn() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

const TOOL_ICONS: Record<string, ReactElement> = {
  astrology: <IconAstrology />,
  moon: <IconMoon />,
  tarot: <IconTarot />,
  numerology: <IconNumerology />,
  spells: <IconSpells />,
  learn: <IconLearn />,
};

// ── Apple / Android logos ─────────────────────────────────────────────────────

function AppleLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 814 1000" fill="currentColor" aria-label="Apple" role="img">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 405.8 15.5 307.6 15.5 213.1c0-149.9 97.8-229.3 194.3-229.3 51.3 0 94.3 33.7 126.9 33.7 31.2 0 79.9-35.7 140.8-35.7 22.5 0 108.1 1.9 166.3 81.2zm-107.4-102.1c24.4-29 41.2-69.7 41.2-110.4 0-5.6-.5-11.3-1.5-16.9-39.3 1.5-86.2 26.2-114.4 58.7-22.4 25.4-41.3 65.5-41.3 106.8 0 6.1.6 12.3 1.5 18.1 4.3.6 8.7 1.5 13.1 1.5 35.7 0 81.1-23.7 101.4-57.8z"/>
    </svg>
  );
}

function AndroidLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-label="Android" role="img">
      <path d="M17.523 15.341a.5.5 0 0 1-.5.5H6.977a.5.5 0 0 1-.5-.5V9.5h11.046v5.841zM7.5 18.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM3.5 9.5a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0-1-1zm17 0a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0-1-1zM15.3 3.1l1.4-2.4a.3.3 0 0 0-.52-.3l-1.42 2.46A7.5 7.5 0 0 0 12 2.5a7.5 7.5 0 0 0-2.76.36L7.82.4a.3.3 0 0 0-.52.3l1.4 2.4A7.5 7.5 0 0 0 4.5 9h15a7.5 7.5 0 0 0-4.2-5.9zM9.5 7a.75.75 0 1 1 0-1.5A.75.75 0 0 1 9.5 7zm5 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/>
    </svg>
  );
}

// ── Thin divider ──────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3 py-2" aria-hidden="true">
      <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
      <span className="text-base" style={{ color: 'hsl(var(--primary) / 0.5)' }}>✦</span>
      <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
    </div>
  );
}

// ── Static TOC (chrome strings — not editable content) ───────────────────────
const TOC_ITEMS = [
  { id: 'about', label: 'About Spellful' },
  { id: 'mission', label: 'Why We Created Spellful' },
  { id: 'how-it-works', label: 'How Spellful Works' },
  { id: 'calculations', label: 'How Information Is Calculated' },
  { id: 'sources', label: 'Sources & Trust' },
  { id: 'privacy', label: 'Your Account & Privacy' },
  { id: 'faq', label: 'FAQ' },
  { id: 'mobile', label: 'Spellful on the Go' },
];

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/about`;

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string>('g1');

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faqpage`,
    name: 'Spellful FAQ',
    url: pageUrl,
    mainEntity: about.faq.groups.flatMap((g) =>
      g.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      }))
    ),
  };

  return (
    <>
      <Helmet>
        <title>{about.meta.title}</title>
        <meta name="description" content={about.meta.description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={about.meta.title} />
        <meta property="og:description" content={about.meta.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="About Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={about.meta.title} />
        <meta name="twitter:description" content={about.meta.description} />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="About Spellful" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          '@id': `${pageUrl}#webpage`,
          name: 'About Spellful',
          url: pageUrl,
          description: about.meta.description,
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: { '@id': `${siteUrl}/#organization` },
        }).replace(/</g, '\\u003c')}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-16">

          {/* ── Jump links (in-page TOC) ── */}
          <nav aria-label="Page sections" className="mb-10 p-4 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>On this page</p>
            <ol className="flex flex-wrap gap-x-4 gap-y-1.5 list-none">
              {TOC_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-sm underline underline-offset-2 decoration-dotted min-h-[44px] inline-flex items-center"
                    style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* ── 1. ABOUT SPELLFUL ── */}
          <section id="about" aria-labelledby="about-heading" className="mb-12">
            <h1
              id="about-heading"
              className="text-4xl md:text-5xl mb-5"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {about.intro.heading}
            </h1>
            <p
              className="text-base md:text-lg leading-relaxed mb-6"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
            >
              {about.intro.body}
            </p>
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 text-sm font-semibold min-h-[44px] rounded-full px-5 py-2.5"
              style={{
                background: 'hsl(var(--primary) / 0.12)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsl(var(--primary) / 0.3)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {about.intro.cta}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </section>

          <Divider />

          {/* ── 2. WHY WE CREATED SPELLFUL ── */}
          <section id="mission" aria-labelledby="mission-heading" className="my-12">
            <h2
              id="mission-heading"
              className="text-3xl md:text-4xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {about.mission.heading}
            </h2>
            <ContentListContext field="about.mission.body">
              {about.mission.body.map((p) => (
                <p
                  key={p.id}
                  className="text-base leading-relaxed mb-4 last:mb-0"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                >
                  {p.text}
                </p>
              ))}
            </ContentListContext>
          </section>

          <Divider />

          {/* ── 3. HOW SPELLFUL WORKS ── */}
          <section id="how-it-works" aria-labelledby="how-heading" className="my-12">
            <h2
              id="how-heading"
              className="text-3xl md:text-4xl mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {about.howItWorks.heading}
            </h2>
            <p
              className="text-sm mb-8"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {about.howItWorks.intro}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ContentListContext field="about.howItWorks.tools">
                {about.howItWorks.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="rounded-xl p-5 flex flex-col gap-3"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
                      >
                        {TOOL_ICONS[tool.icon] ?? <IconLearn />}
                      </span>
                      <h3
                        className="text-lg leading-tight"
                        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                      >
                        {tool.title}
                      </h3>
                    </div>

                    {/* What / How / Means / Limits */}
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="inline font-semibold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>What it uses: </dt>
                        <dd className="inline" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{tool.what}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>How it works: </dt>
                        <dd className="inline" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{tool.how}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>What it means: </dt>
                        <dd className="inline" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{tool.means}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Limitations: </dt>
                        <dd className="inline" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{tool.limits}</dd>
                      </div>
                    </dl>

                    <Link
                      to={TOOL_ROUTES[tool.id] ?? '/'}
                      className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold min-h-[44px] rounded-full px-4 py-2 self-start"
                      style={{
                        color: 'hsl(var(--primary))',
                        border: '1px solid hsl(var(--primary) / 0.25)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {tool.cta}
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  </div>
                ))}
              </ContentListContext>
            </div>
          </section>

          <Divider />

          {/* ── 4. HOW INFORMATION IS CALCULATED ── */}
          <section id="calculations" aria-labelledby="calc-heading" className="my-12">
            <h2
              id="calc-heading"
              className="text-3xl md:text-4xl mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {about.sources.heading}
            </h2>
            <p
              className="text-sm mb-7"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {about.sources.intro}
            </p>

            <div className="space-y-3">
              <ContentListContext field="about.sources.types">
                {about.sources.types.map((type) => (
                  <div
                    key={type.id}
                    className="rounded-xl p-5 flex gap-4"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div
                      className="w-1.5 rounded-full shrink-0 self-stretch"
                      style={{ background: 'hsl(var(--primary) / 0.5)' }}
                      aria-hidden="true"
                    />
                    <div>
                      <h3
                        className="text-base font-semibold mb-1"
                        style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}
                      >
                        {type.label}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                      >
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </ContentListContext>
            </div>
          </section>

          <Divider />

          {/* ── 5. SOURCES & TRUST ── */}
          <section id="sources" aria-labelledby="sources-heading" className="my-12">
            <h2
              id="sources-heading"
              className="text-3xl md:text-4xl mb-5"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              Understanding Our Sources
            </h2>
            <div
              className="rounded-xl p-5 text-sm leading-relaxed"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.2)', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
            >
              <p>{about.sources.disclaimer}</p>
            </div>
          </section>

          <Divider />

          {/* ── 6. PRIVACY & ACCOUNT ── */}
          <section id="privacy" aria-labelledby="privacy-heading" className="my-12">
            <h2
              id="privacy-heading"
              className="text-3xl md:text-4xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {about.privacy.heading}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}>Without an account</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{about.privacy.noAccountTools}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}>With a free account</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{about.privacy.accountTools}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}>Your birth data</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{about.privacy.dataNote}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}>Journal privacy</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{about.privacy.journalNote}</p>
              </div>
            </div>

            <ContentListContext field="about.privacy.body">
              {about.privacy.body.map((p) => (
                <p
                  key={p.id}
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                >
                  {p.text}
                </p>
              ))}
            </ContentListContext>

            <div className="flex flex-wrap gap-3 mt-4">
              <ContentListContext field="about.privacy.links">
                {about.privacy.links.map((link) => (
                  <Link
                    key={link.id}
                    to={PRIVACY_ROUTES[link.id] ?? '/'}
                    className="text-sm underline underline-offset-2 min-h-[44px] inline-flex items-center"
                    style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </ContentListContext>
            </div>
          </section>

          <Divider />

          {/* ── 7. FAQ ── */}
          <section id="faq" aria-labelledby="faq-heading" className="my-12">
            <h2
              id="faq-heading"
              className="text-3xl md:text-4xl mb-8"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {about.faq.heading}
            </h2>

            {/* Group tabs */}
            <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="FAQ categories">
              <ContentListContext field="about.faq.groups">
                {about.faq.groups.map((group) => {
                  const isActive = openGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`faq-panel-${group.id}`}
                      id={`faq-tab-${group.id}`}
                      onClick={() => { setOpenGroup(group.id); setOpenFaq(null); }}
                      className="text-sm px-4 py-2 rounded-full min-h-[44px] transition-all"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        background: isActive ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                        color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                        border: `1px solid ${isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      }}
                    >
                      {group.label}
                    </button>
                  );
                })}
              </ContentListContext>
            </div>

            {/* FAQ panels */}
            <ContentListContext field="about.faq.groups">
              {about.faq.groups.map((group) => (
                <div
                  key={group.id}
                  id={`faq-panel-${group.id}`}
                  role="tabpanel"
                  aria-labelledby={`faq-tab-${group.id}`}
                  hidden={openGroup !== group.id}
                >
                  <dl className="space-y-2">
                    <ContentListContext field={`about.faq.groups.${group.id}.items`}>
                      {group.items.map((item) => {
                        const isOpen = openFaq === item.id;
                        return (
                          <div
                            key={item.id}
                            className="rounded-xl overflow-hidden"
                            style={{
                              background: 'hsl(var(--card))',
                              border: `1px solid ${isOpen ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--border))'}`,
                            }}
                          >
                            <dt>
                              <button
                                type="button"
                                aria-expanded={isOpen}
                                aria-controls={`faq-answer-${item.id}`}
                                id={`faq-q-${item.id}`}
                                onClick={() => setOpenFaq(isOpen ? null : item.id)}
                                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left min-h-[44px]"
                                style={{ background: 'transparent' }}
                              >
                                <span
                                  className="text-sm md:text-base leading-snug"
                                  style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))', fontWeight: 500 }}
                                >
                                  {item.question}
                                </span>
                                <span
                                  className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-transform duration-200"
                                  style={{
                                    background: isOpen ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                                    color: isOpen ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                    transform: isOpen ? 'rotate(45deg)' : 'none',
                                  }}
                                  aria-hidden="true"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                </span>
                              </button>
                            </dt>
                            {isOpen && (
                              <dd
                                id={`faq-answer-${item.id}`}
                                role="region"
                                aria-labelledby={`faq-q-${item.id}`}
                                className="px-5 pb-5"
                              >
                                <p
                                  className="text-sm leading-relaxed"
                                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                                >
                                  {item.answer}
                                </p>
                              </dd>
                            )}
                          </div>
                        );
                      })}
                    </ContentListContext>
                  </dl>
                </div>
              ))}
            </ContentListContext>
          </section>

          <Divider />

          {/* ── 8. MOBILE ── */}
          <section id="mobile" aria-labelledby="mobile-heading" className="my-12">
            <h2
              id="mobile-heading"
              className="text-3xl md:text-4xl mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {about.mobile.heading}
            </h2>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
            >
              {about.mobile.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <ContentListContext field="about.mobile.platforms">
                {about.mobile.platforms.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl px-5 py-4"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <span style={{ color: 'hsl(var(--foreground))' }}>
                      {p.platform === 'apple' ? <AppleLogo /> : <AndroidLogo />}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}>{p.label}</p>
                      <p className="text-xs" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--muted-foreground))' }}>{p.status}</p>
                    </div>
                  </div>
                ))}
              </ContentListContext>
            </div>
          </section>

          <Divider />

          {/* ── 9. CLOSING ── */}
          <section id="closing" aria-labelledby="closing-heading" className="my-12">
            <h2
              id="closing-heading"
              className="text-3xl md:text-4xl mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {about.closing.heading}
            </h2>
            <p
              className="text-base leading-relaxed mb-6"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
            >
              {about.closing.body}
            </p>
            <div className="flex flex-wrap gap-3">
              <ContentListContext field="about.closing.links">
                {about.closing.links.map((link) => (
                  <Link
                    key={link.id}
                    to={CLOSING_ROUTES[link.id] ?? '/'}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold min-h-[44px] rounded-full px-5 py-2.5"
                    style={{
                      background: 'hsl(var(--primary) / 0.12)',
                      color: 'hsl(var(--primary))',
                      border: '1px solid hsl(var(--primary) / 0.3)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </ContentListContext>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
