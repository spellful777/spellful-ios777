/**
 * ProfileShareCard — "Create image card" feature for Spellful profiles.
 *
 * Composites the approved galaxy background with the user's avatar,
 * @username, and a real scannable QR code pointing to their public profile.
 *
 * Formats:
 *   story  — 1080 × 1920 (9:16 Instagram/TikTok Story)
 *   square — 1080 × 1080 (1:1 Instagram feed / general sharing)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Share2, Link, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type CardFormat = 'story' | 'square';

interface ProfileShareCardProps {
  username: string;
  userId: string;
  avatarUrl?: string | null;
  displayName?: string | null;
}

// ─── Background slot URLs ─────────────────────────────────────────────────────

const BG_STORY  = '/airo-assets/images/pages/profile/share-card-bg-story';
const BG_SQUARE = '/airo-assets/images/pages/profile/share-card-bg-square';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function generateQrImageUrl(text: string): string {
  // Uses the same QR service already used in account.tsx for TOTP codes.
  // Returns a URL that resolves to a PNG — browser-safe, no Node APIs needed.
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=2&ecc=H&data=${encodeURIComponent(text)}`;
}

function drawCircularImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const size = r * 2;
  const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, cx - dw / 2, cy - r, dw, dh);
  ctx.restore();
}

// ─── Canvas compositor ────────────────────────────────────────────────────────
//
// Layout coordinates are measured from the actual template artwork:
//
//  STORY  (1080 × 1920)
//    Avatar circle:  cx=540  cy=430  r=218
//    Username pill:  cx=540  cy=790  (text only — pill is in the artwork)
//    QR box:         cx=540  cy=1065  inner size=330
//
//  SQUARE (1080 × 1080)
//    Avatar circle:  cx=540  cy=238  r=188
//    Username pill:  cx=540  cy=568  (text only — pill is in the artwork)
//    QR box:         cx=540  cy=790  inner size=280
//
// The template images already contain the glowing rings, pill border, QR frame
// border, and Spellful wordmark. We draw ONLY the dynamic content on top:
//   1. Avatar photo clipped to the circle
//   2. @username text centred in the pill
//   3. QR code image inside the rounded-square frame

async function buildCard(
  format: CardFormat,
  username: string,
  userId: string,
  avatarUrl: string | null | undefined,
): Promise<Blob> {
  const W = 1080;
  const H = format === 'story' ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const CX = W / 2;
  const isStory = format === 'story';

  // ── 1. Background — draw template at full canvas size ───────────────────────
  const bgSrc = isStory ? BG_STORY : BG_SQUARE;
  try {
    const bgImg = await loadImage(bgSrc);
    // Cover-fit: scale so the image fills the canvas, centred
    const scale = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const dw = bgImg.naturalWidth * scale;
    const dh = bgImg.naturalHeight * scale;
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } catch {
    // Fallback: deep galaxy gradient so the card is never blank
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   '#050310');
    grad.addColorStop(0.5, '#0D0B2A');
    grad.addColorStop(1,   '#050310');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Layout constants matched to template artwork ─────────────────────────────
  const avatarCY  = isStory ? 430  : 238;
  const avatarR   = isStory ? 218  : 188;
  const pillCY    = isStory ? 790  : 568;   // vertical centre of username pill
  const pillW     = isStory ? 680  : 600;   // usable text width inside pill
  const pillH     = isStory ? 88   : 76;
  const qrCY      = isStory ? 1065 : 790;   // centre of QR inner area
  const qrInner   = isStory ? 330  : 280;   // side length of QR image to draw

  // ── 2. Avatar — clip to circle, cover-fill ───────────────────────────────────
  if (avatarUrl) {
    try {
      const avatarImg = await loadImage(avatarUrl);
      drawCircularImage(ctx, avatarImg, CX, avatarCY, avatarR);
    } catch {
      // Leave the black circle from the template if avatar fails to load
    }
  } else {
    // Fallback witch-hat emoji centred in the circle
    ctx.font = `${avatarR}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('🧙', CX, avatarCY);
    ctx.textBaseline = 'alphabetic';
  }

  // ── 3. Username text — centred in the pill area ──────────────────────────────
  const handle = `@${username}`;
  const maxFontSize = isStory ? 54 : 46;
  let fontSize = maxFontSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  while (fontSize > 18) {
    ctx.font = `500 ${fontSize}px Raleway, sans-serif`;
    if (ctx.measureText(handle).width <= pillW - 40) break;
    fontSize -= 2;
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(handle, CX, pillCY + pillH / 2 - fontSize * 0.05);
  ctx.textBaseline = 'alphabetic';

  // ── 4. QR code — drawn inside the rounded-square frame ───────────────────────
  const profileUrl = `https://spellful.com/u/${username}?ref=card&uid=${userId}`;
  try {
    const qrImg = await loadImage(generateQrImageUrl(profileUrl));
    const qrX = CX - qrInner / 2;
    const qrY = qrCY - qrInner / 2;
    ctx.drawImage(qrImg, qrX, qrY, qrInner, qrInner);
  } catch {
    // QR failed — leave the black placeholder from the template
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/png');
  });
}

// ─── Preview renderer (small canvas for UI preview) ──────────────────────────

async function buildPreview(
  format: CardFormat,
  username: string,
  userId: string,
  avatarUrl: string | null | undefined,
): Promise<string> {
  const blob = await buildCard(format, username, userId, avatarUrl);
  return URL.createObjectURL(blob);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileShareCard({ username, userId, avatarUrl, displayName }: ProfileShareCardProps) {
  const [format, setFormat] = useState<CardFormat>('story');
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFormat, setPreviewFormat] = useState<CardFormat | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const prevObjectUrl = useRef<string | null>(null);

  const profileUrl = `https://spellful.com/u/${username}`;

  const generatePreview = useCallback(async (fmt: CardFormat) => {
    setGenerating(true);
    try {
      if (prevObjectUrl.current) {
        URL.revokeObjectURL(prevObjectUrl.current);
        prevObjectUrl.current = null;
      }
      const url = await buildPreview(fmt, username, userId, avatarUrl);
      prevObjectUrl.current = url;
      setPreviewUrl(url);
      setPreviewFormat(fmt);
    } catch {
      // silently ignore preview errors
    } finally {
      setGenerating(false);
    }
  }, [username, userId, avatarUrl]);

  const handleFormatChange = useCallback((fmt: CardFormat) => {
    setFormat(fmt);
    void generatePreview(fmt);
  }, [generatePreview]);

  // Auto-generate story preview on mount so the card is visible immediately
  useEffect(() => {
    void generatePreview('story');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await buildCard(format, username, userId, avatarUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spellful-${username}-${format === 'story' ? 'story-card' : 'square-card'}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // silently ignore
    } finally {
      setGenerating(false);
    }
  }, [format, username, userId, avatarUrl]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `${displayName ?? username} on Spellful`, url: profileUrl });
        return;
      } catch {
        // fall through
      }
    }
    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // ignore
    }
  }, [displayName, username, profileUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // ignore
    }
  }, [profileUrl]);

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Create a personalized image card with your avatar, username, and a scannable QR code to share your Spellful profile.
      </p>

      {/* Format tabs */}
      <div className="flex gap-2">
        {(['story', 'square'] as CardFormat[]).map(fmt => (
          <button
            key={fmt}
            onClick={() => handleFormatChange(fmt)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: format === fmt ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
              border: `1px solid ${format === fmt ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))'}`,
              color: format === fmt ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
          >
            {fmt === 'story' ? '9:16 Story' : '1:1 Square'}
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div
        className="relative rounded-xl overflow-hidden flex items-center justify-center"
        style={{
          background: 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
          aspectRatio: format === 'story' ? '9/16' : '1/1',
          maxHeight: format === 'story' ? '360px' : '260px',
        }}
      >
        {previewUrl && previewFormat === format ? (
          <img
            src={previewUrl}
            alt="Share card preview"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            {generating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 rounded-full border-2"
                style={{ borderColor: 'hsl(var(--primary))', borderTopColor: 'transparent' }}
              />
            ) : (
              <>
                <span className="text-2xl">✨</span>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Tap "Create image card" to preview
                </p>
              </>
            )}
          </div>
        )}
        {generating && previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'hsl(var(--background) / 0.6)' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 rounded-full border-2"
              style={{ borderColor: 'hsl(var(--primary))', borderTopColor: 'transparent' }}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleDownload}
          disabled={generating}
          className="w-full gap-2 font-medium"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Download className="w-4 h-4" />
          {generating ? 'Creating…' : format === 'story' ? 'Download story card' : 'Download square card'}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={generating}
            className="flex-1 gap-1.5 text-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            disabled={generating}
            className="flex-1 gap-1.5 text-xs"
            style={linkCopied ? { borderColor: 'hsl(var(--success) / 0.5)', color: 'hsl(var(--success))' } : {}}
          >
            {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
            {linkCopied ? 'Copied!' : 'Copy link'}
          </Button>
        </div>
      </div>
    </div>
  );
}
