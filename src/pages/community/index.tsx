import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { community } from 'virtual:content';
import { motion } from 'motion/react';
import {
  Wand2, Layers, Moon, Leaf, Heart, BookOpen, Sparkles, Globe,
  PenLine, Bell, Bookmark, TrendingUp, MessageSquare, HelpCircle,
  Pin, Lock, ThumbsUp, Eye, ChevronRight, Search, Users, Star, Building2,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import MyCoven from '@/components/MyCoven';
import { UsernameSetupModal } from '@/components/UsernameSetupModal';
import { useCommunityCategories, useCommunityPosts, useCommunityNotifications, type PostFilter } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import FriendUpdatesFeed from '@/components/FriendUpdatesFeed';

// ── Community stats strip ─────────────────────────────────────────────────────
interface CommunityStats { onlineCount: number; registeredCount: number; }

function CommunityStatsStrip() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/community/stats');
        if (!res.ok) throw new Error('failed');
        const data: CommunityStats = await res.json();
        if (!cancelled) { setStats(data); setError(false); }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div
      className="border-b border-border"
      style={{ background: 'hsl(var(--card-deep))' }}
      aria-label="Community statistics"
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-start gap-3 sm:gap-8">

        {/* Witches Online */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'hsl(var(--presence-live))' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'hsl(var(--presence-live))' }} />
          </span>
          {stats === null && !error ? (
            <span className="h-3.5 w-28 rounded animate-pulse inline-block bg-muted" aria-label="Loading online count" />
          ) : error ? (
            <span className="text-xs text-muted-foreground">— Witches Online</span>
          ) : (
            <span className="text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
              <span className="font-semibold text-foreground">{stats!.onlineCount.toLocaleString()}</span>
              <span className="ml-1 text-muted-foreground">Witches Online</span>
            </span>
          )}
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--presence-live-bg) / 0.15)', color: 'hsl(var(--presence-live))' }}>
            Live
          </span>
        </div>

        <span className="hidden sm:block w-px h-4 shrink-0 bg-border" aria-hidden="true" />

        {/* Registered Witches */}
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 shrink-0 text-accent" aria-hidden="true" />
          {stats === null && !error ? (
            <span className="h-3.5 w-36 rounded animate-pulse inline-block bg-muted" aria-label="Loading registered count" />
          ) : error ? (
            <span className="text-xs text-muted-foreground">— Registered Witches</span>
          ) : (
            <span className="text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
              <span className="font-semibold text-foreground">{stats!.registeredCount.toLocaleString()}</span>
              <span className="ml-1 text-muted-foreground">Registered Witches</span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Icon map for category icons (Lucide names from seed) ──────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Wand2, Layers, Moon, Leaf, Heart, BookOpen, Sparkles, Globe,
};

function CategoryIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line security/detect-object-injection
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} style={style} />;
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS: { value: PostFilter; label: string }[] = [
  { value: 'latest',     label: 'Latest' },
  { value: 'popular',    label: 'Popular' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'following',  label: 'Following' },
  { value: 'mine',       label: 'My Posts' },
];

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: ReturnType<typeof useCommunityPosts>['posts'][number] }) {
  const tags = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const ago = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      className="group"
    >
      <Link
        to={`/community/post/${post.id}`}
        className="block rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-[hsl(var(--card-mid))] transition-colors p-4 gap-3"
      >
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Avatar — links to profile */}
          <Link
            to={post.authorUsername ? `/u/${post.authorUsername}` : '#'}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 mt-0.5"
          >
            {post.authorImage ? (
              <img src={post.authorImage} alt={post.authorName ?? ''} className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-primary/50 transition-all" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground hover:ring-2 hover:ring-primary/50 transition-all">
                {(post.authorName ?? '?')[0].toUpperCase()}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mb-1">
              <Link
                to={post.authorUsername ? `/u/${post.authorUsername}` : '#'}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-foreground/70 hover:text-primary transition-colors"
              >{post.authorName ?? 'Unknown'}</Link>
              <span>·</span>
              <span>{ago}</span>
              {post.categoryName && (
                <>
                  <span>·</span>
                  <span className="text-accent">{post.categoryName}</span>
                </>
              )}
              {post.isPinned && <Pin className="w-3 h-3 text-primary" />}
              {post.isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
            </div>

            {/* Title */}
            <div className="flex items-start gap-2">
              {post.type === 'question' && (
                <HelpCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              )}
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                {post.title}
              </h3>
              {post.acceptedReplyId && (
                <Badge variant="outline" className="shrink-0 text-[10px] border-[hsl(var(--success))] text-[hsl(var(--success))] px-1.5 py-0">
                  Solved
                </Badge>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2.5 pl-11 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {post.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {post.replyCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {post.viewCount}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Trending sidebar ──────────────────────────────────────────────────────────
function TrendingSidebar() {
  const { posts, loading } = useCommunityPosts('popular', undefined, 1);
  const top = posts.slice(0, 5);

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" /> {community.sidebar.trendingTitle}
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : top.length === 0 ? (
          <p className="text-xs text-muted-foreground">{community.sidebar.trendingEmpty}</p>
        ) : (
          <ol className="space-y-2">
            {top.map((p, i) => (
              <li key={p.id}>
                <Link to={`/community/post/${p.id}`} className="flex items-start gap-2 group">
                  <span className="text-xs font-bold text-primary/60 w-4 shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs text-foreground/80 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {p.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
          {community.sidebar.quickLinksTitle}
        </h3>
        <nav className="space-y-1.5">
          {[
            { to: '/community/bookmarks', icon: Bookmark, label: 'Saved Posts', desc: 'Your bookmarked discussions' },
            { to: '/community/notifications', icon: Bell, label: 'Notifications', desc: 'Replies & mentions' },
            { to: '/community/new', icon: PenLine, label: 'New Discussion', desc: 'Start a conversation' },
            { to: '/creators', icon: Star, label: 'Creators', desc: 'Browse verified creators' },
            { to: '/organizations', icon: Building2, label: 'Organizations', desc: 'Shops, studios & collectives' },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted group"
              style={{ border: '1px solid transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'hsl(var(--muted))' }}>
                <Icon className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { session, isPending } = useSession();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PostFilter>('latest');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catExpanded, setCatExpanded] = useState(false);
  const [view, setView] = useState<'feed' | 'coven' | 'friends'>('feed');

  const { categories, loading: catsLoading } = useCommunityCategories();
  const { posts, total, pages, loading: postsLoading } = useCommunityPosts(filter, activeCategory, page);
  const unread = useCommunityNotifications();

  // Presence heartbeat — registers this user as online so the live count is accurate.
  // Fires immediately on mount and refreshes every 4 minutes (well within the 5-min window).
  useEffect(() => {
    if (!session?.user?.id) return;
    const ping = () => { void fetch('/api/presence', { method: 'POST', credentials: 'include' }); };
    ping();
    const interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // Auth gate — redirect to login
  if (!isPending && !session) {
    navigate('/login?redirect=/community');
    return null;
  }

  // Username gate — must choose a username before participating
  const needsUsername = !isPending && session && !(session.user as { username?: string }).username;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/community/search?q=${encodeURIComponent(search.trim())}`);
  };

  const handleFilterChange = (f: PostFilter) => {
    setFilter(f);
    setPage(1);
  };

  const handleCategoryChange = (slug: string | undefined) => {
    setActiveCategory(slug);
    setPage(1);
  };

  return (
    <>
      {/* Username setup gate */}
      {needsUsername && (
        <UsernameSetupModal onComplete={() => { /* session will refresh on next render */ window.location.reload(); }} />
      )}

      <Helmet>
        <title>Spellful Community — Connect with Fellow Witches</title>
        <meta name="description" content="Join the Spellful community — discuss witchcraft, tarot, astrology, and moon magic. Share spells, ask questions, post polls, and connect with fellow practitioners in a welcoming, moderated space." />
        <meta name="robots" content="noindex" />
        <meta property="og:title" content="Spellful Community — Connect with Fellow Witches" />
        <meta property="og:description" content="Join the Spellful community — discuss witchcraft, tarot, astrology, and moon magic with fellow practitioners." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/community" />
        <meta property="og:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spellful Community — Connect with Fellow Witches" />
        <meta name="twitter:description" content="Discuss witchcraft, tarot, astrology, and moon magic with fellow practitioners." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
      </Helmet>

      <main className="min-h-screen">
        {/* ── Magical Hero header ── */}
        <section
          className="relative overflow-hidden border-b border-border"
          style={{ background: `linear-gradient(160deg, hsl(var(--hero-midnight)) 0%, hsl(var(--hero-plum)) 50%, hsl(var(--hero-midnight)) 100%)` }}
        >
          {/* Radial glow behind logo */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ background: `radial-gradient(ellipse 60% 50% at 50% 36%, hsl(var(--hero-lavender) / 0.2) 0%, transparent 70%)` }}
          />

          {/* Animated SVG — energy trails + twinkling stars */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="tgL" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="hsl(270 52% 64%)" stopOpacity="0" />
                <stop offset="45%"  stopColor="hsl(270 52% 64%)" stopOpacity="0.6" />
                <stop offset="75%"  stopColor="hsl(44 54% 54%)"  stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(44 54% 54%)"  stopOpacity="0" />
              </linearGradient>
              <linearGradient id="tgR" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="hsl(270 52% 64%)" stopOpacity="0" />
                <stop offset="45%"  stopColor="hsl(270 52% 64%)" stopOpacity="0.6" />
                <stop offset="75%"  stopColor="hsl(44 54% 54%)"  stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(44 54% 54%)"  stopOpacity="0" />
              </linearGradient>
              <style>{`
                @media (prefers-reduced-motion: reduce) { .sa { animation: none !important; } }
                .tl { stroke:url(#tgL); stroke-width:1.5; fill:none; stroke-dasharray:300; stroke-dashoffset:300;
                      animation: tDraw 9s ease-in-out infinite; }
                .tr { stroke:url(#tgR); stroke-width:1.5; fill:none; stroke-dasharray:300; stroke-dashoffset:300;
                      animation: tDraw 11s ease-in-out 1.8s infinite; }
                @keyframes tDraw {
                  0%  { stroke-dashoffset:300; opacity:0; }
                  12% { opacity:1; }
                  55% { stroke-dashoffset:0; opacity:0.85; }
                  78% { stroke-dashoffset:-300; opacity:0; }
                  100%{ stroke-dashoffset:-300; opacity:0; }
                }
                .tw  { animation: twk 3.5s ease-in-out infinite; }
                .tw2 { animation: twk 4.2s ease-in-out 0.8s infinite; }
                .tw3 { animation: twk 2.9s ease-in-out 1.5s infinite; }
                .tw4 { animation: twk 5.1s ease-in-out 0.4s infinite; }
                .tw5 { animation: twk 3.8s ease-in-out 2.1s infinite; }
                .tw6 { animation: twk 4.6s ease-in-out 1.0s infinite; }
                .tw7 { animation: twk 3.1s ease-in-out 2.7s infinite; }
                .tw8 { animation: twk 6.0s ease-in-out 1.2s infinite; }
                .tw9 { animation: twk 2.7s ease-in-out 3.3s infinite; }
                .tw10{ animation: twk 4.9s ease-in-out 0.6s infinite; }
                .tw11{ animation: twk 3.6s ease-in-out 2.2s infinite; }
                .tw12{ animation: twk 5.3s ease-in-out 1.7s infinite; }
                @keyframes twk {
                  0%,100%{ opacity:0.12; transform:scale(0.65); }
                  50%    { opacity:1;    transform:scale(1.2);  }
                }
                .mglow { animation: mp 6s ease-in-out infinite; }
                @keyframes mp {
                  0%,100%{ opacity:0.2; }
                  50%    { opacity:0.55; }
                }
                .shimmer { animation: shim 12s ease-in-out 5s infinite; }
                @keyframes shim {
                  0%,100%{ opacity:0; transform:translateX(-130%); }
                  8%     { opacity:0.2; }
                  22%    { opacity:0;  transform:translateX(130%); }
                  23%,99%{ opacity:0;  transform:translateX(-130%); }
                }
              `}</style>
            </defs>

            {/* Left energy trail */}
            <path className="tl sa" d="M -40,155 C 80,115 150,195 240,145 C 300,108 340,158 400,118" />
            {/* Right energy trail — mirrored */}
            <g style={{ transform: 'scaleX(-1)', transformOrigin: '50% 0' }}>
              <path className="tr sa" d="M -40,155 C 80,115 150,195 240,145 C 300,108 340,158 400,118" />
            </g>

            {/* Twinkling four-pointed stars */}
            {([
              [18,22,3.5,'hsl(270 60% 97%)','tw'],   [28,55,2.5,'hsl(270 45% 79%)','tw2'],
              [12,68,2,  'hsl(44 54% 54%)', 'tw3'],  [35,15,2,  'hsl(270 60% 97%)','tw4'],
              [42,72,3,  'hsl(270 45% 79%)','tw5'],  [58,18,2.5,'hsl(44 54% 54%)', 'tw6'],
              [65,70,2,  'hsl(270 60% 97%)','tw7'],  [72,30,3,  'hsl(270 45% 79%)','tw8'],
              [80,58,2,  'hsl(44 54% 54%)', 'tw9'],  [88,20,3.5,'hsl(270 60% 97%)','tw10'],
              [22,40,2,  'hsl(270 45% 79%)','tw11'], [78,75,2.5,'hsl(270 60% 97%)','tw12'],
            ] as [number,number,number,string,string][]).map(([cx,cy,r,fill,cls], i) => (
              <g key={i} className={`sa ${cls}`} fill={fill} style={{ transformOrigin: `${cx}% ${cy}%` }}>
                <rect x={`${cx}%`} y={`${cy}%`} width={r*0.44} height={r*2} rx={r*0.15}
                  transform={`translate(-${r*0.22},-${r})`} />
                <rect x={`${cx}%`} y={`${cy}%`} width={r*2} height={r*0.44} rx={r*0.15}
                  transform={`translate(-${r},-${r*0.22})`} />
              </g>
            ))}
          </svg>

          {/* ── Visible content ── */}
          <div className="relative max-w-5xl mx-auto px-5 md:px-8 pt-10 pb-0 md:pt-14 flex flex-col items-center text-center">

            {/* Logo + shimmer + moon glow */}
            <div className="relative mb-5 md:mb-6" style={{ maxWidth: 'min(320px, 70vw)', width: '100%' }}>
              {/* Moon glow — sits behind the logo, outside overflow-hidden so no rect clip */}
              <div
                className="absolute pointer-events-none mglow sa"
                aria-hidden="true"
                style={{
                  top: '-8%', left: '50%',
                  transform: 'translateX(-50%)',
                  width: '30%', height: '30%',
                  borderRadius: '50%',
                  background: 'transparent',
                  boxShadow: `0 0 32px 16px hsl(var(--hero-lavender-soft) / 0.35)`,
                  zIndex: 0,
                }}
              />
              {/* Official Spellful logo — overflow-hidden on this wrapper clips only the shimmer */}
              <div className="relative overflow-hidden" style={{ zIndex: 1 }}>
                <img
                  src="/airo-assets/images/logo/horizontal"
                  alt="Spellful"
                  className="block w-full h-auto object-contain"
                  style={{
                    filter: `drop-shadow(0 0 20px hsl(var(--hero-lavender) / 0.5)) drop-shadow(0 0 8px hsl(var(--hero-gold) / 0.3))`,
                  }}
                  loading="eager"
                  fetchPriority="high"
                />
                {/* Shimmer sweep — clipped to logo bounds only */}
                <div
                  className="absolute inset-0 pointer-events-none shimmer sa"
                  aria-hidden="true"
                  style={{ background: `linear-gradient(105deg, transparent 30%, hsl(var(--hero-moonlight) / 0.25) 50%, transparent 70%)` }}
                />
              </div>
            </div>

            {/* Heading + subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' as const }}
              className="mb-7 md:mb-8"
            >
              <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl mb-2.5" style={{ color: `hsl(var(--hero-moonlight))` }}>
                The Spellful Community
              </h1>
              <p className="text-sm md:text-base max-w-md mx-auto leading-relaxed" style={{ color: `hsl(var(--hero-lavender-soft))` }}>
                A sacred space to share wisdom, ask questions, and walk the path together.
              </p>
            </motion.div>

            {/* Action toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28, ease: 'easeOut' as const }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-2xl pb-8 md:pb-10"
            >
              {/* Primary CTA */}
              <Link to="/community/new" className="shrink-0">
                <Button
                  size="sm"
                  className="gap-2 font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
                  style={{ boxShadow: `0 0 14px hsl(var(--hero-gold) / 0.35)` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 24px hsl(var(--hero-gold) / 0.6)`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 14px hsl(var(--hero-gold) / 0.35)`; }}
                >
                  <PenLine className="w-4 h-4" />
                  {community.hero.ctaLabel}
                </Button>
              </Link>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: `hsl(var(--hero-lavender))` }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={community.hero.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{
                    background: `hsl(var(--hero-surface) / 0.85)`,
                    border: `1px solid hsl(var(--hero-lavender) / 0.35)`,
                    color: `hsl(var(--hero-moonlight))`,
                  }}
                />
              </form>

              {/* Secondary controls */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap"
                  style={{
                    background: `hsl(var(--hero-surface) / 0.9)`,
                    border: `1px solid hsl(var(--hero-lavender) / 0.3)`,
                    color: `hsl(var(--hero-lavender-soft))`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `hsl(var(--hero-lavender) / 0.7)`; (e.currentTarget as HTMLAnchorElement).style.color = `hsl(var(--hero-moonlight))`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `hsl(var(--hero-lavender) / 0.3)`; (e.currentTarget as HTMLAnchorElement).style.color = `hsl(var(--hero-lavender-soft))`; }}
                >
                  ✦ Spellful Home
                </Link>
                <Link to="/community/notifications" className="relative">
                  <Button
                    variant="outline" size="sm" className="gap-2"
                    style={{
                      background: `hsl(var(--hero-surface) / 0.9)`,
                      borderColor: `hsl(var(--hero-lavender) / 0.3)`,
                      color: `hsl(var(--hero-lavender-soft))`,
                    }}
                  >
                    <Bell className="w-4 h-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Stats strip sits inside the hero section */}
          <CommunityStatsStrip />
        </section>

        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10">
          {/* ── Magical Category Navigation ── */}
          <section className="mb-8" aria-label="Browse by category">
            {/* Section header */}
            <div className="text-center mb-5">
              <p className="text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                {community.categorySection.eyebrow}
              </p>
              <h2 className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {community.categorySection.heading}
              </h2>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {community.categorySection.subheading}
              </p>
            </div>

            {(() => {
              const allTiles = [
                { id: '__all__', slug: undefined as string | undefined, name: community.categorySection.allLabel, icon: 'Globe', postCount: 0 },
                ...categories,
              ];
              const MOBILE_INITIAL = 4;
              const isActiveHidden = activeCategory !== undefined &&
                !allTiles.slice(0, MOBILE_INITIAL).some((t) => t.slug === activeCategory);
              const shouldExpand = catExpanded || isActiveHidden;
              return catsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allTiles.map((cat, idx) => {
                      const isActive = cat.slug === undefined ? activeCategory === undefined : activeCategory === cat.slug;
                      // On mobile, hide tiles beyond MOBILE_INITIAL unless expanded or active
                      const hiddenOnMobile = idx >= MOBILE_INITIAL && !shouldExpand;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.slug)}
                          aria-pressed={isActive}
                          className={hiddenOnMobile ? 'sm:flex hidden' : 'flex'}
                          style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            minHeight: '80px',
                            padding: '10px 8px',
                            borderRadius: '16px',
                            border: isActive
                              ? '1.5px solid hsl(var(--primary))'
                              : '1px solid hsl(var(--border))',
                            background: isActive
                              ? 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.06) 100%)'
                              : 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.6) 100%)',
                            boxShadow: isActive
                              ? '0 0 0 1px hsl(var(--primary) / 0.3), 0 2px 12px hsl(var(--primary) / 0.15)'
                              : 'none',
                            transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.15s',
                            cursor: 'pointer',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px hsl(var(--accent) / 0.18)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.transform = '';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = isActive
                              ? '0 0 0 1px hsl(var(--primary) / 0.3), 0 2px 12px hsl(var(--primary) / 0.15)'
                              : 'none';
                          }}
                        >
                          {/* Icon */}
                          <CategoryIcon
                            name={cat.icon}
                            className="w-5 h-5 shrink-0"
                            style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}
                          />
                          {/* Label — wraps, never truncates */}
                          <span
                            className="text-xs font-medium leading-snug"
                            style={{
                              color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.85)',
                              fontFamily: 'var(--font-sans)',
                              wordBreak: 'break-word',
                              hyphens: 'auto',
                            }}
                          >
                            {cat.name}
                          </span>
                          {/* Post count */}
                          {cat.postCount > 0 && (
                            <span
                              className="text-[10px] leading-none"
                              style={{ color: isActive ? 'hsl(var(--primary) / 0.75)' : 'hsl(var(--muted-foreground))' }}
                            >
                              {cat.postCount}
                            </span>
                          )}
                          {/* Active sparkle — tiny star near icon */}
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute top-2 right-2.5 text-[8px] leading-none pointer-events-none"
                              style={{ color: 'hsl(var(--primary))', opacity: 0.9 }}
                            >
                              ✦
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Expand / collapse — mobile only, hidden on sm+ */}
                  {allTiles.length > MOBILE_INITIAL && (
                    <div className="flex justify-center mt-3 sm:hidden">
                      <button
                        onClick={() => setCatExpanded((v) => !v)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: 'hsl(var(--muted))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--accent))',
                          fontFamily: 'var(--font-sans)',
                        }}
                        aria-expanded={shouldExpand}
                      >
                        <span style={{ color: 'hsl(var(--primary))' }}>✦</span>
                        {shouldExpand ? community.categorySection.collapseLabel : community.categorySection.revealLabel}
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </section>

          {/* ── Feed + sidebar ── */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Feed */}
            <div className="flex-1 min-w-0">
              {/* View toggle: Feed / Friend Updates / My Coven / Discover */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setView('feed')}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: view === 'feed' ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    color: view === 'feed' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  Feed
                </button>
                <button
                  onClick={() => setView('friends')}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: view === 'friends' ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    color: view === 'friends' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  <Heart className="w-3 h-3" />
                  Friend Updates
                </button>
                <button
                  onClick={() => setView('coven')}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: view === 'coven' ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    color: view === 'coven' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  <Users className="w-3 h-3" />
                  My Coven
                </button>
                <Link
                  to="/community/discover"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                >
                  <Sparkles className="w-3 h-3" />
                  Discover
                </Link>
              </div>

              {/* My Coven view */}
              {view === 'coven' && session?.user?.id && (
                <MyCoven currentUserId={session.user.id} />
              )}

              {/* Friend Updates view */}
              {view === 'friends' && (
                <FriendUpdatesFeed />
              )}

              {/* Filter tabs + feed — only shown in feed view */}
              {view === 'feed' && (<>
              <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-none">
                {FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleFilterChange(value)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {activeCategory && (
                  <span className="shrink-0 ml-auto flex items-center gap-1 text-xs text-accent">
                    <ChevronRight className="w-3 h-3" />
                    {categories.find((c) => c.slug === activeCategory)?.name}
                    <button
                      onClick={() => handleCategoryChange(undefined)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      aria-label="Clear category filter"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              {/* Post list */}
              {postsLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center">
                  <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {filter === 'following'
                      ? community.emptyStates.following
                      : filter === 'mine'
                      ? community.emptyStates.mine
                      : community.emptyStates.default}
                  </p>
                  {filter === 'following' ? (
                    <Link to="/community/discover" className="mt-4 inline-block">
                      <Button size="sm" variant="outline" className="gap-2 mt-3">
                        <Users className="w-3.5 h-3.5" /> Discover Members
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/community/new" className="mt-4 inline-block">
                      <Button size="sm" variant="outline" className="gap-2 mt-3">
                        <PenLine className="w-3.5 h-3.5" /> {community.emptyStates.ctaLabel}
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {posts.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {pages} · {total} posts
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>)}
            </div>

            {/* Sidebar */}
            <div className="lg:w-64 shrink-0">
              <TrendingSidebar />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
