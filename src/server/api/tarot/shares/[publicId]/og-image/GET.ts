/**
 * GET /api/tarot/shares/:publicId/og-image
 *
 * Returns a 1200×630 SVG image for Open Graph / social link previews.
 * No authentication required — this URL is embedded in og:image meta tags
 * and fetched by social crawlers.
 *
 * Uses pure SVG (no native addons) so it works on Alpine/musl.
 * The SVG is served as image/svg+xml; Facebook and most crawlers accept SVG
 * for og:image when the Content-Type is correct.
 */

import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';

interface ShareRow {
  spread_name: string;
  cards_snapshot: string;
  share_mode: string;
  public_title: string;
  public_summary: string;
  revoked_at: Date | null;
}

interface CardSnapshot {
  cardId: string;
  position: string;
  reversed: boolean;
  displayOrder: number;
}

/** Map a card ID to its slot URL path. */
function cardSlotUrl(cardId: string): string {
  const majorArcana = new Set([
    'the-fool','the-magician','the-high-priestess','the-empress','the-emperor',
    'the-hierophant','the-lovers','the-chariot','strength','the-hermit',
    'wheel-of-fortune','justice','the-hanged-man','death','temperance',
    'the-devil','the-tower','the-star','the-moon','the-sun','judgement','the-world',
  ]);
  if (majorArcana.has(cardId)) {
    return `https://spellful.com/airo-assets/images/tarot/major-arcana/${cardId}`;
  }
  // Determine suit from card name
  if (cardId.endsWith('-of-cups'))      return `https://spellful.com/airo-assets/images/tarot/cups/${cardId}`;
  if (cardId.endsWith('-of-wands'))     return `https://spellful.com/airo-assets/images/tarot/wands/${cardId}`;
  if (cardId.endsWith('-of-swords'))    return `https://spellful.com/airo-assets/images/tarot/swords/${cardId}`;
  if (cardId.endsWith('-of-pentacles')) return `https://spellful.com/airo-assets/images/tarot/pentacles/${cardId}`;
  return `https://spellful.com/airo-assets/images/tarot/major-arcana/${cardId}`;
}

/** Escape XML special characters. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Wrap text into lines of at most maxChars characters. */
function wrapSvgText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (test.length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSvg(share: ShareRow): string {
  let cards: CardSnapshot[] = [];
  try { cards = JSON.parse(share.cards_snapshot) as CardSnapshot[]; } catch { cards = []; }

  // Show up to 3 hero cards in the OG image
  const heroCards = cards.slice(0, 3);
  const W = 1200;
  const H = 630;

  // Card layout: up to 3 cards centred horizontally
  const CARD_W = 160;
  const CARD_H = 280;
  const CARD_GAP = 24;
  const totalCardsW = heroCards.length * CARD_W + (heroCards.length - 1) * CARD_GAP;
  const cardsStartX = (W - totalCardsW) / 2;
  const cardsY = 140;

  const cardElements = heroCards.map((card, i) => {
    const cx = cardsStartX + i * (CARD_W + CARD_GAP);
    const imgUrl = cardSlotUrl(card.cardId);
    const posLabel = esc(card.position ?? '');
    const reversedLabel = card.reversed ? ' · Reversed' : '';

    return `
      <!-- Card ${i + 1} -->
      <rect x="${cx}" y="${cardsY}" width="${CARD_W}" height="${CARD_H}" rx="10" ry="10"
            fill="#1A1530" stroke="#C9A84C" stroke-width="1.5"/>
      <image href="${esc(imgUrl)}" x="${cx + 4}" y="${cardsY + 4}"
             width="${CARD_W - 8}" height="${CARD_H - 8}"
             preserveAspectRatio="xMidYMid meet"
             clip-path="url(#cardClip${i})"
             ${card.reversed ? `transform="rotate(180 ${cx + CARD_W / 2} ${cardsY + CARD_H / 2})"` : ''}/>
      <clipPath id="cardClip${i}">
        <rect x="${cx + 4}" y="${cardsY + 4}" width="${CARD_W - 8}" height="${CARD_H - 8}" rx="8"/>
      </clipPath>
      ${posLabel ? `<text x="${cx + CARD_W / 2}" y="${cardsY + CARD_H + 22}"
            font-family="Georgia, serif" font-size="13" fill="#B8A9D9"
            text-anchor="middle">${posLabel}${esc(reversedLabel)}</text>` : ''}
    `;
  }).join('');

  // Title text
  const title = share.public_title || `My ${esc(share.spread_name)} Tarot Reading`;
  const titleLines = wrapSvgText(title, 48);

  // Summary text (cards_and_summary only)
  const summaryText = share.share_mode === 'cards_and_summary' ? share.public_summary : '';
  const summaryLines = summaryText ? wrapSvgText(summaryText, 72).slice(0, 2) : [];

  // Card count badge if more than 3 cards
  const extraCount = cards.length - 3;
  const extraBadge = extraCount > 0 ? `
    <rect x="${cardsStartX + totalCardsW + 12}" y="${cardsY + CARD_H / 2 - 20}" width="60" height="40" rx="8"
          fill="#C9A84C22" stroke="#C9A84C" stroke-width="1"/>
    <text x="${cardsStartX + totalCardsW + 42}" y="${cardsY + CARD_H / 2 + 6}"
          font-family="Raleway, sans-serif" font-size="16" fill="#C9A84C" text-anchor="middle">+${extraCount}</text>
  ` : '';

  const titleY = 80;
  const titleElements = titleLines.slice(0, 2).map((line, i) =>
    `<text x="${W / 2}" y="${titleY + i * 36}"
           font-family="Georgia, serif" font-size="30" font-style="italic"
           fill="white" text-anchor="middle">${esc(line)}</text>`
  ).join('');

  const summaryY = cardsY + CARD_H + 60;
  const summaryElements = summaryLines.map((line, i) =>
    `<text x="${W / 2}" y="${summaryY + i * 28}"
           font-family="Raleway, sans-serif" font-size="18"
           fill="rgba(245,245,245,0.82)" text-anchor="middle">${esc(line)}</text>`
  ).join('');

  const ctaY = H - 44;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0D0B1A"/>
      <stop offset="50%" stop-color="#1A1530"/>
      <stop offset="100%" stop-color="#0D0B1A"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#3D2060" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0D0B1A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Decorative stars -->
  <circle cx="60" cy="60" r="1.5" fill="#C9A84C" opacity="0.7"/>
  <circle cx="120" cy="30" r="1" fill="white" opacity="0.5"/>
  <circle cx="1140" cy="60" r="1.5" fill="#C9A84C" opacity="0.7"/>
  <circle cx="1080" cy="30" r="1" fill="white" opacity="0.5"/>
  <circle cx="40" cy="580" r="1" fill="#B8A9D9" opacity="0.6"/>
  <circle cx="1160" cy="580" r="1" fill="#B8A9D9" opacity="0.6"/>

  <!-- Gold top accent line -->
  <rect x="80" y="20" width="120" height="2" fill="#C9A84C" opacity="0.8"/>
  <rect x="${W - 200}" y="20" width="120" height="2" fill="#C9A84C" opacity="0.8"/>

  <!-- Title -->
  ${titleElements}

  <!-- Gold divider -->
  <rect x="${W / 2 - 80}" y="${titleY + titleLines.slice(0, 2).length * 36 + 8}" width="160" height="1.5" fill="#C9A84C" opacity="0.7"/>

  <!-- Card images -->
  ${cardElements}
  ${extraBadge}

  <!-- Summary -->
  ${summaryElements}

  <!-- CTA footer -->
  <text x="${W / 2}" y="${ctaY}"
        font-family="Raleway, sans-serif" font-size="16" fill="#C9A84C88"
        text-anchor="middle">✦  Discover your own reading at spellful.com  ✦</text>

  <!-- Logo text fallback (white) -->
  <text x="80" y="${H - 20}"
        font-family="Georgia, serif" font-size="14" fill="rgba(255,255,255,0.4)"
        text-anchor="start">Spellful</text>
</svg>`;
}

export default async function handler(req: Request<{ publicId: string }>, res: Response): Promise<void> {
  const { publicId } = req.params;

  if (!publicId || !/^[A-Za-z0-9_-]{20,30}$/.test(publicId)) {
    res.status(404).end();
    return;
  }

  const [rows] = await db.execute(
    sql`SELECT spread_name, cards_snapshot, share_mode, public_title, public_summary, revoked_at
        FROM tarot_shares WHERE public_id = ${publicId} LIMIT 1`
  ) as unknown as [ShareRow[], unknown];

  const share = rows[0];
  if (!share || share.revoked_at != null) {
    // Return a minimal "unavailable" SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="#0D0B1A"/>
      <text x="600" y="315" font-family="Georgia,serif" font-size="32" fill="#B8A9D9" text-anchor="middle">This reading is no longer available.</text>
    </svg>`);
    return;
  }

  const svg = buildSvg(share);

  // Cache for 1 hour — content is immutable once published
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
}
