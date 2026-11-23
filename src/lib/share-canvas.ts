/**
 * share-canvas.ts — Canvas-based share card generator for Spellful.
 * Produces 1080×1920 story cards and 1080×1080 square posts.
 * Uses the same native Canvas approach as HoroscopeShareMenu.
 */

export type ShareCardFormat = 'story' | 'square';

export interface ShareCardPayload {
  title: string;
  subtitle?: string;
  description?: string;
  contentType?: string;
  format: ShareCardFormat;
  /** Optional background image URL (slot URL or absolute) */
  backgroundUrl?: string;
}

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

/** Wrap text to fit within maxWidth, returning an array of lines. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Draw a rounded rectangle path. */
function roundRect(
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

function renderCard(
  resolve: (blob: Blob) => void,
  payload: ShareCardPayload,
  bgImg: HTMLImageElement | null,
) {
  const isStory = payload.format === 'story';
  const W = 1080;
  const H = isStory ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Background ──────────────────────────────────────────────────────────────
  if (bgImg && bgImg.naturalWidth > 0) {
    const scale = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const dw = bgImg.naturalWidth * scale;
    const dh = bgImg.naturalHeight * scale;
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    // Fallback: deep celestial gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0D0B1A');
    grad.addColorStop(0.5, '#1A1530');
    grad.addColorStop(1, '#0D0B1A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Dark overlay for readability
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, 'rgba(0,0,0,0.35)');
  overlay.addColorStop(0.5, 'rgba(0,0,0,0.55)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // Brand colours from CSS variables
  const goldHex = cssVarToHex('--primary');
  const lavHex  = cssVarToHex('--accent');

  // ── Content panel ───────────────────────────────────────────────────────────
  const PAD  = 72;
  const INNER = W - PAD * 2;
  const CX   = W / 2;

  const panelTop = isStory ? 380 : 160;
  const panelH   = isStory ? 1160 : 720;

  roundRect(ctx, PAD, panelTop, INNER, panelH, 40);
  ctx.fillStyle = 'rgba(13, 11, 26, 0.82)';
  ctx.fill();
  ctx.strokeStyle = `${goldHex}55`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Gold top accent line ─────────────────────────────────────────────────────
  ctx.fillStyle = goldHex;
  ctx.fillRect(PAD + 40, panelTop, 120, 3);

  let y = panelTop + 64;

  // ── Content type label ───────────────────────────────────────────────────────
  if (payload.contentType) {
    ctx.font = '500 32px Raleway, sans-serif';
    ctx.fillStyle = lavHex;
    ctx.textAlign = 'center';
    ctx.fillText(payload.contentType.toUpperCase(), CX, y);
    y += 52;
  }

  // ── Title ────────────────────────────────────────────────────────────────────
  ctx.font = `bold ${isStory ? 80 : 64}px "Cormorant Garamond", Georgia, serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  const titleLines = wrapText(ctx, payload.title, INNER - 80);
  const titleLineH = isStory ? 92 : 76;
  for (const line of titleLines.slice(0, 3)) {
    ctx.fillText(line, CX, y);
    y += titleLineH;
  }
  y += 16;

  // ── Gold divider ─────────────────────────────────────────────────────────────
  ctx.fillStyle = goldHex;
  ctx.fillRect(CX - 60, y, 120, 2);
  y += 36;

  // ── Subtitle ─────────────────────────────────────────────────────────────────
  if (payload.subtitle) {
    ctx.font = `italic ${isStory ? 44 : 36}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = goldHex;
    ctx.textAlign = 'center';
    const subLines = wrapText(ctx, payload.subtitle, INNER - 120);
    for (const line of subLines.slice(0, 2)) {
      ctx.fillText(line, CX, y);
      y += isStory ? 54 : 46;
    }
    y += 12;
  }

  // ── Description ──────────────────────────────────────────────────────────────
  if (payload.description) {
    ctx.font = `${isStory ? 36 : 30}px Raleway, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.80)';
    ctx.textAlign = 'center';
    const descLines = wrapText(ctx, payload.description, INNER - 120);
    for (const line of descLines.slice(0, isStory ? 5 : 4)) {
      ctx.fillText(line, CX, y);
      y += isStory ? 48 : 40;
    }
  }

  // ── Stars decoration ─────────────────────────────────────────────────────────
  const starPositions: [number, number][] = isStory
    ? [[PAD + 30, panelTop + 30], [W - PAD - 30, panelTop + 30], [PAD + 30, panelTop + panelH - 30], [W - PAD - 30, panelTop + panelH - 30]]
    : [[PAD + 20, panelTop + 20], [W - PAD - 20, panelTop + 20]];
  ctx.font = '28px sans-serif';
  ctx.fillStyle = `${goldHex}99`;
  ctx.textAlign = 'center';
  for (const [sx, sy] of starPositions) {
    ctx.fillText('✦', sx, sy);
  }

  canvas.toBlob((blob) => resolve(blob!), 'image/png');
}

/** Generate a share card as a PNG Blob. */
export function generateShareCard(payload: ShareCardPayload): Promise<Blob> {
  return new Promise((resolve) => {
    if (payload.backgroundUrl) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => renderCard(resolve, payload, bgImg);
      bgImg.onerror = () => renderCard(resolve, payload, null);
      bgImg.src = payload.backgroundUrl;
    } else {
      renderCard(resolve, payload, null);
    }
  });
}

/** Download a Blob as a file. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
