import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router';
import { useMemo } from 'react';
import { generateFullMoonMoments, getMoonPhase } from '@/lib/moon-phase-engine';
import { getUpcomingFullMoons } from '@/lib/full-moon-feed';
import { moon_event } from 'virtual:content';
import { ShareBar } from '@/components/ShareBar';

const siteUrl = 'https://spellful.com';

const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december'
];
const MONTH_LABELS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function formatTime(date: Date, tz: string = 'UTC'): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz, timeZoneName: 'short' });
}

export default function MoonEventPage() {
  const { type, year: yearStr, month: monthStr } = useParams<{ type: string; year: string; month: string }>();

  const year = parseInt(yearStr ?? '0', 10);
  const monthIdx = MONTH_NAMES.indexOf((monthStr ?? '').toLowerCase());
  const isFullMoon = type === 'full-moon';
  const isNewMoon = type === 'new-moon';

  const eventData = useMemo(() => {
    if (!isFullMoon && !isNewMoon) return null;
    if (monthIdx === -1 || isNaN(year)) return null;

    if (isFullMoon) {
      const moons = generateFullMoonMoments(year, year);
      return moons.find((m) => m.month === monthIdx + 1) ?? null;
    }
    // New moon: scan the month for elongation crossing 0
    const startDate = new Date(Date.UTC(year, monthIdx, 1));
    const endDate = new Date(Date.UTC(year, monthIdx + 1, 0));
    let prevElong = -1;
    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const phase = getMoonPhase(d);
      if (prevElong > 300 && phase.elongation < 60) {
        return { date: new Date(d), month: monthIdx + 1, year };
      }
      prevElong = phase.elongation;
    }
    return null;
  }, [isFullMoon, isNewMoon, year, monthIdx]);

  // For full moons, get the enriched data from full-moon-feed
  const enrichedMoon = useMemo(() => {
    if (!isFullMoon) return null;
    const moons = getUpcomingFullMoons(5);
    return moons.find((m) => {
      const d = new Date(m.iso);
      return d.getUTCFullYear() === year && d.getUTCMonth() === monthIdx;
    }) ?? null;
  }, [isFullMoon, year, monthIdx]);

  if (monthIdx === -1 || isNaN(year) || (!isFullMoon && !isNewMoon)) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="text-center px-6">
          <h1 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Page Not Found</h1>
          <Link to="/moon-calendar" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>← Moon Calendar</Link>
        </div>
      </main>
    );
  }

  const typeLabel = isFullMoon ? 'Full Moon' : 'New Moon';
  // eslint-disable-next-line security/detect-object-injection
  const monthLabel = MONTH_LABELS[monthIdx];
  const pageTitle = `${monthLabel} ${year} ${typeLabel} | Spellful`;
  const pageUrl = `${siteUrl}/moon/${type}/${year}/${monthStr}`;
  const description = isFullMoon && enrichedMoon
    ? `The ${enrichedMoon.name} — ${monthLabel} ${year} Full Moon in ${enrichedMoon.sign}. ${enrichedMoon.theme}`
    : `${monthLabel} ${year} ${typeLabel} date, time, and spiritual significance. Accurate astronomical data verified against NASA.`;

  const moonPhaseAtEvent = eventData && 'date' in eventData
    ? getMoonPhase(eventData.date)
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    name: pageTitle,
    headline: `${monthLabel} ${year} ${typeLabel}: Date, Time & Spiritual Meaning`,
    url: pageUrl,
    isPartOf: { '@id': `${siteUrl}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Moon Calendar', item: `${siteUrl}/moon-calendar` },
        { '@type': 'ListItem', position: 3, name: `${year} ${typeLabel}s`, item: `${siteUrl}/moon/${type}/${year}` },
        { '@type': 'ListItem', position: 4, name: `${monthLabel} ${year}`, item: pageUrl },
      ],
    },
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        {/* Hero */}
        <section className="relative pt-16 pb-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.12) 0%, transparent 65%)' }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center justify-center gap-2 text-xs flex-wrap" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <li><Link to="/" style={{ color: 'hsl(var(--muted-foreground))' }}>Home</Link></li>
                <li>/</li>
                <li><Link to="/moon-calendar" style={{ color: 'hsl(var(--muted-foreground))' }}>Moon Calendar</Link></li>
                <li>/</li>
                <li style={{ color: 'hsl(var(--foreground))' }}>{monthLabel} {year} {typeLabel}</li>
              </ol>
            </nav>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-7xl mb-6"
              aria-hidden="true"
            >
              {isFullMoon ? '🌕' : '🌑'}
            </motion.div>

            {enrichedMoon && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs tracking-widest uppercase mb-3"
                style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
              >
                {enrichedMoon.name}
              </motion.p>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {monthLabel} {year} {typeLabel}
            </motion.h1>

            {enrichedMoon && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg mb-2"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                in {enrichedMoon.sign}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4"
            >
              <Link to="/astronomical-accuracy" className="text-xs underline" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {moon_event.labels.how_we_calculate}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Date & Time */}
        {eventData && 'date' in eventData && (
          <section className="py-12 px-6 md:px-10" style={{ background: 'hsl(var(--muted))' }}>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl mb-6 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {moon_event.labels.datetime_heading}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Date', value: eventData.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) },
                  { label: 'Time (UTC)', value: formatTime(eventData.date, 'UTC') },
                  { label: 'Illumination', value: moonPhaseAtEvent ? `${moonPhaseAtEvent.illumination}%` : (isFullMoon ? '100%' : '0%') },
                ].map(({ label, value }) => (
                  <div key={label} className="p-5 rounded-xl text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <div className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{label}</div>
                    <div className="font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{value}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center mt-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {moon_event.labels.utc_note}
              </p>
            </div>
          </section>
        )}

        {/* Enriched moon data */}
        {enrichedMoon && (
          <section className="py-16 px-6 md:px-10">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-8 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {moon_event.labels.spiritual_theme}
                </h2>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{enrichedMoon.theme}</p>
              </div>

              <div className="p-8 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {moon_event.labels.spellwork}
                </h2>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{enrichedMoon.spellwork}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Herbs', value: enrichedMoon.herbs, color: '--grimoire-herb' },
                  { label: 'Crystals', value: enrichedMoon.crystals, color: '--accent' },
                  { label: 'Color', value: enrichedMoon.color, color: '--primary' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-5 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: `hsl(var(${color}))`, fontFamily: 'var(--font-sans)' }}>{label}</div>
                    <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Share */}
        <section className="py-8 px-6 md:px-10 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-3xl mx-auto flex justify-center">
            <ShareBar
              text={`🌕 ${typeLabel} in ${monthLabel} ${year} — spiritual themes, rituals & correspondences on Spellful.`}
              url={`https://spellful.com/moon/${type}/${year}/${monthStr}`}
              label="Share this moon"
            />
          </div>
        </section>

        {/* Navigation */}
        <section className="py-12 px-6 md:px-10 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-center">
            <Link to="/moon-calendar" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
              Full Moon Calendar
            </Link>
            <Link to="/moon/phases" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
              Moon Phase Guide
            </Link>
            <Link to="/moon-ritual" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
              Moon Rituals
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
