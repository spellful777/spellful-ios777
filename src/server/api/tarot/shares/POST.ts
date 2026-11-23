/**
 * POST /api/tarot/shares
 * Creates a public share snapshot for a completed tarot reading.
 *
 * Body:
 *   spreadType    string
 *   spreadName    string
 *   cards         Array<{ cardId, position, reversed, displayOrder }>
 *   shareMode     'cards_and_summary' | 'cards_only'
 *   publicTitle   string (user-approved, sanitised)
 *   publicSummary string (user-approved, sanitised; empty for cards_only)
 *   sourceReadingId? number (optional reference to saved reading the user owns)
 *
 * Returns: { publicId, url }
 */

import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';

// Allowed card IDs — major arcana + 4 suits × 14 = 78 cards
const VALID_CARD_IDS = new Set([
  // Major Arcana
  'the-fool','the-magician','the-high-priestess','the-empress','the-emperor',
  'the-hierophant','the-lovers','the-chariot','strength','the-hermit',
  'wheel-of-fortune','justice','the-hanged-man','death','temperance',
  'the-devil','the-tower','the-star','the-moon','the-sun','judgement','the-world',
  // Cups
  'ace-of-cups','two-of-cups','three-of-cups','four-of-cups','five-of-cups',
  'six-of-cups','seven-of-cups','eight-of-cups','nine-of-cups','ten-of-cups',
  'page-of-cups','knight-of-cups','queen-of-cups','king-of-cups',
  // Wands
  'ace-of-wands','two-of-wands','three-of-wands','four-of-wands','five-of-wands',
  'six-of-wands','seven-of-wands','eight-of-wands','nine-of-wands','ten-of-wands',
  'page-of-wands','knight-of-wands','queen-of-wands','king-of-wands',
  // Swords
  'ace-of-swords','two-of-swords','three-of-swords','four-of-swords','five-of-swords',
  'six-of-swords','seven-of-swords','eight-of-swords','nine-of-swords','ten-of-swords',
  'page-of-swords','knight-of-swords','queen-of-swords','king-of-swords',
  // Pentacles
  'ace-of-pentacles','two-of-pentacles','three-of-pentacles','four-of-pentacles','five-of-pentacles',
  'six-of-pentacles','seven-of-pentacles','eight-of-pentacles','nine-of-pentacles','ten-of-pentacles',
  'page-of-pentacles','knight-of-pentacles','queen-of-pentacles','king-of-pentacles',
]);

interface CardSnapshot {
  cardId: string;
  position: string;
  reversed: boolean;
  displayOrder: number;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const {
    spreadType,
    spreadName,
    cards,
    shareMode,
    publicTitle,
    publicSummary,
    sourceReadingId,
  } = req.body as {
    spreadType?: string;
    spreadName?: string;
    cards?: CardSnapshot[];
    shareMode?: string;
    publicTitle?: string;
    publicSummary?: string;
    sourceReadingId?: number;
  };

  // ── Validation ────────────────────────────────────────────────────────────
  if (!spreadType || typeof spreadType !== 'string') {
    res.status(400).json({ error: 'spreadType is required' });
    return;
  }
  if (!Array.isArray(cards) || cards.length === 0 || cards.length > 22) {
    res.status(400).json({ error: 'cards must be an array of 1–22 items' });
    return;
  }
  for (const c of cards) {
    if (!c.cardId || !VALID_CARD_IDS.has(c.cardId)) {
      res.status(400).json({ error: `Invalid cardId: ${c.cardId}` });
      return;
    }
  }
  if (shareMode !== 'cards_and_summary' && shareMode !== 'cards_only') {
    res.status(400).json({ error: 'shareMode must be cards_and_summary or cards_only' });
    return;
  }
  const safeTitle   = String(publicTitle ?? '').slice(0, 120).trim();
  const safeSummary = shareMode === 'cards_only' ? '' : String(publicSummary ?? '').slice(0, 400).trim();
  const safeSpreadName = String(spreadName ?? spreadType).slice(0, 80).trim();

  // ── Verify sourceReadingId ownership if provided ──────────────────────────
  if (sourceReadingId != null) {
    const [rows] = await db.execute(
      sql`SELECT id FROM tarot_readings WHERE id = ${sourceReadingId} AND user_id = ${session.user.id} LIMIT 1`
    ) as unknown as [Array<{ id: number }>, unknown];
    if (!rows.length) {
      res.status(403).json({ error: 'Reading not found or not owned by you' });
      return;
    }
  }

  // ── Rate limit: max 20 active shares per user ─────────────────────────────
  const [countRows] = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM tarot_shares WHERE owner_user_id = ${session.user.id} AND revoked_at IS NULL`
  ) as unknown as [Array<{ cnt: number }>, unknown];
  if ((countRows[0]?.cnt ?? 0) >= 20) {
    res.status(429).json({ error: 'Maximum active shares reached. Revoke an existing share first.' });
    return;
  }

  // ── Create snapshot ───────────────────────────────────────────────────────
  const publicId = crypto.randomBytes(18).toString('base64url');
  const cardsJson = JSON.stringify(cards);

  await db.execute(sql`
    INSERT INTO tarot_shares
      (public_id, owner_user_id, source_reading_id, spread_type, spread_name,
       cards_snapshot, share_mode, public_title, public_summary, published_at)
    VALUES
      (${publicId}, ${session.user.id}, ${sourceReadingId ?? null}, ${spreadType},
       ${safeSpreadName}, ${cardsJson}, ${shareMode}, ${safeTitle}, ${safeSummary}, NOW())
  `);

  const shareUrl = `https://spellful.com/tarot/share/${publicId}`;
  res.status(201).json({ publicId, url: shareUrl });
}
