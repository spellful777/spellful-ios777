/**
 * /plus — Spellful Plus
 * Premium redesign: deep midnight purple, antique gold, lavender.
 * Sections: Hero → Features → Free vs Plus → Pricing → FAQ → Closing invitation.
 */
import { useState, useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, ChevronUp, Sparkles, RotateCcw, Lock, ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/auth-client';
import { plus } from 'virtual:content';
import { ContentListContext } from '@airo/content';
import { Capacitor } from '@capacitor/core';
import { fetchPlusProduct, purchasePlus, restorePurchases } from '@/lib/storekit';

// ── Types ──────────────────────────────────────────────────────────────────────

interface EntitlementState {
  isPlus: boolean;
  status: string | null;
  expiresAt: string | null;
}

// ── Celestial divider ──────────────────────────────────────────────────────────

function CelestialDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-2" aria-hidden="true">
      <div className="h-px flex-1 max-w-16" style={{ background: 'hsl(var(--primary) / 0.25)' }} />
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1l1.2 3.6L13 5.5l-2.8 2.7.7 3.8L8 10.2 5.1 12l.7-3.8L3 5.5l3.8-.9L8 1z"
          fill="hsl(var(--primary))" opacity="0.7" />
      </svg>
      <div className="h-px flex-1 max-w-16" style={{ background: 'hsl(var(--primary) / 0.25)' }} />
    </div>
  );
}

// ── Supporter badge icon ───────────────────────────────────────────────────────

function SupporterBadgeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5S12.83 18 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c.83 0 1.5-.67 1.5-1.5S12.83 3 12 3z"
        fill="hsl(var(--primary))" opacity="0.9" />
      <path d="M18 2l.75 2.25L21 5l-2.25.75L18 8l-.75-2.25L15 5l2.25-.75L18 2z"
        fill="hsl(var(--primary))" />
      <path d="M21 10l.4 1.2 1.2.4-1.2.4L21 13l-.4-1.2-1.2-.4 1.2-.4L21 10z"
        fill="hsl(var(--accent))" />
    </svg>
  );
}

// ── Feature tab data ───────────────────────────────────────────────────────────

const FEATURE_TABS = [
  {
    id: 'practice',
    icon: '✦',
    label: 'Practice Studio',
    headline: 'Your practice, your way.',
    body: 'A customizable personal practice home with rearrangeable widgets — your tarot, moon phase, journal, and routines arranged exactly how you want them.',
    detail: 'Drag and drop widgets to build a dashboard that reflects your unique path. Morning ritual? Evening reflection? Your Studio adapts.',
  },
  {
    id: 'themes',
    icon: '🎨',
    label: 'Celestial Themes',
    headline: 'A sanctuary that feels like yours.',
    body: 'Additional celestial color palettes and alternate dashboard layouts to make Spellful feel uniquely yours.',
    detail: 'Choose from deep midnight, twilight lavender, forest dusk, and more — each crafted to honor the aesthetic of your practice.',
  },
  {
    id: 'routines',
    icon: '📅',
    label: 'Routine Builder Pro',
    headline: 'Unlimited rituals, beautifully organized.',
    body: 'Unlimited custom practice routines, flexible reminder schedules, and saved templates. Free accounts include one routine.',
    detail: 'Build morning rituals, moon cycle practices, seasonal sabbat preparations, and more — with reminders that honor your schedule.',
  },
  {
    id: 'badge',
    icon: '✦',
    label: 'Supporter Badge',
    headline: 'Wear your support with grace.',
    body: 'An optional, tasteful celestial emblem you can choose to display on your profile and posts.',
    detail: 'Showing your support for free spiritual education — always opt-in, never required, never intrusive.',
  },
] as const;

// ── Profile Studio Preview ─────────────────────────────────────────────────────

const PREVIEW_BANNERS: ReadonlyArray<{ id: string; label: string; free: boolean; gradient: string; image?: string; upload?: true }> = [
  { id: 'upload',   label: 'Upload your own', free: false, gradient: '', upload: true },
  { id: 'custom',   label: 'Custom Photo',    free: false, gradient: '', image: '/airo-assets/images/pages/home/community-banner' },
  { id: 'midnight', label: 'Midnight',        free: false, gradient: 'linear-gradient(135deg, hsl(248 60% 12%) 0%, hsl(270 55% 18%) 50%, hsl(248 60% 12%) 100%)' },
  { id: 'aurora',   label: 'Aurora',          free: false, gradient: 'linear-gradient(135deg, hsl(180 60% 12%) 0%, hsl(259 55% 20%) 50%, hsl(320 50% 18%) 100%)' },
  { id: 'ember',    label: 'Ember',           free: false, gradient: 'linear-gradient(135deg, hsl(20 60% 14%) 0%, hsl(350 55% 20%) 50%, hsl(270 50% 16%) 100%)' },
  { id: 'forest',   label: 'Forest',          free: false, gradient: 'linear-gradient(135deg, hsl(140 40% 10%) 0%, hsl(180 45% 14%) 50%, hsl(259 40% 14%) 100%)' },
  { id: 'free',     label: 'Default',         free: true,  gradient: 'linear-gradient(135deg, hsl(248 41% 10%) 0%, hsl(251 39% 14%) 100%)' },
];

const PREVIEW_ACCENTS = [
  { id: 'gold',     varName: '--preview-accent-gold',     free: false },
  { id: 'lavender', varName: '--preview-accent-lavender', free: false },
  { id: 'rose',     varName: '--preview-accent-rose',     free: false },
  { id: 'sage',     varName: '--preview-accent-sage',     free: false },
  { id: 'free',     varName: '--preview-accent-free',     free: true  },
] as const;

const PREVIEW_FRAMES = [
  { id: 'moon',  label: '🌙', free: false },
  { id: 'stars', label: '✦',  free: false },
  { id: 'vines', label: '🌿', free: false },
  { id: 'none',  label: '○',  free: true  },
] as const;

function ProfileStudioPreview() {
  const [banner, setBanner] = useState<string>('free');
  const [accentId, setAccentId] = useState<string>('free');
  const [frame, setFrame] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<'banner' | 'accent' | 'frame'>('banner');

  const currentBanner = PREVIEW_BANNERS.find((b) => b.id === banner) ?? PREVIEW_BANNERS[PREVIEW_BANNERS.length - 1];
  const currentAccent = PREVIEW_ACCENTS.find((a) => a.id === accentId) ?? PREVIEW_ACCENTS[4];
  const currentFrame  = PREVIEW_FRAMES.find((f) => f.id === frame)   ?? PREVIEW_FRAMES[3];

  const accentCss = `hsl(var(${currentAccent.varName}))`;
  const accentAlpha = (opacity: number) => `hsl(var(${currentAccent.varName}) / ${opacity})`;

  const isPlus = !currentBanner.free || !currentAccent.free || !currentFrame.free;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--primary) / 0.25)', background: 'hsl(var(--card))' }}>
      {/* Mock profile card */}
      <div className="relative">
        {/* Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={banner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-28 w-full relative overflow-hidden flex items-center justify-center"
            style={currentBanner.image ? undefined : { background: currentBanner.upload ? 'hsl(var(--muted))' : currentBanner.gradient }}
          >
            {currentBanner.image && (
              <img
                src={currentBanner.image}
                alt="Custom profile banner"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {currentBanner.upload && (
              <div className="flex flex-col items-center gap-1.5 pointer-events-none"
                style={{ border: '1.5px dashed hsl(var(--border))', borderRadius: '8px', padding: '10px 18px' }}>
                <Upload className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Your photo here</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Avatar */}
        <div className="absolute left-5 -bottom-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={frame}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: currentFrame.free
                  ? 'hsl(var(--card))'
                  : `conic-gradient(${accentCss} 0deg, hsl(var(--card)) 180deg, ${accentCss} 360deg)`,
                padding: currentFrame.free ? '2px' : '3px',
              }}
            >
              <div className="w-full h-full rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'hsl(var(--muted))' }}>
                🧙
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Plus badge indicator */}
        <AnimatePresence>
          {isPlus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{ background: 'hsl(var(--primary) / 0.9)', color: 'hsl(var(--primary-foreground))' }}
            >
              <SupporterBadgeIcon size={10} />
              Plus
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile info */}
      <div className="px-5 pt-10 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            @moonwitch
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            she/her
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Lunar witch · Crystal healer · Tarot reader ✨
        </p>

        {/* Accent-colored tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {['Moon Magic', 'Crystals', 'Tarot'].map((tag) => (
            <motion.span
              key={tag}
              animate={{ borderColor: accentAlpha(0.4), color: accentCss, background: accentAlpha(0.12) }}
              transition={{ duration: 0.3 }}
              className="text-xs px-2.5 py-0.5 rounded-full border"
            >
              {tag}
            </motion.span>
          ))}
        </div>

        {/* Action buttons styled with accent */}
        <div className="flex gap-2">
          <motion.button
            animate={{ background: accentCss, color: 'hsl(var(--foreground))' }}
            transition={{ duration: 0.3 }}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium"
          >
            Add to Coven
          </motion.button>
          <button className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            Message
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t px-5 py-4 space-y-4" style={{ borderColor: 'hsl(var(--border))' }}>
        {/* Tab selector */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
          {(['banner', 'accent', 'frame'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{
                background: activeTab === t ? 'hsl(var(--card))' : 'transparent',
                color: activeTab === t ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {t === 'banner' ? 'Banner' : t === 'accent' ? 'Accent' : 'Frame'}
            </button>
          ))}
        </div>

        {/* Banner picker */}
        {activeTab === 'banner' && (
          <div className="flex gap-2 flex-wrap">
            {PREVIEW_BANNERS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBanner(b.id)}
                title={b.label}
                className="relative w-10 h-7 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden flex items-center justify-center"
                style={{
                  background: b.image ? undefined : b.upload ? 'hsl(var(--muted))' : b.gradient,
                  border: b.upload ? '1.5px dashed hsl(var(--border))' : undefined,
                  outline: banner === b.id ? `2px solid ${accentCss}` : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              >
                {/* Upload swatch */}
                {b.upload && (
                  <Upload className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                )}
                {/* Photo banner swatch — show actual image thumbnail */}
                {b.image && (
                  <>
                    <img src={b.image} alt={b.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <span className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'hsl(var(--background) / 0.35)' }}>
                      <ImageIcon className="w-3 h-3" style={{ color: 'hsl(var(--foreground))' }} />
                    </span>
                  </>
                )}
                {!b.free && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: 'hsl(var(--primary))' }}>
                    <Lock className="w-2 h-2" style={{ color: 'hsl(var(--primary-foreground))' }} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Accent picker */}
        {activeTab === 'accent' && (
          <div className="flex gap-2 flex-wrap">
            {PREVIEW_ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccentId(a.id)}
                title={a.id}
                className="relative w-8 h-8 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  background: `hsl(var(${a.varName}))`,
                  outline: accentId === a.id ? `2px solid hsl(var(${a.varName}))` : '2px solid transparent',
                  outlineOffset: '3px',
                }}
              >
                {!a.free && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: 'hsl(var(--primary))' }}>
                    <Lock className="w-2 h-2" style={{ color: 'hsl(var(--primary-foreground))' }} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Frame picker */}
        {activeTab === 'frame' && (
          <div className="flex gap-3 flex-wrap">
            {PREVIEW_FRAMES.map((f) => {
              const FRAME_PATHS: Record<string, string> = {
                moon:      'M8,4 Q12,0 16,4 Q20,8 16,12 Q12,16 8,12 Q4,8 8,4 M4,0 L4,2 M20,0 L20,2 M0,8 L2,8 M22,8 L24,8',
                stars:     'M12,2 L13.5,8 L19,8 L14.5,11.5 L16,17 L12,13.5 L8,17 L9.5,11.5 L5,8 L10.5,8 Z',
                vines:     'M12,2 Q14,6 12,10 Q10,6 12,2 M6,6 Q10,8 10,12 Q6,10 6,6 M18,6 Q14,8 14,12 Q18,10 18,6',
              };
              const framePath = FRAME_PATHS[f.id];
              return (
                <button
                  key={f.id}
                  onClick={() => setFrame(f.id)}
                  className="relative flex flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 transition-all"
                  style={{
                    background: frame === f.id ? `${accentCss}18` : 'transparent',
                    outline: frame === f.id ? `2px solid ${accentCss}` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                >
                  {/* Mini avatar with frame */}
                  <div className="relative w-10 h-10">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-base"
                      style={{
                        background: f.free
                          ? 'hsl(var(--card))'
                          : `conic-gradient(${accentCss} 0deg, hsl(var(--card)) 180deg, ${accentCss} 360deg)`,
                        padding: f.free ? '2px' : '2.5px',
                      }}
                    >
                      <div className="w-full h-full rounded-full flex items-center justify-center"
                        style={{ background: 'hsl(var(--muted))', fontSize: '14px' }}>
                        🧙
                      </div>
                    </div>
                    {framePath && (
                      <svg
                        width="48" height="48"
                        viewBox="0 0 24 24"
                        className="absolute pointer-events-none"
                        style={{ top: -4, left: -4, zIndex: 2 }}
                        aria-hidden="true"
                      >
                        <path d={framePath} fill="none" stroke={`${accentCss}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {!f.free && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center z-10"
                        style={{ background: 'hsl(var(--primary))' }}>
                        <Lock className="w-2 h-2" style={{ color: 'hsl(var(--primary-foreground))' }} />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: frame === f.id ? accentCss : 'hsl(var(--muted-foreground))' }}>
                    {f.id === 'none' ? 'None' : f.id.charAt(0).toUpperCase() + f.id.slice(1)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Lock className="w-3 h-3 inline mr-1 opacity-60" />
          Locked options unlock with Spellful Plus
        </p>
      </div>
    </div>
  );
}

// ── Purchase CTA block ─────────────────────────────────────────────────────────

function PurchaseCta({
  isSubscribed, isNative, purchasing, restoring, purchaseError,
  displayPrice, onPurchase, onRestore,
}: {
  isSubscribed: boolean;
  isNative: boolean;
  purchasing: boolean;
  restoring: boolean;
  purchaseError: string | null;
  displayPrice: string;
  onPurchase: () => void;
  onRestore: () => void;
}) {
  if (isSubscribed) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border"
          style={{ borderColor: 'hsl(var(--primary) / 0.4)', background: 'hsl(var(--primary) / 0.08)' }}>
          <SupporterBadgeIcon size={16} />
          <span className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>
            You're a Plus member
          </span>
        </div>
        <Link to="/account">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Manage subscription
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {isNative ? (
        <Button
          onClick={onPurchase}
          disabled={purchasing}
          className="px-10 py-3 text-base font-semibold rounded-full"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          aria-label="Subscribe to Spellful Plus"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {purchasing ? 'Processing…' : plus.pricing.primaryCta}
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <Button
            disabled
            className="px-10 py-3 text-base font-semibold rounded-full opacity-60 cursor-not-allowed"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            aria-label="Spellful Plus available in the iOS app"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {plus.pricing.primaryCta}
          </Button>
          <span className="text-xs text-muted-foreground">Available in the iOS app</span>
        </div>
      )}

      {purchaseError && (
        <p className="text-xs text-destructive text-center max-w-xs">{purchaseError}</p>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
            {plus.pricing.secondaryCta}
          </Button>
        </Link>
        {isNative && (
          <Button variant="ghost" size="sm" onClick={onRestore} disabled={restoring}
            className="text-muted-foreground hover:text-foreground text-sm">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            {restoring ? 'Restoring…' : 'Restore Purchases'}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-1">{plus.pricing.billingNote}</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PlusPage() {
  const { session } = useSession();
  const [entitlement, setEntitlement] = useState<EntitlementState | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [displayPrice, setDisplayPrice] = useState<string>(plus.pricing.price);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<string>('practice');
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/plus/entitlement', { credentials: 'include' })
      .then((r) => r.json() as Promise<EntitlementState>)
      .then(setEntitlement)
      .catch(() => undefined);
  }, [session?.user]);

  useEffect(() => {
    if (!isNative) return;
    fetchPlusProduct().then((product) => {
      if (product?.displayPrice) setDisplayPrice(product.displayPrice);
    });
  }, [isNative]);

  const isSubscribed = entitlement?.isPlus === true;

  async function handlePurchase() {
    if (!session?.user?.id) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const result = await purchasePlus(session.user.id);
      if (result.ok && result.isPlus) {
        setEntitlement({ isPlus: true, status: result.status, expiresAt: result.expiresAt });
      } else if (result.error && result.error !== 'USER_CANCELLED') {
        setPurchaseError('Purchase could not be completed. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    setPurchaseError(null);
    try {
      const result = await restorePurchases();
      if (result.ok && result.isPlus) {
        setEntitlement({ isPlus: true, status: result.status, expiresAt: result.expiresAt });
      } else if (result.error && result.error !== 'NO_TRANSACTIONS') {
        setPurchaseError('Could not restore purchases. Please try again.');
      }
    } finally {
      setRestoring(false);
    }
  }

  const activeTab = FEATURE_TABS.find((t) => t.id === activeFeature) ?? FEATURE_TABS[0];

  return (
    <>
      <Helmet>
        <title>{plus.meta.title}</title>
        <meta name="description" content={plus.meta.description} />
        <meta property="og:title" content={plus.meta.title} />
        <meta property="og:description" content={plus.meta.description} />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

        {/* ── Section 1: Premium Hero ── */}
        <section className="relative py-24 px-4 text-center overflow-hidden">
          {/* Radial cosmic glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--cosmic-bg-center) / 0.55) 0%, transparent 70%)' }} />
          {/* Subtle star field */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
            style={{ backgroundImage: 'radial-gradient(1px 1px at 20% 30%, hsl(var(--primary) / 0.4) 0%, transparent 100%), radial-gradient(1px 1px at 80% 20%, hsl(var(--accent) / 0.3) 0%, transparent 100%), radial-gradient(1px 1px at 60% 70%, hsl(var(--primary) / 0.25) 0%, transparent 100%)' }} />

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' as const }}
            className="relative max-w-2xl mx-auto"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              <SupporterBadgeIcon size={14} />
              <span className="text-xs font-medium tracking-wide" style={{ color: 'hsl(var(--primary))' }}>
                {plus.pricing.name}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Make Your Magic<br />
              <span style={{ color: 'hsl(var(--primary))' }}>Your Own.</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Create a sanctuary that reflects your unique path with celestial themes, personalized rituals, and magical tools designed around your practice.
            </p>

            <PurchaseCta
              isSubscribed={isSubscribed}
              isNative={isNative}
              purchasing={purchasing}
              restoring={restoring}
              purchaseError={purchaseError}
              displayPrice={displayPrice}
              onPurchase={handlePurchase}
              onRestore={handleRestore}
            />
          </motion.div>
        </section>

        {/* ── Section 2: Discover Your Plus Features ── */}
        <section className="py-20 px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: 'easeOut' as const }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Discover Your Plus Features
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Every feature is designed to deepen your practice — not gate it.
            </p>
          </motion.div>

          {/* Feature tab selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label="Plus features">
            {FEATURE_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeFeature === tab.id}
                aria-controls={`feature-panel-${tab.id}`}
                onClick={() => setActiveFeature(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: activeFeature === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                  color: activeFeature === tab.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                  border: `1px solid ${activeFeature === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                }}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feature panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              id={`feature-panel-${activeFeature}`}
              role="tabpanel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="rounded-2xl p-8 text-center"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.2)' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl"
                style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                {activeTab.icon}
              </div>
              <h3 className="text-xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                {activeTab.headline}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-md mx-auto">
                {activeTab.body}
              </p>
              <p className="text-xs leading-relaxed max-w-sm mx-auto"
                style={{ color: 'hsl(var(--accent))' }}>
                {activeTab.detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ── Section 2b: Profile Studio Preview ── */}
        <section className="py-12 px-4 max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: 'easeOut' as const }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Your Profile, Your Way
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Try the advanced profile editor below — see exactly what Plus unlocks.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' as const }}
          >
            <ProfileStudioPreview />
          </motion.div>
        </section>

        {/* ── Section 3: Free vs Plus ── */}
        <section className="py-20 px-4 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: 'easeOut' as const }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Free vs Plus
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The knowledge, community, and core tools stay free for everyone — always.
            </p>
          </motion.div>

          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
            {/* Header row */}
            <div className="grid grid-cols-2">
              <div className="px-5 py-4 border-r" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                <p className="text-sm font-semibold text-foreground">{plus.comparison.freeLabel}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Always free</p>
              </div>
              <div className="px-5 py-4" style={{ background: 'hsl(var(--primary) / 0.08)' }}>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                  {plus.comparison.plusLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{displayPrice}/month</p>
              </div>
            </div>

            {/* Items */}
            <div className="grid grid-cols-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="px-5 py-5 border-r space-y-2.5"
                style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                <ContentListContext field="plus.comparison.freeItems">
                  {plus.comparison.freeItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                        style={{ color: 'hsl(var(--success))' }} />
                      <span className="text-xs text-foreground leading-snug">{item}</span>
                    </div>
                  ))}
                </ContentListContext>
              </div>
              <div className="px-5 py-5 space-y-2.5"
                style={{ background: 'hsl(var(--primary) / 0.04)' }}>
                <ContentListContext field="plus.comparison.plusItems">
                  {plus.comparison.plusItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0 text-xs" style={{ color: 'hsl(var(--primary))' }}>✦</span>
                      <span className="text-xs text-foreground leading-snug">{item}</span>
                    </div>
                  ))}
                </ContentListContext>
              </div>
            </div>
          </div>

          {/* Why free note */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 px-6 py-5 rounded-2xl text-center"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--primary))' }}>
              {plus.whyFree.heading}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{plus.whyFree.body}</p>
          </motion.div>
        </section>

        {/* ── Section 4: Pricing ── */}
        <section className="py-20 px-4 max-w-sm mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: 'easeOut' as const }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-8"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Simple Membership
            </h2>

            <div className="rounded-3xl p-8"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--primary))' }}>
                    {displayPrice}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{plus.pricing.billingNote}</p>
              </div>

              <CelestialDivider />

              {/* Included list */}
              <ul className="space-y-2.5 text-left my-6">
                {FEATURE_TABS.map((f) => (
                  <li key={f.id} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                      <Check className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                    <span className="text-sm text-foreground">{f.label}</span>
                  </li>
                ))}
              </ul>

              <CelestialDivider />

              <div className="mt-6">
                <PurchaseCta
                  isSubscribed={isSubscribed}
                  isNative={isNative}
                  purchasing={purchasing}
                  restoring={restoring}
                  purchaseError={purchaseError}
                  displayPrice={displayPrice}
                  onPurchase={handlePurchase}
                  onRestore={handleRestore}
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Section 5: FAQ ── */}
        <section className="py-20 px-4 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: 'easeOut' as const }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Questions
            </h2>
          </motion.div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <ContentListContext field="plus.faq">
              {plus.faq.map((item) => (
                <div key={item.id} className="border-b last:border-0"
                  style={{ borderColor: 'hsl(var(--border))' }}>
                  <button
                    onClick={() => setOpenFaqId((prev) => (prev === item.id ? null : item.id))}
                    className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 transition-colors hover:bg-black/5"
                    aria-expanded={openFaqId === item.id}
                  >
                    <span className="text-sm font-medium text-foreground">{item.question}</span>
                    <span className="flex-shrink-0 text-muted-foreground">
                      {openFaqId === item.id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaqId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' as const }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </ContentListContext>
          </div>
        </section>

        {/* ── Section 6: Closing invitation ── */}
        <section className="py-20 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, hsl(var(--cosmic-bg-center) / 0.4) 0%, transparent 70%)' }} />
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut' as const }}
            className="relative max-w-xl mx-auto"
          >
            <div className="text-3xl mb-4" aria-hidden="true">✦</div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Personalize your sanctuary.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
              Your practice is yours. Plus simply gives you more ways to make it feel that way.
            </p>
            <PurchaseCta
              isSubscribed={isSubscribed}
              isNative={isNative}
              purchasing={purchasing}
              restoring={restoring}
              purchaseError={purchaseError}
              displayPrice={displayPrice}
              onPurchase={handlePurchase}
              onRestore={handleRestore}
            />
          </motion.div>
        </section>

        {/* ── Footer links ── */}
        <div className="py-8 px-4 text-center border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
            <span aria-hidden="true">·</span>
            <Link to="/account" className="hover:text-foreground transition-colors">Manage Subscription</Link>
            {isNative && (
              <>
                <span aria-hidden="true">·</span>
                <button onClick={handleRestore} disabled={restoring}
                  className="hover:text-foreground transition-colors disabled:opacity-50">
                  {restoring ? 'Restoring…' : 'Restore Purchases'}
                </button>
              </>
            )}
          </div>
        </div>

      </main>
    </>
  );
}
