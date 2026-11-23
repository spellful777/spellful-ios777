/**
 * HoroscopeShareMenu — compact share button for the daily horoscope widget.
 * Platforms: Threads, Bluesky, Facebook, X (pre-typed posts)
 * Instagram: generates a 1080×1920 Story graphic and downloads it.
 *
 * Story graphic features:
 *  - 9 branded story background templates (5 original + 4 new celestial)
 *  - Day-rotating template selection
 *  - No Spellful logo rendered — branding is omitted from all Instagram exports
 *  - Zodiac sign accent colour tinting per sign family
 *  - Structured content zones: header, headline, body, pull-quote, Do/Don't, logo footer
 *  - Safe-zone margins for Instagram Story UI overlays
 *
 * Dropdown renders via ReactDOM.createPortal into document.body so it escapes
 * all overflow:hidden / stacking-context ancestors in the card hierarchy.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import type { DailyHoroscope } from '@/lib/horoscope-engine';

// ── Sign data ─────────────────────────────────────────────────────────────────

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

/**
 * Subtle per-sign accent tint applied to the sign name and divider.
 * Keeps the system unified while giving each sign a distinct flavour.
 * All values are canvas-ready hex strings.
 */
const SIGN_ACCENT: Record<string, string> = {
  Aries:       '#E8735A', // warm coral-red
  Taurus:      '#7EC8A0', // earthy green
  Gemini:      '#F0D080', // bright gold-yellow
  Cancer:      '#A8C8E8', // soft silver-blue
  Leo:         '#F0A840', // warm amber-gold
  Virgo:       '#B8D4A0', // muted sage
  Libra:       '#D4A8D8', // soft rose-lavender
  Scorpio:     '#8060A8', // deep violet
  Sagittarius: '#E89050', // adventurous orange
  Capricorn:   '#A0A8B8', // cool slate
  Aquarius:    '#60B8D8', // electric sky-blue
  Pisces:      '#90A8D8', // dreamy periwinkle
};

// ── Story template pool (9 templates: 5 original + 4 new) ────────────────────

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

// ── Canvas helpers ────────────────────────────────────────────────────────────

/** Read a CSS HSL variable and return a canvas-ready hex string. */
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

/**
 * Wrap and draw text, returning the Y position after the last line.
 * align defaults to 'center'; originX defaults to canvas centre.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  lineH: number,
  startY: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'center',
  originX = 540,
  maxLines = 99,
): number {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  const words = text.split(' ');
  let line = '';
  let y = startY;
  let linesDrawn = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      if (linesDrawn < maxLines) ctx.fillText(line, originX, y);
      line = word;
      y += lineH;
      linesDrawn++;
    } else {
      line = test;
    }
  }
  if (line && linesDrawn < maxLines) ctx.fillText(line, originX, y);
  ctx.textAlign = 'center';
  return y + lineH;
}

/** Extract a pull-quote: use cosmicInsight if available, else first sentence. */
function extractPullQuote(horoscope: DailyHoroscope): string {
  const ext = horoscope as unknown as Record<string, unknown>;
  if (typeof ext.cosmicInsight === 'string' && ext.cosmicInsight.trim()) {
    return ext.cosmicInsight.trim();
  }
  const firstSentence = horoscope.body.split(/[.!?]/)[0]?.trim();
  return firstSentence ? firstSentence + '.' : '';
}

/** Truncate body text to a target character count, ending at a word boundary. */
function truncateBody(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.lastIndexOf(' ', maxChars);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, maxChars)) + '…';
}

// ── Logo loader ───────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ── Main story generator ──────────────────────────────────────────────────────

function generateStoryCanvas(horoscope: DailyHoroscope): Promise<Blob> {
  return new Promise((resolve) => {
    const start = new Date(new Date().getFullYear(), 0, 0).getTime();
    const dayOfYear = Math.floor((Date.now() - start) / 86400000);
    const templateUrl = STORY_TEMPLATES[dayOfYear % STORY_TEMPLATES.length];

    Promise.all([
      loadImage(templateUrl),
    ]).then(([bgImg]) => {
      renderStory(resolve, horoscope, bgImg, templateUrl);
    });
  });
}

function renderStory(
  resolve: (blob: Blob) => void,
  horoscope: DailyHoroscope,
  bgImg: HTMLImageElement | null,
  templateUrl: string,
) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── 1. Background template ───────────────────────────────────────────────────
  if (bgImg && bgImg.naturalWidth > 0) {
    const scale = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const dw = bgImg.naturalWidth * scale;
    const dh = bgImg.naturalHeight * scale;
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    // Fallback: deep celestial gradient
    const fallback = ctx.createLinearGradient(0, 0, 0, H);
    fallback.addColorStop(0, '#0D0B1A');
    fallback.addColorStop(0.5, '#1A1530');
    fallback.addColorStop(1, '#0D0B1A');
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, W, H);
  }

  // Subtle dark vignette overlay for text legibility
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Brand colours ─────────────────────────────────────────────────────────
  const goldHex    = cssVarToHex('--primary');   // #C9A84C
  const lavHex     = cssVarToHex('--accent');    // #B8A9D9
  const signAccent = SIGN_ACCENT[horoscope.sign] ?? goldHex;
  const CX         = W / 2;

  // ── 3. Safe-zone constants ───────────────────────────────────────────────────
  // Instagram Story safe zone: keep content between y=250 and y=1670
  const SAFE_TOP    = 250;
  const SAFE_BOT    = 1670;
  const PAD         = 72;
  const INNER       = W - PAD * 2;
  const BODY_INNER  = INNER - 80;   // 856px — generous centered reading width

  // ── 4. Main content panel ────────────────────────────────────────────────────
  const PANEL_TOP = SAFE_TOP + 20;
  const PANEL_BOT = SAFE_BOT - 20;
  const PANEL_H   = PANEL_BOT - PANEL_TOP;

  drawRoundRect(ctx, PAD, PANEL_TOP, INNER, PANEL_H, 44);
  ctx.fillStyle = 'rgba(8,5,28,0.74)';
  ctx.fill();

  // Centered gold top accent bar
  ctx.fillStyle = goldHex;
  ctx.fillRect(CX - 70, PANEL_TOP, 140, 3);


  // ── 5a. Vertical centering — estimate content height ────────────────────────
  const ext = horoscope as unknown as Record<string, unknown>;
  const doText   = typeof ext.doToday   === 'string' ? (ext.doToday   as string).trim() : '';
  const dontText = typeof ext.dontToday === 'string' ? (ext.dontToday as string).trim() : '';
  const hasDoDont = !!(doText || dontText);
  const pullQuote = extractPullQuote(horoscope);
  const EST_HEADER   = 310;
  const EST_HEADLINE = 300;
  const EST_BODY     = 380;
  const EST_QUOTE    = pullQuote ? 230 : 0;
  const EST_DODONT   = hasDoDont ? 192 : 0;
  const estimatedH   = EST_HEADER + EST_HEADLINE + EST_BODY + EST_QUOTE + EST_DODONT;
  const availableH   = PANEL_H - 80;
  const contentStartY = PANEL_TOP + 40 + Math.max(0, Math.floor((availableH - estimatedH) / 2));

  // ── 5. Sign symbol + name header ─────────────────────────────────────────────
  const symbol = (SIGN_SYMBOLS[horoscope.sign] ?? '✦') + '\uFE0E';
  ctx.font = '80px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols", serif';
  ctx.fillStyle = 'rgba(245,245,245,0.92)';
  ctx.textAlign = 'center';
  ctx.fillText(symbol, CX, contentStartY + 80);

  // Sign name in sign accent colour
  ctx.font = 'italic 300 96px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = signAccent;
  ctx.textAlign = 'center';
  ctx.fillText(horoscope.sign, CX, contentStartY + 180);

  // Date label in gold
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  ctx.font = '400 38px "Raleway", sans-serif';
  ctx.fillStyle = goldHex;
  ctx.textAlign = 'center';
  ctx.fillText(dateLabel, CX, contentStartY + 232);

  // Divider in sign accent
  ctx.strokeStyle = signAccent + 'AA';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(CX - 220, contentStartY + 260);
  ctx.lineTo(CX + 220, contentStartY + 260);
  ctx.stroke();

  // ── 6. Headline — centered on CX ────────────────────────────────────────────
  let y = drawWrappedText(
    ctx,
    horoscope.headline,
    INNER - 80,
    92,
    contentStartY + 360,
    'italic 300 78px "Cormorant Garamond", Georgia, serif',
    'rgba(245,245,245,1)',
    'center',
    CX,
    3,
  );

  y += 24;

  // ── 7. Body paragraph — centered block ─────────────────────────────────────
  const bodyText = truncateBody(horoscope.body, 320);
  y = drawWrappedText(
    ctx,
    bodyText,
    BODY_INNER,
    58,
    y,
    '300 40px "Raleway", sans-serif',
    'rgba(245,245,245,0.88)',
    'center',
    CX,
    6,
  );

  y += 32;

  // ── 8. Pull-quote block — centered ──────────────────────────────────────────
  if (pullQuote && y < PANEL_BOT - 380) {
    const quoteFont = 'italic 300 42px "Cormorant Garamond", Georgia, serif';
    ctx.font = quoteFont;
    const quoteWords = pullQuote.split(' ');
    const quoteLines: string[] = [];
    let qLine = '';
    for (const w of quoteWords) {
      const test = qLine ? `${qLine} ${w}` : w;
      if (ctx.measureText(test).width > BODY_INNER - 28 && qLine) {
        quoteLines.push(qLine);
        qLine = w;
      } else {
        qLine = test;
      }
    }
    if (qLine) quoteLines.push(qLine);

    const quoteLineH = 58;
    const quoteBlockH = quoteLines.length * quoteLineH + 20;
    // Center the quote block: bar + text anchored to CX - half of BODY_INNER
    const quoteBlockX = CX - BODY_INNER / 2;

    // Gold vertical bar on left of centered block
    ctx.fillStyle = goldHex;
    ctx.fillRect(quoteBlockX, y - 8, 5, quoteBlockH);

    // Quote text in lavender, left-aligned within centered block
    ctx.font = quoteFont;
    ctx.fillStyle = lavHex;
    ctx.textAlign = 'left';
    quoteLines.forEach((line, i) => {
      ctx.fillText(line, quoteBlockX + 24, y + i * quoteLineH);
    });
    ctx.textAlign = 'center';

    y += quoteBlockH + 36;
  }

  // ── 9. Do / Don't columns ─────────────────────────────────────────────────────

  if ((doText || dontText) && y < PANEL_BOT - 280) {
    const colW    = (INNER - 32) / 2;
    const colPad  = 20;
    const colH    = 160;
    const leftX   = PAD;
    const rightX  = PAD + colW + 32;

    // Do column
    if (doText) {
      drawRoundRect(ctx, leftX, y, colW, colH, 16);
      ctx.fillStyle = 'rgba(100,200,130,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,200,130,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '600 30px "Raleway", sans-serif';
      ctx.fillStyle = '#7EC8A0';
      ctx.textAlign = 'left';
      ctx.fillText('✓  DO', leftX + colPad, y + 40);

      ctx.font = '300 32px "Raleway", sans-serif';
      ctx.fillStyle = 'rgba(245,245,245,0.85)';
      const doLines = doText.split(' ').reduce<string[]>((acc, w) => {
        const last = acc[acc.length - 1] ?? '';
        ctx.font = '300 32px "Raleway", sans-serif';
        if (ctx.measureText(`${last} ${w}`).width > colW - colPad * 2 && last) {
          acc.push(w);
        } else {
          acc[acc.length - 1] = last ? `${last} ${w}` : w;
        }
        return acc;
      }, ['']);
      doLines.slice(0, 3).forEach((line, i) => {
        ctx.fillText(line, leftX + colPad, y + 76 + i * 38);
      });
    }

    // Don't column
    if (dontText) {
      drawRoundRect(ctx, rightX, y, colW, colH, 16);
      ctx.fillStyle = 'rgba(200,100,100,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,100,100,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '600 30px "Raleway", sans-serif';
      ctx.fillStyle = '#E87878';
      ctx.textAlign = 'left';
      ctx.fillText('✗  DON\'T', rightX + colPad, y + 40);

      ctx.font = '300 32px "Raleway", sans-serif';
      ctx.fillStyle = 'rgba(245,245,245,0.85)';
      const dontLines = dontText.split(' ').reduce<string[]>((acc, w) => {
        const last = acc[acc.length - 1] ?? '';
        ctx.font = '300 32px "Raleway", sans-serif';
        if (ctx.measureText(`${last} ${w}`).width > colW - colPad * 2 && last) {
          acc.push(w);
        } else {
          acc[acc.length - 1] = last ? `${last} ${w}` : w;
        }
        return acc;
      }, ['']);
      dontLines.slice(0, 3).forEach((line, i) => {
        ctx.fillText(line, rightX + colPad, y + 76 + i * 38);
      });
    }

    ctx.textAlign = 'center';
    y += colH + 32;
  }

  // ── 10. Logo footer — intentionally omitted ─────────────────────────────────
  // No Spellful logo or watermark is rendered on Instagram share images.
  // Pre-branded wallpapers (templates 6–14) carry the logo in their artwork;
  // unbranded templates (1–5) export clean so users may add their own caption.

  canvas.toBlob((blob) => resolve(blob!), 'image/png');
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  horoscope: DailyHoroscope;
}

export default function HoroscopeShareMenu({ horoscope }: Props) {
  const [open, setOpen] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const openMenu = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [open]);

  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const url      = 'https://spellful.com/horoscope';
  const symbol   = SIGN_SYMBOLS[horoscope.sign] ?? '✦';
  const postText = `${symbol} ${horoscope.sign} · ${horoscope.headline}\n\n${horoscope.body.slice(0, 140)}…\n\n✨ Read your full reading at spellful.com`;

  const trackShare = (platform: string) => {
    void fetch('/api/horoscope/share', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sign: horoscope.sign, platform }),
    });
  };

  const shareX        = () => { trackShare('x');        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(url)}`, '_blank'); setOpen(false); };
  const shareFacebook = () => { trackShare('facebook');  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(postText)}`, '_blank'); setOpen(false); };
  const shareBluesky  = () => { trackShare('bluesky');   window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(postText + '\n' + url)}`, '_blank'); setOpen(false); };
  const shareThreads  = () => { trackShare('threads');   window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(postText + '\n' + url)}`, '_blank'); setOpen(false); };

  const downloadStory = async () => {
    setGeneratingStory(true);
    trackShare('story_download');
    try {
      const blob = await generateStoryCanvas(horoscope);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `spellful-${horoscope.sign.toLowerCase()}-story.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setGeneratingStory(false);
      setOpen(false);
    }
  };

  const items = [
    {
      label: 'Threads', action: shareThreads,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.284 2.651Z"/></svg>,
    },
    {
      label: 'Bluesky', action: shareBluesky,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>,
    },
    {
      label: 'Facebook', action: shareFacebook,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    },
    {
      label: 'Post on X', action: shareX,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    },
    {
      label: generatingStory ? 'Generating…' : 'Instagram Story',
      action: downloadStory,
      isInstagram: true,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>,
    },
  ];

  const dropdown = (
    <AnimatePresence>
      {open && menuPos && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="shadow-xl"
            style={{
              position: 'fixed',
              top: menuPos.top,
              right: menuPos.right,
              zIndex: 9999,
              minWidth: 200,
              borderRadius: 14,
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              padding: '6px 0',
              overflow: 'hidden',
            }}
            role="menu"
            aria-label="Share horoscope"
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                disabled={generatingStory && item.label.includes('Instagram')}
                role="menuitem"
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors duration-150 disabled:opacity-50"
                style={{
                  color: 'hsl(var(--foreground))',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--muted))';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span style={{ color: 'hsl(var(--primary))' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => open ? setOpen(false) : openMenu()}
        aria-label="Share horoscope"
        aria-expanded={open}
        className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200"
        style={{
          background: open ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--primary))',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </>
  );
}
