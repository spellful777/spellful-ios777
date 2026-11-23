/**
 * Cosmic Connections — Astrology 2.0
 * Two-person synastry: aspect list with filtering, compatibility scores,
 * composite insights, and full narrative breakdown.
 */

import { useState, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { cosmic_connections } from 'virtual:content';
import { calculateChart } from '@/lib/astro-calculator';
import { calculateSynastry } from '@/lib/synastry';
import type { SynastryResult, SynastryAspect } from '@/lib/synastry';
import CompatibilityScoreCards from '@/components/synastry/CompatibilityScoreCards';
import SynastryNarrative from '@/components/synastry/SynastryNarrative';
import DualWheelChart from '@/components/synastry/DualWheelChart';
import ShareBar from '@/components/ShareBar';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/astrology/cosmic-connections`;

// ── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { label: 'UTC-12:00 (Baker Island)', value: -12 },
  { label: 'UTC-11:00 (Samoa)', value: -11 },
  { label: 'UTC-10:00 (Hawaii)', value: -10 },
  { label: 'UTC-09:00 (Alaska)', value: -9 },
  { label: 'UTC-08:00 (Pacific Time)', value: -8 },
  { label: 'UTC-07:00 (Mountain Time)', value: -7 },
  { label: 'UTC-06:00 (Central Time)', value: -6 },
  { label: 'UTC-05:00 (Eastern Time)', value: -5 },
  { label: 'UTC-04:00 (Atlantic Time)', value: -4 },
  { label: 'UTC-03:00 (Buenos Aires)', value: -3 },
  { label: 'UTC-02:00 (Mid-Atlantic)', value: -2 },
  { label: 'UTC-01:00 (Azores)', value: -1 },
  { label: 'UTC+00:00 (London / GMT)', value: 0 },
  { label: 'UTC+01:00 (Paris / Berlin)', value: 1 },
  { label: 'UTC+02:00 (Cairo / Athens)', value: 2 },
  { label: 'UTC+03:00 (Moscow / Istanbul)', value: 3 },
  { label: 'UTC+04:00 (Dubai)', value: 4 },
  { label: 'UTC+05:00 (Karachi)', value: 5 },
  { label: 'UTC+05:30 (India)', value: 5.5 },
  { label: 'UTC+06:00 (Dhaka)', value: 6 },
  { label: 'UTC+07:00 (Bangkok)', value: 7 },
  { label: 'UTC+08:00 (Beijing / Singapore)', value: 8 },
  { label: 'UTC+09:00 (Tokyo / Seoul)', value: 9 },
  { label: 'UTC+09:30 (Adelaide)', value: 9.5 },
  { label: 'UTC+10:00 (Sydney)', value: 10 },
  { label: 'UTC+11:00 (Solomon Islands)', value: 11 },
  { label: 'UTC+12:00 (Auckland)', value: 12 },
];

const ASPECT_FILTERS = ['All', 'Conjunction', 'Trine', 'Sextile', 'Square', 'Opposition', 'Quincunx'] as const;
type AspectFilter = typeof ASPECT_FILTERS[number];

function aspectGlyph(type: string): string {
  if (type === 'Conjunction') return '☌';
  if (type === 'Sextile') return '⚹';
  if (type === 'Square') return '□';
  if (type === 'Trine') return '△';
  if (type === 'Quincunx') return '⚻';
  if (type === 'Opposition') return '☍';
  return '';
}

const ASPECT_NATURE_COLORS: Record<string, string> = {
  harmonious: 'hsl(var(--secondary))',
  challenging: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--accent))',
  transformative: 'hsl(var(--primary))',
};

const ASPECT_NATURE_MAP: Record<string, string> = {
  Conjunction: 'neutral',
  Trine: 'harmonious',
  Sextile: 'harmonious',
  Square: 'challenging',
  Opposition: 'challenging',
  Quincunx: 'transformative',
};

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  ascendant: '↑',
};

const PLANET_LABELS: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', ascendant: 'Rising',
};

const DIMENSION_LABELS: Record<string, string> = {
  love: 'Love', stability: 'Stability', sexual: 'Passion',
  communication: 'Communication', longterm: 'Long-term',
};

const TABS = [
  { id: 'aspects', label: 'Aspects', symbol: '☌' },
  { id: 'scores', label: 'Compatibility', symbol: '♡' },
  { id: 'wheel', label: 'Dual Wheel', symbol: '◎' },
  { id: 'narrative', label: 'Full Reading', symbol: '✦' },
] as const;
type TabId = typeof TABS[number]['id'];

// ── Form type ────────────────────────────────────────────────────────────────

interface PersonForm {
  name: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  utcOffset: string;
  unknownTime: boolean;
}

const DEFAULT_FORM: PersonForm = {
  name: '', year: '', month: '', day: '',
  hour: '12', minute: '0', utcOffset: '-7', unknownTime: false,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function orbLabel(orb: number) {
  return `${orb.toFixed(1)}\u00b0`;
}

function scoreBar(score: number) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? 'hsl(var(--secondary))' : pct >= 45 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
  return { pct, color };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CosmicConnectionsPage() {
  const [personA, setPersonA] = useState<PersonForm>({ ...DEFAULT_FORM });
  const [personB, setPersonB] = useState<PersonForm>({ ...DEFAULT_FORM });
  const [synastry, setSynastry] = useState<SynastryResult | null>(null);
  const [chartA, setChartA] = useState<ReturnType<typeof calculateChart> | null>(null);
  const [chartB, setChartB] = useState<ReturnType<typeof calculateChart> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('aspects');
  const [aspectFilter, setAspectFilter] = useState<AspectFilter>('All');
  const [expandedAspect, setExpandedAspect] = useState<number | null>(null);
  const [expandedScore, setExpandedScore] = useState<string | null>(null);

  function handleChange(
    setter: React.Dispatch<React.SetStateAction<PersonForm>>,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setter(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleUnknownTime(setter: React.Dispatch<React.SetStateAction<PersonForm>>) {
    setter(f => ({ ...f, unknownTime: !f.unknownTime }));
  }

  const calculate = useCallback(() => {
    setError('');
    const parseForm = (f: PersonForm) => {
      const y = parseInt(f.year), mo = parseInt(f.month), d = parseInt(f.day);
      const h = f.unknownTime ? 12 : parseInt(f.hour);
      const mi = f.unknownTime ? 0 : parseInt(f.minute);
      const tz = parseFloat(f.utcOffset);
      if (!y || !mo || !d) return null;
      return calculateChart(y, mo, d, h, mi, 0, 0, tz);
    };

    const ca = parseForm(personA);
    const cb = parseForm(personB);
    if (!ca || !cb) {
      setError('Please fill in birth date for both people.');
      return;
    }
    setLoading(true);
    try {
      const result = calculateSynastry(ca, cb);
      setChartA(ca);
      setChartB(cb);
      setSynastry(result);
      setActiveTab('aspects');
      setAspectFilter('All');
      setExpandedAspect(null);
    } catch {
      setError('Something went wrong calculating the connection. Please check the dates and try again.');
    }
    setLoading(false);
  }, [personA, personB]);

  // Filtered aspects
  const filteredAspects: SynastryAspect[] = synastry
    ? (aspectFilter === 'All' ? synastry.aspects : synastry.aspects.filter(a => a.type === aspectFilter))
    : [];

  // Overall score bar
  const overall = synastry ? scoreBar(synastry.scores.overall) : null;

  return (
    <>
      <Helmet>
        <title>Cosmic Connections — Synastry & Compatibility | Spellful</title>
        <meta name="description" content="Explore the astrological connection between two birth charts. See synastry aspects, compatibility scores, composite insights, and a full relationship reading." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Cosmic Connections — Synastry & Compatibility | Spellful" />
        <meta property="og:description" content="Explore the astrological connection between two birth charts." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cosmic Connections — Synastry & Compatibility | Spellful" />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          name: 'Cosmic Connections',
          url: pageUrl,
          isPartOf: { '@id': `${siteUrl}/#website` },
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>

        {/* ── Hero ── */}
        <section className="relative pt-16 pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 65%)' }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
            >
              {cosmic_connections.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {cosmic_connections.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg leading-relaxed max-w-2xl mx-auto mb-6"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {cosmic_connections.hero.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.35 }}
            >
              <Link
                to="/astrology"
                className="text-xs tracking-widest uppercase"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
              >
                {cosmic_connections.hero.backLink}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Two-person form ── */}
        <section className="pb-16 px-6 md:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {([
                { label: 'Person A', person: personA, setter: setPersonA, accent: '--primary' },
                { label: 'Person B', person: personB, setter: setPersonB, accent: '--accent' },
              ] as const).map(({ label, person, setter, accent }) => (
                <div
                  key={label}
                  className="rounded-2xl p-6"
                  style={{ background: 'hsl(var(--card))', border: `1px solid hsl(var(${accent}) / 0.3)` }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-xl" style={{ color: `hsl(var(${accent}))` }}>✦</span>
                    <h2 className="text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{label}</h2>
                  </div>

                  {/* Name */}
                  <div className="mb-4">
                    <label className="block text-xs tracking-widest uppercase mb-1.5" style={{ color: `hsl(var(${accent}))`, fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>
                      Name (optional)
                    </label>
                    <input
                      name="name" value={person.name}
                      onChange={(e) => handleChange(setter, e)}
                      placeholder="e.g. Luna"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                    />
                  </div>

                  {/* Date */}
                  <div className="mb-4">
                    <label className="block text-xs tracking-widest uppercase mb-1.5" style={{ color: `hsl(var(${accent}))`, fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>
                      Birth Date
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select name="month" value={person.month} onChange={(e) => handleChange(setter, e)}
                        className="w-full px-3 py-3 rounded-xl text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        <option value="">Month</option>
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                      <select name="day" value={person.day} onChange={(e) => handleChange(setter, e)}
                        className="w-full px-3 py-3 rounded-xl text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <input name="year" value={person.year} onChange={(e) => handleChange(setter, e)}
                        type="number" placeholder="Year" min="1900" max="2100"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }} />
                    </div>
                  </div>

                  {/* Unknown time toggle */}
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => toggleUnknownTime(setter)}
                      className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
                      style={{ background: person.unknownTime ? `hsl(var(${accent}))` : 'hsl(var(--muted))' }}
                      aria-pressed={person.unknownTime}
                      aria-label="Unknown birth time"
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                        style={{
                          background: 'hsl(var(--foreground))',
                          transform: person.unknownTime ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
                        }}
                      />
                    </button>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      Unknown birth time (uses noon)
                    </span>
                  </div>

                  {/* Time + timezone */}
                  {!person.unknownTime && (
                    <div className="mb-4">
                      <label className="block text-xs tracking-widest uppercase mb-1.5" style={{ color: `hsl(var(${accent}))`, fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}>
                        Birth Time
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <select name="hour" value={person.hour} onChange={(e) => handleChange(setter, e)}
                          className="w-full px-3 py-3 rounded-xl text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                          ))}
                        </select>
                        <select name="minute" value={person.minute} onChange={(e) => handleChange(setter, e)}
                          className="w-full px-3 py-3 rounded-xl text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                      <select name="utcOffset" value={person.utcOffset} onChange={(e) => handleChange(setter, e)}
                        className="w-full px-3 py-3 rounded-xl text-sm outline-none" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {TIMEZONES.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-center mb-4" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>{error}</p>
            )}

            {/* Calculate button */}
            <div className="flex justify-center">
              <button
                onClick={calculate}
                disabled={loading}
                className="px-10 py-4 rounded-2xl text-sm tracking-widest uppercase transition-all duration-200"
                style={{
                  background: 'hsl(var(--primary) / 0.15)',
                  border: '1px solid hsl(var(--primary) / 0.5)',
                  color: 'hsl(var(--primary))',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.15em',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.25)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.15)'; }}
              >
                {loading ? 'Reading the stars\u2026' : '\u2728 Reveal Cosmic Connection'}
              </button>
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        <AnimatePresence>
          {synastry && chartA && chartB && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Overall score banner */}
              <section className="pb-8 px-6 md:px-10">
                <div className="max-w-5xl mx-auto">
                  <div
                    className="rounded-2xl p-6 text-center relative overflow-hidden"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.3)' }}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.07) 0%, transparent 70%)' }} />
                    <div className="relative">
                      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>
                        {personA.name || 'Person A'} &amp; {personB.name || 'Person B'}
                      </p>
                      <h2 className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                        {synastry.archetype}
                      </h2>
                      <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {synastry.archetypeDescription}
                      </p>
                      {overall && (
                        <div className="max-w-xs mx-auto">
                          <div className="flex justify-between text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                            <span>Overall Compatibility</span>
                            <span style={{ color: overall.color }}>{Math.round(overall.pct)}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${overall.pct}%` }}
                              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' as const }}
                              className="h-full rounded-full"
                              style={{ background: overall.color }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Share */}
              <section className="pb-6 px-6 md:px-10">
                <div className="max-w-5xl mx-auto">
                  <ShareBar
                    url={pageUrl}
                    text={`✨ I just explored my cosmic connection on Spellful — ${synastry.archetype}! Discover yours:`}
                    label="Share your cosmic connection"
                  />
                </div>
              </section>

              {/* Tab bar */}
              <section className="pb-4 px-6 md:px-10">
                <div className="max-w-5xl mx-auto">
                  <div
                    className="flex gap-1 p-1 rounded-2xl"
                    style={{ background: 'hsl(var(--muted))' }}
                    role="tablist"
                    aria-label="Cosmic Connections sections"
                  >
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs tracking-wide transition-all duration-200"
                        style={{
                          background: activeTab === tab.id ? 'hsl(var(--card))' : 'transparent',
                          color: activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                          fontFamily: 'var(--font-sans)',
                          boxShadow: activeTab === tab.id ? '0 1px 4px hsl(var(--background) / 0.6)' : 'none',
                        }}
                      >
                        <span aria-hidden="true">{tab.symbol}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Tab panels */}
              <section className="pb-24 px-6 md:px-10">
                <div className="max-w-5xl mx-auto">

                  {/* ── ASPECTS tab ── */}
                  {activeTab === 'aspects' && (
                    <div>
                      {/* Aspect filter */}
                      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by aspect type">
                        {ASPECT_FILTERS.map(f => {
                          const active = aspectFilter === f;
                          return (
                            <button
                              key={f}
                              onClick={() => { setAspectFilter(f); setExpandedAspect(null); }}
                              className="px-3 py-1.5 rounded-full text-xs transition-all"
                              style={{
                                background: active ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.1)',
                                color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))',
                                border: '1px solid hsl(var(--primary) / 0.3)',
                                fontFamily: 'var(--font-sans)',
                              }}
                              aria-pressed={active}
                            >
                              {f !== 'All' && <span className="mr-1">{aspectGlyph(f)}</span>}
                              {f}
                            </button>
                          );
                        })}
                      </div>

                      {/* Aspect count */}
                      <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {filteredAspects.length} aspect{filteredAspects.length !== 1 ? 's' : ''} found
                        {aspectFilter !== 'All' ? ` \u2014 ${aspectFilter}` : ''}
                      </p>

                      {/* Aspect list */}
                      {filteredAspects.length === 0 ? (
                        <p className="text-sm text-center py-12" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          No {aspectFilter} aspects found between these charts.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {filteredAspects.map((asp, i) => {
                            const isOpen = expandedAspect === i;
                            const nature = ASPECT_NATURE_MAP[asp.type] || 'neutral';
                            const col = ASPECT_NATURE_COLORS[nature] || 'hsl(var(--foreground))';
                            const sym1 = PLANET_SYMBOLS[asp.planet1] || '';
                            const sym2 = PLANET_SYMBOLS[asp.planet2] || '';
                            const lbl1 = PLANET_LABELS[asp.planet1] || asp.planet1;
                            const lbl2 = PLANET_LABELS[asp.planet2] || asp.planet2;
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.03 }}
                              >
                                <button
                                  onClick={() => setExpandedAspect(isOpen ? null : i)}
                                  className="w-full text-left rounded-xl p-4 transition-all duration-200"
                                  style={{
                                    background: isOpen ? 'hsl(var(--card))' : 'hsl(var(--muted))',
                                    border: `1px solid ${isOpen ? col : 'hsl(var(--border))'}`,
                                  }}
                                  aria-expanded={isOpen}
                                >
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {/* Planet A */}
                                    <span className="text-lg" style={{ color: 'hsl(var(--primary))' }}>{sym1}</span>
                                    <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                                      {personA.name ? `${personA.name}\u2019s ` : ''}{lbl1}
                                    </span>
                                    {/* Aspect badge */}
                                    <span
                                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                                      style={{ background: `${col}22`, color: col, fontFamily: 'var(--font-sans)', border: `1px solid ${col}55` }}
                                    >
                                      {aspectGlyph(asp.type)} {asp.type}
                                    </span>
                                    {/* Planet B */}
                                    <span className="text-lg" style={{ color: 'hsl(var(--accent))' }}>{sym2}</span>
                                    <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                                      {personB.name ? `${personB.name}\u2019s ` : ''}{lbl2}
                                    </span>
                                    {/* Orb + chevron */}
                                    <span className="ml-auto flex items-center gap-2">
                                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{orbLabel(asp.orb)}</span>
                                      <span className="text-xs transition-transform duration-200" style={{ color: 'hsl(var(--muted-foreground))', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
                                    </span>
                                  </div>

                                  {/* Dimension chips */}
                                  {asp.dimension.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {asp.dimension.map(d => (
                                        <span key={d} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                          {DIMENSION_LABELS[d] || d}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </button>

                                {/* Expanded interpretation */}
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="overflow-hidden"
                                    >
                                      <div
                                        className="rounded-b-xl px-5 py-4 -mt-1"
                                        style={{ background: 'hsl(var(--card))', border: `1px solid ${col}`, borderTop: 'none' }}
                                      >
                                        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                          {asp.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${col}22`, color: col, fontFamily: 'var(--font-sans)' }}>
                                            {nature.charAt(0).toUpperCase() + nature.slice(1)}
                                          </span>
                                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                            Score: {asp.score > 0 ? '+' : ''}{asp.score.toFixed(1)}
                                          </span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* Composite insights */}
                      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Composite Sun', value: synastry.compositeSun, symbol: '☉', desc: 'The relationship\'s core identity and shared purpose' },
                          { label: 'Composite Moon', value: synastry.compositeMoon, symbol: '☽', desc: 'The emotional tone and inner life of this connection' },
                        ].map(({ label, value, symbol, desc }) => (
                          <div key={label} className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl" style={{ color: 'hsl(var(--primary))' }}>{symbol}</span>
                              <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{label}</span>
                            </div>
                            <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</p>
                            <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Highlights & challenges */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--secondary) / 0.4)' }}>
                          <h3 className="text-sm font-medium mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--secondary))' }}>
                            \u2728 Connection Strengths
                          </h3>
                          <ul className="flex flex-col gap-2">
                            {synastry.highlights.map((h, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                <span style={{ color: 'hsl(var(--secondary))' }}>✦</span>
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--destructive) / 0.3)' }}>
                          <h3 className="text-sm font-medium mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--destructive))' }}>
                            \u25c8 Growth Edges
                          </h3>
                          <ul className="flex flex-col gap-2">
                            {synastry.challenges.map((c, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                <span style={{ color: 'hsl(var(--destructive))' }}>◈</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SCORES tab ── */}
                  {activeTab === 'scores' && (
                    <CompatibilityScoreCards
                      scores={synastry.scores}
                      expandedScore={expandedScore}
                      setExpandedScore={setExpandedScore}
                    />
                  )}

                  {/* ── WHEEL tab ── */}
                  {activeTab === 'wheel' && (
                    <div className="flex flex-col items-center gap-6">
                      <p className="text-sm text-center max-w-md" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        The inner wheel shows {personA.name || 'Person A'}\u2019s natal chart; the outer wheel shows {personB.name || 'Person B'}\u2019s planets overlaid.
                      </p>
                      <DualWheelChart chartA={chartA} chartB={chartB} aspects={synastry.aspects} />
                    </div>
                  )}

                  {/* ── NARRATIVE tab ── */}
                  {activeTab === 'narrative' && (
                    <SynastryNarrative
                      synastry={synastry}
                      nameA={personA.name || 'Person A'}
                      nameB={personB.name || 'Person B'}
                    />
                  )}

                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state / intro ── */}
        {!synastry && (
          <section className="pb-24 px-6 md:px-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { symbol: '☌', title: 'Synastry Aspects', desc: 'Every cross-chart aspect between the two natal charts, with orb, nature, and interpretation.' },
                  { symbol: '♡', title: 'Compatibility Scores', desc: 'Five dimensions — Love, Stability, Passion, Communication, and Long-term — scored and explained.' },
                  { symbol: '✦', title: 'Full Reading', desc: 'Archetype, composite identity, relationship patterns, timing insights, and growth edges.' },
                ].map(({ symbol, title, desc }) => (
                  <div key={title} className="rounded-2xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <div className="text-3xl mb-3" style={{ color: 'hsl(var(--primary))' }}>{symbol}</div>
                    <h3 className="text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
    </>
  );
}
