import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Lock, Check, Clock, MessageCircle, ExternalLink, Settings, MoreHorizontal } from 'lucide-react';
import { OnlineDot } from '@/components/OnlineDot';
import { BlockUserSheet } from '@/components/BlockUserSheet';
import { profile as profileContent } from 'virtual:content';

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
  profileTheme: string | null;
  profileLayout: string | null;
  pronouns: string | null;
  interestTags: string[] | null;
  socialLinks: Record<string, string> | null;
};

interface ProfileStats {
  covenCount: number;
  followerCount: number;
}

// ─── Accent color map ─────────────────────────────────────────────────────────
const ACCENT_VARS: Record<string, string> = {
  gold:     'hsl(var(--primary))',
  lavender: 'hsl(var(--accent))',
  rose:     'hsl(var(--accent-rose))',
  sage:     'hsl(var(--secondary))',
  sky:      'hsl(var(--info))',
  ember:    'hsl(var(--warning))',
  violet:   'hsl(var(--accent-violet))',
  moon:     'hsl(var(--muted-foreground))',
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

// ─── Theme CSS variable overrides ───────────────────────────────────────────
const THEME_OVERRIDES: Record<string, React.CSSProperties> = {
  celestial: { '--profile-accent': 'hsl(var(--accent))',            '--profile-bg': 'hsl(259 39% 10%)' } as React.CSSProperties,
  forest:    { '--profile-accent': 'hsl(var(--secondary))',         '--profile-bg': 'hsl(120 20% 8%)' } as React.CSSProperties,
  lunar:     { '--profile-accent': 'hsl(var(--muted-foreground))',  '--profile-bg': 'hsl(248 30% 8%)' } as React.CSSProperties,
  gothic:    { '--profile-accent': 'hsl(0 0% 80%)',                 '--profile-bg': 'hsl(0 0% 5%)' } as React.CSSProperties,
  cottage:   { '--profile-accent': 'hsl(var(--secondary))',         '--profile-bg': 'hsl(80 15% 8%)' } as React.CSSProperties,
  crystal:   { '--profile-accent': 'hsl(var(--primary))',           '--profile-bg': 'hsl(270 30% 9%)' } as React.CSSProperties,
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

// ─── Social link helpers ──────────────────────────────────────────────────────
function SocialIcon({ platform }: { platform: string }) {
  if (platform === 'instagram') return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
  if (platform === 'tiktok') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
  if (platform === 'youtube') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
    </svg>
  );
  return <ExternalLink className="w-4 h-4" />;
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', website: 'Website',
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
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
  const [stats, setStats] = useState<ProfileStats>({ covenCount: 0, followerCount: 0 });

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/profile/${username}`)
      .then(r => r.json())
      .then((data: { error?: string; profile?: Profile; connectionStatus?: string | null; connectionId?: number | null; isOwn?: boolean; covenCount?: number; followerCount?: number }) => {
        if (data.error) setError(data.error);
        else {
          setProfile(data.profile ?? null);
          setConnectionStatus(data.connectionStatus ?? null);
          setConnectionId(data.connectionId ?? null);
          setIsOwn(data.isOwn ?? false);
          setStats({ covenCount: data.covenCount ?? 0, followerCount: data.followerCount ?? 0 });
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [username]);

  async function sendCovenRequest() {
    if (!profile) return;
    setRequesting(true);
    try {
      const r = await fetch('/api/coven/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: profile.id }),
      });
      if (r.ok) {
        // Fetch the new connection id
        const statusR = await fetch(`/api/coven/status/${profile.id}`, { credentials: 'include' });
        if (statusR.ok) {
          const statusData = await statusR.json() as { status: string | null; connectionId: number | null };
          setConnectionStatus(statusData.status);
          setConnectionId(statusData.connectionId);
        } else {
          setConnectionStatus('pending_sent');
        }
      }
    } finally { setRequesting(false); }
  }

  async function removeFromCoven() {
    if (!connectionId) return;
    setRequesting(true);
    try {
      await fetch(`/api/coven/${connectionId}`, { method: 'DELETE', credentials: 'include' });
      setConnectionStatus(null);
      setConnectionId(null);
    } finally { setRequesting(false); }
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{profileContent.loading}</p>
      </div>
    </main>
  );

  if (error) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <Lock className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <h1 className="text-2xl font-serif font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          {error === 'Profile not found' ? profileContent.errorNotFound : profileContent.errorPrivate}
        </h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {error === 'Profile not found'
            ? profileContent.errorNotFoundDesc
            : profileContent.errorPrivateDesc}
        </p>
        <Button onClick={() => navigate(-1)} variant="outline">{profileContent.goBack}</Button>
      </div>
    </main>
  );

  if (!profile) return null;

  const accent = accentColor(profile.accentColor);
  const themeOverride = THEME_OVERRIDES[profile.profileTheme ?? ''] ?? {};
  const profileLayout = profile.profileLayout ?? 'classic';
  const coverHeight = profileLayout === 'immersive' ? '320px' : profileLayout === 'compact' ? '140px' : '220px';
  const cardMaxWidth = profileLayout === 'immersive' ? '900px' : '672px';
  const displayName = profile.name ?? profile.username ?? 'Witch';
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : null;
  const interests = profile.interestTags ?? [];
  const social = profile.socialLinks ?? {};
  const socialEntries = Object.entries(social).filter(([, v]) => v);

  return (
    <>
      <Helmet>
        <title>{displayName} — Spellful</title>
        <meta name="description" content={profile.bio ?? `${displayName}'s profile on Spellful`} />
        <meta property="og:title" content={`${displayName} — Spellful`} />
        <meta property="og:description" content={profile.bio ?? `${displayName}'s profile on Spellful`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://spellful.com/profile/${profile.username}`} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Spellful — Witchcraft, Tarot &amp; Intuitive Resources" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayName} — Spellful`} />
        <meta name="twitter:description" content={profile.bio ?? `${displayName}'s profile on Spellful`} />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Spellful — Witchcraft, Tarot &amp; Intuitive Resources" />
      </Helmet>

      <main style={themeOverride}>
        {/* ── Cover ──────────────────────────────────────────────────────────── */}
        <div
          className="relative w-full"
          style={{ ...coverStyle(profile), height: coverHeight }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          {/* Own profile edit shortcut */}
          {isOwn && (
            <Link
              to="/account/profile"
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-opacity hover:opacity-90"
              style={{ background: 'hsl(var(--background) / 0.7)', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
            >
              <Settings className="w-3.5 h-3.5" />
              {profileContent.customize}
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
            {/* Avatar — overlaps cover */}
            <div
              className="absolute rounded-full p-1"
              style={{
                top: '-48px',
                left: '28px',
                background: 'hsl(var(--card))',
                boxShadow: `0 0 0 3px ${accent}`,
              }}
            >
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: `${accent}22` }}
                >
                  <span className="text-3xl font-serif font-bold" style={{ color: accent }}>{initials}</span>
                </div>
              )}
              <OnlineDot userId={profile.id} className="absolute bottom-1 right-1" />
            </div>

            {/* Coven / message actions — top right of card */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {!isOwn && session && (
                <>
                  <Link to={`/messages?user=${profile.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {profileContent.message}
                    </Button>
                  </Link>
                  {connectionStatus === 'accepted' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={requesting}
                      onClick={removeFromCoven}
                      className="gap-1.5 text-xs h-8"
                      title="Remove from Coven"
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: accent }} />
                      Coven Member
                    </Button>
                  ) : connectionStatus === 'pending_sent' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={requesting}
                      onClick={removeFromCoven}
                      className="gap-1.5 text-xs h-8"
                      title="Cancel invitation"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Invitation Sent
                    </Button>
                  ) : connectionStatus === 'pending_received' ? (
                    <Button size="sm" variant="outline" disabled className="gap-1.5 text-xs h-8">
                      <Clock className="w-3.5 h-3.5" />
                      Invitation Received
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={sendCovenRequest}
                      disabled={requesting}
                      className="gap-1.5 text-xs h-8"
                      style={{ background: accent, color: 'hsl(var(--primary-foreground))' }}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Invite to Coven
                    </Button>
                  )}
                  {/* ⋯ More menu — block option */}
                  <button
                    onClick={() => setBlockSheetOpen(true)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
                    title="More options"
                    aria-label="More options"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Block sheet */}
            {profile && !isOwn && (
              <BlockUserSheet
                open={blockSheetOpen}
                onOpenChange={setBlockSheetOpen}
                displayName={profile.name ?? profile.username ?? 'this member'}
                userId={profile.id}
                onBlocked={() => navigate('/community')}
              />
            )}

            {/* Name + pronouns + username */}
            <div className="mb-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <h1
                  className="text-2xl font-serif font-bold leading-tight"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {displayName}
                </h1>
                {profile.pronouns && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
                  >
                    {profile.pronouns}
                  </span>
                )}
              </div>
              {profile.username && (
                <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  @{profile.username}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p
                className="text-sm leading-relaxed mb-4 max-w-lg"
                style={{ color: 'hsl(var(--foreground) / 0.85)', fontFamily: 'var(--font-sans)' }}
              >
                {profile.bio}
              </p>
            )}

            {/* Meta row: location · witch path · member since */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.location}
                </span>
              )}
              {profile.witchPath && (
                <span className="flex items-center gap-1">
                  ✦ {profile.witchPath}
                </span>
              )}
              {memberYear && (
                <span>Member since {memberYear}</span>
              )}
            </div>

            {/* Coven & follower counts */}
            <div className="flex items-center gap-5 mb-4">
              <div className="text-center">
                <p className="text-lg font-serif font-bold leading-none" style={{ color: 'hsl(var(--foreground))' }}>
                  {stats.covenCount}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Coven</p>
              </div>
              <div className="w-px h-8" style={{ background: 'hsl(var(--border))' }} />
              <div className="text-center">
                <p className="text-lg font-serif font-bold leading-none" style={{ color: 'hsl(var(--foreground))' }}>
                  {stats.followerCount}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Followers</p>
              </div>
            </div>

            {/* Astro signs */}
            {(profile.sunSign || profile.moonSign || profile.risingSign) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: 'Sun', sign: profile.sunSign },
                  { label: 'Moon', sign: profile.moonSign },
                  { label: 'Rising', sign: profile.risingSign },
                ].filter(s => s.sign).map(s => (
                  <span
                    key={s.label}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground) / 0.8)', border: '1px solid hsl(var(--border))' }}
                  >
                    <span style={{ color: accent }}>{SIGN_SYMBOLS[s.sign!] ?? ''}</span>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</span>
                    {s.sign}
                  </span>
                ))}
              </div>
            )}

            {/* Interest tags */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {interests.map(tag => (
                  <Link
                    key={tag}
                    to={`/community?q=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                    style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    aria-label={PLATFORM_LABELS[platform] ?? platform}
                  >
                    <SocialIcon platform={platform} />
                    <span>{PLATFORM_LABELS[platform] ?? platform}</span>
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Guest join CTA */}
          {!session && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 rounded-xl border p-5 text-center space-y-3"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            >
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {profileContent.joinCta}
              </p>
              <Button
                onClick={() => navigate('/signup')}
                style={{ background: accent, color: 'hsl(var(--primary-foreground))' }}
              >
                {profileContent.createAccount}
              </Button>
            </motion.div>
          )}

          <div className="h-12" />
        </div>
      </main>
    </>
  );
}
