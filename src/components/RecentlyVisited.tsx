/**
 * RecentlyVisited.tsx
 *
 * Tracks the last 5 unique pages visited (localStorage) and renders a
 * compact floating sidebar widget on desktop (md+). Hidden on mobile —
 * the mobile bottom nav already provides quick navigation.
 *
 * Storage key: "spellful_recent_pages"
 * Shape: Array<{ path: string; label: string; visitedAt: number }>
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronRight, X } from 'lucide-react';

const STORAGE_KEY = 'spellful_recent_pages';
const MAX_ITEMS = 5;

// Pages we don't want to track
const SKIP_PATHS = new Set([
  '/login', '/signup', '/forgot-password',
  '/admin/spells', '/admin/community',
  '/app-store-submission', '/app-store-screenshots', '/app-launch-kit',
]);

// Human-readable labels for paths
const PATH_LABELS: Record<string, string> = {
  '/':                    'Home',
  '/tarot':               'Tarot',
  '/birth-chart':         'Birth Chart',
  '/moon-ritual':         'Moon Ritual',
  '/moon-calendar':       'Moon Calendar',
  '/moon/phases':         'Moon Phases',
  '/astrology':           'Astrology',
  '/astrology/planets':   'Planets',
  '/astrology/houses':    'Houses',
  '/astrology/aspects':   'Aspects',
  '/herbs':               'Herbs & Crystals',
  '/grimoire':            'My Grimoire',
  '/spells':              'Spell Library',
  '/spells/submit':       'Submit a Spell',
  '/learn':               'Spellful Academy',
  '/resources':           'Resources',
  '/community':           'Community',
  '/dashboard':           'Daily Dashboard',
  '/sanctuary':           'My Sanctuary',
  '/numerology':          'Numerology',
  '/runes':               'Runes',
  '/compatibility':       'Compatibility',
  '/dream-journal':       'Dream Journal',
  '/horoscope':           'Horoscope',
  '/about':               'About',
  '/reminders':           'Reminders',
  '/messages':            'Messages',
  '/timeline':            'Timeline',
  '/calendar':            'Calendar',
  '/account':             'Account',
};

function labelForPath(path: string): string {
  if (PATH_LABELS[path]) return PATH_LABELS[path];
  // Dynamic segments — derive from last segment
  const last = path.split('/').filter(Boolean).pop() ?? '';
  return last
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Page glyphs for visual interest
const PATH_GLYPHS: Record<string, string> = {
  '/tarot':             '🃏',
  '/birth-chart':       '⭐',
  '/moon-ritual':       '🌙',
  '/moon-calendar':     '📅',
  '/moon/phases':       '🌕',
  '/astrology':         '♈',
  '/astrology/planets': '🪐',
  '/astrology/houses':  '🏠',
  '/astrology/aspects': '△',
  '/herbs':             '🌿',
  '/grimoire':          '📖',
  '/spells':            '✨',
  '/learn':             '🎓',
  '/resources':         '📚',
  '/community':         '👥',
  '/dashboard':         '🔮',
  '/sanctuary':         '🕯️',
  '/numerology':        '🔢',
  '/runes':             '᚛',
  '/compatibility':     '💫',
  '/dream-journal':     '💭',
  '/horoscope':         '♊',
};

function glyphForPath(path: string): string {
  // Check exact match first
  if (PATH_GLYPHS[path]) return PATH_GLYPHS[path];
  // Check prefix matches for dynamic routes
  for (const [key, glyph] of Object.entries(PATH_GLYPHS)) {
    if (path.startsWith(key + '/')) return glyph;
  }
  return '✦';
}

interface RecentPage {
  path: string;
  label: string;
  visitedAt: number;
}

function loadRecent(): RecentPage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentPage[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(pages: RecentPage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function useRecentPages() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (SKIP_PATHS.has(path)) return;

    const label = labelForPath(path);
    const now = Date.now();

    const existing = loadRecent();
    // Remove duplicate of this path, then prepend
    const filtered = existing.filter(p => p.path !== path);
    const updated = [{ path, label, visitedAt: now }, ...filtered].slice(0, MAX_ITEMS);
    saveRecent(updated);
  }, [location.pathname]);
}

export default function RecentlyVisited() {
  const location = useLocation();
  const [pages, setPages] = useState<RecentPage[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    setMounted(true);
    setPages(loadRecent());
  }, []);

  // Refresh list whenever route changes
  useEffect(() => {
    if (mounted) setPages(loadRecent());
  }, [location.pathname, mounted]);

  // Filter out current page
  const filtered = pages.filter(p => p.path !== location.pathname);

  // Don't render if fewer than 2 previous pages
  if (!mounted || filtered.length < 2) return null;

  return (
    <>
      {/* Toggle tab — fixed to right edge, vertically centered */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close recently visited' : 'Recently visited pages'}
        aria-expanded={open}
        className="fixed z-30 hidden md:flex items-center gap-1.5 px-2 py-3 rounded-l-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{
          right: open ? '200px' : '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRight: 'none',
          color: 'hsl(var(--primary))',
          transition: 'right 0.3s cubic-bezier(0.4,0,0.2,1)',
          writingMode: 'vertical-rl',
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <Clock size={11} strokeWidth={1.8} style={{ transform: 'rotate(90deg)' }} aria-hidden="true" />
        <span>Recent</span>
      </button>

      {/* Sidebar panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="recently-visited"
            initial={{ x: 200 }}
            animate={{ x: 0 }}
            exit={{ x: 200 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed z-30 hidden md:flex flex-col"
            style={{
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '200px',
              maxHeight: '360px',
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRight: 'none',
              borderRadius: '12px 0 0 12px',
              boxShadow: '-4px 0 24px hsl(var(--background) / 0.8)',
            }}
            aria-label="Recently visited pages"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.6)' }}
            >
              <div className="flex items-center gap-1.5">
                <Clock size={12} strokeWidth={1.8} style={{ color: 'hsl(var(--primary))' }} aria-hidden="true" />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}
                >
                  Recently Visited
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-0.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                <X size={13} strokeWidth={1.8} />
              </button>
            </div>

            {/* Page list */}
            <ul className="flex flex-col overflow-y-auto py-1" role="list">
              {filtered.map((page) => (
                <li key={page.path}>
                  <Link
                    to={page.path}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary"
                    style={{ color: 'hsl(var(--foreground) / 0.85)' }}
                  >
                    <span
                      className="text-base leading-none shrink-0 w-5 text-center"
                      aria-hidden="true"
                    >
                      {glyphForPath(page.path)}
                    </span>
                    <span
                      className="text-xs flex-1 truncate group-hover:text-primary transition-colors"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      {page.label}
                    </span>
                    <ChevronRight
                      size={11}
                      strokeWidth={1.8}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'hsl(var(--primary))' }}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
