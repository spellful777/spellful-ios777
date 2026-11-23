import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
import { Home, Search, Sparkles, Users, User, X, Star, Moon, BookOpen, Leaf, GraduationCap, Globe, Scroll, Hash, CalendarDays, Heart, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client.tsx';

// ─── Explore tool categories ──────────────────────────────────────────────────
interface ExploreTool {
  label: string;
  href: string;
  icon: React.ReactNode;
  desc: string;
}

interface ExploreCategory {
  label: string;
  tools: ExploreTool[];
}

const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    label: 'Divination',
    tools: [
      { label: 'Tarot', href: '/resources', icon: <Star size={16} strokeWidth={1.5} />, desc: '78-card readings & spreads' },
      { label: 'Runes', href: '/runes', icon: <Layers size={16} strokeWidth={1.5} />, desc: 'Elder Futhark readings' },
      { label: 'Numerology', href: '/numerology', icon: <Scroll size={16} strokeWidth={1.5} />, desc: 'Life path & destiny numbers' },
    ],
  },
  {
    label: 'Moon & Sky',
    tools: [
      { label: 'Moon Rituals', href: '/moon-ritual', icon: <Moon size={16} strokeWidth={1.5} />, desc: '48 rituals across 8 phases' },
      { label: 'Moon Calendar', href: '/moon-calendar', icon: <CalendarDays size={16} strokeWidth={1.5} />, desc: 'Lunar phases & timing' },
      { label: 'Astrology', href: '/astrology', icon: <Star size={16} strokeWidth={1.5} />, desc: 'Planets, houses & aspects' },
      { label: 'Birth Chart', href: '/birth-chart', icon: <Globe size={16} strokeWidth={1.5} />, desc: 'Natal wheel & synastry' },
    ],
  },
  {
    label: 'Spellcraft',
    tools: [
      { label: 'Spell Library', href: '/spells', icon: <Sparkles size={16} strokeWidth={1.5} />, desc: 'Curated spells by intention' },
      { label: 'Herbs & Crystals', href: '/herbs', icon: <Leaf size={16} strokeWidth={1.5} />, desc: 'Magical correspondences' },
      { label: 'Potions Lab', href: '/potions', icon: <Hash size={16} strokeWidth={1.5} />, desc: 'Brews, oils & recipes' },
    ],
  },
  {
    label: 'Inner Work',
    tools: [
      { label: 'Dream Journal', href: '/dream-journal', icon: <BookOpen size={16} strokeWidth={1.5} />, desc: 'Encrypted dream records' },
      { label: 'Compatibility', href: '/compatibility', icon: <Heart size={16} strokeWidth={1.5} />, desc: 'Synastry & connections' },
    ],
  },
  {
    label: 'Learn',
    tools: [
      { label: 'Spellful Academy', href: '/learn', icon: <GraduationCap size={16} strokeWidth={1.5} />, desc: '22 free guided lessons' },
    ],
  },
];

// ─── Tab definitions ──────────────────────────────────────────────────────────
interface Tab {
  label: string;
  icon: React.ReactNode;
  href: string;
  authRequired?: boolean;
  matchPaths?: string[];
  isExplore?: boolean;
}

const TABS: Tab[] = [
  {
    label: 'Home',
    icon: <Home size={22} strokeWidth={1.6} />,
    href: '/',
  },
  {
    label: 'Explore',
    icon: <Search size={22} strokeWidth={1.6} />,
    href: '/explore',
    isExplore: true,
    matchPaths: [
      '/explore', '/tarot', '/runes', '/numerology', '/dream-journal',
      '/moon-calendar', '/moon-ritual', '/birth-chart', '/calendar',
      '/astrology', '/spells', '/herbs', '/timeline',
      '/resources', '/learn', '/horoscope', '/compatibility',
      '/potions',
    ],
  },
  {
    label: 'Grimoire',
    icon: <BookOpen size={22} strokeWidth={1.6} />,
    href: '/grimoire',
    authRequired: true,
    matchPaths: ['/grimoire', '/dashboard', '/sanctuary', '/reminders', '/dream-journal', '/timeline'],
  },
  {
    label: 'Coven',
    icon: <Users size={22} strokeWidth={1.6} />,
    href: '/community',
    authRequired: true,
    matchPaths: ['/community', '/messages'],
  },
  {
    label: 'You',
    icon: <User size={22} strokeWidth={1.6} />,
    href: '/account',
    authRequired: true,
    matchPaths: ['/account', '/profile', '/u/'],
  },
];

function isTabActive(tab: Tab, pathname: string): boolean {
  if (tab.href === '/') return pathname === '/';
  if (pathname === tab.href) return true;
  return tab.matchPaths?.some((p) => pathname === p || pathname.startsWith(p + '/')) ?? false;
}

// ─── Explore drawer ───────────────────────────────────────────────────────────
function ExploreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const [tappedHref, setTappedHref] = useState<string | null>(null);

  // Close on route change
  useEffect(() => {
    if (open) onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="explore-backdrop"
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'hsl(var(--background) / 0.7)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            key="explore-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Explore tools"
            className="md:hidden fixed left-0 right-0 bottom-[57px] z-50 rounded-t-2xl overflow-hidden"
            style={{
              background: 'hsl(var(--card))',
              borderTop: '1px solid hsl(var(--primary) / 0.25)',
              boxShadow: '0 -8px 40px 0 hsl(var(--background) / 0.6)',
              maxHeight: '72svh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0"
              style={{ borderBottom: '1px solid hsl(var(--border))' }}
            >
              <div className="flex items-center gap-2">
                <Search size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--primary))' }} />
                <span
                  className="text-sm font-medium"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))', fontSize: '1.05rem' }}
                >
                  Explore
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Explore menu"
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable tool list */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(72svh - 56px)' }}>
              {EXPLORE_CATEGORIES.map((cat, ci) => (
                <div key={cat.label}>
                  <p
                    className="px-5 pt-4 pb-1.5 text-[10px] uppercase tracking-widest"
                    style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
                  >
                    {cat.label}
                  </p>

                  {cat.tools.map((tool, ti) => {
                    const isActive = location.pathname === tool.href || location.pathname.startsWith(tool.href + '/');
                    return (
                      <motion.div
                        key={tool.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18, delay: ci * 0.04 + ti * 0.03 }}
                      >
                        <Link
                          to={tool.href}
                          className="flex items-center gap-3.5 px-5 py-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                          style={{
                            background: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                            borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                          }}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => {
                            setTappedHref(tool.href);
                            setTimeout(() => setTappedHref(null), 500);
                          }}
                        >
                          <motion.span
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            animate={tappedHref === tool.href
                              ? { boxShadow: ['0 0 0px 0px hsl(var(--primary) / 0)', '0 0 12px 4px hsl(var(--primary) / 0.55)', '0 0 0px 0px hsl(var(--primary) / 0)'] }
                              : { boxShadow: '0 0 0px 0px hsl(var(--primary) / 0)' }
                            }
                            transition={{ duration: 0.45, ease: 'easeOut' as const }}
                            style={{
                              background: isActive || tappedHref === tool.href ? 'hsl(var(--primary) / 0.22)' : 'hsl(var(--muted))',
                              color: isActive || tappedHref === tool.href ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                            }}
                          >
                            {tool.icon}
                          </motion.span>
                          <div className="min-w-0">
                            <p
                              className="text-sm leading-tight"
                              style={{
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 400,
                                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                              }}
                            >
                              {tool.label}
                            </p>
                            <p
                              className="text-[11px] leading-tight mt-0.5 truncate"
                              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                            >
                              {tool.desc}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}

                  {ci < EXPLORE_CATEGORIES.length - 1 && (
                    <div className="mx-5 mt-2" style={{ height: '1px', background: 'hsl(var(--border))' }} />
                  )}
                </div>
              ))}
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main nav ─────────────────────────────────────────────────────────────────
export default function MobileBottomNav() {
  const { session, isPending } = useSession();
  const location = useLocation();
  const [exploreOpen, setExploreOpen] = useState(false);

  const closeExplore = useCallback(() => setExploreOpen(false), []);

  // Render a stable placeholder while auth resolves to avoid layout shift
  if (isPending) {
    return (
      <nav
        aria-label="Mobile bottom navigation"
        aria-hidden="true"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          background: 'hsl(var(--background) / 0.96)',
          borderTop: '1px solid hsl(var(--primary) / 0.18)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          minHeight: '56px',
        }}
      />
    );
  }

  return (
    <>
      <ExploreDrawer open={exploreOpen} onClose={closeExplore} />

      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          background: 'hsl(var(--background) / 0.96)',
          borderTop: '1px solid hsl(var(--primary) / 0.18)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {TABS.map((tab) => {
          const active = isTabActive(tab, location.pathname) || (tab.isExplore === true && exploreOpen);

          if (tab.isExplore) {
            return (
              <button
                key={tab.label}
                aria-label={tab.label}
                aria-expanded={exploreOpen}
                aria-haspopup="dialog"
                onClick={() => setExploreOpen((v) => !v)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary relative"
                style={{
                  minHeight: '56px',
                  color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full transition-all duration-300"
                  style={{ background: active ? 'hsl(var(--primary))' : 'transparent' }}
                  aria-hidden="true"
                />
                <motion.span
                  animate={{ rotate: exploreOpen ? 45 : 0, scale: active ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {exploreOpen ? <X size={22} strokeWidth={1.6} /> : <Search size={22} strokeWidth={1.6} />}
                </motion.span>
                <span
                  className="text-[10px] leading-none font-medium tracking-wide"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          const dest = tab.authRequired && !session
            ? `/login?redirect=${tab.href}`
            : tab.href;

          return (
            <Link
              key={tab.label}
              to={dest}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              onClick={closeExplore}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary relative"
              style={{
                minHeight: '56px',
                color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}
            >
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full transition-all duration-300"
                style={{ background: active ? 'hsl(var(--primary))' : 'transparent' }}
                aria-hidden="true"
              />
              <span
                className="transition-transform duration-200"
                style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}
              >
                {tab.icon}
              </span>
              <span
                className="text-[10px] leading-none font-medium tracking-wide"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
