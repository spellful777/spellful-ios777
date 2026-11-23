/**
 * GET /api/tarot/shares/:publicId
 * Returns the public share snapshot. No authentication required.
 * Returns 404 for revoked or non-existent shares.
 */

import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';

interface ShareRow {
  public_id: string;
  spread_type: string;
  spread_name: string;
  cards_snapshot: string;
  share_mode: string;
  public_title: string;
  public_summary: string;
  published_at: Date;
  revoked_at: Date | null;
}

export default async function handler(req: Request<{ publicId: string }>, res: Response): Promise<void> {
  const { publicId } = req.params;

  if (!publicId || !/^[A-Za-z0-9_-]{20,30}$/.test(publicId)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const [rows] = await db.execute(
    sql`SELECT public_id, spread_type, spread_name, cards_snapshot, share_mode,
               public_title, public_summary, published_at, revoked_at
        FROM tarot_shares
        WHERE public_id = ${publicId}
        LIMIT 1`
  ) as unknown as [ShareRow[], unknown];

  const share = rows[0];
  if (!share || share.revoked_at != null) {
    res.status(404).json({ error: 'This reading share is no longer available.' });
    return;
  }

  let cards: unknown[] = [];
  try {
    cards = JSON.parse(share.cards_snapshot) as unknown[];
  } catch {
    cards = [];
  }

  res.json({
    publicId: share.public_id,
    spreadType: share.spread_type,
    spreadName: share.spread_name,
    cards,
    shareMode: share.share_mode,
    publicTitle: share.public_title,
    publicSummary: share.public_summary,
    publishedAt: share.published_at,
  });
}
