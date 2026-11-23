/**
 * ShareTarotModal — simplified single-screen tarot reading share modal.
 *
 * Two actions:
 *   1. Create shareable link — cards-only public permalink, auto-titled, one tap
 *   2. Save story image     — 1080×1920 Instagram Story PNG download; no public link
 *
 * Private intention, notes, and personal data are never included.
 * The canvas renderer supports cards_and_summary mode for future use.
 */

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Copy, Check, ExternalLink, Download, Share2 } from 'lucide-react';
import { shareContent } from '@/lib/share-studio';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TarotCardForShare {
  cardId: string;
  position: string;
  reversed: boolean;
  displayOrder: number;
}

export interface ShareTarotPayload {
  spreadType: string;
  spreadName: string;
  cards: TarotCardForShare[];
  /** Optional: ID of a saved reading the user owns */
  sourceReadingId?: number;
  /** Optional: pre-generated concise summary from the reading engine */
  suggestedSummary?: string;
}

interface Props {
  payload: ShareTarotPayload;
  onClose: () => void;
}

type ShareMode = 'cards_and_summary' | 'cards_only' | 'image_only';

// ── Story template pool (same 9 as HoroscopeShareMenu) ───────────────────────

const STORY_TEMPLATES = [
  '/airo-assets/images/pages/horoscope/story-template-1',
  '/airo-assets/images/pages/horoscope/story-template-2',
  '/airo-assets/images/pages/horoscope/story-template-3',
  '/airo-assets/images/pages/horoscope/story-template-4',
  '/airo-assets/images/pages/horoscope/story-template-5',
  '/airo-assets/images/pages/horoscope/story-template-6',
  '/airo-assets/images/pages/horoscope/story-template-7',
  '/airo-assets/images/pages/horoscope/story-template-8',
  '/airo-assets/images/pages/horoscope/story-template-9',
  '/airo-assets/images/pages/horoscope/story-template-10',
  '/airo-assets/images/pages/horoscope/story-template-11',
  '/airo-assets/images/pages/horoscope/story-template-12',
  '/airo-assets/images/pages/horoscope/story-template-13',
  '/airo-assets/images/pages/horoscope/story-template-14',
];

// All story templates are pre-branded (logo embedded in artwork) — no watermark added.

// ── Card helpers ──────────────────────────────────────────────────────────────

function cardSlotUrl(cardId: string): string {
  const majorArcana = new Set([
    'the-fool','the-magician','the-high-priestess','the-empress','the-emperor',
    'the-hierophant','the-lovers','the-chariot','strength','the-hermit',
    'wheel-of-fortune','justice','the-hanged-man','death','temperance',
    'the-devil','the-tower','the-star','the-moon','the-sun','judgement','the-world',
  ]);
  if (majorArcana.has(cardId)) return `/airo-assets/images/tarot/major-arcana/${cardId}`;
  if (cardId.endsWith('-of-cups'))      return `/airo-assets/images/tarot/cups/${cardId}`;
  if (cardId.endsWith('-of-wands'))     return `/airo-assets/images/tarot/wands/${cardId}`;
  if (cardId.endsWith('-of-swords'))    return `/airo-assets/images/tarot/swords/${cardId}`;
  if (cardId.endsWith('-of-pentacles')) return `/airo-assets/images/tarot/pentacles/${cardId}`;
  return `/airo-assets/images/tarot/major-arcana/${cardId}`;
}

function formatCardName(cardId: string): string {
  return cardId.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function cssVarToHex(varName: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 1;
  const c = tmp.getContext('2d')!;
  c.fillStyle = `hsl(${raw})`;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Instagram Story canvas renderer ──────────────────────────────────────────

async function generateTarotStory(
  payload: ShareTarotPayload,
  shareMode: ShareMode,
): Promise<Blob> {
  const W = 1080;
  const H = 1920;

  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  const templateUrl = STORY_TEMPLATES[dayOfYear % STORY_TEMPLATES.length];

  const sortedCards = [...payload.cards].sort((a, b) => a.displayOrder - b.displayOrder);
  // Load ALL cards — no cap; every card in the spread is rendered
  const [bgImg, ...cardImgs] = await Promise.all([
    loadImage(templateUrl),
    ...sortedCards.map((c) => loadImage(cardSlotUrl(c.cardId))),
  ]);

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── Background ──────────────────────────────────────────────────────────
    if (bgImg && bgImg.naturalWidth > 0) {
      const scale = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
      const dw = bgImg.naturalWidth * scale;
      const dh = bgImg.naturalHeight * scale;
      ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0D0B1A');
      grad.addColorStop(0.5, '#1A1530');
      grad.addColorStop(1, '#0D0B1A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    const goldHex = cssVarToHex('--primary');
    const lavHex  = cssVarToHex('--accent');
    const CX = W / 2;

    // ── Safe zone constants ─────────────────────────────────────────────────
    const SAFE_TOP = 250;
    const PAD      = 72;
    const INNER    = W - PAD * 2;

    // ── Header panel ────────────────────────────────────────────────────────
    const HEADER_H = 180;
    drawRoundRect(ctx, PAD, SAFE_TOP, INNER, HEADER_H, 32);
    ctx.fillStyle = 'rgba(8,5,28,0.78)';
    ctx.fill();

    // Gold top bar
    ctx.fillStyle = goldHex;
    ctx.fillRect(PAD + 44, SAFE_TOP, 120, 3);

    // Spread name
    ctx.font = 'italic 300 72px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = 'rgba(245,245,245,1)';
    ctx.textAlign = 'center';
    ctx.fillText(payload.spreadName, CX, SAFE_TOP + 80);

    // "My Tarot Reading" subtitle
    ctx.font = '300 36px "Raleway", sans-serif';
    ctx.fillStyle = goldHex;
    ctx.textAlign = 'center';
    ctx.fillText('My Tarot Reading', CX, SAFE_TOP + 136);

    // ── Spread-aware card layout ────────────────────────────────────────────
    // Compute geometry based on actual card count and spread type.
    // Layouts:
    //   1 card  — single centered card (Daily Card)
    //   3 cards — left-to-right row with arc (Past · Present · Future)
    //   4 cards — 2×2 grid (Spiritual Guidance)
    //   5 cards — top row of 3 + bottom row of 2 (Love & Relationships, Career & Purpose)
    //   other   — auto-grid rows of up to 3

    const n = sortedCards.length;
    const CARDS_TOP = SAFE_TOP + HEADER_H + 48;

    // ── Per-layout geometry ────────────────────────────────────────────────
    // Each layout returns an array of { x, y } center positions for each card,
    // plus the card dimensions to use.

    interface CardPos { x: number; y: number; rot: number; }

    function computeLayout(count: number): { positions: CardPos[]; cw: number; ch: number; totalH: number } {
      const GAP = 24;
      const LABEL_H = 72; // space below each card for name + position text

      if (count === 1) {
        const cw = 360;
        const ch = Math.round(cw * 9 / 5);
        return {
          cw, ch,
          totalH: ch + LABEL_H,
          positions: [{ x: CX, y: CARDS_TOP + ch / 2, rot: 0 }],
        };
      }

      if (count === 3) {
        const cw = 272;
        const ch = Math.round(cw * 9 / 5);
        const totalW = 3 * cw + 2 * GAP;
        const startX = (W - totalW) / 2 + cw / 2;
        const arcY = [CARDS_TOP + ch / 2 - 24, CARDS_TOP + ch / 2, CARDS_TOP + ch / 2 - 24];
        const rots = [-0.04, 0, 0.04];
        return {
          cw, ch,
          totalH: ch + LABEL_H,
          positions: [0, 1, 2].map((i) => ({ x: startX + i * (cw + GAP), y: arcY[i], rot: rots[i] })),
        };
      }

      if (count === 4) {
        // 2×2 grid
        const cw = 220;
        const ch = Math.round(cw * 9 / 5);
        const totalW = 2 * cw + GAP;
        const startX = (W - totalW) / 2 + cw / 2;
        const rowGap = GAP + LABEL_H;
        return {
          cw, ch,
          totalH: 2 * ch + rowGap + LABEL_H,
          positions: [
            { x: startX,           y: CARDS_TOP + ch / 2,                  rot: 0 },
            { x: startX + cw + GAP, y: CARDS_TOP + ch / 2,                  rot: 0 },
            { x: startX,           y: CARDS_TOP + ch + rowGap + ch / 2,    rot: 0 },
            { x: startX + cw + GAP, y: CARDS_TOP + ch + rowGap + ch / 2,    rot: 0 },
          ],
        };
      }

      if (count === 5) {
        // Row of 3 on top, row of 2 centered below
        const cw = 200;
        const ch = Math.round(cw * 9 / 5);
        const rowGap = GAP + LABEL_H;
        const row1W = 3 * cw + 2 * GAP;
        const row2W = 2 * cw + GAP;
        const r1x = (W - row1W) / 2 + cw / 2;
        const r2x = (W - row2W) / 2 + cw / 2;
        const r1y = CARDS_TOP + ch / 2;
        const r2y = CARDS_TOP + ch + rowGap + ch / 2;
        return {
          cw, ch,
          totalH: 2 * ch + rowGap + LABEL_H,
          positions: [
            { x: r1x,           y: r1y, rot: 0 },
            { x: r1x + cw + GAP, y: r1y, rot: 0 },
            { x: r1x + 2*(cw + GAP), y: r1y, rot: 0 },
            { x: r2x,           y: r2y, rot: 0 },
            { x: r2x + cw + GAP, y: r2y, rot: 0 },
          ],
        };
      }

      // Fallback: rows of up to 3
      const cols = Math.min(count, 3);
      const rows = Math.ceil(count / cols);
      const cw = Math.min(220, Math.floor((W - PAD * 2 - (cols - 1) * GAP) / cols));
      const ch = Math.round(cw * 9 / 5);
      const rowGap = GAP + LABEL_H;
      const positions: CardPos[] = [];
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        // Center the last partial row
        const rowCount = row === rows - 1 ? count - row * cols : cols;
        const rowW = rowCount * cw + (rowCount - 1) * GAP;
        const rowStartX = (W - rowW) / 2 + cw / 2;
        positions.push({
          x: rowStartX + col * (cw + GAP),
          y: CARDS_TOP + row * (ch + rowGap) + ch / 2,
          rot: 0,
        });
      }
      return { cw, ch, totalH: rows * ch + (rows - 1) * rowGap + LABEL_H, positions };
    }

    const layout = computeLayout(n);
    const { cw: CARD_W, ch: CARD_H, positions: cardPositions } = layout;

    // ── Altar glow beneath card group ─────────────────────────────────────
    const groupCenterY = CARDS_TOP + layout.totalH * 0.5;
    const altarGlow = ctx.createRadialGradient(CX, groupCenterY, 0, CX, groupCenterY, 500);
    altarGlow.addColorStop(0, 'rgba(184,169,217,0.10)');
    altarGlow.addColorStop(0.5, 'rgba(201,168,76,0.06)');
    altarGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = altarGlow;
    ctx.fillRect(PAD, CARDS_TOP - 40, INNER, layout.totalH + 80);

    // ── Draw each card ─────────────────────────────────────────────────────
    sortedCards.forEach((card, i) => {
      const pos = cardPositions[i];
      if (!pos) return;
      const cardImg = cardImgs[i];

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(pos.rot);

      // Drop shadow
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 10;

      // Card background
      drawRoundRect(ctx, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
      ctx.fillStyle = 'rgba(14,10,32,0.92)';
      ctx.fill();

      // Gold border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = goldHex + '99';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Card image
      if (cardImg && cardImg.naturalWidth > 0) {
        ctx.save();
        drawRoundRect(ctx, -CARD_W / 2 + 4, -CARD_H / 2 + 4, CARD_W - 8, CARD_H - 8, 10);
        ctx.clip();
        if (card.reversed) {
          ctx.rotate(Math.PI);
          ctx.drawImage(cardImg, -CARD_W / 2 + 4, -CARD_H / 2 + 4, CARD_W - 8, CARD_H - 8);
        } else {
          ctx.drawImage(cardImg, -CARD_W / 2 + 4, -CARD_H / 2 + 4, CARD_W - 8, CARD_H - 8);
        }
        ctx.restore();
      }

      // Luminous edge glow
      const edgeGlow = ctx.createLinearGradient(-CARD_W / 2, -CARD_H / 2, CARD_W / 2, CARD_H / 2);
      edgeGlow.addColorStop(0, goldHex + '44');
      edgeGlow.addColorStop(0.5, lavHex + '22');
      edgeGlow.addColorStop(1, goldHex + '44');
      ctx.strokeStyle = edgeGlow;
      ctx.lineWidth = 3;
      drawRoundRect(ctx, -CARD_W / 2 + 1, -CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2, 13);
      ctx.stroke();

      // Reversed badge
      if (card.reversed) {
        const bW = 96; const bH = 26;
        drawRoundRect(ctx, -bW / 2, CARD_H / 2 - 38, bW, bH, 7);
        ctx.fillStyle = 'rgba(8,5,28,0.88)';
        ctx.fill();
        ctx.strokeStyle = lavHex + '88';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = '400 17px "Raleway", sans-serif';
        ctx.fillStyle = lavHex;
        ctx.textAlign = 'center';
        ctx.fillText('↑ Reversed', 0, CARD_H / 2 - 38 + 18);
      }

      ctx.restore();

      // Labels below card (no rotation — always upright for readability)
      const labelFontSize = CARD_W < 220 ? 24 : 28;
      const posFontSize   = CARD_W < 220 ? 20 : 22;
      const labelY = pos.y + CARD_H / 2 + 30;

      ctx.font = `italic 300 ${labelFontSize}px "Cormorant Garamond", Georgia, serif`;
      ctx.fillStyle = 'rgba(245,245,245,0.95)';
      ctx.textAlign = 'center';
      // Truncate card name to fit card width
      let cardName = formatCardName(card.cardId);
      while (ctx.measureText(cardName).width > CARD_W + 20 && cardName.length > 4) {
        cardName = cardName.slice(0, -2) + '…';
      }
      ctx.fillText(cardName, pos.x, labelY);

      if (card.position) {
        ctx.font = `300 ${posFontSize}px "Raleway", sans-serif`;
        ctx.fillStyle = goldHex + 'DD';
        ctx.textAlign = 'center';
        let posLabel = '· ' + card.position + ' ·';
        while (ctx.measureText(posLabel).width > CARD_W + 20 && posLabel.length > 5) {
          posLabel = posLabel.slice(0, -2) + '…';
        }
        ctx.fillText(posLabel, pos.x, labelY + posFontSize + 4);
      }
    });

    // ── Summary / takeaway panel ─────────────────────────────────────────────
    const summaryTop = CARDS_TOP + layout.totalH + 32;

    if (shareMode === 'cards_and_summary' && payload.suggestedSummary) {
      const PANEL_H = 240;
      drawRoundRect(ctx, PAD, summaryTop, INNER, PANEL_H, 28);
      ctx.fillStyle = 'rgba(8,5,28,0.78)';
      ctx.fill();
      ctx.strokeStyle = goldHex + '44';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Centered gold top bar
      ctx.fillStyle = goldHex;
      ctx.fillRect(CX - 50, summaryTop, 100, 2);

      // Summary text — centered
      const summaryText = payload.suggestedSummary.slice(0, 200);
      const words = summaryText.split(' ');
      const maxW = INNER - 100;
      const lines: string[] = [];
      let line = '';
      ctx.font = 'italic 300 38px "Cormorant Garamond", Georgia, serif';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);

      ctx.fillStyle = lavHex;
      ctx.textAlign = 'center';
      lines.slice(0, 4).forEach((l, i) => {
        ctx.fillText(l, CX, summaryTop + 68 + i * 50);
      });
    }

    // ── Logo footer — intentionally omitted ────────────────────────────────
    // No Spellful logo or watermark is rendered on Instagram share images.
    // Pre-branded wallpapers (templates 6–14) carry the logo in their artwork;
    // unbranded templates (1–5) export clean so users may add their own caption.

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShareTarotModal({ payload, onClose }: Props) {
  // Simplified single-screen flow: choose link or image, done.
  const [publicId, setPublicId] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedCards = [...payload.cards].sort((a, b) => a.displayOrder - b.displayOrder);
  const autoTitle = `My ${payload.spreadName} Tarot Reading`;

  // ── Create cards-only public share ───────────────────────────────────────
  const createShare = useCallback(async () => {
    setLinkLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tarot/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadType: payload.spreadType,
          spreadName: payload.spreadName,
          cards: payload.cards,
          shareMode: 'cards_only',
          publicTitle: autoTitle,
          publicSummary: '',
          sourceReadingId: payload.sourceReadingId,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to create link');
      }
      const data = await res.json() as { publicId: string; url: string };
      setPublicId(data.publicId);
      setPublicUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLinkLoading(false);
    }
  }, [payload, autoTitle]);

  // ── Download story image (no public link created) ─────────────────────────
  const downloadStory = useCallback(async () => {
    setImageLoading(true);
    setError(null);
    try {
      const blob = await generateTarotStory(payload, 'cards_only');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `spellful-tarot-${payload.spreadType.toLowerCase().replace(/\s+/g, '-')}-story.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate image');
    } finally {
      setImageLoading(false);
    }
  }, [payload, onClose]);

  // ── Copy link ─────────────────────────────────────────────────────────────
  const copyLink = useCallback(async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }, [publicUrl]);

  // ── Share via device ──────────────────────────────────────────────────────
  const shareViaDevice = useCallback(async () => {
    if (!publicUrl) return;
    await shareContent({
      title: autoTitle,
      text: `${autoTitle} — see the cards and try your own reading at Spellful`,
      url: publicUrl,
    });
  }, [publicUrl, autoTitle]);

  // ── Revoke ────────────────────────────────────────────────────────────────
  const revokeShare = useCallback(async () => {
    if (!publicId) return;
    await fetch(`/api/tarot/shares/${publicId}`, { method: 'DELETE' });
    onClose();
  }, [publicId, onClose]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'hsl(var(--background) / 0.85)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-base font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                Share your reading
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* ── Card preview strip ─────────────────────────────────── */}
            <div className="flex gap-2 justify-center">
              {sortedCards.slice(0, 3).map((card) => (
                <div
                  key={`${card.cardId}-${card.displayOrder}`}
                  className="rounded-lg overflow-hidden border flex-shrink-0"
                  style={{
                    width: 64,
                    aspectRatio: '5/9',
                    borderColor: 'hsl(var(--border))',
                    background: 'hsl(var(--muted))',
                  }}
                >
                  <img
                    src={cardSlotUrl(card.cardId)}
                    alt={formatCardName(card.cardId)}
                    className="w-full h-full object-cover"
                    style={card.reversed ? { transform: 'rotate(180deg)' } : undefined}
                  />
                </div>
              ))}
              {sortedCards.length > 3 && (
                <div
                  className="rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{
                    width: 64,
                    aspectRatio: '5/9',
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  +{sortedCards.length - 3}
                </div>
              )}
            </div>

            {/* ── Privacy note ───────────────────────────────────────── */}
            <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Only your cards are shared. Your personal details stay private.
            </p>

            {/* ── Error ──────────────────────────────────────────────── */}
            {error && (
              <p className="text-xs text-center" style={{ color: 'hsl(var(--destructive))' }}>
                {error}
              </p>
            )}

            {/* ── Link created state ─────────────────────────────────── */}
            {publicUrl ? (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
                  style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}
                >
                  <span className="flex-1 text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {publicUrl}
                  </span>
                  <button
                    onClick={() => void copyLink()}
                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                    style={{ color: copied ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
                    aria-label="Copy link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => void copyLink()}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                  <button
                    onClick={() => void shareViaDevice()}
                    className="flex-1 py-3 rounded-xl text-sm border transition-all flex items-center justify-center gap-2"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'hsl(var(--muted))' }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl text-xs border transition-all flex items-center justify-center gap-1.5"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))', background: 'transparent' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview
                  </a>
                  <button
                    onClick={() => void revokeShare()}
                    className="flex-1 py-2.5 rounded-xl text-xs border transition-all"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))', background: 'transparent' }}
                  >
                    Revoke link
                  </button>
                </div>
              </div>
            ) : (
              /* ── Two main actions ──────────────────────────────────── */
              <div className="space-y-3">
                {/* Primary: create shareable link */}
                <button
                  onClick={() => void createShare()}
                  disabled={linkLoading || imageLoading}
                  className="w-full py-3.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                  <Share2 className="w-4 h-4" />
                  {linkLoading ? 'Creating link…' : 'Create shareable link'}
                </button>

                {/* Secondary: save story image */}
                <button
                  onClick={() => void downloadStory()}
                  disabled={linkLoading || imageLoading}
                  className="w-full py-3.5 rounded-xl text-sm border transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'hsl(var(--muted))' }}
                >
                  <Download className="w-4 h-4" />
                  {imageLoading ? 'Saving image…' : 'Save story image instead'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
