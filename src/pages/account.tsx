import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate, Link, Navigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, useReducedMotion } from 'motion/react';
import { useSession, signOut, authClient } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  User, Star, LogOut, Sparkles, Camera, Eye, EyeOff,
  ShieldCheck, ShieldOff, Shield, Smartphone, Key, Check, X, QrCode,
  Globe, Lock, Users, Monitor, Trash2, Activity, Bell, MessageSquare as MessageSquareIcon,
  Download, AlertTriangle, Sliders, Type, Contrast, Wand2, CheckCircle2, Award, Crown, ChevronRight,
} from 'lucide-react';
import { account } from 'virtual:content';

// ── Google SVG icon ───────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Apple SVG icon ────────────────────────────────────────────────────────────
function AppleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// ── Twinkling star (header accent) ───────────────────────────────────────────
function TwinkleStar({ x, y, delay }: { x: string; y: string; delay: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <motion.span
      aria-hidden="true"
      className="absolute pointer-events-none select-none text-primary"
      style={{ left: x, top: y, fontSize: '10px', opacity: 0 }}
      animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.2, 0.6] }}
      transition={{ duration: 2.4, delay, repeat: Infinity, repeatDelay: 3 + delay }}
    >✦</motion.span>
  );
}

const ZODIAC_GLYPHS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

// ── Section card wrapper ──────────────────────────────────────────────────────
function SettingsCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 ${className}`}
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {children}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function CardHeading({ icon: Icon, children, className }: { icon: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 mb-4${className ? ` ${className}` : ""}`}>
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
      <h2 className="font-serif text-lg leading-tight" style={{ color: 'hsl(var(--foreground))' }}>{children}</h2>
    </div>
  );
}

// ── 2FA Setup Modal ───────────────────────────────────────────────────────────
function TwoFaSetup({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState<'choice' | 'totp-qr' | 'totp-verify' | 'done'>('choice');
  const [qrUri, setQrUri] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  async function startTotp() {
    setLoading(true);
    setError('');
    try {
      const twoFactor = (authClient as unknown as { twoFactor?: { getTotpUri: (opts: { password: string }) => Promise<{ data?: { totpURI?: string }; error?: { message?: string } }> } }).twoFactor;
      const result = await twoFactor?.getTotpUri({ password: '' });
      if (result?.data?.totpURI) {
        setQrUri(result.data.totpURI);
        setStep('totp-qr');
      } else {
        setError(result?.error?.message ?? 'Could not generate QR code.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyTotp() {
    if (totpCode.length < 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    setError('');
    try {
      const twoFactor = (authClient as unknown as { twoFactor?: { enableTwoFactor: (opts: { code: string }) => Promise<{ data?: { backupCodes?: string[] }; error?: { message?: string } }> } }).twoFactor;
      const result = await twoFactor?.enableTwoFactor({ code: totpCode });
      if (result?.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
        setStep('done');
        onEnabled();
      } else {
        setError(result?.error?.message ?? 'Invalid code. Please try again.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(10px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif" style={{ color: 'hsl(var(--foreground))' }}>{account.twoFaModal.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'choice' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">{account.twoFaModal.choiceIntro}</p>
            <button onClick={startTotp} disabled={loading}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:opacity-90"
              style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              <QrCode className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <div>
                <p className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>{account.twoFaModal.totpOptionTitle}</p>
                <p className="text-xs text-muted-foreground">{account.twoFaModal.totpOptionDesc}</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl text-left opacity-50 cursor-not-allowed"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              title="SMS requires Twilio configuration" disabled>
              <Smartphone className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <div>
                <p className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>{account.twoFaModal.smsOptionTitle}</p>
                <p className="text-xs text-muted-foreground">{account.twoFaModal.smsOptionDesc}</p>
              </div>
            </button>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>
        )}

        {step === 'totp-qr' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app:</p>
            <div className="flex justify-center p-4 rounded-xl" style={{ background: 'white' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUri)}`}
                alt="TOTP QR code" className="w-44 h-44" />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all px-2"
              style={{ fontFamily: 'monospace' }}>{qrUri}</p>
            <Button onClick={() => setStep('totp-verify')} className="w-full bg-primary text-primary-foreground">
              I've scanned it — enter code
            </Button>
          </div>
        )}

        {step === 'totp-verify' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app to confirm setup:</p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={totpCode} onChange={setTotpCode}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button onClick={verifyTotp} disabled={loading || totpCode.length < 6}
              className="w-full bg-primary text-primary-foreground">
              {loading ? 'Verifying…' : 'Enable 2FA'}
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success mb-2">
              <Check className="w-5 h-5" />
              <p className="font-medium">Two-factor authentication enabled!</p>
            </div>
            <p className="text-sm text-muted-foreground">Save these backup codes in a safe place. Each can only be used once:</p>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
              {backupCodes.map((code, i) => (
                <span key={i} className="text-xs font-mono text-center py-1" style={{ color: 'hsl(var(--foreground))' }}>{code}</span>
              ))}
            </div>
            <Button onClick={onClose} className="w-full bg-primary text-primary-foreground">Done</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main Account Page ─────────────────────────────────────────────────────────
// ── Badge definitions ─────────────────────────────────────────────────────────
interface UserBadge { id: number; badgeKey: string; badgeType: string; isVisible: number; sortOrder: number }

const INTEREST_BADGES: { key: string; label: string; emoji: string; description: string }[] = [
  { key: 'interest.lunar_witch', label: 'Lunar Witch', emoji: '🌙', description: 'Drawn to moon magic and lunar cycles' },
  { key: 'interest.green_witch', label: 'Green Witch', emoji: '🌿', description: 'Herbalism, nature, and earth magic' },
  { key: 'interest.astrology', label: 'Astrology Enthusiast', emoji: '⭐', description: 'Passionate about astrology and birth charts' },
  { key: 'interest.crystals', label: 'Crystal Lover', emoji: '💎', description: 'Crystal healing and gemstone magic' },
  { key: 'interest.tarot', label: 'Tarot Enthusiast', emoji: '🃏', description: 'Tarot reading and divination' },
  { key: 'interest.candle_magic', label: 'Candle Magic', emoji: '🕯️', description: 'Candle spells and fire magic' },
];

const OFFICIAL_BADGE_LABELS: Record<string, { label: string; emoji: string }> = {
  'official.verified_creator': { label: 'Verified Creator', emoji: '✨' },
  'official.spellful_team': { label: 'Spellful Team', emoji: '🔮' },
  'official.community_guide': { label: 'Community Guide', emoji: '🌟' },
};

export default function AccountPage() {
  const navigate = useNavigate();
  const { session, isPending } = useSession();

  // Profile state
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [showTwoFaSetup, setShowTwoFaSetup] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  // Sign out all sessions
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);

  // Data export / deletion
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  const [cancelDeletionLoading, setCancelDeletionLoading] = useState(false);

  // Accessibility preferences
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('spellful-reduced-motion') === 'true');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>(() => (localStorage.getItem('spellful-font-size') as 'normal' | 'large' | 'larger') || 'normal');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('spellful-high-contrast') === 'true');

  // Account type
  const [accountType, setAccountType] = useState<string>('community_member');

  // Creator application status
  interface AppSummary { id: number; referenceId: string; status: string; requestedAccountType: string; creatorCategory: string; reviewDecision: string; reviewReason: string; submittedAt: string; }
  const [myApplication, setMyApplication] = useState<AppSummary | null>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  const loadMyApplication = useCallback(async () => {
    setAppLoading(true);
    try {
      const res = await fetch('/api/creator-applications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { applications: AppSummary[] };
        setMyApplication(data.applications[0] ?? null);
      }
    } finally {
      setAppLoading(false);
    }
  }, []);

  // Badges
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [badgesLoaded, setBadgesLoaded] = useState(false);
  const [badgeSaving, setBadgeSaving] = useState<string | null>(null);

  // Apply accessibility preferences on mount
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('reduce-motion', reducedMotion);
    html.classList.remove('font-size-large', 'font-size-larger');
    const fs = (localStorage.getItem('spellful-font-size') as 'normal' | 'large' | 'larger') || 'normal';
    if (fs !== 'normal') html.classList.add(`font-size-${fs}`);
    html.classList.toggle('high-contrast', highContrast);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Username change state
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameCooldownDays, setUsernameCooldownDays] = useState<number | null>(null);

  // Public profile fields
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [witchPath, setWitchPath] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('private');
  const [hideOnlineStatus, setHideOnlineStatus] = useState(false);
  const [presenceSaving, setPresenceSaving] = useState(false);
  const [messagePermission, setMessagePermission] = useState('everyone');
  const [invitePermission, setInvitePermission] = useState('everyone');
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    covenInvitations: true,
    covenAccepted: true,
    communityReplies: true,
    communityLikes: true,
    messages: true,
    systemAnnouncements: true,
  });
  const [permSaving, setPermSaving] = useState(false);
  const [permSaved, setPermSaved] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [blockedMembers, setBlockedMembers] = useState<Array<{ id: number; blockedId: string; createdAt: string | null; name: string | null; username: string | null; image: string | null }>>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [publicProfileSaved, setPublicProfileSaved] = useState(false);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState('');

  // Sessions & activity
  type SessionItem = { id: string; userAgent: string | null; ipAddress: string | null; createdAt: string | null; expiresAt: string | null; isCurrent: boolean };
  type ActivityItem = { id: number; device: string | null; ipAddress: string | null; createdAt: string | null };
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  // Astro profile
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [sunSign, setSunSign] = useState('');
  const [moonSign, setMoonSign] = useState('');
  const [risingSign, setRisingSign] = useState('');

  useEffect(() => {
    if (!session?.user) return;
    const u = session.user as { image?: string; twoFactorEnabled?: boolean; birthDate?: string; birthTime?: string; birthLocation?: string; sunSign?: string; moonSign?: string; risingSign?: string };
    setAvatarUrl(u.image ?? '/airo-assets/images/avatars/default-hat-purple');
    setTwoFaEnabled(u.twoFactorEnabled ?? false);
    const extUser = u as { username?: string; bio?: string; location?: string; witchPath?: string; profileVisibility?: string };
    setUsername(extUser.username ?? '');
    setUsernameInput(extUser.username ?? '');
    setBio(extUser.bio ?? '');
    setLocation(extUser.location ?? '');
    setWitchPath(extUser.witchPath ?? '');
    setProfileVisibility(extUser.profileVisibility ?? 'private');
    const extUser2 = u as { hideOnlineStatus?: boolean; messagePermission?: string; invitePermission?: string; notificationPreferences?: Record<string, boolean> };
    setHideOnlineStatus(extUser2.hideOnlineStatus ?? false);
    if (extUser2.messagePermission) setMessagePermission(extUser2.messagePermission);
    if (extUser2.invitePermission) setInvitePermission(extUser2.invitePermission);
    if (extUser2.notificationPreferences) setNotifPrefs((prev) => ({ ...prev, ...extUser2.notificationPreferences }));
    setBirthDate(u.birthDate ?? '');
    setBirthTime(u.birthTime ?? '');
    setBirthLocation(u.birthLocation ?? '');
    setSunSign(u.sunSign ?? '');
    setMoonSign(u.moonSign ?? '');
    setRisingSign(u.risingSign ?? '');
    // Fetch account type separately (not in session payload)
    fetch('/api/account/type', { credentials: 'include' })
      .then(r => r.json())
      .then((d: { accountType?: string }) => { if (d.accountType) setAccountType(d.accountType); })
      .catch(() => undefined);
    // Fetch creator application status
    loadMyApplication();
    // Fetch badges
    fetch('/api/profile/badges', { credentials: 'include' })
      .then(r => r.json())
      .then((d: { badges?: UserBadge[] }) => { setMyBadges(d.badges ?? []); setBadgesLoaded(true); })
      .catch(() => setBadgesLoaded(true));
  }, [session]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be 5 MB or smaller.');
      e.target.value = '';
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const valid = await new Promise<boolean>(resolve => {
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(objectUrl); resolve(img.width === img.height); };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(false); };
      img.src = objectUrl;
    });
    if (!valid) {
      setAvatarError('Photo must be square (equal width and height).');
      e.target.value = '';
      return;
    }
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/account/avatar', { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) { setAvatarUrl(data.url); }
      else if (data.error) { setAvatarError(data.error); }
    } catch {
      setAvatarError('Upload failed. Please try again.');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  }

  async function handleSelectDefaultAvatar(avatarSlotUrl: string) {
    setAvatarError('');
    setAvatarLoading(true);
    try {
      const res = await fetch('/api/account/avatar/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: avatarSlotUrl }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) { setAvatarUrl(data.url); }
    } catch { /* silent */ }
    finally { setAvatarLoading(false); }
  }

  async function handleSaveProfile() {
    setProfileSaved(false);
    try {
      await authClient.updateUser({ birthDate, birthTime, birthLocation, sunSign, moonSign, risingSign } as Record<string, string>);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      // silent
    }
  }

  async function handleSavePublicProfile() {
    setPublicProfileError('');
    setPublicProfileLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, bio, location, witchPath, profileVisibility }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.error) { setPublicProfileError(data.error); }
      else { setPublicProfileSaved(true); setTimeout(() => setPublicProfileSaved(false), 2500); }
    } catch { setPublicProfileError('Failed to save profile'); }
    finally { setPublicProfileLoading(false); }
  }

  async function handleSavePermissions() {
    setPermSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messagePermission, invitePermission }),
      });
      setPermSaved(true);
      setTimeout(() => setPermSaved(false), 2500);
    } finally { setPermSaving(false); }
  }

  async function handleSaveNotifPrefs() {
    setNotifSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationPreferences: notifPrefs }),
      });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    } finally { setNotifSaving(false); }
  }

  async function loadSessions() {
    if (sessionsLoaded) return;
    const [sessRes, actRes] = await Promise.all([
      fetch('/api/account/sessions', { credentials: 'include' }).then(r => r.json()) as Promise<{ sessions?: SessionItem[] }>,
      fetch('/api/account/activity', { credentials: 'include' }).then(r => r.json()) as Promise<{ activity?: ActivityItem[] }>,
    ]);
    setSessions(sessRes.sessions ?? []);
    setActivity(actRes.activity ?? []);
    setSessionsLoaded(true);
  }

  async function revokeSession(id: string) {
    await fetch(`/api/account/sessions/${id}`, { method: 'DELETE', credentials: 'include' });
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  function parseDevice(ua: string | null): string {
    if (!ua) return 'Unknown device';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone / iPad';
    if (/Android/.test(ua)) return 'Android';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Browser';
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return; }
    setPasswordLoading(true);
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if ((result as { error?: { message?: string } }).error) {
        setPasswordError((result as { error?: { message?: string } }).error?.message ?? 'Could not update password.');
      } else {
        setPasswordSaved(true);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => setPasswordSaved(false), 2500);
      }
    } catch {
      setPasswordError('Something went wrong. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function signOutAllSessions() {
    setSignOutAllLoading(true);
    try {
      await fetch('/api/account/sessions', { method: 'DELETE', credentials: 'include' });
      // Reload sessions list
      await loadSessions();
    } finally {
      setSignOutAllLoading(false);
    }
  }

  async function handleExportData() {
    setExportLoading(true);
    try {
      const res = await fetch('/api/account/export', { credentials: 'include' });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'spellful-data-export.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportLoading(false);
    }
  }

  async function handleRequestDeletion() {
    if (!deletePassword) { setDeleteError('Please enter your password.'); return; }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json() as { ok?: boolean; scheduledDeletionAt?: string; error?: string };
      if (data.ok) {
        setDeletionScheduledAt(data.scheduledDeletionAt ?? null);
        setDeleteConfirmOpen(false);
        setDeletePassword('');
      } else {
        setDeleteError(data.error ?? 'Something went wrong.');
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleCancelDeletion() {
    setCancelDeletionLoading(true);
    try {
      await fetch('/api/account/delete', { method: 'DELETE', credentials: 'include' });
      setDeletionScheduledAt(null);
    } finally {
      setCancelDeletionLoading(false);
    }
  }

  function applyAccessibility(rm: boolean, fs: 'normal' | 'large' | 'larger', hc: boolean) {
    const html = document.documentElement;
    html.classList.toggle('reduce-motion', rm);
    html.classList.remove('font-size-large', 'font-size-larger');
    if (fs !== 'normal') html.classList.add(`font-size-${fs}`);
    html.classList.toggle('high-contrast', hc);
    localStorage.setItem('spellful-reduced-motion', String(rm));
    localStorage.setItem('spellful-font-size', fs);
    localStorage.setItem('spellful-high-contrast', String(hc));
  }

  async function handleDisable2Fa() {
    setTwoFaLoading(true);
    try {
      const twoFactor = (authClient as unknown as { twoFactor?: { disableTwoFactor: () => Promise<{ error?: { message?: string } }> } }).twoFactor;
      await twoFactor?.disableTwoFactor();
      setTwoFaEnabled(false);
    } catch {
      // silent
    } finally {
      setTwoFaLoading(false);
    }
  }

  function handleSocialConnect(provider: 'google' | 'apple') {
    void authClient.linkSocial({ provider, callbackURL: '/account' });
  }

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  const user = session.user;
  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <>
      <Helmet>
        <title>{account.meta.title}</title>
        <meta name="description" content={account.meta.description} />
        <meta name="robots" content="noindex" />
      </Helmet>

      {showTwoFaSetup && (
        <TwoFaSetup
          onClose={() => setShowTwoFaSetup(false)}
          onEnabled={() => setTwoFaEnabled(true)}
        />
      )}

      <main className="min-h-screen px-4 py-10 sm:py-14" style={{ background: 'hsl(var(--background))' }}>
        <div className="max-w-xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

            {/* ── Page Header ── */}
            <div className="relative mb-8 rounded-2xl px-5 py-5 overflow-hidden"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              {/* Subtle twinkling stars — header only */}
              <TwinkleStar x="8%" y="18%" delay={0} />
              <TwinkleStar x="88%" y="12%" delay={1.1} />
              <TwinkleStar x="94%" y="72%" delay={2.3} />
              <TwinkleStar x="4%" y="80%" delay={0.7} />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
                      style={{
                        background: 'hsl(var(--muted))',
                        boxShadow: '0 0 0 2px hsl(var(--primary) / 0.5), 0 0 0 4px hsl(var(--background))',
                      }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={user.name ?? 'Avatar'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-serif" style={{ color: 'hsl(var(--primary))' }}>{initials}</span>
                      )}
                      {avatarLoading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full"
                          style={{ background: 'hsl(var(--background) / 0.7)' }}>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h1 className="font-serif text-xl leading-tight truncate" style={{ color: 'hsl(var(--foreground))' }}>
                      My Spellful Account
                    </h1>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {user.name && <span className="font-medium" style={{ color: 'hsl(var(--accent))' }}>{user.name}</span>}
                      {user.name && ' · '}
                      Your magic. Your space.
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{account.header.signOutButton}</span>
                </Button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="profile">
              {/* Tab bar */}
              <TabsList
                className="w-full mb-6 grid grid-cols-4 h-auto p-1 rounded-xl gap-1"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              >
                {([
                  { value: 'profile', icon: User, label: account.tabs.profile },
                  { value: 'security', icon: ShieldCheck, label: account.tabs.security },
                  { value: 'astro', icon: Star, label: account.tabs.astrology },
                  { value: 'privacy', icon: ShieldOff, label: 'Privacy' },
                  { value: 'accessibility', icon: Sliders, label: 'Accessibility' },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all
                      data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm
                      data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                  </TabsTrigger>
                ))}
                {/* Customize tab — navigates to profile studio */}
                <Link
                  to="/account/profile"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all col-span-4 mt-1"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18) 0%, hsl(var(--accent) / 0.18) 100%)',
                    border: '1px solid hsl(var(--primary) / 0.45)',
                    color: 'hsl(var(--primary))',
                    boxShadow: '0 0 12px hsl(var(--primary) / 0.15)',
                  }}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>Customize Profile</span>
                </Link>
              </TabsList>

              {/* ── Profile Tab ── */}
              <TabsContent value="profile" className="space-y-4">

                {/* ── Profile Studio CTA ── */}
                <Link
                  to="/account/profile"
                  className="block rounded-2xl p-5 transition-all hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.2) 50%, hsl(var(--primary) / 0.1) 100%)',
                    border: '1px solid hsl(var(--primary) / 0.5)',
                    boxShadow: '0 0 24px hsl(var(--primary) / 0.12), inset 0 1px 0 hsl(var(--primary) / 0.15)',
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'hsl(var(--primary) / 0.2)', border: '1px solid hsl(var(--primary) / 0.4)' }}
                      >
                        <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-serif" style={{ color: 'hsl(var(--primary))' }}>
                          Customize Your Profile
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Themes, layouts, sections, soundscapes, guestbook &amp; more
                        </p>
                      </div>
                    </div>
                    <div
                      className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0"
                      style={{
                        background: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                      }}
                    >
                      Open Studio →
                    </div>
                  </div>
                </Link>

                {/* Avatar section */}
                <SettingsCard>
                  <div className="mb-1">
                    <h2 className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>Choose Your Magical Look</h2>
                    <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Every witch has their own style. Pick the avatar that feels like you, or upload a little magic of your own.
                    </p>
                  </div>

                  {/* Current avatar preview + upload */}
                  <div className="flex items-center gap-4 mt-4 mb-5">
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                        style={{
                          background: 'hsl(var(--muted))',
                          boxShadow: '0 0 0 2px hsl(var(--primary) / 0.6), 0 0 0 4px hsl(var(--background))',
                        }}>
                        {avatarLoading ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                        ) : avatarUrl ? (
                          <img src={avatarUrl} alt={user.name ?? 'Your avatar'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-serif" style={{ color: 'hsl(var(--primary))' }}>{initials}</span>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                        aria-label="Upload custom photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                        className="hidden" onChange={handleAvatarChange} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Your current look</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{account.profileTab.uploadHint}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{account.profileTab.uploadConstraints}</p>
                      {avatarError && <p className="text-xs mt-1" style={{ color: 'hsl(var(--destructive))' }}>{avatarError}</p>}
                    </div>
                  </div>

                  {/* Witch hat preset grid */}
                  <div className="rounded-xl p-4"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    <p className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {account.profileTab.avatarPickerTitle}
                    </p>
                    <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 sm:gap-3">
                      {account.DEFAULT_AVATARS.map(function(avatar) {
                        const isSelected = avatarUrl === avatar.url;
                        return (
                          <button
                            key={avatar.id}
                            onClick={function() { void handleSelectDefaultAvatar(avatar.url); }}
                            disabled={avatarLoading}
                            className="relative rounded-full overflow-hidden aspect-square transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            style={isSelected ? {
                              boxShadow: '0 0 0 2px hsl(var(--primary)), 0 0 0 4px hsl(var(--background)), 0 0 12px hsl(var(--primary) / 0.4)',
                            } : {}}
                            aria-label={`${avatar.label} witch hat${isSelected ? ' (selected)' : ''}`}
                            aria-pressed={isSelected}
                            title={avatar.label}
                          >
                            <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" loading="lazy" />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-full pointer-events-none"
                                style={{ background: 'hsl(var(--primary) / 0.2)' }}>
                                <Check className="w-4 h-4 drop-shadow" style={{ color: 'hsl(var(--primary-foreground))' }} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Tap any hat to set it as your profile picture.</p>
                  </div>
                </SettingsCard>

                {/* Display name */}
                <SettingsCard>
                  <CardHeading icon={User}>Display Name</CardHeading>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-muted-foreground">Name</Label>
                    <Input
                      id="name"
                      defaultValue={user.name ?? ''}
                      className="bg-muted border-border"
                      onBlur={async (e) => { await authClient.updateUser({ name: e.target.value }); }}
                    />
                    <p className="text-xs text-muted-foreground">This is how you appear across Spellful.</p>
                  </div>
                  <div className="mt-4">
                    <Button onClick={handleSaveProfile} className="bg-primary text-primary-foreground">
                      {profileSaved
                        ? <span className="flex items-center gap-2"><Check className="w-4 h-4" />Saved</span>
                        : 'Save Profile'}
                    </Button>
                  </div>
                </SettingsCard>

                {/* Public profile */}
                <SettingsCard>
                  <CardHeading icon={Globe}>{account.profileTab.publicProfileTitle}</CardHeading>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{account.profileTab.usernameLabel}</Label>
                      {usernameCooldownDays !== null ? (
                        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                          ⏳ You can change your username again in {usernameCooldownDays} day{usernameCooldownDays === 1 ? '' : 's'}.
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">@</span>
                            <Input
                              value={usernameInput}
                              onChange={e => {
                                const v = e.target.value.slice(0, 12);
                                setUsernameInput(v);
                                setUsernameAvailable(null);
                                setUsernameError('');
                                setUsernameSaved(false);
                                if (v.length >= 3) {
                                  setUsernameChecking(true);
                                  clearTimeout((window as Window & { _unTimer?: ReturnType<typeof setTimeout> })._unTimer);
                                  (window as Window & { _unTimer?: ReturnType<typeof setTimeout> })._unTimer = setTimeout(async () => {
                                    try {
                                      const r = await fetch(`/api/username/check?username=${encodeURIComponent(v)}`, { credentials: 'include' });
                                      const d = await r.json() as { available: boolean; error?: string };
                                      setUsernameAvailable(d.available);
                                      if (!d.available) setUsernameError(d.error ?? 'Already taken');
                                    } catch { setUsernameError('Could not check'); }
                                    finally { setUsernameChecking(false); }
                                  }, 500);
                                }
                              }}
                              placeholder="e.g. MoonWitch42"
                              className="bg-muted border-border font-mono"
                              maxLength={12}
                            />
                            <Button
                              size="sm"
                              disabled={usernameInput === username || !usernameAvailable || usernameSaving || usernameChecking}
                              onClick={async () => {
                                setUsernameSaving(true);
                                try {
                                  const r = await fetch('/api/username/change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ username: usernameInput }) });
                                  const d = await r.json() as { ok?: boolean; error?: string; code?: string; daysLeft?: number };
                                  if (d.ok) { setUsername(usernameInput); setUsernameSaved(true); setUsernameAvailable(null); }
                                  else if (d.code === 'cooldown' && d.daysLeft) { setUsernameCooldownDays(d.daysLeft); }
                                  else { setUsernameError(d.error ?? 'Failed'); }
                                } catch { setUsernameError('Failed'); }
                                finally { setUsernameSaving(false); }
                              }}
                              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                            >
                              {usernameSaving ? '…' : usernameSaved ? '✓' : 'Save'}
                            </Button>
                          </div>
                          {usernameError && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{usernameError}</p>}
                          {usernameAvailable === true && usernameInput !== username && <p className="text-xs" style={{ color: 'hsl(var(--success))' }}>✨ {usernameInput} is available!</p>}
                          {usernameChecking && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Checking…</p>}
                        </>
                      )}
                      <p className="text-xs text-muted-foreground">3–12 characters, letters A–Z and digits 0–9 only. Can be changed once every 30 days.</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        {account.profileTab.bioLabel} <span className="text-xs opacity-60">({bio.length}/160)</span>
                      </Label>
                      <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        maxLength={160}
                        rows={3}
                        placeholder={account.profileTab.bioPlaceholder}
                        className="w-full rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Location</Label>
                      <Input
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="City, Country (optional)"
                        className="bg-muted border-border"
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Witch Path</Label>
                      <select
                        value={witchPath}
                        onChange={e => setWitchPath(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      >
                        <option value="">Select your path...</option>
                        {['Eclectic','Green','Hedge','Kitchen','Sea','Cosmic','Ceremonial','Solitary','Hereditary','Dianic','Faery','Shadow'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Profile Visibility</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can view' },
                          { value: 'coven', label: 'Coven', icon: Users, desc: 'Coven members only' },
                          { value: 'private', label: 'Private', icon: Lock, desc: 'Only you' },
                        ] as const).map(({ value, label, icon: Icon, desc }) => (
                          <button
                            key={value}
                            onClick={() => setProfileVisibility(value)}
                            className={`p-3 rounded-xl border text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary ${profileVisibility === value ? 'border-primary' : 'border-border hover:border-primary/40'}`}
                            style={profileVisibility === value ? { background: 'hsl(var(--primary) / 0.1)' } : {}}
                            aria-pressed={profileVisibility === value}
                          >
                            <Icon className={`w-4 h-4 mx-auto mb-1 ${profileVisibility === value ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`text-xs font-medium ${profileVisibility === value ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Online Status Privacy */}
                    <div className="flex items-center justify-between py-3 border-t border-border">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Hide Online Status</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          When enabled, coven members won't see when you're online
                        </p>
                      </div>
                      <Switch
                        checked={hideOnlineStatus}
                        onCheckedChange={async (checked) => {
                          setHideOnlineStatus(checked);
                          setPresenceSaving(true);
                          try {
                            await fetch('/api/presence/settings', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ hideOnlineStatus: checked }),
                            });
                          } finally { setPresenceSaving(false); }
                        }}
                        disabled={presenceSaving}
                        aria-label="Hide online status"
                      />
                    </div>

                    {publicProfileError && <p className="text-sm text-destructive">{publicProfileError}</p>}

                    <div className="flex items-center gap-3 pt-1">
                      <Button onClick={handleSavePublicProfile} disabled={publicProfileLoading} className="bg-primary text-primary-foreground">
                        {publicProfileLoading
                          ? account.profileTab.savingButton
                          : publicProfileSaved
                            ? <span className="flex items-center gap-2"><Check className="w-4 h-4" />{account.profileTab.savedButton}</span>
                            : account.profileTab.saveButton}
                      </Button>
                      {username && (
                        <Link to={`/u/${username}`}
                          className="text-xs hover:underline" style={{ color: 'hsl(var(--primary))' }}>
                          {account.profileTab.viewProfileLink}
                        </Link>
                      )}
                    </div>
                  </div>
                </SettingsCard>

                {/* ── Badges ── */}
                <SettingsCard>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                    <h2 className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>Your Badges</h2>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Select interest badges to display on your profile. Official badges are awarded by the Spellful team.
                  </p>

                  {/* Official badges (read-only, toggle visibility) */}
                  {myBadges.filter(b => b.badgeType === 'official').length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Official</p>
                      <div className="flex flex-wrap gap-2">
                        {myBadges.filter(b => b.badgeType === 'official').map(badge => {
                          const meta = OFFICIAL_BADGE_LABELS[badge.badgeKey] ?? { label: badge.badgeKey, emoji: '🏅' };
                          return (
                            <button
                              key={badge.badgeKey}
                              disabled={badgeSaving === badge.badgeKey}
                              onClick={async () => {
                                setBadgeSaving(badge.badgeKey);
                                try {
                                  const res = await fetch('/api/profile/badges', {
                                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                                    body: JSON.stringify({ badgeKey: badge.badgeKey, action: 'toggle_visibility' }),
                                  });
                                  const d = await res.json() as { isVisible?: boolean };
                                  setMyBadges(prev => prev.map(b => b.badgeKey === badge.badgeKey ? { ...b, isVisible: d.isVisible ? 1 : 0 } : b));
                                } finally { setBadgeSaving(null); }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                              style={{
                                background: badge.isVisible ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                                border: `1px solid ${badge.isVisible ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                                color: badge.isVisible ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                opacity: badgeSaving === badge.badgeKey ? 0.6 : 1,
                              }}>
                              <span>{meta.emoji}</span>
                              <span>{meta.label}</span>
                              {!badge.isVisible && <EyeOff className="w-3 h-3 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interest badges (self-select) */}
                  <div>
                    <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Interests</p>
                    {!badgesLoaded ? (
                      <div className="flex gap-2 flex-wrap">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-8 w-28 rounded-full animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_BADGES.map(badge => {
                          const active = myBadges.some(b => b.badgeKey === badge.key);
                          const saving = badgeSaving === badge.key;
                          return (
                            <button
                              key={badge.key}
                              disabled={saving}
                              title={badge.description}
                              onClick={async () => {
                                setBadgeSaving(badge.key);
                                try {
                                  const action = active ? 'remove' : 'add';
                                  const res = await fetch('/api/profile/badges', {
                                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                                    body: JSON.stringify({ badgeKey: badge.key, action }),
                                  });
                                  if (res.ok) {
                                    if (action === 'add') {
                                      const d = await res.json() as { badgeId?: number };
                                      setMyBadges(prev => [...prev, { id: d.badgeId ?? 0, badgeKey: badge.key, badgeType: 'interest', isVisible: 1, sortOrder: 0 }]);
                                    } else {
                                      setMyBadges(prev => prev.filter(b => b.badgeKey !== badge.key));
                                    }
                                  }
                                } finally { setBadgeSaving(null); }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                              style={{
                                background: active ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                                border: `1px solid ${active ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                                color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                opacity: saving ? 0.6 : 1,
                              }}>
                              <span>{badge.emoji}</span>
                              <span>{badge.label}</span>
                              {active && <Check className="w-3 h-3 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </SettingsCard>

                {/* ── Account Type / Creator Opt-in ── */}
                <SettingsCard>
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                    <h2 className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>Account Type</h2>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Your account type shapes how you appear on Spellful and what features are available to you.
                  </p>

                  {/* Current type badge */}
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-xl"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                      {accountType === 'creator' ? <Wand2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> :
                       accountType === 'organization' ? <Users className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} /> :
                       accountType === 'official' ? <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} /> :
                       <Globe className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize" style={{ color: 'hsl(var(--foreground))' }}>
                        {accountType === 'community_member' ? 'Community Member' :
                         accountType === 'creator' ? 'Creator' :
                         accountType === 'organization' ? 'Organization' :
                         accountType === 'official' ? 'Official Spellful' :
                         accountType}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {accountType === 'community_member' && 'Standard community account'}
                        {accountType === 'creator' && 'Content creator — share your craft with the community'}
                        {accountType === 'organization' && 'Organization or group account'}
                        {accountType === 'official' && 'Official Spellful account'}
                      </p>
                    </div>
                  </div>

                  {/* Platform Role — shown when user has an elevated role; tapping opens the role dashboard */}
                  {(() => {
                    const platformRole = (user as { platformRole?: string }).platformRole;
                    if (!platformRole || platformRole === 'member') return null;
                    const roleConfig: Record<string, { label: string; desc: string; dashboardLabel: string; route: string; color: string; bg: string; icon: ReactNode }> = {
                      owner:     { label: 'Platform Owner',  desc: 'Full platform access and control',  dashboardLabel: 'Open Admin Dashboard',  route: '/admin/dashboard',  color: 'hsl(var(--primary))',  bg: 'hsl(var(--primary) / 0.12)',  icon: <Crown      className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> },
                      admin:     { label: 'Admin',           desc: 'Platform administrator',            dashboardLabel: 'Open Admin Dashboard',  route: '/admin/dashboard',  color: 'hsl(var(--accent))',   bg: 'hsl(var(--accent) / 0.12)',   icon: <ShieldCheck className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} /> },
                      moderator: { label: 'Moderator',       desc: 'Community moderator',               dashboardLabel: 'Open Moderator Queue',  route: '/admin/moderator',  color: 'hsl(var(--info))',     bg: 'hsl(var(--info) / 0.12)',     icon: <Shield     className="w-4 h-4" style={{ color: 'hsl(var(--info))' }} /> },
                      support:   { label: 'Support',         desc: 'Support team member',               dashboardLabel: 'Open Applications',     route: '/admin/applications', color: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.12)', icon: <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} /> },
                    };
                    const cfg = roleConfig[platformRole];
                    if (!cfg) return null;
                    return (
                      <Link
                        to={cfg.route}
                        className="flex items-center gap-3 mb-5 p-3 rounded-xl transition-opacity hover:opacity-80 active:opacity-60"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.color}40`, textDecoration: 'none' }}
                        aria-label={`${cfg.label} — ${cfg.dashboardLabel}`}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: cfg.bg }}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{cfg.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
                      </Link>
                    );
                  })()}

                  {/* Creator application — shown to community_member */}
                  {accountType === 'community_member' && (
                    <div className="rounded-xl p-4 space-y-3"
                      style={{ background: 'hsl(var(--card-deep))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
                      <div className="flex items-start gap-3">
                        <Wand2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Become a Creator</p>
                          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Share your magical work with the community. Apply for Creator status to get a Verified Creator badge on your profile.
                          </p>
                        </div>
                      </div>

                      {appLoading && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>}

                      {!appLoading && !myApplication && (
                        <Button size="sm" asChild className="bg-primary text-primary-foreground">
                          <Link to="/creator-application">Apply for Creator status</Link>
                        </Button>
                      )}

                      {!appLoading && myApplication && (() => {
                        const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                          pending_review:  { label: 'Pending Review',           color: 'hsl(var(--warning))',    bg: 'hsl(var(--warning) / 0.12)' },
                          info_requested:  { label: 'More Information Needed',  color: 'hsl(var(--info))',       bg: 'hsl(var(--info) / 0.12)' },
                          approved:        { label: 'Approved',                 color: 'hsl(var(--success))',    bg: 'hsl(var(--success) / 0.12)' },
                          rejected:        { label: 'Not Approved',             color: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive) / 0.1)' },
                          withdrawn:       { label: 'Withdrawn',                color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))' },
                        };
                        const st = statusMap[myApplication.status] ?? statusMap.withdrawn;
                        const canWithdraw = ['pending_review', 'info_requested'].includes(myApplication.status);
                        const canReapply = ['rejected', 'withdrawn'].includes(myApplication.status);
                        return (
                          <div className="space-y-3">
                            <div className="rounded-lg p-3 space-y-2"
                              style={{ background: st.bg, border: `1px solid ${st.color}30` }}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</span>
                                <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  #{myApplication.referenceId.slice(0, 8)}
                                </span>
                                {myApplication.requestedAccountType === 'organization' && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))' }}>
                                    Organization
                                  </span>
                                )}
                              </div>
                              {myApplication.reviewReason && (
                                <p className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>{myApplication.reviewReason}</p>
                              )}
                              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Submitted {new Date(myApplication.submittedAt).toLocaleDateString()}
                              </p>
                            </div>

                            {withdrawMsg && (
                              <p className="text-xs" style={{ color: 'hsl(var(--success))' }}>{withdrawMsg}</p>
                            )}

                            {canWithdraw && (
                              <Button size="sm" variant="outline"
                                disabled={withdrawing}
                                className="border-border text-xs"
                                onClick={async () => {
                                  setWithdrawing(true);
                                  try {
                                    const res = await fetch(`/api/creator-applications/${myApplication.id}/withdraw`, {
                                      method: 'POST', credentials: 'include',
                                    });
                                    if (res.ok) {
                                      setWithdrawMsg('Application withdrawn.');
                                      loadMyApplication();
                                    }
                                  } finally {
                                    setWithdrawing(false);
                                  }
                                }}>
                                {withdrawing ? 'Withdrawing…' : 'Withdraw application'}
                              </Button>
                            )}

                            {canReapply && (
                              <Button size="sm" asChild className="bg-primary text-primary-foreground">
                                <Link to="/creator-application">Submit a new application</Link>
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Non-self-service types — show info only */}
                  {(accountType === 'organization' || accountType === 'official') && (
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Your account type is managed by the Spellful team. Contact support to request changes.
                    </p>
                  )}
                </SettingsCard>
              </TabsContent>

              {/* ── Security Tab ── */}
              <TabsContent value="security" className="space-y-4">

                {/* Change Password */}
                <SettingsCard>
                  <CardHeading icon={Key}>{account.securityTab.passwordSectionTitle}</CardHeading>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-pw" className="text-sm text-muted-foreground">{account.securityTab.currentPasswordLabel}</Label>
                      <div className="relative">
                        <Input id="current-pw" type={showCurrent ? 'text' : 'password'} value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password"
                          className="bg-muted border-border pr-10" />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showCurrent ? 'Hide password' : 'Show password'}>
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pw" className="text-sm text-muted-foreground">{account.securityTab.newPasswordLabel}</Label>
                      <div className="relative">
                        <Input id="new-pw" type={showNew ? 'text' : 'password'} value={newPassword}
                          onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password"
                          className="bg-muted border-border pr-10" minLength={8} />
                        <button type="button" onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showNew ? 'Hide password' : 'Show password'}>
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pw" className="text-sm text-muted-foreground">{account.securityTab.confirmPasswordLabel}</Label>
                      <Input id="confirm-pw" type="password" value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                        className="bg-muted border-border" />
                    </div>
                    {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                    <Button type="submit" disabled={passwordLoading} className="bg-primary text-primary-foreground">
                      {passwordLoading ? 'Saving…' : passwordSaved
                        ? <span className="flex items-center gap-2"><Check className="w-4 h-4" />Password updated</span>
                        : 'Update Password'}
                    </Button>
                  </form>
                </SettingsCard>

                {/* Two-Factor Auth */}
                <SettingsCard>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {twoFaEnabled
                        ? <ShieldCheck className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--success))' }} />
                        : <ShieldOff className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />}
                      <div>
                        <h2 className="font-serif text-base leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                          {account.securityTab.twoFaSectionTitle}
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: twoFaEnabled ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>
                          {twoFaEnabled ? 'Enabled — your account is protected' : 'Not enabled'}
                        </p>
                      </div>
                    </div>
                    {twoFaEnabled ? (
                      <Button variant="outline" size="sm" onClick={handleDisable2Fa} disabled={twoFaLoading}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs">
                        {twoFaLoading ? 'Disabling…' : 'Disable'}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setShowTwoFaSetup(true)}
                        className="bg-primary text-primary-foreground text-xs">
                        Enable 2FA
                      </Button>
                    )}
                  </div>
                </SettingsCard>

                {/* Connected Accounts */}
                <SettingsCard>
                  <CardHeading icon={Globe}>Connected Accounts</CardHeading>
                  <div className="space-y-2">
                    {([
                      { provider: 'google' as const, label: 'Google', Icon: GoogleIcon },
                      { provider: 'apple' as const, label: 'Apple', Icon: AppleIcon },
                    ]).map(({ provider, label, Icon }) => (
                      <div key={provider} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                        <div className="flex items-center gap-3">
                          <Icon />
                          <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{label}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleSocialConnect(provider)}
                          className="text-xs">Connect</Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Connect a social account to sign in without a password. Requires Google/Apple credentials to be configured.
                  </p>
                </SettingsCard>

                {/* Active Sessions */}
                <SettingsCard>
                  <div className="flex items-center justify-between mb-4">
                    <CardHeading icon={Monitor}>{account.securityTab.sessionsSectionTitle}</CardHeading>
                    <div className="flex gap-2 -mt-4">
                      {!sessionsLoaded && (
                        <Button size="sm" variant="outline" onClick={loadSessions} className="text-xs">Load</Button>
                      )}
                      {sessionsLoaded && sessions.filter(s => !s.isCurrent).length > 0 && (
                        <Button size="sm" variant="outline" onClick={signOutAllSessions} disabled={signOutAllLoading}
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                          {signOutAllLoading ? 'Signing out…' : 'Sign out all other devices'}
                        </Button>
                      )}
                    </div>
                  </div>
                  {sessionsLoaded && sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active sessions found.</p>
                  )}
                  <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                    {sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm text-foreground flex items-center gap-2">
                              {parseDevice(s.userAgent)}
                              {s.isCurrent && (
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))' }}>
                                  Current
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              {s.ipAddress ? ` · ${s.ipAddress}` : ''}
                            </p>
                          </div>
                        </div>
                        {!s.isCurrent && (
                          <button onClick={() => revokeSession(s.id)}
                            className="text-destructive hover:text-destructive/80 transition-colors p-1 rounded"
                            aria-label="Revoke session">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </SettingsCard>

                {/* Login Activity */}
                <SettingsCard>
                  <CardHeading icon={Activity}>{account.securityTab.activitySectionTitle}</CardHeading>
                  {!sessionsLoaded && (
                    <p className="text-sm text-muted-foreground">{account.securityTab.noSessionsLoadedText}</p>
                  )}
                  {sessionsLoaded && activity.length === 0 && (
                    <p className="text-sm text-muted-foreground">{account.securityTab.noActivityText}</p>
                  )}
                  <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                    {activity.map(a => (
                      <div key={a.id} className="flex items-center gap-3 py-3">
                        <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm text-foreground">{a.device || parseDevice(null)}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.createdAt ? new Date(a.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                            {a.ipAddress ? ` · ${a.ipAddress}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SettingsCard>
              </TabsContent>

              {/* ── Astrology Tab ── */}
              <TabsContent value="astro" className="space-y-4">

                {/* Cosmic summary strip — only when values are saved */}
                {(sunSign || moonSign || risingSign) && (
                  <div className="rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
                    {[
                      { label: 'Sun', sign: sunSign, glyph: '☀️' },
                      { label: 'Moon', sign: moonSign, glyph: '🌙' },
                      { label: 'Rising', sign: risingSign, glyph: '⬆️' },
                    ].filter(item => item.sign).map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-base leading-none">{item.glyph}</span>
                        <div>
                          <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.label}</p>
                          <p className="text-sm font-medium leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                            {ZODIAC_GLYPHS[item.sign] ?? ''} {item.sign}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <SettingsCard>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                    <h2 className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>Your Cosmic Blueprint</h2>
                  </div>
                  <p className="text-xs mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>Your story is written in the stars.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-sm text-muted-foreground">{account.astroTab.birthDateLabel}</Label>
                      <Input id="birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                        className="bg-muted border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthTime" className="text-sm text-muted-foreground">{account.astroTab.birthTimeLabel}</Label>
                      <Input id="birthTime" type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)}
                        className="bg-muted border-border" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="birthLocation" className="text-sm text-muted-foreground">{account.astroTab.birthLocationLabel}</Label>
                      <Input id="birthLocation" type="text" value={birthLocation} onChange={e => setBirthLocation(e.target.value)}
                        placeholder="City, Country" className="bg-muted border-border" />
                    </div>

                    {([
                      { id: 'sunSign', label: account.astroTab.sunSignLabel, value: sunSign, set: setSunSign },
                      { id: 'moonSign', label: account.astroTab.moonSignLabel, value: moonSign, set: setMoonSign },
                      { id: 'risingSign', label: account.astroTab.risingSignLabel, value: risingSign, set: setRisingSign },
                    ] as { id: string; label: string; value: string; set: (v: string) => void }[]).map(({ id, label, value, set }) => (
                      <div key={id} className="space-y-2">
                        <Label htmlFor={id} className="text-sm text-muted-foreground">{label}</Label>
                        <select
                          id={id}
                          value={value}
                          onChange={e => set(e.target.value)}
                          className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                          <option value="">Select…</option>
                          {account.ZODIAC_SIGNS.map(sign => <option key={sign} value={sign}>{sign}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Birth details are private and never shown on your public profile.
                  </p>

                  <div className="mt-4">
                    <Button onClick={handleSaveProfile} className="bg-primary text-primary-foreground">
                      {profileSaved
                        ? <span className="flex items-center gap-2"><Check className="w-4 h-4" />{account.astroTab.savedButton}</span>
                        : account.astroTab.saveButton}
                    </Button>
                  </div>
                </SettingsCard>
              </TabsContent>

              {/* ── Privacy Tab ── */}
              <TabsContent value="privacy" className="space-y-4">

                {/* Message Permissions */}
                <SettingsCard>
                  <CardHeading icon={MessageSquareIcon}>Message Permissions</CardHeading>
                  <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Control who can send you direct messages.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    {([
                      { value: 'everyone', label: 'Everyone', desc: 'Non-Coven messages go to requests' },
                      { value: 'coven', label: 'My Coven', desc: 'Only Coven members can message you' },
                      { value: 'nobody', label: 'Nobody', desc: 'No new messages accepted' },
                    ] as const).map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMessagePermission(value)}
                        className="p-3 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                        style={messagePermission === value
                          ? { background: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary))' }
                          : { borderColor: 'hsl(var(--border))' }}
                        aria-pressed={messagePermission === value}
                      >
                        <p className="text-sm font-medium" style={{ color: messagePermission === value ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</p>
                      </button>
                    ))}
                  </div>

                  <CardHeading icon={Users} className="mt-4">Coven Invitation Settings</CardHeading>
                  <p className="text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Control who can send you Coven invitations.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {([
                      { value: 'everyone', label: 'Everyone', desc: 'Any member can invite you' },
                      { value: 'nobody', label: 'Nobody', desc: 'Pause all Coven invitations' },
                    ] as const).map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setInvitePermission(value)}
                        className="p-3 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                        style={invitePermission === value
                          ? { background: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary))' }
                          : { borderColor: 'hsl(var(--border))' }}
                        aria-pressed={invitePermission === value}
                      >
                        <p className="text-sm font-medium" style={{ color: invitePermission === value ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</p>
                      </button>
                    ))}
                  </div>

                  <Button onClick={handleSavePermissions} disabled={permSaving} className="bg-primary text-primary-foreground text-sm">
                    {permSaving ? 'Saving…' : permSaved ? <span className="flex items-center gap-2"><Check className="w-4 h-4" />Saved</span> : 'Save Permissions'}
                  </Button>
                </SettingsCard>

                {/* Notification Preferences */}
                <SettingsCard>
                  <CardHeading icon={Bell}>Notification Preferences</CardHeading>
                  <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Choose which notifications you receive.
                  </p>
                  <div className="space-y-3 mb-4">
                    {([
                      { key: 'covenInvitations', label: 'Coven invitations', desc: 'When someone invites you to their Coven' },
                      { key: 'covenAccepted', label: 'Coven accepted', desc: 'When someone accepts your Coven invitation' },
                      { key: 'communityReplies', label: 'Community replies', desc: 'When someone replies to your posts' },
                      { key: 'communityLikes', label: 'Community likes', desc: 'When someone likes your posts or replies' },
                      { key: 'messages', label: 'Direct messages', desc: 'New message notifications' },
                      { key: 'systemAnnouncements', label: 'Announcements', desc: 'Platform updates and announcements' },
                    ] as const).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{label}</p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</p>
                        </div>
                        <Switch
                          checked={notifPrefs[key] ?? true}
                          onCheckedChange={(checked) => setNotifPrefs((prev) => ({ ...prev, [key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleSaveNotifPrefs} disabled={notifSaving} className="bg-primary text-primary-foreground text-sm">
                    {notifSaving ? 'Saving…' : notifSaved ? <span className="flex items-center gap-2"><Check className="w-4 h-4" />Saved</span> : 'Save Preferences'}
                  </Button>
                </SettingsCard>

                {/* Data & Privacy */}
                <SettingsCard>
                  <CardHeading icon={Download}>Your Data</CardHeading>
                  <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Download a copy of your Spellful data including your profile, posts, and Coven connections.
                  </p>
                  <Button onClick={handleExportData} disabled={exportLoading} variant="outline" className="text-sm">
                    {exportLoading ? 'Preparing export…' : 'Download my data'}
                  </Button>
                </SettingsCard>

                {/* Account Deletion */}
                <SettingsCard>
                  <CardHeading icon={AlertTriangle}>Delete Account</CardHeading>
                  {deletionScheduledAt ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl text-sm" style={{ background: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))' }}>
                        Your account is scheduled for deletion on <strong>{new Date(deletionScheduledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>. You can cancel before then.
                      </div>
                      <Button onClick={handleCancelDeletion} disabled={cancelDeletionLoading} variant="outline" className="text-sm">
                        {cancelDeletionLoading ? 'Cancelling…' : 'Cancel deletion'}
                      </Button>
                    </div>
                  ) : deleteConfirmOpen ? (
                    <div className="space-y-3">
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Your account will be permanently deleted after a 30-day grace period. Enter your password to confirm.
                      </p>
                      <Input
                        type="password"
                        placeholder="Your current password"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                        className="bg-muted border-border"
                      />
                      {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
                      <div className="flex gap-2">
                        <Button onClick={handleRequestDeletion} disabled={deleteLoading}
                          className="text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {deleteLoading ? 'Confirming…' : 'Confirm deletion'}
                        </Button>
                        <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setDeletePassword(''); setDeleteError(''); }} className="text-sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Permanently delete your account and all associated data. This cannot be undone after the 30-day grace period.
                      </p>
                      <Button onClick={() => setDeleteConfirmOpen(true)} variant="outline"
                        className="text-sm text-destructive border-destructive/30 hover:bg-destructive/10">
                        Request account deletion
                      </Button>
                    </div>
                  )}
                </SettingsCard>

                {/* Restricted Members */}
                <SettingsCard>
                  <CardHeading icon={ShieldOff}>Restricted Members</CardHeading>
                  <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Members you've restricted cannot message you, view your profile, or interact with your content. They are not notified.
                  </p>

                  {/* Load on tab focus */}
                  {blockedMembers.length === 0 && !blockedLoading && (
                    <button
                      className="text-xs underline mb-3"
                      style={{ color: 'hsl(var(--primary))' }}
                      onClick={async () => {
                        setBlockedLoading(true);
                        try {
                          const r = await fetch('/api/blocks', { credentials: 'include' });
                          if (r.ok) {
                            const data = await r.json() as { blocks: typeof blockedMembers };
                            setBlockedMembers(data.blocks);
                          }
                        } finally { setBlockedLoading(false); }
                      }}
                    >
                      Load restricted members
                    </button>
                  )}

                  {blockedLoading && (
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
                  )}

                  {!blockedLoading && blockedMembers.length === 0 && (
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      You haven't restricted any members.
                    </p>
                  )}

                  <div className="space-y-3">
                    {blockedMembers.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'hsl(var(--card))' }}>
                          {b.image ? (
                            <img src={b.image} alt={b.name ?? ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {(b.name ?? b.username ?? '?')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                            {b.name ?? b.username ?? 'Unknown member'}
                          </p>
                          {b.username && (
                            <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>@{b.username}</p>
                          )}
                          {b.createdAt && (
                            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              Restricted {new Date(b.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {/* Unblock */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={unblockingId === b.blockedId}
                          className="text-xs h-7 shrink-0"
                          onClick={async () => {
                            setUnblockingId(b.blockedId);
                            try {
                              await fetch(`/api/blocks/${b.blockedId}`, { method: 'DELETE', credentials: 'include' });
                              setBlockedMembers((prev) => prev.filter((x) => x.id !== b.id));
                            } finally { setUnblockingId(null); }
                          }}
                        >
                          {unblockingId === b.blockedId ? 'Removing…' : 'Remove restriction'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </SettingsCard>
              </TabsContent>
              {/* ── Accessibility Tab ── */}
              <TabsContent value="accessibility" className="space-y-4">
                <SettingsCard>
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                    <h2 className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>Motion & Animation</h2>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Reduce or disable animations site-wide.
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Reduce motion</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Minimizes animations and transitions</p>
                    </div>
                    <Switch
                      checked={reducedMotion}
                      onCheckedChange={(v) => { setReducedMotion(v); applyAccessibility(v, fontSize, highContrast); }}
                    />
                  </div>
                </SettingsCard>

                <SettingsCard>
                  <div className="flex items-center gap-2 mb-1">
                    <Type className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                    <h2 className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>Text Size</h2>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Adjust the base font size across the site.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['normal', 'large', 'larger'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setFontSize(value); applyAccessibility(reducedMotion, value, highContrast); }}
                        className="p-3 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary capitalize text-sm"
                        style={fontSize === value
                          ? { background: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))' }
                          : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        aria-pressed={fontSize === value}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </SettingsCard>

                <SettingsCard>
                  <div className="flex items-center gap-2 mb-1">
                    <Contrast className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                    <h2 className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>Contrast</h2>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Increase contrast for better readability.
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>High contrast mode</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Increases text and border contrast</p>
                    </div>
                    <Switch
                      checked={highContrast}
                      onCheckedChange={(v) => { setHighContrast(v); applyAccessibility(reducedMotion, fontSize, v); }}
                    />
                  </div>
                </SettingsCard>
              </TabsContent>

            </Tabs>
          </motion.div>
        </div>
      </main>
    </>
  );
}
