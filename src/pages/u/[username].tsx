/**
 * /u/:username — Canonical public profile page (Phase 0–2)
 * Resolves by username_normalized. Enforces visibility + blocks.
 * Shows: cover, avatar with frame, theme, practice labels, status,
 *        interest tags, social links, modular sections, gallery,
 *        featured posts, badges.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import {
  MapPin, Users, Lock, Check, Clock, MessageCircle,
  ExternalLink, Settings, MoreHorizontal, Share2,
  Star, Sparkles, Image as ImageIcon, BookOpen, Heart,
} from 'lucide-react';
import { OnlineDot } from '@/components/OnlineDot';
import { BlockUserSheet } from '@/components/BlockUserSheet';
import { ReportModal } from '@/components/ReportModal';
import ShareStudioModal from '@/components/ShareStudioModal';
import ProfileShareCard from '@/components/ProfileShareCard';
import { user_profile as pageContent } from 'virtual:content';

// ─── Types ────────────────────────────────────────────────────────────────────
type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  witchPath: string | null;
  profileVisibility: string | null;
  sunSign: string | null;
  moonSign: string | null;
  risingSign: string | null;
  createdAt: string | null;
  coverImage: string | null;
  coverPreset: string | null;
  accentColor: string | null;
  pronouns: string | null;
  interestTags: string[] | null;
  socialLinks: Record<string, string> | null;
  profileTheme: string | null;
  avatarFrame: string | null;
  practiceLabels: string[] | null;
  profileStatus: string | null;
  profileSections: { id: string; enabled: boolean; order: number }[] | null;
  hideOnlineStatus: boolean | null;
  profileLayout: string | null;
  bioVisibility: string | null;
  locationVisibility: string | null;
  zodiacVisibility: string | null;
  socialLinksVisibility: string | null;
};

type Playlist = {
  id: number; provider: string; canonicalUrl: string; providerPlaylistId: string;
  customTitle: string; description: string; visibility: string;
  isFeatured: number; isCurrentVibe: number;
};

type GuestbookEntry = {
  id: number; text: string; createdAt: string;
  authorUsername: string | null; authorImage: string | null;
};

type Milestone = {
  id: number; sourceType: string; title: string; milestoneDate: string;
  note: string; visibility: string; position: number;
};

type GalleryItem = {
  id: number; imageUrl: string; caption: string | null; altText: string | null;
  visibility: string | null; sortOrder: number | null;
};

type FeaturedPost = {
  id: number; title: string; createdAt: string | null; audience: string | null;
};

// ─── Theme CSS variable overrides ─────────────────────────────────────────────
const THEME_OVERRIDES: Record<string, React.CSSProperties> = {
  celestial: { '--profile-accent': 'hsl(var(--accent))', '--profile-bg': 'hsl(259 39% 10%)' } as React.CSSProperties,
  forest:    { '--profile-accent': 'hsl(var(--secondary))', '--profile-bg': 'hsl(120 20% 8%)' } as React.CSSProperties,
  lunar:     { '--profile-accent': 'hsl(var(--muted-foreground))', '--profile-bg': 'hsl(248 30% 8%)' } as React.CSSProperties,
  gothic:    { '--profile-accent': 'hsl(0 0% 80%)', '--profile-bg': 'hsl(0 0% 5%)' } as React.CSSProperties,
  cottage:   { '--profile-accent': 'hsl(var(--secondary))', '--profile-bg': 'hsl(80 15% 8%)' } as React.CSSProperties,
  crystal:   { '--profile-accent': 'hsl(var(--primary))', '--profile-bg': 'hsl(270 30% 9%)' } as React.CSSProperties,
};

// ─── Avatar frame SVG overlays ────────────────────────────────────────────────
function AvatarFrame({ frame, size }: { frame: string; size: number }) {
  if (!frame) return null;
  const s = size + 16;
  const frames: Record<string, string> = {
    moon:      'M8,4 Q12,0 16,4 Q20,8 16,12 Q12,16 8,12 Q4,8 8,4 M4,0 L4,2 M20,0 L20,2 M0,8 L2,8 M22,8 L24,8',
    celestial: 'M12,2 L13.5,8 L19,8 L14.5,11.5 L16,17 L12,13.5 L8,17 L9.5,11.5 L5,8 L10.5,8 Z',
    botanical: 'M12,2 Q14,6 12,10 Q10,6 12,2 M6,6 Q10,8 10,12 Q6,10 6,6 M18,6 Q14,8 14,12 Q18,10 18,6',
    crystal:   'M12,2 L16,8 L20,6 L16,14 L20,18 L12,16 L4,18 L8,14 L4,6 L8,8 Z',
    ornate:    'M2,2 L6,2 L6,6 M18,2 L22,2 L22,6 M2,18 L2,22 L6,22 M18,22 L22,22 L22,18 M12,1 L12,3 M12,21 L12,23 M1,12 L3,12 M21,12 L23,12',
  };
  const d = frames[frame];
  if (!d) return null;
  return (
    <svg
      width={s} height={s}
      viewBox="0 0 24 24"
      className="absolute pointer-events-none"
      style={{ top: -8, left: -8, zIndex: 2 }}
      aria-hidden="true"
    >
      <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Accent color map ─────────────────────────────────────────────────────────
const ACCENT_VARS: Record<string, string> = {
  gold: 'hsl(var(--primary))', lavender: 'hsl(var(--accent))',
  rose: 'hsl(var(--accent-rose))', sage: 'hsl(var(--secondary))',
  sky: 'hsl(var(--info))', ember: 'hsl(var(--warning))',
  violet: 'hsl(var(--accent-violet))', moon: 'hsl(var(--muted-foreground))',
};
function accentColor(key: string | null | undefined): string {
  return ACCENT_VARS[key ?? ''] ?? 'hsl(var(--primary))';
}

// ─── Cover gradient presets ───────────────────────────────────────────────────
const COVER_PRESETS: Record<string, string> = {
  midnight: 'linear-gradient(135deg, hsl(var(--footer-bg-darkest)) 0%, hsl(var(--footer-bg-deep)) 50%, hsl(var(--muted)) 100%)',
  aurora:   'linear-gradient(135deg, hsl(var(--footer-bg-deep)) 0%, hsl(var(--accent) / 0.4) 50%, hsl(var(--footer-lavender) / 0.3) 100%)',
  ember:    'linear-gradient(135deg, hsl(var(--card-deep)) 0%, hsl(var(--warning) / 0.25) 60%, hsl(var(--primary) / 0.2) 100%)',
  forest:   'linear-gradient(135deg, hsl(var(--footer-bg-darkest)) 0%, hsl(var(--secondary) / 0.2) 60%, hsl(var(--muted)) 100%)',
  cosmos:   'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--footer-bg-deep)) 40%, hsl(var(--accent) / 0.3) 100%)',
  rose:     'linear-gradient(135deg, hsl(var(--card-deep)) 0%, hsl(var(--footer-lavender) / 0.35) 60%, hsl(var(--accent) / 0.2) 100%)',
};
function coverStyle(profile: Profile): React.CSSProperties {
  if (profile.coverImage) return { backgroundImage: `url(${profile.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  const preset = profile.coverPreset ?? 'midnight';
  return { background: COVER_PRESETS[preset] ?? COVER_PRESETS.midnight };
}

// ─── Astro sign symbols ───────────────────────────────────────────────────────
const SIGN_SYMBOLS: Record<string, string> = {
  Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
  Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓',
};

// ─── Social icon ──────────────────────────────────────────────────────────────
function SocialIcon({ platform }: { platform: string }) {
  if (platform === 'instagram') return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
  if (platform === 'tiktok') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
  return <ExternalLink className="w-4 h-4" />;
}

// ─── Identity field types ────────────────────────────────────────────────────
type IdentityField = { fieldKey: string; value: string; visibility: string };

type PublicCollectionItem = { id: number; name: string; note: string; emoji: string; visibility: string };
type PublicCollection = { id: number; type: string; title: string; visibility: string; items: PublicCollectionItem[] };

const COLLECTION_EMOJI: Record<string, string> = {
  crystals: '💎', herbs: '🌿', tarot_decks: '🃏', bookshelf: '📚', tools: '🔮', inspirations: '✨',
};

// ─── Default section order ────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { id: 'about', label: 'About My Path', icon: BookOpen },
  { id: 'interests', label: 'Magical Interests', icon: Sparkles },
  { id: 'gallery', label: 'Sacred Space', icon: ImageIcon },
  { id: 'featured', label: 'Featured Posts', icon: Star },
  { id: 'coven', label: 'My Coven', icon: Users },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'soundscapes', label: 'Magical Soundscapes', icon: Sparkles },
  { id: 'guestbook', label: 'Guestbook', icon: MessageCircle },
  { id: 'milestones', label: 'Milestones', icon: Star },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [isOwn, setIsOwn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [blockSheetOpen, setBlockSheetOpen] = useState(false);
  const [profileReportOpen, setProfileReportOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [identityFields, setIdentityFields] = useState<IdentityField[]>([]);
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [soundscapesEnabled, setSoundscapesEnabled] = useState(false);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [guestbookEnabled, setGuestbookEnabled] = useState(false);
  const [guestbookSubmitters, setGuestbookSubmitters] = useState('coven');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [guestbookText, setGuestbookText] = useState('');
  const [guestbookSubmitting, setGuestbookSubmitting] = useState(false);
  const [guestbookMsg, setGuestbookMsg] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [profileBadges, setProfileBadges] = useState<{ id: number; badgeKey: string; badgeType: string }[]>([]);
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/profile/${encodeURIComponent(username)}`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { error?: string; profile?: Profile; connectionStatus?: string | null; connectionId?: number | null; isOwn?: boolean }) => {
        if (data.error) { setError(data.error); return; }
        setProfile(data.profile ?? null);
        setConnectionStatus(data.connectionStatus ?? null);
        setConnectionId(data.connectionId ?? null);
        setIsOwn(data.isOwn ?? false);
        // Load gallery + featured + identity + collections + soundscapes + guestbook + milestones in parallel
        Promise.all([
          fetch(`/api/profile/${encodeURIComponent(username)}/gallery`, { credentials: 'include' }).then(r => r.ok ? r.json() : { items: [] }),
          fetch(`/api/profile/${encodeURIComponent(username)}/featured`, { credentials: 'include' }).then(r => r.ok ? r.json() : { posts: [] }),
          fetch(`/api/profile/${encodeURIComponent(username)}/identity`, { credentials: 'include' }).then(r => r.ok ? r.json() : { fields: [] }),
          fetch(`/api/profile/${encodeURIComponent(username)}/collections`, { credentials: 'include' }).then(r => r.ok ? r.json() : { collections: [] }),
          fetch(`/api/profile/${encodeURIComponent(username)}/soundscapes`, { credentials: 'include' }).then(r => r.ok ? r.json() : { enabled: false, playlists: [] }),
          fetch(`/api/profile/${encodeURIComponent(username)}/guestbook`, { credentials: 'include' }).then(r => r.ok ? r.json() : { enabled: false, entries: [] }),
          fetch(`/api/profile/${encodeURIComponent(username)}/milestones`, { credentials: 'include' }).then(r => r.ok ? r.json() : { milestones: [] }),
          fetch(`/api/profile/${encodeURIComponent(username)}/badges`, { credentials: 'include' }).then(r => r.ok ? r.json() : { badges: [] }),
        ]).then(([gd, fd, id, cd, sd, gbData, md, bd]: [
          { items?: GalleryItem[] }, { posts?: FeaturedPost[] }, { fields?: IdentityField[] }, { collections?: PublicCollection[] },
          { enabled?: boolean; playlists?: Playlist[] },
          { enabled?: boolean; settings?: { allowedSubmitters?: string }; entries?: GuestbookEntry[] },
          { milestones?: Milestone[] },
          { badges?: { id: number; badgeKey: string; badgeType: string }[] }
        ]) => {
          setGallery(gd.items ?? []);
          setFeaturedPosts(fd.posts ?? []);
          setIdentityFields(id.fields ?? []);
          setCollections(cd.collections ?? []);
          setSoundscapesEnabled(!!sd.enabled);
          setPlaylists(sd.playlists ?? []);
          setGuestbookEnabled(!!gbData.enabled);
          setGuestbookSubmitters(gbData.settings?.allowedSubmitters ?? 'coven');
          setGuestbookEntries(gbData.entries ?? []);
          setMilestones(md.milestones ?? []);
          setProfileBadges(bd.badges ?? []);
        }).catch(() => undefined);
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [username]);

  async function sendCovenRequest() {
    if (!profile) return;
    setRequesting(true);
    try {
      const r = await fetch('/api/coven/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ receiverId: profile.id }) });
      if (r.ok) {
        const statusR = await fetch(`/api/coven/status/${profile.id}`, { credentials: 'include' });
        if (statusR.ok) {
          const sd = await statusR.json() as { status: string | null; connectionId: number | null };
          setConnectionStatus(sd.status); setConnectionId(sd.connectionId);
        } else { setConnectionStatus('pending_sent'); }
      }
    } finally { setRequesting(false); }
  }

  async function removeFromCoven() {
    if (!connectionId) return;
    setRequesting(true);
    try {
      await fetch(`/api/coven/${connectionId}`, { method: 'DELETE', credentials: 'include' });
      setConnectionStatus(null); setConnectionId(null);
    } finally { setRequesting(false); }
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'hsl(var(--primary))' }} />
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.loading}</p>
      </div>
    </main>
  );

  if (error || !profile) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <Lock className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <h1 className="text-2xl font-serif font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          {error === 'Profile not found' || error === 'Profile unavailable' ? pageContent.notFound : pageContent.unavailable}
        </h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {error === 'Profile not found' || error === 'Profile unavailable'
            ? pageContent.notFoundDesc
            : pageContent.unavailableDesc}
        </p>
        <Button onClick={() => navigate(-1)} variant="outline">{pageContent.goBack}</Button>
      </div>
    </main>
  );

  const accent = accentColor(profile.accentColor);
  const displayName = profile.name || profile.username || 'Witch';
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : null;
  const interests = profile.interestTags ?? [];
  const social = profile.socialLinks ?? {};
  const socialEntries = Object.entries(social).filter(([, v]) => v);
  const practiceLabels = profile.practiceLabels ?? [];
  const themeOverride = THEME_OVERRIDES[profile.profileTheme ?? ''] ?? {};
  const avatarFrame = profile.avatarFrame ?? '';
  const profileLayout = profile.profileLayout ?? 'classic';

  // Identity field helpers
  const identityMap: Record<string, string> = {};
  for (const f of identityFields) identityMap[f.fieldKey] = f.value;
  const magicalName = identityMap.magical_name ?? '';
  const magicalPath = identityMap.magical_path ?? '';
  const experienceLevel = identityMap.experience_level ?? '';
  const favoriteElement = identityMap.favorite_element ?? '';
  const personalMotto = identityMap.personal_motto ?? '';

  // Field-level visibility helper
  // Returns true if the viewer can see a field with the given visibility setting
  const isCoven = connectionStatus === 'accepted';
  function canSeeField(visibility: string | null | undefined): boolean {
    const v = visibility ?? 'public';
    if (isOwn) return true;
    if (v === 'public') return true;
    if (v === 'coven') return isCoven;
    return false; // private
  }

  // Cover height by layout
  const coverHeight = profileLayout === 'immersive' ? '320px' : profileLayout === 'compact' ? '140px' : '220px';
  const cardMaxWidth = profileLayout === 'immersive' ? '900px' : '672px';

  // Resolve visible sections in order
  const sectionConfig = profile.profileSections ?? DEFAULT_SECTIONS.map((s, i) => ({ id: s.id, enabled: true, order: i }));
  const visibleSections = DEFAULT_SECTIONS
    .map(s => ({ ...s, cfg: sectionConfig.find(c => c.id === s.id) ?? { id: s.id, enabled: true, order: 99 } }))
    .filter(s => s.cfg.enabled)
    .sort((a, b) => a.cfg.order - b.cfg.order);

  const astroSigns = canSeeField(profile.zodiacVisibility) ? [
    profile.sunSign && { label: 'Sun', sign: profile.sunSign },
    profile.moonSign && { label: 'Moon', sign: profile.moonSign },
    profile.risingSign && { label: 'Rising', sign: profile.risingSign },
  ].filter(Boolean) as { label: string; sign: string }[] : [];

  return (
    <>
      <Helmet>
        <title>{displayName} (@{profile.username ?? ''}) — Spellful</title>
        <meta name="description" content={profile.bio ?? `${displayName} (@${profile.username ?? ''}) on Spellful`} />
        <meta property="og:title" content={`${displayName} (@${profile.username ?? ''}) — Spellful`} />
        <meta property="og:description" content={profile.bio ?? `${displayName} (@${profile.username ?? ''}) on Spellful`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://spellful.com/u/${profile.username ?? ''}`} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayName} (@${profile.username ?? ''}) — Spellful`} />
        <meta name="twitter:description" content={profile.bio ?? `${displayName} (@${profile.username ?? ''}) on Spellful`} />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        {/* Canonical URL */}
        <link rel="canonical" href={`https://spellful.com/u/${profile.username ?? ''}`} />
      </Helmet>

      <main style={themeOverride}>
        {/* ── Cover ──────────────────────────────────────────────────────────── */}
        <div className="relative w-full" style={{ ...coverStyle(profile), height: coverHeight }} aria-hidden="true">
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          {isOwn && (
            <Link
              to="/account/profile"
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-opacity hover:opacity-90"
              style={{ background: 'hsl(var(--background) / 0.7)', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
            >
              <Settings className="w-3.5 h-3.5" />
              {pageContent.customize}
            </Link>
          )}
        </div>

        {/* ── Profile card ───────────────────────────────────────────────────── */}
        <div className="mx-auto px-4" style={{ maxWidth: cardMaxWidth }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' as const }}
            className="relative rounded-2xl border"
            style={{
              background: (themeOverride as Record<string, string>)['--profile-bg'] ?? 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              marginTop: '-56px',
              paddingTop: '72px',
              paddingBottom: '28px',
              paddingLeft: '28px',
              paddingRight: '28px',
            }}
          >
            {/* Avatar with frame */}
            <div className="absolute" style={{ top: '-48px', left: '28px' }}>
              <div className="relative" style={{ width: 96, height: 96 }}>
                <div
                  className="rounded-full p-1"
                  style={{ background: 'hsl(var(--card))', boxShadow: `0 0 0 3px ${accent}` }}
                >
                  {profile.image ? (
                    <img src={profile.image} alt={displayName} className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `${accent}22` }}>
                      <span className="text-3xl font-serif font-bold" style={{ color: accent }}>{initials}</span>
                    </div>
                  )}
                </div>
                <AvatarFrame frame={avatarFrame} size={96} />
                {!profile.hideOnlineStatus && <OnlineDot userId={profile.id} className="absolute bottom-1 right-1" />}
              </div>
            </div>

            {/* Actions top-right */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Share profile — visible to everyone */}
              <button
                onClick={() => isOwn ? setShareCardOpen(true) : setShareOpen(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: 'hsl(var(--muted) / 0.85)', color: 'hsl(var(--foreground))' }}
                aria-label="Share profile"
                title="Share profile"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {!isOwn && session && (
                <>
                  <Link to={`/messages?user=${profile.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {pageContent.message}
                    </Button>
                  </Link>
                  {connectionStatus === 'accepted' ? (
                    <Button size="sm" variant="outline" disabled={requesting} onClick={removeFromCoven} className="gap-1.5 text-xs h-8" title="Remove from Coven">
                      <Check className="w-3.5 h-3.5" style={{ color: accent }} />
                      {pageContent.covenMember}
                    </Button>
                  ) : connectionStatus === 'pending_sent' ? (
                    <Button size="sm" variant="outline" disabled className="gap-1.5 text-xs h-8">
                      <Clock className="w-3.5 h-3.5" />
                      {pageContent.invited}
                    </Button>
                  ) : connectionStatus === 'pending_received' ? (
                    <Button size="sm" disabled={requesting} onClick={sendCovenRequest} className="gap-1.5 text-xs h-8" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                      <Users className="w-3.5 h-3.5" />
                      {pageContent.acceptInvite}
                    </Button>
                  ) : (
                    <Button size="sm" disabled={requesting} onClick={sendCovenRequest} className="gap-1.5 text-xs h-8" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                      <Users className="w-3.5 h-3.5" />
                      {pageContent.inviteToCoven}
                    </Button>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setProfileMenuOpen((v) => !v)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {profileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-9 z-20 w-44 rounded-xl border shadow-lg overflow-hidden"
                          style={{ background: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                        >
                          <button
                            onClick={() => { setProfileMenuOpen(false); setBlockSheetOpen(true); }}
                            className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            Restrict member
                          </button>
                          <button
                            onClick={() => { setProfileMenuOpen(false); setProfileReportOpen(true); }}
                            className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                            style={{ color: 'hsl(var(--destructive))' }}
                          >
                            Report profile
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>

            {/* Identity */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-serif font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {displayName}
                </h1>
                {profile.pronouns && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                    {profile.pronouns}
                  </span>
                )}
              </div>

              {/* @username handle — secondary line below display name */}
              {profile.username && (
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  @{profile.username}
                </p>
              )}

              {/* Magical Name */}
              {magicalName && (
                <p className="text-sm font-medium italic" style={{ color: accent }}>
                  {magicalName}
                </p>
              )}

              {/* Status */}
              {profile.profileStatus && (
                <p className="text-sm italic" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  ✨ {profile.profileStatus}
                </p>
              )}

              {/* Personal Motto */}
              {personalMotto && (
                <p className="text-xs italic px-3 py-1.5 rounded-lg inline-block" style={{ background: `${accent}10`, color: 'hsl(var(--muted-foreground))', borderLeft: `2px solid ${accent}` }}>
                  "{personalMotto}"
                </p>
              )}

              {/* Practice labels */}
              {practiceLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {practiceLabels.map(label => (
                    <span key={label} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Badges */}
              {profileBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {profileBadges.map(badge => {
                    const BADGE_META: Record<string, { label: string; emoji: string }> = {
                      'interest.lunar_witch': { label: 'Lunar Witch', emoji: '🌙' },
                      'interest.green_witch': { label: 'Green Witch', emoji: '🌿' },
                      'interest.astrology': { label: 'Astrology Enthusiast', emoji: '⭐' },
                      'interest.crystals': { label: 'Crystal Lover', emoji: '💎' },
                      'interest.tarot': { label: 'Tarot Enthusiast', emoji: '🃏' },
                      'interest.candle_magic': { label: 'Candle Magic', emoji: '🕯️' },
                      'official.verified_creator': { label: 'Verified Creator', emoji: '✨' },
                      'official.spellful_team': { label: 'Spellful Team', emoji: '🔮' },
                      'official.community_guide': { label: 'Community Guide', emoji: '🌟' },
                    };
                    const meta = BADGE_META[badge.badgeKey] ?? { label: badge.badgeKey, emoji: '🏅' };
                    const isOfficial = badge.badgeType === 'official';
                    return (
                      <span key={badge.badgeKey}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: isOfficial ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                          border: `1px solid ${isOfficial ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--border))'}`,
                          color: isOfficial ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        }}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Witch path */}
              {profile.witchPath && (
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" style={{ color: accent }} />
                  {profile.witchPath}
                </p>
              )}

              {/* Location + member since */}
              <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {profile.location && canSeeField(profile.locationVisibility) && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                )}
                {memberYear && (
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{pageContent.memberSince} {memberYear}</span>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && canSeeField(profile.bioVisibility) && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'hsl(var(--foreground))' }}>{profile.bio}</p>
            )}

            {/* Astro signs */}
            {astroSigns.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {astroSigns.map(({ label, sign }) => (
                  <span key={label} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                    {SIGN_SYMBOLS[sign] ?? ''} {sign} {label}
                  </span>
                ))}
              </div>
            )}

            {/* Social links */}
            {socialEntries.length > 0 && canSeeField(profile.socialLinksVisibility) && (
              <div className="flex flex-wrap gap-2">
                {socialEntries.map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                    <SocialIcon platform={platform} />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Share profile CTA ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' as const }}
            className="mt-4"
          >
            <button
              onClick={() => isOwn ? setShareCardOpen(true) : setShareOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                background: `${accent}18`,
                border: `1px solid ${accent}40`,
                color: accent,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Share2 className="w-4 h-4" />
              {isOwn ? 'Share your profile' : `Share ${displayName}'s profile`}
            </button>
          </motion.div>

          {/* ── Modular sections ─────────────────────────────────────────────── */}
          <div className="mt-6 space-y-4 pb-16">
            {visibleSections.map(section => {
              if (section.id === 'interests' && interests.length === 0) return null;
              if (section.id === 'gallery' && gallery.length === 0) return null;
              if (section.id === 'featured' && featuredPosts.length === 0) return null;
              if (section.id === 'about' && !profile.bio && !magicalPath && !experienceLevel && !favoriteElement) return null;
              if (section.id === 'favorites' && collections.length === 0) return null;
              if (section.id === 'soundscapes' && (!soundscapesEnabled || playlists.length === 0)) return null;
              if (section.id === 'guestbook' && !guestbookEnabled) return null;
              if (section.id === 'milestones' && milestones.length === 0) return null;

              return (
                <motion.section
                  key={section.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' as const }}
                  className="rounded-2xl p-5"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  aria-label={section.label}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <section.icon className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                    <h2 className="font-serif text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{section.label}</h2>
                  </div>

                  {/* Interests */}
                  {section.id === 'interests' && (
                    <div className="flex flex-wrap gap-2">
                      {interests.map(tag => (
                        <span key={tag} className="text-xs px-3 py-1 rounded-full"
                          style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Gallery */}
                  {section.id === 'gallery' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {gallery.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setLightboxImg(item.imageUrl)}
                          className="relative aspect-square rounded-xl overflow-hidden transition-opacity hover:opacity-90 focus:outline-none focus:ring-2"
                          style={{ '--tw-ring-color': accent } as React.CSSProperties}
                          aria-label={item.altText || item.caption || 'Gallery image'}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.altText || item.caption || ''}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {item.caption && (
                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs truncate"
                              style={{ background: 'hsl(var(--background) / 0.7)', color: 'hsl(var(--foreground))' }}>
                              {item.caption}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Featured posts */}
                  {section.id === 'featured' && (
                    <div className="space-y-2">
                      {featuredPosts.map(post => (
                        <Link
                          key={post.id}
                          to={`/community/post/${post.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-80"
                          style={{ background: 'hsl(var(--muted))' }}
                        >
                          <Star className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                          <span className="text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>{post.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* About My Path — bio + magical identity fields */}
                  {section.id === 'about' && (
                    <div className="space-y-3">
                      {profile.bio && canSeeField(profile.bioVisibility) && (
                        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{profile.bio}</p>
                      )}
                      {magicalPath && (
                        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{magicalPath}</p>
                      )}
                      {(experienceLevel || favoriteElement) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {experienceLevel && (
                            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
                              🌱 {experienceLevel}
                            </span>
                          )}
                          {favoriteElement && favoriteElement !== 'None' && (
                            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
                              {favoriteElement === 'Earth' ? '🌍' : favoriteElement === 'Air' ? '💨' : favoriteElement === 'Fire' ? '🔥' : favoriteElement === 'Water' ? '💧' : favoriteElement === 'Spirit' ? '✨' : '🌀'} {favoriteElement}
                            </span>
                          )}
                        </div>
                      )}
                      {!profile.bio && !magicalPath && !experienceLevel && !favoriteElement && (
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.noPathDesc}</p>
                      )}
                    </div>
                  )}

                  {/* Coven placeholder */}
                  {section.id === 'coven' && (
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.covenPlaceholder}</p>
                  )}

                  {/* Magical Favorites — collections */}
                  {section.id === 'favorites' && (
                    collections.length === 0 ? (
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.favoritesPlaceholder}</p>
                    ) : (
                      <div className="space-y-5">
                        {collections.map(col => (
                          <div key={col.id}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-base">{COLLECTION_EMOJI[col.type] ?? '✨'}</span>
                              <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{col.title}</h3>
                            </div>
                            {col.items.length === 0 ? null : (
                              <div className="flex flex-wrap gap-2">
                                {col.items.map(item => (
                                  <span key={item.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}>
                                    {item.emoji && <span>{item.emoji}</span>}
                                    <span>{item.name}</span>
                                    {item.note && <span className="opacity-60">— {item.note}</span>}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Magical Soundscapes */}
                  {section.id === 'soundscapes' && soundscapesEnabled && playlists.length > 0 && (
                    <div className="space-y-3">
                      {playlists.filter(pl => pl.isFeatured).map(pl => (
                        <div key={pl.id} className="p-3 rounded-xl border" style={{ background: `${accent}10`, borderColor: `${accent}30` }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">🎵</span>
                            <span className="text-xs font-semibold" style={{ color: accent }}>Featured Playlist</span>
                          </div>
                          {pl.provider === 'spotify' ? (
                            <div className="rounded-xl overflow-hidden" style={{ height: 152 }}>
                              <iframe
                                src={`https://open.spotify.com/embed/playlist/${pl.providerPlaylistId}?utm_source=generator`}
                                width="100%" height="152" frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                title={pl.customTitle || 'Spotify playlist'}
                              />
                            </div>
                          ) : (
                            <a href={pl.canonicalUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm underline" style={{ color: accent }}>
                              Open on TIDAL ↗
                            </a>
                          )}
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2">
                        {playlists.filter(pl => !pl.isFeatured).map(pl => (
                          <a key={pl.id} href={pl.canonicalUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
                            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}>
                            <span>{pl.provider === 'spotify' ? '🎧' : '🎵'}</span>
                            <span>{pl.customTitle || pl.providerPlaylistId}</span>
                            {pl.isCurrentVibe ? <span style={{ color: accent }}>✨</span> : null}
                          </a>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Playlists are member-provided links. Clicking opens the streaming service.</p>
                    </div>
                  )}

                  {/* Magical Guestbook */}
                  {section.id === 'guestbook' && guestbookEnabled && (
                    <div className="space-y-4">
                      {guestbookEntries.length === 0 ? (
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No entries yet. Be the first to sign!</p>
                      ) : (
                        <div className="space-y-3">
                          {guestbookEntries.map(entry => (
                            <div key={entry.id} className="p-3 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                              <div className="flex items-center gap-2 mb-1">
                                {entry.authorImage ? (
                                  <img src={entry.authorImage} alt="" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: `${accent}20`, color: accent }}>✦</div>
                                )}
                                <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>@{entry.authorUsername ?? 'member'}</span>
                                <span className="text-xs ml-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(entry.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{entry.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Submit form — only for non-owners when guestbook is open */}
                      {!isOwn && session && guestbookSubmitters !== 'nobody' && (
                        <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                          <textarea
                            value={guestbookText}
                            onChange={e => setGuestbookText(e.target.value.slice(0, 300))}
                            placeholder="Leave a greeting… (max 300 characters)"
                            rows={3}
                            className="w-full text-sm rounded-xl p-3 resize-none border"
                            style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                if (!guestbookText.trim() || !profile) return;
                                setGuestbookSubmitting(true);
                                setGuestbookMsg('');
                                try {
                                  const res = await fetch(`/api/profile/${encodeURIComponent(profile.username ?? '')}/guestbook`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                                    body: JSON.stringify({ text: guestbookText.trim() }),
                                  });
                                  const data = await res.json() as { moderationState?: string; error?: string };
                                  if (res.ok) {
                                    setGuestbookText('');
                                    setGuestbookMsg(data.moderationState === 'pending' ? 'Your entry is awaiting approval.' : 'Entry added!');
                                  } else {
                                    setGuestbookMsg(data.error ?? 'Could not submit entry.');
                                  }
                                } finally { setGuestbookSubmitting(false); }
                              }}
                              disabled={guestbookSubmitting || !guestbookText.trim()}
                              className="px-4 py-1.5 rounded-full text-xs font-medium transition-opacity disabled:opacity-50"
                              style={{ background: accent, color: 'hsl(var(--primary-foreground))' }}
                            >
                              {guestbookSubmitting ? 'Sending…' : 'Sign guestbook'}
                            </button>
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{guestbookText.length}/300</span>
                          </div>
                          {guestbookMsg && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{guestbookMsg}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Personal Milestones */}
                  {section.id === 'milestones' && milestones.length > 0 && (
                    <div className="relative pl-5 space-y-4">
                      {/* Vertical line */}
                      <div className="absolute left-1.5 top-2 bottom-2 w-px" style={{ background: `${accent}40` }} />
                      {milestones.map(m => (
                        <div key={m.id} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-3.5 top-1.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: 'hsl(var(--card))', borderColor: accent }} />
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{m.title}</p>
                            {m.milestoneDate && <p className="text-xs" style={{ color: accent }}>{m.milestoneDate}</p>}
                            {m.note && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{m.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.section>
              );
            })}
          </div>
        </div>

        {/* ── Gallery lightbox ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {lightboxImg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'hsl(var(--background) / 0.92)', backdropFilter: 'blur(8px)' }}
              onClick={() => setLightboxImg(null)}
            >
              <img
                src={lightboxImg}
                alt={pageContent.galleryAlt}
                className="max-w-full max-h-full rounded-2xl object-contain"
                style={{ maxHeight: '90vh' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Share Studio modal (non-owner) ──────────────────────────────────── */}
        {profile && (
          <ShareStudioModal
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            contentType="profile"
            title={displayName + "'s Profile on Spellful"}
            description={profile.bio ?? undefined}
            slug={profile.username ?? undefined}
          />
        )}

        {/* ── Profile Share Card sheet (owner only) ────────────────────────────── */}
        <AnimatePresence>
          {shareCardOpen && isOwn && profile && (
            <>
              {/* Backdrop */}
              <motion.div
                key="share-card-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40"
                style={{ background: 'hsl(var(--background) / 0.7)', backdropFilter: 'blur(4px)' }}
                onClick={() => setShareCardOpen(false)}
              />
              {/* Bottom sheet */}
              <motion.div
                key="share-card-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] as const }}
                className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-y-auto"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  maxHeight: '90dvh',
                  paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                }}
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'hsl(var(--muted-foreground) / 0.4)' }} />
                </div>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <h2 className="font-serif text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Create image card
                  </h2>
                  <button
                    onClick={() => setShareCardOpen(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                {/* Card generator */}
                <div className="px-5 py-4">
                  <ProfileShareCard
                    username={profile.username ?? ''}
                    userId={profile.id}
                    avatarUrl={profile.image}
                    displayName={profile.name}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Block sheet ───────────────────────────────────────────────────────── */}
        {!isOwn && profile && (
          <BlockUserSheet
            userId={profile.id}
            displayName={profile.name ?? profile.username ?? 'this member'}
            open={blockSheetOpen}
            onOpenChange={setBlockSheetOpen}
            onBlocked={() => navigate('/community')}
          />
        )}

        {/* ── Profile report modal ──────────────────────────────────────────────── */}
        {!isOwn && profile && (
          <ReportModal
            open={profileReportOpen}
            onClose={() => setProfileReportOpen(false)}
            targetType="profile"
            targetId={profile.id}
          />
        )}
      </main>
    </>
  );
}
