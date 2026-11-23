/**
 * ShareStudioModal — unified share UI for Spellful content.
 *
 * Supports: tarot readings, horoscope, profile, spells, moon phase.
 * Uses share-studio.ts service: native share sheet → Web Share API → clipboard.
 * Privacy-safe: never includes private data (birth details, journal, Grimoire).
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, ExternalLink, Moon, Star, User, Sparkles, Download, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shareContent, buildShareUrl, type SharePayload } from '@/lib/share-studio';
import { generateShareCard, downloadBlob, type ShareCardFormat } from '@/lib/share-canvas';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShareContentType = 'tarot' | 'horoscope' | 'profile' | 'spell' | 'moon';

export interface ShareStudioProps {
  open: boolean;
  onClose: () => void;
  contentType: ShareContentType;
  /** Public-safe title for the share */
  title: string;
  /** Public-safe description / body text */
  description?: string;
  /** Slug for URL building (username for profile, spell slug, etc.) */
  slug?: string;
  /** Override the canonical URL entirely */
  url?: string;
}

// ─── Content type config ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ShareContentType, { icon: React.ReactNode; color: string; label: string }> = {
  tarot: {
    icon: <Star className="w-5 h-5" />,
    color: 'hsl(var(--primary))',
    label: 'Tarot Reading',
  },
  horoscope: {
    icon: <Moon className="w-5 h-5" />,
    color: 'hsl(var(--accent))',
    label: 'Horoscope',
  },
  profile: {
    icon: <User className="w-5 h-5" />,
    color: 'hsl(var(--secondary))',
    label: 'Profile',
  },
  spell: {
    icon: <Sparkles className="w-5 h-5" />,
    color: 'hsl(var(--primary))',
    label: 'Spell',
  },
  moon: {
    icon: <Moon className="w-5 h-5" />,
    color: 'hsl(var(--accent))',
    label: 'Moon Phase',
  },
};

// ─── Share option button ──────────────────────────────────────────────────────

function ShareOption({
  icon,
  label,
  sublabel,
  onClick,
  disabled,
  success,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  disabled?: boolean;
  success?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left"
      style={{
        background: success ? 'hsl(var(--success) / 0.12)' : 'hsl(var(--muted))',
        border: `1px solid ${success ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--border))'}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: success ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--card))',
          color: success ? 'hsl(var(--success))' : 'hsl(var(--foreground))',
        }}
      >
        {success ? <Check className="w-4 h-4" /> : icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-sm font-medium leading-tight"
          style={{ fontFamily: 'var(--font-heading)', color: success ? 'hsl(var(--success))' : 'hsl(var(--foreground))' }}
        >
          {success ? 'Copied!' : label}
        </p>
        {sublabel && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function ShareStudioModal({
  open,
  onClose,
  contentType,
  title,
  description,
  slug,
  url: urlOverride,
}: ShareStudioProps) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [cardFormat, setCardFormat] = useState<ShareCardFormat>('story');
  const [generatingCard, setGeneratingCard] = useState(false);

  const cfg = TYPE_CONFIG[contentType];
  const shareUrl = urlOverride ?? buildShareUrl(contentType as Parameters<typeof buildShareUrl>[0], slug);

  // Profile shares get an invite-style message; all other types use the standard format.
  const shareText = contentType === 'profile'
    ? (description
        ? `Follow me on Spellful ✨\n\n${description}\n\n${shareUrl}`
        : `Join me on Spellful — the home for witches, mystics & magical folk ✨\n\n${shareUrl}`)
    : (description
        ? `${title}\n\n${description}`
        : title);

  const payload: SharePayload = {
    title,
    text: shareText,
    url: shareUrl,
  };

  const handleNativeShare = useCallback(async () => {
    setSharing(true);
    try {
      const result = await shareContent(payload);
      if (result.method === 'clipboard') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } finally {
      setSharing(false);
    }
  }, [payload]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // Fallback: select text
    }
  }, [shareUrl]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  }, [shareText]);

  const handleTwitter = useCallback(() => {
    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&via=spellful`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  }, [shareText, shareUrl]);

  const handleGenerateCard = useCallback(async () => {
    setGeneratingCard(true);
    try {
      const blob = await generateShareCard({
        title,
        subtitle: cfg.label,
        description: description?.slice(0, 200),
        contentType: cfg.label,
        format: cardFormat,
      });
      const ext = 'png';
      const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      downloadBlob(blob, `spellful-${safeName}-${cardFormat}.${ext}`);
    } catch {
      // silently fail — canvas may be blocked in some environments
    } finally {
      setGeneratingCard(false);
    }
  }, [title, description, cfg.label, cardFormat]);

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="share-backdrop"
            className="fixed inset-0 z-50"
            style={{ background: 'hsl(var(--background) / 0.75)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            key="share-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Share ${cfg.label}`}
            className="fixed left-0 right-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 -8px 40px 0 hsl(var(--background) / 0.5)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-5 pb-4"
              style={{ borderBottom: '1px solid hsl(var(--border))' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${cfg.color.replace(')', ' / 0.15)')}`, color: cfg.color }}
                >
                  {cfg.icon}
                </div>
                <div>
                  <p
                    className="text-base font-medium leading-tight"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                  >
                    Share {cfg.label}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {title}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close share menu"
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Share options */}
            <div className="px-5 py-4 flex flex-col gap-2.5">
              {/* Native share / OS share sheet */}
              {hasNativeShare && (
                <ShareOption
                  icon={<Share2 className="w-4 h-4" />}
                  label="Share via…"
                  sublabel="Opens your device's share sheet"
                  onClick={handleNativeShare}
                  disabled={sharing}
                  success={copied && !hasNativeShare}
                />
              )}

              {/* Copy link */}
              <ShareOption
                icon={<Copy className="w-4 h-4" />}
                label="Copy link"
                sublabel={shareUrl}
                onClick={handleCopyLink}
                success={linkCopied}
              />

              {/* Copy text */}
              <ShareOption
                icon={<Copy className="w-4 h-4" />}
                label="Copy text"
                sublabel={shareText.slice(0, 60) + (shareText.length > 60 ? '…' : '')}
                onClick={handleCopyText}
                success={copied && !hasNativeShare}
              />

              {/* Twitter / X */}
              <ShareOption
                icon={
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                }
                label="Share on X"
                sublabel="Opens X (Twitter) in a new tab"
                onClick={handleTwitter}
              />

              {/* Open link */}
              <ShareOption
                icon={<ExternalLink className="w-4 h-4" />}
                label="Open link"
                sublabel={shareUrl}
                onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
              />
            </div>

            {/* Image card export */}
            <div
              className="mx-5 mb-4 rounded-xl overflow-hidden"
              style={{ border: '1px solid hsl(var(--border))' }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}
              >
                <ImageIcon className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  Create image card
                </p>
              </div>
              <div className="px-4 py-3 space-y-3" style={{ background: 'hsl(var(--card))' }}>
                {/* Format toggle */}
                <div className="flex gap-2">
                  {(['story', 'square'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setCardFormat(fmt)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary capitalize"
                      style={{
                        background: cardFormat === fmt ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                        color: cardFormat === fmt ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                        border: `1px solid ${cardFormat === fmt ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                        fontFamily: 'var(--font-sans)',
                      }}
                      aria-pressed={cardFormat === fmt}
                    >
                      {fmt === 'story' ? '9:16 Story' : '1:1 Square'}
                    </button>
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {cardFormat === 'story' ? '1080 × 1920 px — ideal for Instagram/TikTok stories' : '1080 × 1080 px — ideal for feed posts'}
                </p>
                <Button
                  size="sm"
                  className="w-full gap-2 text-sm"
                  onClick={() => void handleGenerateCard()}
                  disabled={generatingCard}
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                  {generatingCard
                    ? <><span className="animate-spin">✦</span> Generating…</>
                    : <><Download className="w-4 h-4" /> Download {cardFormat === 'story' ? 'story' : 'square'} card</>
                  }
                </Button>
              </div>
            </div>

            {/* Privacy note */}
            <div className="px-5 pb-5">
              <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Only public information is included in this share. Your private Grimoire, birth details, and journal entries are never shared.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
