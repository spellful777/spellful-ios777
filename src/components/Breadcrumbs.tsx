/**
 * Breadcrumbs.tsx
 * Smart breadcrumb trail derived from the current URL path.
 * Renders on pages with depth >= 2 (e.g. /astrology/planets, /tarot/cards/the-fool).
 * Skips auth-only utility pages (login, signup, account, etc.).
 */
import { Link, useLocation } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';

// ── Human-readable labels for known path segments ────────────────────────────
const SEGMENT_LABELS: Record<string, string> = {
  // Top-level
  'astrology':         'Astrology',
  'tarot':             'Tarot',
  'cards':             'Cards',
  'birth-chart':       'Birth Chart',
  'moon-ritual':       'Moon Ritual',
  'moon-calendar':     'Moon Calendar',
  'moon':              'Moon',
  'phases':            'Phases',
  'herbs':             'Herbs & Crystals',
  'grimoire':          'My Grimoire',
  'spells':            'Spell Library',
  'learn':             'Spellful Academy',
  'resources':         'Resources',
  'community':         'Community',
  'dashboard':         'Daily Dashboard',
  'sanctuary':         'My Sanctuary',
  'numerology':        'Numerology',
  'runes':             'Runes',
  'compatibility':     'Compatibility',
  'dream-journal':     'Dream Journal',
  'horoscope':         'Horoscope',
  'about':             'About',
  'profile':           'Profile',
  'reminders':         'Reminders',
  // Sub-segments
  'planets':           'Planets',
  'houses':            'Houses',
  'aspects':           'Aspects',
  'live-sky':          'Live Sky Explorer',
  'cosmic-connections': 'Cosmic Connections',
  'celestial-time-machine': 'Celestial Time Machine',
  'post':              'Post',
  'new':               'New Post',
  'bookmarks':         'Bookmarks',
  'notifications':     'Notifications',
  'submit':            'Submit a Spell',
};

// Pages where breadcrumbs should NOT appear
const SKIP_PATHS = new Set([
  '/', '/login', '/signup', '/forgot-password', '/account',
  '/messages', '/privacy', '/terms', '/astronomical-accuracy',
  '/app-store-submission', '/app-store-screenshots', '/app-launch-kit',
  '/admin/spells', '/admin/community',
]);

/** Returns true when the path should have no breadcrumbs rendered */
function shouldSkipPath(pathname: string): boolean {
  if (SKIP_PATHS.has(pathname)) return true;
  // Moon event pages (/moon/:type/:year/:month) have numeric year/month segments
  // that produce meaningless intermediate links — suppress entirely.
  const segs = pathname.split('/').filter(Boolean);
  if (segs[0] === 'moon' && segs.length >= 3 && /^[0-9]{4}$/.test(segs[2])) return true;
  return false;
}

/** Convert a slug like "the-fool" → "The Fool" */
function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface Crumb {
  label: string;
  href: string;
}

/** Returns true when a segment is a raw ID/number we should not show as a crumb label */
function isRawId(seg: string): boolean {
  // Pure numeric (e.g. community post id "123")
  return /^[0-9]+$/.test(seg);
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: 'Home', href: '/' }];

  let path = '';
  for (const seg of segments) {
    path += '/' + seg;
    // Skip raw numeric IDs — they produce meaningless labels like "123"
    if (isRawId(seg)) continue;
    const label = SEGMENT_LABELS[seg] ?? slugToLabel(seg);
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  // Don't render on skipped pages or top-level pages (depth < 2)
  if (shouldSkipPath(pathname)) return null;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 1) return null;

  const crumbs = buildCrumbs(pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className="w-full px-4 md:px-8 py-2.5"
      style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}
    >
      <ol className="flex items-center flex-wrap gap-1 max-w-7xl mx-auto">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {i === 0 ? (
                <Link
                  to={crumb.href}
                  className="flex items-center gap-1 text-xs transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  aria-label="Home"
                >
                  <Home size={12} strokeWidth={1.8} />
                </Link>
              ) : isLast ? (
                <span
                  className="text-xs font-medium truncate max-w-[180px]"
                  style={{ color: 'hsl(var(--foreground) / 0.85)', fontFamily: 'var(--font-sans)' }}
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="text-xs transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded truncate max-w-[140px]"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  {crumb.label}
                </Link>
              )}
              {!isLast && (
                <ChevronRight
                  size={11}
                  strokeWidth={1.8}
                  style={{ color: 'hsl(var(--muted-foreground) / 0.5)', flexShrink: 0 }}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
