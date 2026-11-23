import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, User, BookOpen, ChevronDown, Users, Bookmark, Bell, Sparkles, Star, PenLine, MessageCircle, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
import MessagingBell from '@/components/MessagingBell';

// ─── Nav structure ────────────────────────────────────────────────────────────
// Desktop: Home | Discover | Connections | Explore | My Sanctuary
// Mobile:  Home | Discover | Love        | Explore | Sanctuary

interface NavChild {
  label: string;
  href: string;
  icon?: string;
  authRequired?: boolean;
}

interface NavItem {
  label: string;          // desktop label
  mobileLabel: string;    // mobile bottom-bar label
  href?: string;          // if top-level link (no dropdown)
  children?: NavChild[];  // dropdown items
  authOnly?: boolean;     // hide entire item when signed out
  guestOnly?: boolean;    // hide entire item when signed in
}

const NAV: NavItem[] = [
  // ── 1. Home ──────────────────────────────────────────────────────────────
  {
    label: 'Home',
    mobileLabel: 'Home',
    href: '/',
  },
  // ── 2. Explore ───────────────────────────────────────────────────────────
  {
    label: 'Explore',
    mobileLabel: 'Explore',
    children: [
      // Divination & Insight
      { label: 'Tarot', href: '/tarot' },
      { label: 'Runes', href: '/runes' },
      { label: 'Numerology', href: '/numerology' },
      { label: 'Dream Journal', href: '/dream-journal', authRequired: true },
      // Moon & Astrology
      { label: 'Moon Calendar', href: '/moon-calendar' },
      { label: 'Moon Ritual', href: '/moon-ritual' },
      { label: 'Birth Chart', href: '/birth-chart' },
      { label: 'Astrology', href: '/astrology' },
      // Spellcraft & Apothecary
      { label: 'Spell Library', href: '/spells' },
      { label: 'Herbs & Crystals', href: '/herbs' },
      // Learn & Grow
      { label: 'Spellful Academy', href: '/learn' },
      { label: 'Resources', href: '/resources' },
    ],
  },
  // ── 3. My Sanctuary (auth-gated) ─────────────────────────────────────────
  {
    label: 'My Sanctuary',
    mobileLabel: 'Sanctuary',
    authOnly: true,
    children: [
      { label: 'Daily Dashboard', href: '/dashboard', authRequired: true, icon: 'dashboard' },
      { label: 'My Sanctuary', href: '/sanctuary', authRequired: true, icon: 'sanctuary' },
      { label: 'My Grimoire', href: '/grimoire', authRequired: true, icon: 'grimoire' },
      { label: 'Reminders', href: '/reminders', authRequired: true, icon: 'reminders' },
    ],
  },
  // ── 4. My Coven (auth-gated) ──────────────────────────────────────────────
  {
    label: 'My Coven',
    mobileLabel: 'My Coven',
    authOnly: true,
    children: [
      { label: 'Discussions', href: '/community', authRequired: true, icon: 'discussions' },
      { label: 'New Post', href: '/community/new', authRequired: true, icon: 'newpost' },
      { label: 'Messages', href: '/messages', authRequired: true, icon: 'messages' },
      { label: 'Bookmarks', href: '/community/bookmarks', authRequired: true, icon: 'bookmark' },
      { label: 'Notifications', href: '/community/notifications', authRequired: true, icon: 'bell' },
    ],
  },
  // ── Community link for guests ─────────────────────────────────────────────
  {
    label: 'Community',
    mobileLabel: 'Community',
    href: '/community',
    guestOnly: true,
  },
  // ── 5. Profile (auth-gated) ───────────────────────────────────────────────
  {
    label: 'Profile',
    mobileLabel: 'Profile',
    authOnly: true,
    children: [
      { label: 'My Account', href: '/account', authRequired: true },
      { label: 'About Spellful', href: '/about' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
  // ── About for guests ──────────────────────────────────────────────────────
  {
    label: 'About',
    mobileLabel: 'About',
    href: '/about',
    guestOnly: true,
  },
];

// ─── Notification count ───────────────────────────────────────────────────────

function useCommunityUnread(loggedIn: boolean) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/community/notifications?page=1')
      .then((r) => r.ok ? r.json() : null)
      .then((d: { unread?: number } | null) => { if (d?.unread) setUnread(d.unread); })
      .catch(() => {});
  }, [loggedIn]);
  return unread;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(item: NavItem, pathname: string): boolean {
  if (item.href) return pathname === item.href;
  return item.children?.some((c) => pathname === c.href) ?? false;
}

const NAV_STYLE = {
  fontFamily: 'var(--font-sans)',
  letterSpacing: '0.10em',
  textTransform: 'uppercase' as const,
  fontSize: '0.72rem',
};

// ─── Icon map for dropdown items ─────────────────────────────────────────────

function ChildIcon({ icon, unread }: { icon?: string; unread?: number }) {
  const sz = 13;
  const sw = 1.5;
  if (icon === 'dashboard')   return <Sparkles size={sz} strokeWidth={sw} />;
  if (icon === 'sanctuary')   return <Star size={sz} strokeWidth={sw} />;
  if (icon === 'grimoire')    return <BookOpen size={sz} strokeWidth={sw} />;
  if (icon === 'reminders')   return <Moon size={sz} strokeWidth={sw} />;
  if (icon === 'discussions') return <Users size={sz} strokeWidth={sw} />;
  if (icon === 'newpost')     return <PenLine size={sz} strokeWidth={sw} />;
  if (icon === 'messages')    return <MessageCircle size={sz} strokeWidth={sw} />;
  if (icon === 'bookmark')    return <Bookmark size={sz} strokeWidth={sw} />;
  if (icon === 'bell') return (
    <span className="relative inline-flex">
      <Bell size={sz} strokeWidth={sw} />
      {(unread ?? 0) > 0 && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-[7px] font-bold text-white flex items-center justify-center leading-none">
          {(unread ?? 0) > 9 ? '9+' : unread}
        </span>
      )}
    </span>
  );
  return null;
}

// ─── Section config for grouped dropdowns ────────────────────────────────────

interface SectionConfig {
  label: string;
  hrefs: string[];
}

const DROPDOWN_SECTIONS: Record<string, SectionConfig[]> = {
  'My Sanctuary': [
    { label: 'Personal', hrefs: ['/dashboard', '/sanctuary'] },
    { label: 'Tools', hrefs: ['/grimoire', '/reminders'] },
  ],
  'My Coven': [
    { label: 'Community', hrefs: ['/community', '/community/new'] },
    { label: 'Inbox', hrefs: ['/messages', '/community/bookmarks', '/community/notifications'] },
  ],
};

// ─── Desktop dropdown ─────────────────────────────────────────────────────────

interface DropdownProps {
  item: NavItem;
  pathname: string;
  session: { user: { name?: string | null } } | null;
  unread?: number;
}

function DesktopDropdown({ item, pathname, session, unread = 0 }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = isActive(item, pathname);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const visibleChildren = item.children?.filter((c) => {
    if (c.authRequired === true) return !!session;
    if (c.authRequired === false) return !session;
    return true;
  }) ?? [];

  const sections = DROPDOWN_SECTIONS[item.label];
  const isSectioned = !!sections;

  const sectionedChildren: { label: string; items: NavChild[] }[] = isSectioned
    ? sections
        .map((sec) => ({ label: sec.label, items: visibleChildren.filter((c) => sec.hrefs.includes(c.href)) }))
        .filter((s) => s.items.length > 0)
    : [{ label: '', items: visibleChildren }];

  const triggerColor = active || open ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.7)';

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      {item.href ? (
        <div className="flex items-center gap-0.5">
          <Link
            to={item.href}
            className="transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            style={{ ...NAV_STYLE, color: triggerColor }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(var(--primary))'; }}
            onMouseLeave={(e) => { if (!active && !open) (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(var(--foreground) / 0.7)'; }}
          >
            {item.label}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }}
            aria-expanded={open}
            aria-haspopup="true"
            aria-label="Show sub-menu"
            className="flex items-center transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-0.5"
            style={{ color: active || open ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.5)' }}
          >
            <ChevronDown size={11} className="transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }}
          aria-expanded={open}
          aria-haspopup="true"
          className="flex items-center gap-1.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          style={{ ...NAV_STYLE, color: triggerColor }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--primary))'; }}
          onMouseLeave={(e) => { if (!active && !open) (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--foreground) / 0.7)'; }}
        >
          {(item.label === 'My Coven' || item.label === 'Community') && (
            <span className="relative inline-flex items-center">
              <Users size={13} strokeWidth={1.5} />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive text-[8px] font-bold text-white flex items-center justify-center leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </span>
          )}
          {item.label}
          <ChevronDown size={11} className="transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 rounded-2xl border shadow-2xl overflow-hidden z-50"
            style={{
              minWidth: isSectioned ? '220px' : '190px',
              background: 'hsl(var(--card) / 0.98)',
              borderColor: 'hsl(var(--primary) / 0.22)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 40px hsl(var(--background) / 0.7), 0 0 0 1px hsl(var(--primary) / 0.1)',
            }}
            role="menu"
          >
            {/* Panel header for sectioned dropdowns */}
            {isSectioned && (
              <div className="px-4 pt-3 pb-2 flex items-center gap-2" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {item.label === 'My Sanctuary' && <Star size={12} strokeWidth={1.5} style={{ color: 'hsl(var(--primary))' }} />}
                {item.label === 'My Coven' && <Users size={12} strokeWidth={1.5} style={{ color: 'hsl(var(--primary))' }} />}
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em' }}>
                  {item.label}
                </span>
              </div>
            )}

            {sectionedChildren.map((section, si) => (
              <div key={section.label || si}>
                {isSectioned && section.label && (
                  <p className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>
                    {section.label}
                  </p>
                )}
                {section.items.map((child) => {
                  const isCurrentPage = pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      to={child.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      style={{
                        ...NAV_STYLE,
                        fontSize: '0.7rem',
                        color: isCurrentPage ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.78)',
                        background: isCurrentPage ? 'hsl(var(--primary) / 0.09)' : 'transparent',
                        borderLeft: isCurrentPage ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.background = 'hsl(var(--primary) / 0.1)';
                        el.style.color = 'hsl(var(--primary))';
                        el.style.borderLeft = '2px solid hsl(var(--primary) / 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.background = isCurrentPage ? 'hsl(var(--primary) / 0.09)' : 'transparent';
                        el.style.color = isCurrentPage ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.78)';
                        el.style.borderLeft = isCurrentPage ? '2px solid hsl(var(--primary))' : '2px solid transparent';
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors duration-150"
                        style={{
                          background: isCurrentPage ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--muted))',
                          color: isCurrentPage ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        <ChildIcon icon={child.icon} unread={child.href === '/community/notifications' ? unread : 0} />
                      </span>
                      {child.label}
                    </Link>
                  );
                })}
                {si < sectionedChildren.length - 1 && (
                  <div className="mx-4 my-1" style={{ height: '1px', background: 'hsl(var(--border))' }} />
                )}
              </div>
            ))}
            <div className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const location = useLocation();
  const lastScrollY = useRef(0);
  const { session, isPending } = useSession();
  const unread = useCommunityUnread(!!session);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y > lastScrollY.current && y > 80) {
        setNavVisible(false);
        setMobileOpen(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700${(!isPending && session) ? ' hidden md:block' : ''}`}
      style={{
        background: scrolled ? 'hsl(var(--background) / 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid hsl(var(--primary) / 0.15)' : 'none',
      }}
    >
      {/* h-16 on mobile (64px), h-20 on desktop (80px); collapses to h-12 when scrolled away */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 flex items-center justify-between transition-all duration-300 h-16 md:h-20"
        style={!navVisible ? { height: '3rem' } : undefined}
      >
        {/* Logo — larger on mobile (2.5rem floor), scales up to 3rem on desktop */}
        <Link to="/" className="flex items-center shrink-0">
          <img
            src="/airo-assets/images/logo/official-white"
            alt="Spellful"
            className="block h-auto w-auto object-contain transition-all duration-300"
            style={{
              /* clamp: 2.5rem on mobile → 3rem on md+ desktops */
              maxHeight: navVisible ? 'clamp(2.5rem, 6vw, 3rem)' : '2rem',
              maxWidth: '260px',
              filter: 'drop-shadow(0 0 6px hsl(var(--accent) / 0.35)) drop-shadow(0 0 14px hsl(var(--foreground) / 0.15))',
            }}
          />
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
          {NAV.filter((item) => (!item.authOnly || !!session) && (!item.guestOnly || !session)).map((item) => (
            <DesktopDropdown
              key={item.label}
              item={item}
              pathname={location.pathname}
              session={session}
              unread={(item.label === 'My Coven' || item.label === 'Community') ? unread : 0}
            />
          ))}

          {/* Messaging bell — desktop, signed-in only */}
          {session && <MessagingBell />}

          {/* Auth pill */}
          {session ? (
            <Link
              to="/account"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                borderColor: 'hsl(var(--primary) / 0.4)',
                color: 'hsl(var(--primary))',
                ...NAV_STYLE,
              }}
            >
              <User className="w-3.5 h-3.5" />
              {session.user.name?.split(' ')[0] ?? 'Account'}
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs px-4 py-1.5 rounded-full border transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                borderColor: 'hsl(var(--primary) / 0.5)',
                color: 'hsl(var(--primary))',
                ...NAV_STYLE,
              }}
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile: messaging bell (signed-in) + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {session && <MessagingBell />}
          <motion.button
            className="p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            style={{ color: 'hsl(var(--foreground) / 0.8)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            animate={{ opacity: navVisible ? 1 : 0, pointerEvents: navVisible ? 'auto' : 'none' }}
            transition={{ duration: 0.25 }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu — full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden fixed inset-0 z-40 flex flex-col bg-[hsl(var(--mobile-menu-bg-start))]"
          >
            {/* Celestial star field */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {([
                [12, 18], [28, 7], [45, 22], [67, 11], [83, 28], [92, 15],
                [8, 45], [35, 38], [55, 52], [74, 41], [88, 55], [20, 62],
                [48, 70], [65, 78], [82, 68], [15, 82], [38, 88], [72, 85],
                [5, 30], [60, 33], [95, 72], [30, 95],
              ] as [number, number][]).map(([x, y], i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: i % 4 === 0 ? '2px' : '1px',
                    height: i % 4 === 0 ? '2px' : '1px',
                    background: i % 5 === 0 ? 'hsl(var(--primary) / 0.65)' : 'hsl(var(--foreground) / 0.3)',
                  }}
                />
              ))}
              {/* Soft nebula glow */}
              <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full"
                style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)' }}
              />
            </div>

            {/* Top bar: logo + close */}
            <div className="relative flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
              <Link to="/" onClick={() => setMobileOpen(false)} aria-label="Spellful home">
                <img
                  src="/airo-assets/images/logo/horizontal"
                  alt="Spellful"
                  className="h-8 w-auto object-contain"
                />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="w-11 h-11 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: 'hsl(var(--foreground) / 0.07)', color: 'hsl(var(--foreground) / 0.8)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable nav */}
            <div className="relative flex-1 overflow-y-auto px-6 pb-2">
              <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
                {NAV.filter((item) => (!item.authOnly || !!session) && (!item.guestOnly || !session)).map((item) => {
                  const expanded = mobileExpanded === item.label;

                  // Item has both href and children
                  if (item.href && item.children && item.children.length > 0) {
                    const visibleSub = item.children.filter((c) => {
                      if (c.authRequired === true) return !!session;
                      if (c.authRequired === false) return !session;
                      return true;
                    });
                    return (
                      <div key={item.label} className="border-b" style={{ borderColor: 'hsl(var(--primary) / 0.12)' }}>
                        <div className="flex items-center justify-between py-3.5">
                          <Link
                            to={item.href}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            style={{
                              ...NAV_STYLE,
                              fontSize: '0.85rem',
                              color: location.pathname === item.href ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.85)',
                            }}
                            onClick={() => setMobileOpen(false)}
                          >
                            {item.mobileLabel}
                          </Link>
                          <button
                            onClick={() => setMobileExpanded(expanded ? null : item.label)}
                            aria-expanded={expanded}
                            aria-label="Show sub-menu"
                            className="p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            style={{ color: 'hsl(var(--foreground) / 0.45)' }}
                          >
                            <ChevronDown
                              size={14}
                              className="transition-transform duration-200"
                              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </button>
                        </div>
                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-0 pl-4 pb-3">
                                {visibleSub.map((child) => (
                                  <Link
                                    key={child.href}
                                    to={child.href}
                                    className="py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                                    style={{
                                      ...NAV_STYLE,
                                      fontSize: '0.72rem',
                                      color: location.pathname === child.href ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.6)',
                                    }}
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  // Plain top-level link
                  if (item.href) {
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="py-3.5 border-b"
                        style={{
                          ...NAV_STYLE,
                          fontSize: '0.85rem',
                          borderColor: 'hsl(var(--primary) / 0.12)',
                          color: location.pathname === item.href ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.85)',
                        }}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.mobileLabel}
                      </Link>
                    );
                  }

                  const expanded2 = mobileExpanded === item.label;
                  const visibleChildren = item.children?.filter((c) => {
                    if (c.authRequired === true) return !!session;
                    if (c.authRequired === false) return !session;
                    return true;
                  }) ?? [];

                  return (
                    <div key={item.label} className="border-b" style={{ borderColor: 'hsl(var(--primary) / 0.12)' }}>
                      <button
                        onClick={() => setMobileExpanded(expanded2 ? null : item.label)}
                        aria-expanded={expanded2}
                        className="w-full flex items-center justify-between py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        style={{
                          ...NAV_STYLE,
                          fontSize: '0.85rem',
                          color: isActive(item, location.pathname) ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.85)',
                        }}
                      >
                        <span className="flex items-center gap-2">
                          {(item.label === 'My Coven' || item.label === 'Community') && (
                            <span className="relative flex items-center">
                              <Users size={14} />
                              {unread > 0 && (
                                <span className="absolute -top-1.5 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-[8px] font-bold text-white flex items-center justify-center leading-none">
                                  {unread > 9 ? '9+' : unread}
                                </span>
                              )}
                            </span>
                          )}
                          {item.mobileLabel}
                        </span>
                        <ChevronDown
                          size={14}
                          className="transition-transform duration-200"
                          style={{ transform: expanded2 ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                      </button>

                      <AnimatePresence>
                        {expanded2 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-0 pl-4 pb-3">
                              {visibleChildren.map((child) => (
                                <Link
                                  key={child.href}
                                  to={child.href}
                                  className="flex items-center gap-2 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                                  style={{
                                    ...NAV_STYLE,
                                    fontSize: '0.72rem',
                                    color: location.pathname === child.href ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.6)',
                                  }}
                                  onClick={() => setMobileOpen(false)}
                                >
                                  {child.icon === 'grimoire' && <BookOpen size={12} />}
                                  {child.icon === 'bookmark' && <Bookmark size={12} />}
                                  {child.icon === 'bell' && (
                                    <span className="relative">
                                      <Bell size={12} />
                                      {child.href === '/community/notifications' && unread > 0 && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-[7px] font-bold text-white flex items-center justify-center leading-none">
                                          {unread > 9 ? '9+' : unread}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Auth area — pinned to bottom */}
            <div
              className="relative shrink-0 px-6 pt-5"
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 24px, 28px)',
                borderTop: '1px solid hsl(var(--primary) / 0.15)',
              }}
            >
              {/* Crescent divider motif */}
              <div className="flex items-center justify-center mb-4 gap-3" aria-hidden="true">
                <div className="h-px flex-1" style={{ background: 'hsl(var(--primary) / 0.18)' }} />
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7c1.5 0 2.9-.47 4.04-1.27A5.5 5.5 0 0 1 9 14.5a5.5 5.5 0 0 1 0-11c.65 0 1.27.11 1.85.31A6.97 6.97 0 0 0 9 2Z"
                    fill="hsl(var(--primary) / 0.45)"
                  />
                  <circle cx="13" cy="4" r="1" fill="hsl(var(--primary) / 0.5)" />
                  <circle cx="15" cy="7" r="0.6" fill="hsl(var(--primary) / 0.35)" />
                  <circle cx="11" cy="2.5" r="0.5" fill="hsl(var(--primary) / 0.4)" />
                </svg>
                <div className="h-px flex-1" style={{ background: 'hsl(var(--primary) / 0.18)' }} />
              </div>

              {session ? (
                <Link
                  to="/account"
                  className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    ...NAV_STYLE,
                    fontSize: '0.8rem',
                    background: 'hsl(var(--primary) / 0.12)',
                    color: 'hsl(var(--primary))',
                    border: '1px solid hsl(var(--primary) / 0.3)',
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {session.user.name?.split(' ')[0] ?? 'My Account'}
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Sign In — warm gold primary */}
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2.5 w-full rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      ...NAV_STYLE,
                      fontSize: '0.82rem',
                      minHeight: '48px',
                      background: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      boxShadow: '0 0 18px hsl(var(--primary) / 0.35)',
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <User size={15} strokeWidth={1.8} />
                    Sign In
                  </Link>

                  {/* Create Account — lavender outline */}
                  <Link
                    to="/signup"
                    className="flex items-center justify-center gap-2.5 w-full rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    style={{
                      ...NAV_STYLE,
                      fontSize: '0.82rem',
                      minHeight: '48px',
                      background: 'transparent',
                      color: 'hsl(var(--accent))',
                      border: '1.5px solid hsl(var(--accent) / 0.55)',
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {/* UserPlus inline SVG — lucide-react v0.454 lacks this icon */}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Create Account
                  </Link>

                  <p
                    className="text-center text-xs mt-0.5"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}
                  >
                    New to Spellful? It&apos;s free to join.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
