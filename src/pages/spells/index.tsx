import { useState, useEffect, useCallback } from 'react';
import { getMoonPhase } from '@/lib/moon-phase-engine';
import { Link, useSearchParams } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Sparkles, PenLine, Clock, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SpellCard, { type SpellCardData } from '@/components/SpellCard';
import { useSession } from '@/lib/auth/auth-client';
import { spells as spellsContent } from 'virtual:content';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpellsResponse {
  spells: SpellCardData[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INTENTIONS = [
  { value: '', label: 'All Intentions' },
  { value: 'protection', label: 'Protection' },
  { value: 'love', label: 'Love' },
  { value: 'abundance', label: 'Abundance' },
  { value: 'healing', label: 'Healing' },
  { value: 'clarity', label: 'Clarity' },
  { value: 'banishing', label: 'Banishing' },
  { value: 'divination', label: 'Divination' },
  { value: 'grounding', label: 'Grounding' },
];

const DIFFICULTIES = [
  { value: '', label: 'Any Difficulty' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const MOON_PHASES = [
  { value: '', label: 'Any Moon Phase' },
  { value: 'new_moon', label: '🌑 New Moon' },
  { value: 'waxing_crescent', label: '🌒 Waxing Crescent' },
  { value: 'first_quarter', label: '🌓 First Quarter' },
  { value: 'waxing_gibbous', label: '🌔 Waxing Gibbous' },
  { value: 'full_moon', label: '🌕 Full Moon' },
  { value: 'waning_gibbous', label: '🌖 Waning Gibbous' },
  { value: 'last_quarter', label: '🌗 Last Quarter' },
  { value: 'waning_moon', label: '🌘 Waning Moon' },
];

const SORTS = [
  { value: 'newest', label: 'Recently Added' },
  { value: 'most_saved', label: 'Most Saved' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'oldest', label: 'Oldest First' },
];

const DURATION_OPTIONS = [
  { value: '', label: 'Any Duration' },
  { value: '0-15', label: 'Under 15 min' },
  { value: '0-30', label: 'Under 30 min' },
  { value: '30-60', label: '30–60 min' },
  { value: '60-999', label: 'Over 60 min' },
];

const MOON_GLYPHS: Record<string, string> = {
  new_moon: '🌑', waxing_crescent: '🌒', first_quarter: '🌓',
  waxing_gibbous: '🌔', full_moon: '🌕', waning_gibbous: '🌖',
  last_quarter: '🌗', waning_moon: '🌘',
};

// Traditional intention alignments per moon phase (spiritual associations, not astronomical facts)
const MOON_INTENTION_ALIGNMENT: Record<string, string[]> = {
  new_moon:        ['clarity', 'abundance'],
  waxing_crescent: ['abundance', 'healing'],
  first_quarter:   ['protection', 'clarity'],
  waxing_gibbous:  ['love', 'abundance'],
  full_moon:       ['love', 'divination', 'healing'],
  waning_gibbous:  ['healing', 'grounding'],
  last_quarter:    ['banishing', 'grounding'],
  waning_moon:     ['banishing', 'protection'],
};

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        background: active ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
        color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
        border: `1px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
      }}
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SpellsPage() {
  const { session } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<SpellsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [featuredSpell, setFeaturedSpell] = useState<SpellCardData | null>(null);

  // Moon companion — SSR-safe: static initial, real value in useEffect
  const [moonData, setMoonData] = useState<{ phase: string; illumination: number } | null>(null);
  useEffect(() => {
    const m = getMoonPhase(new Date());
    setMoonData({ phase: m.phase, illumination: Math.round(m.illumination) });
  }, []);

  // Ritual Path matcher state
  type PathStep = 'intention' | 'experience' | 'time' | 'materials' | 'results';
  const [pathOpen, setPathOpen] = useState(false);
  const [pathStep, setPathStep] = useState<PathStep>('intention');
  const [pathIntention, setPathIntention] = useState('');
  const [pathExperience, setPathExperience] = useState('');
  const [pathTime, setPathTime] = useState('');
  const [pathResults, setPathResults] = useState<SpellCardData[]>([]);
  const [pathLoading, setPathLoading] = useState(false);

  const resetPath = () => {
    setPathStep('intention');
    setPathIntention('');
    setPathExperience('');
    setPathTime('');
    setPathResults([]);
  };

  const runPathSearch = useCallback(async (intent: string, exp: string, time: string) => {
    setPathLoading(true);
    setPathStep('results');
    const params = new URLSearchParams({ limit: '6', sort: 'most_saved' });
    if (intent) params.set('intention', intent);
    if (exp) params.set('difficulty', exp);
    if (time) {
      const map: Record<string, string> = { '15': '0-15', '30': '0-30', '60': '30-60', '60+': '60-999' };
      const dur = map[time];
      if (dur) {
        const [min, max] = dur.split('-');
        if (min) params.set('minDuration', min);
        if (max && max !== '999') params.set('maxDuration', max);
      }
    }
    try {
      const r = await fetch(`/api/spells?${params}`);
      const d = await r.json() as SpellsResponse;
      setPathResults(d.spells ?? []);
    } catch { setPathResults([]); }
    setPathLoading(false);
  }, []);

  // Derive filter state from URL params
  const search = searchParams.get('search') ?? '';
  const intention = searchParams.get('intention') ?? '';
  const difficulty = searchParams.get('difficulty') ?? '';
  const moonPhase = searchParams.get('moonPhase') ?? '';
  const duration = searchParams.get('duration') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const hasFilters = !!(search || intention || difficulty || moonPhase || duration || sort !== 'newest');

  // Fetch featured spell once on mount
  useEffect(() => {
    fetch('/api/spells?featured=true&limit=1')
      .then((r) => r.json())
      .then((d: SpellsResponse) => {
        if (d.spells?.length) setFeaturedSpell(d.spells[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (intention) params.set('intention', intention);
    if (difficulty) params.set('difficulty', difficulty);
    if (moonPhase) params.set('moonPhase', moonPhase);
    if (duration) {
      const [min, max] = duration.split('-');
      if (min) params.set('minDuration', min);
      if (max && max !== '999') params.set('maxDuration', max);
    }
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '12');

    fetch(`/api/spells?${params}`)
      .then((r) => r.json())
      .then((d: SpellsResponse) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [search, intention, difficulty, moonPhase, duration, sort, page]);

  const siteUrl = 'https://spellful.com';

  return (
    <>
      <Helmet>
        <title>Free Spell Library — Witchcraft Spells for Every Intention | Spellful</title>
        <meta name="description" content="Browse 18+ free witchcraft spells for protection, love, abundance, healing, banishing, and more. Step-by-step instructions, materials, and moon phase guidance. No signup, no ads." />
        <link rel="canonical" href="https://spellful.com/spells" />
        <meta property="og:title" content="Free Spell Library — Witchcraft Spells for Every Intention | Spellful" />
        <meta property="og:description" content="18+ free witchcraft spells with step-by-step instructions, materials, and moon phase guidance. No signup required." />
        <meta property="og:url" content="https://spellful.com/spells" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Free Spell Library — Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Spell Library — Witchcraft Spells for Every Intention | Spellful" />
        <meta name="twitter:description" content="18+ free witchcraft spells with step-by-step instructions, materials, and moon phase guidance. No signup required." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Free Spell Library — Spellful" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${siteUrl}/spells#webpage`,
          name: 'Free Spell Library — Spellful',
          url: `${siteUrl}/spells`,
          description: 'A free curated library of witchcraft spells for protection, love, abundance, healing, clarity, banishing, divination, and grounding. No signup required.',
          isPartOf: { '@id': `${siteUrl}/#website` },
        }).replace(/</g, '\u003c')}</script>
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        {/* Ambient stars */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: 35 }, (_, i) => {
            const top = ((i * 37 + 11) % 100);
            const left = ((i * 53 + 7) % 100);
            const dur = 3 + (i % 5);
            const del = (i % 7) * 0.5;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{ width: 1.5, height: 1.5, top: `${top}%`, left: `${left}%`, background: 'hsl(var(--foreground))' }}
                animate={{ opacity: [0.03, 0.15, 0.03] }}
                transition={{ duration: dur, repeat: Infinity, delay: del }}
              />
            );
          })}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-8">

          {/* ── Page header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-sm tracking-wide" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                {spellsContent.hero.eyebrow}
              </span>
            </div>
            <h1
              className="text-4xl md:text-6xl mb-4"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
            >
              {spellsContent.hero.title}
            </h1>
            <p
              className="text-base md:text-lg max-w-2xl mx-auto"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {spellsContent.hero.description}
            </p>
            {session && (
              <div className="mt-5">
                <Link to="/spells/submit">
                  <Button variant="outline" size="sm" className="gap-2">
                    <PenLine className="w-3.5 h-3.5" />
                    {spellsContent.submitCta}
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* ── Intention chooser ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            aria-labelledby="intention-chooser-heading"
            className="mb-12"
          >
            <div className="text-center mb-6">
              <h2
                id="intention-chooser-heading"
                className="text-2xl md:text-3xl mb-2"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
              >
                {spellsContent.intentionChooser.heading}
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {spellsContent.intentionChooser.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {spellsContent.intentionChooser.intentions.map((item) => {
                const isActive = intention === item.value;
                return (
                  <button
                    key={item.id}
                    onClick={() => setParam('intention', isActive ? '' : item.value)}
                    aria-pressed={isActive}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: isActive ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
                      border: `1px solid ${isActive ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--border))'}`,
                      transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <span className="text-2xl" aria-hidden="true">{item.glyph}</span>
                    <span
                      className="text-sm font-medium leading-tight"
                      style={{ fontFamily: 'var(--font-heading)', color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-xs leading-tight"
                      style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                    >
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* ── Featured spell ── */}
          {featuredSpell && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              aria-labelledby="featured-spell-heading"
              className="mb-10"
            >
              <p
                className="text-xs font-medium uppercase tracking-widest mb-3"
                style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                id="featured-spell-heading"
              >
                {spellsContent.featuredSpell.heading}
              </p>
              <Link
                to={`/spells/${featuredSpell.slug}`}
                className="group flex flex-col sm:flex-row gap-5 p-5 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--primary) / 0.3)',
                  boxShadow: '0 0 24px hsl(var(--primary) / 0.08)',
                }}
              >
                {/* Glyph accent */}
                <div
                  className="flex items-center justify-center rounded-xl shrink-0 w-16 h-16 sm:w-20 sm:h-20 text-3xl"
                  style={{ background: 'hsl(var(--primary) / 0.12)' }}
                  aria-hidden="true"
                >
                  {MOON_GLYPHS[featuredSpell.moonPhase] ?? '✨'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                    >
                      {featuredSpell.intention}
                    </span>
                    <span
                      className="text-xs capitalize"
                      style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                    >
                      {featuredSpell.difficulty}
                    </span>
                  </div>
                  <h3
                    className="text-xl md:text-2xl mb-1 group-hover:text-primary transition-colors"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                  >
                    {featuredSpell.title}
                  </h3>
                  <p
                    className="text-sm mb-3 line-clamp-2"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                  >
                    {featuredSpell.subtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {featuredSpell.durationMinutes} min
                    </span>
                    {featuredSpell.ratingCount > 0 && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Star className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' }} aria-hidden="true" />
                        {(featuredSpell.ratingSum / featuredSpell.ratingCount).toFixed(1)}
                        <span>({featuredSpell.ratingCount})</span>
                      </span>
                    )}
                    <span
                      className="flex items-center gap-1.5 text-xs font-medium ml-auto"
                      style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      {spellsContent.featuredSpell.ctaLabel}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.section>
          )}

          {/* ── Search + sort bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <Input
                type="search"
                placeholder="Search spells…"
                value={search}
                onChange={(e) => setParam('search', e.target.value)}
                className="pl-9"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setParam('sort', e.target.value)}
                className="text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((v) => !v)}
                className="gap-1.5 shrink-0"
                style={showFilters ? { background: 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary) / 0.4)' } : {}}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {hasFilters && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'hsl(var(--primary))' }}
                  />
                )}
              </Button>
            </div>
          </motion.div>

          {/* ── Quick-access intention chips ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-4"
            aria-label="Quick filters"
          >
            {[
              { label: '✨ Beginner', difficulty: 'beginner', intention: '' },
              { label: '🌕 Full Moon', difficulty: '', intention: '', moonPhase: 'full_moon' },
              { label: '💛 Abundance', difficulty: '', intention: 'abundance' },
              { label: '💜 Clarity', difficulty: '', intention: 'clarity' },
              { label: '🌿 Healing', difficulty: '', intention: 'healing' },
              { label: '🛡 Protection', difficulty: '', intention: 'protection' },
            ].map((chip) => {
              const isActive = (chip.difficulty && difficulty === chip.difficulty) ||
                (chip.intention && intention === chip.intention) ||
                ('moonPhase' in chip && chip.moonPhase && moonPhase === chip.moonPhase);
              return (
                <button
                  key={chip.label}
                  onClick={() => {
                    if (chip.difficulty) setParam('difficulty', isActive ? '' : chip.difficulty);
                    if (chip.intention) setParam('intention', isActive ? '' : chip.intention);
                    if ('moonPhase' in chip && chip.moonPhase) setParam('moonPhase', isActive ? '' : chip.moonPhase);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    background: isActive ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                    borderColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    fontFamily: 'var(--font-sans)',
                  }}
                  aria-pressed={!!isActive}
                >
                  {chip.label}
                </button>
              );
            })}
          </motion.div>

          {/* ── Filter panel ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mb-6"
              >
                <div
                  className="p-5 rounded-2xl"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Intention */}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Intention</p>
                      <div className="flex flex-wrap gap-1.5">
                        {INTENTIONS.map((i) => (
                          <FilterChip
                            key={i.value}
                            label={i.label}
                            active={intention === i.value}
                            onClick={() => setParam('intention', i.value)}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Difficulty */}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Difficulty</p>
                      <div className="flex flex-wrap gap-1.5">
                        {DIFFICULTIES.map((d) => (
                          <FilterChip
                            key={d.value}
                            label={d.label}
                            active={difficulty === d.value}
                            onClick={() => setParam('difficulty', d.value)}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Moon Phase */}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Moon Phase</p>
                      <div className="flex flex-wrap gap-1.5">
                        {MOON_PHASES.map((m) => (
                          <FilterChip
                            key={m.value}
                            label={m.label}
                            active={moonPhase === m.value}
                            onClick={() => setParam('moonPhase', m.value)}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Duration */}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Duration</p>
                      <div className="flex flex-wrap gap-1.5">
                        {DURATION_OPTIONS.map((d) => (
                          <FilterChip
                            key={d.value}
                            label={d.label}
                            active={duration === d.value}
                            onClick={() => setParam('duration', d.value)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {hasFilters && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 text-xs transition-colors"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--foreground))'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))'; }}
                      >
                        <X className="w-3 h-3" /> Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results count ── */}
          {data && !loading && (
            <p className="text-sm mb-5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {data.pagination.total} spell{data.pagination.total !== 1 ? 's' : ''}
              {search ? ` matching "${search}"` : ''}
              {intention ? ` · ${intention}` : ''}
            </p>
          )}

          {/* ── Grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="h-52 rounded-2xl animate-pulse"
                  style={{ background: 'hsl(var(--card))' }}
                />
              ))}
            </div>
          ) : data && data.spells.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {data.spells.map((spell, i) => (
                <SpellCard key={spell.id} spell={spell} index={i} />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl text-center"
              style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px dashed hsl(var(--border))' }}
            >
              <Sparkles className="w-10 h-10" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                {spellsContent.noResults.title}
              </p>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {spellsContent.noResults.description}
              </p>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                  <X className="w-3 h-3" /> Clear filters
                </Button>
              )}
            </div>
          )}

          {/* ── Pagination ── */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
                className="gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setParam('page', String(page + 1))}
                className="gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* ── Moon & Ritual Timing companion ── */}
          {moonData && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              aria-labelledby="moon-timing-heading"
              className="mt-14 mb-10"
            >
              <div
                className="p-5 rounded-2xl flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-4xl" aria-hidden="true">{MOON_GLYPHS[moonData.phase] ?? '🌙'}</span>
                  <div>
                    <p
                      id="moon-timing-heading"
                      className="text-xs font-medium uppercase tracking-wide mb-0.5"
                      style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                    >
                      Tonight's Moon
                    </p>
                    <p
                      className="text-lg capitalize"
                      style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                    >
                      {moonData.phase.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {moonData.illumination}% illuminated
                    </p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Intentions aligned with this phase:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(MOON_INTENTION_ALIGNMENT[moonData.phase] ?? []).map((intent) => (
                      <button
                        key={intent}
                        onClick={() => setParam('intention', intention === intent ? '' : intent)}
                        className="text-xs px-3 py-1.5 rounded-full capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{
                          background: intention === intent ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
                          color: intention === intent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                          border: `1px solid ${intention === intent ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {intent}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ── Build Your Ritual Path ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            aria-labelledby="ritual-path-heading"
            className="mt-4 mb-16"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              {/* Header — always visible */}
              <button
                onClick={() => { setPathOpen((o) => !o); if (!pathOpen) resetPath(); }}
                className="w-full flex items-center justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                aria-expanded={pathOpen}
                aria-controls="ritual-path-panel"
              >
                <div>
                  <p
                    id="ritual-path-heading"
                    className="text-xl"
                    style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                  >
                    Build Your Ritual Path
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Answer a few questions and we'll suggest spells that fit your intention and situation.
                  </p>
                </div>
                <Sparkles
                  className="w-5 h-5 shrink-0"
                  style={{ color: 'hsl(var(--primary))' }}
                  aria-hidden="true"
                />
              </button>

              {/* Collapsible panel */}
              <AnimatePresence>
                {pathOpen && (
                  <motion.div
                    id="ritual-path-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-6" style={{ borderTop: '1px solid hsl(var(--border))' }}>

                      {/* Step: intention */}
                      {pathStep === 'intention' && (
                        <div className="pt-5">
                          <p className="text-base mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                            What is your intention?
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {INTENTIONS.filter((i) => i.value).map((i) => (
                              <button
                                key={i.value}
                                onClick={() => { setPathIntention(i.value); setPathStep('experience'); }}
                                className="text-sm px-4 py-3 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary capitalize"
                                style={{
                                  background: 'hsl(var(--muted))',
                                  color: 'hsl(var(--foreground))',
                                  border: '1px solid hsl(var(--border))',
                                  fontFamily: 'var(--font-sans)',
                                }}
                              >
                                {i.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step: experience */}
                      {pathStep === 'experience' && (
                        <div className="pt-5">
                          <p className="text-base mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                            What's your experience level?
                          </p>
                          <div className="flex flex-col gap-2">
                            {[
                              { value: 'beginner', label: 'Beginner', desc: 'New to spellwork' },
                              { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
                              { value: 'advanced', label: 'Advanced', desc: 'Comfortable with complex rituals' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => { setPathExperience(opt.value); setPathStep('time'); }}
                                className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                              >
                                <span style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{opt.label}</span>
                                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{opt.desc}</span>
                              </button>
                            ))}
                          </div>
                          <button onClick={() => setPathStep('intention')} className="mt-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>← Back</button>
                        </div>
                      )}

                      {/* Step: time */}
                      {pathStep === 'time' && (
                        <div className="pt-5">
                          <p className="text-base mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                            How much time do you have?
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: '15', label: 'Under 15 min' },
                              { value: '30', label: 'Under 30 min' },
                              { value: '60', label: '30–60 min' },
                              { value: '60+', label: 'Over an hour' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => { setPathTime(opt.value); void runPathSearch(pathIntention, pathExperience, opt.value); }}
                                className="text-sm px-4 py-3 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => setPathStep('experience')} className="mt-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>← Back</button>
                        </div>
                      )}

                      {/* Step: results */}
                      {pathStep === 'results' && (
                        <div className="pt-5">
                          {pathLoading ? (
                            <div className="flex items-center gap-3 py-8 justify-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                              />
                              <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Finding your spells…</span>
                            </div>
                          ) : pathResults.length > 0 ? (
                            <>
                              <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                                Showing spells matching <strong style={{ color: 'hsl(var(--foreground))' }}>{pathIntention}</strong>
                                {pathExperience ? <>, {pathExperience} level</> : ''}
                                {pathTime ? <>, under {pathTime === '60+' ? '60+ min' : `${pathTime} min`}</> : ''}.
                                These are real spells from the library — no invented content.
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {pathResults.map((spell, i) => (
                                  <SpellCard key={spell.id} spell={spell} index={i} />
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="py-8 text-center">
                              <p className="text-base mb-2" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>No exact matches found</p>
                              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Try browsing the full library with the filters above.</p>
                            </div>
                          )}
                          <div className="flex gap-3 flex-wrap">
                            <button
                              onClick={resetPath}
                              className="text-sm px-4 py-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                            >
                              Start Over
                            </button>
                            <Link
                              to="/spells"
                              onClick={() => setPathOpen(false)}
                              className="text-sm px-4 py-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                            >
                              Browse Full Library
                            </Link>
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>
      </main>
    </>
  );
}
