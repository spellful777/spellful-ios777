/**
 * /explore — Unified Explore landing page.
 * Search first, then categories, recently visited, favorites, recommended topics.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  Search, Star, Moon, Sparkles, Leaf, GraduationCap,
  Globe, BookOpen, Scroll, Heart, CalendarDays, Layers,
  ChevronRight, Clock, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { explore } from 'virtual:content';

// ─── Category data ────────────────────────────────────────────────────────────

interface ExploreItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  desc: string;
  tags?: string[];
}

interface ExploreCategory {
  id: string;
  label: string;
  color: string;
  items: ExploreItem[];
}

const CATEGORIES: ExploreCategory[] = [
  {
    id: 'divination',
    label: 'Divination',
    color: 'hsl(var(--primary))',
    items: [
      { label: 'Tarot', href: '/tarot', icon: <Star className="w-5 h-5" />, desc: '78-card readings & spreads', tags: ['tarot', 'cards', 'reading', 'spread'] },
      { label: 'Runes', href: '/runes', icon: <Layers className="w-5 h-5" />, desc: 'Elder Futhark readings', tags: ['runes', 'elder futhark', 'divination'] },
      { label: 'Numerology', href: '/numerology', icon: <Scroll className="w-5 h-5" />, desc: 'Life path & destiny numbers', tags: ['numerology', 'numbers', 'life path'] },
    ],
  },
  {
    id: 'moon',
    label: 'Moon & Sky',
    color: 'hsl(var(--accent))',
    items: [
      { label: 'Moon Rituals', href: '/moon-ritual', icon: <Moon className="w-5 h-5" />, desc: '48 rituals across 8 phases', tags: ['moon', 'ritual', 'lunar', 'phase'] },
      { label: 'Moon Calendar', href: '/moon-calendar', icon: <CalendarDays className="w-5 h-5" />, desc: 'Lunar phases & timing', tags: ['moon', 'calendar', 'lunar', 'phase'] },
      { label: 'Astrology', href: '/astrology', icon: <Star className="w-5 h-5" />, desc: 'Planets, houses & aspects', tags: ['astrology', 'planets', 'zodiac', 'houses'] },
      { label: 'Birth Chart', href: '/birth-chart', icon: <Globe className="w-5 h-5" />, desc: 'Natal wheel & synastry', tags: ['birth chart', 'natal', 'synastry', 'astrology'] },
      { label: 'Horoscope', href: '/horoscope', icon: <Star className="w-5 h-5" />, desc: 'Daily cosmic guidance', tags: ['horoscope', 'daily', 'zodiac'] },
    ],
  },
  {
    id: 'spellcraft',
    label: 'Spellcraft',
    color: 'hsl(var(--primary))',
    items: [
      { label: 'Spell Library', href: '/spells', icon: <Sparkles className="w-5 h-5" />, desc: 'Curated spells by intention', tags: ['spells', 'magic', 'ritual', 'intention'] },
      { label: 'Herbs & Crystals', href: '/herbs', icon: <Leaf className="w-5 h-5" />, desc: 'Magical correspondences', tags: ['herbs', 'crystals', 'correspondences', 'plants'] },
    ],
  },
  {
    id: 'inner',
    label: 'Inner Work',
    color: 'hsl(var(--secondary))',
    items: [
      { label: 'Dream Journal', href: '/dream-journal', icon: <BookOpen className="w-5 h-5" />, desc: 'Encrypted dream records', tags: ['dream', 'journal', 'sleep', 'subconscious'] },
      { label: 'Compatibility', href: '/compatibility', icon: <Heart className="w-5 h-5" />, desc: 'Synastry & connections', tags: ['compatibility', 'synastry', 'relationships'] },
    ],
  },
  {
    id: 'learn',
    label: 'Learn',
    color: 'hsl(var(--accent))',
    items: [
      { label: 'Spellful Academy', href: '/learn', icon: <GraduationCap className="w-5 h-5" />, desc: '22 free guided lessons', tags: ['learn', 'academy', 'lessons', 'beginner'] },
      { label: 'Resources', href: '/resources', icon: <BookOpen className="w-5 h-5" />, desc: 'Guides, spreads & references', tags: ['resources', 'guides', 'reference'] },
    ],
  },
];

const ALL_ITEMS: ExploreItem[] = CATEGORIES.flatMap((c) => c.items);

const RECENT_KEY = 'spellful_explore_recent';
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function addRecent(href: string) {
  try {
    const prev = getRecent().filter((h) => h !== href);
    localStorage.setItem(RECENT_KEY, JSON.stringify([href, ...prev].slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

// ─── Search results ───────────────────────────────────────────────────────────

function SearchResults({ query, onNavigate }: { query: string; onNavigate: (href: string) => void }) {
  const q = query.toLowerCase().trim();
  const results = ALL_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.tags?.some((t) => t.includes(q)),
  );

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
          No results for "{query}"
        </p>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
          Try searching for tarot, moon, herbs, spells, or astrology.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
        {results.length} result{results.length !== 1 ? 's' : ''}
      </p>
      {results.map((item) => (
        <motion.div
          key={item.href}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Link
            to={item.href}
            onClick={() => onNavigate(item.href)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
            >
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {item.label}
              </p>
              <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {item.desc}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({ category, onNavigate }: { category: ExploreCategory; onNavigate: (href: string) => void }) {
  return (
    <div>
      <p
        className="text-xs uppercase tracking-widest mb-3"
        style={{ color: category.color, fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
      >
        {category.label}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {category.items.map((item, i) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: i * 0.04 }}
          >
            <Link
              to={item.href}
              onClick={() => onNavigate(item.href)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${category.color.replace(')', ' / 0.12)')}`, color: category.color }}
              >
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {item.label}
                </p>
                <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {item.desc}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const handleNavigate = useCallback((href: string) => {
    addRecent(href);
    setRecent(getRecent());
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const recentItems = recent
    .map((href) => ALL_ITEMS.find((item) => item.href === href))
    .filter((item): item is ExploreItem => item !== undefined);

  const isSearching = query.trim().length > 0;

  return (
    <>
      <Helmet>
        <title>Explore — Spellful</title>
        <meta name="description" content="Search and explore tarot, moon rituals, spells, herbs, astrology, and more on Spellful." />
        <meta property="og:title" content="Explore — Spellful" />
        <meta property="og:description" content="Search and explore tarot, moon rituals, spells, herbs, astrology, and more on Spellful." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/explore" />
        <meta property="og:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Explore — Spellful" />
        <meta name="twitter:description" content="Search and explore tarot, moon rituals, spells, herbs, astrology, and more on Spellful." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
      </Helmet>

      <main className="min-h-screen pb-24" style={{ background: 'hsl(var(--background))' }}>
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 pt-4 pb-3"
          style={{
            background: 'hsl(var(--background) / 0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <h1
            className="text-2xl mb-3"
            style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
          >
            {explore.heading}
          </h1>

          {/* Search bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search spells, herbs, tarot, moon…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                fontFamily: 'var(--font-sans)',
              }}
              aria-label="Search Spellful"
            />
            {query && (
              <button
                onClick={clearQuery}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pt-5 flex flex-col gap-8">
          {isSearching ? (
            <SearchResults query={query} onNavigate={handleNavigate} />
          ) : (
            <>
              {/* Recently visited */}
              {recentItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                    <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {explore.recentLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => handleNavigate(item.href)}
                        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        <span style={{ color: 'hsl(var(--primary))' }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick access chips */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                  {explore.popularLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Daily Tarot', href: '/tarot' },
                    { label: 'Moon Phase', href: '/moon-calendar' },
                    { label: 'Spell Library', href: '/spells' },
                    { label: 'Horoscope', href: '/horoscope' },
                    { label: 'Herbs', href: '/herbs' },
                    { label: 'Birth Chart', href: '/birth-chart' },
                    { label: 'Academy', href: '/learn' },
                  ].map((chip) => (
                    <Link
                      key={chip.href}
                      to={chip.href}
                      onClick={() => handleNavigate(chip.href)}
                      className="px-3 py-1.5 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{
                        background: 'hsl(var(--primary) / 0.1)',
                        border: '1px solid hsl(var(--primary) / 0.25)',
                        color: 'hsl(var(--primary))',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {chip.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* All categories */}
              {CATEGORIES.map((cat) => (
                <CategorySection key={cat.id} category={cat} onNavigate={handleNavigate} />
              ))}
            </>
          )}
        </div>
      </main>
    </>
  );
}
