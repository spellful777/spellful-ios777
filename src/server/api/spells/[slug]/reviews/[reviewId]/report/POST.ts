import type { Request, Response } from 'express';
import { db } from '../../../../../../db/client.js';
import { spells, spellReviews, reviewReports } from '../../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../../../../lib/auth-session.js';

const VALID_REASONS = ['spam', 'harassment', 'misinformation', 'inappropriate', 'other'];

export default async function handler(req: Request<{ slug: string; reviewId: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { slug, reviewId } = req.params;
  const reviewIdNum = parseInt(reviewId, 10);
  const { reason } = req.body as { reason: string };

  if (!reason || !VALID_REASONS.includes(reason)) {
    return res.status(400).json({ error: `reason must be one of: ${VALID_REASONS.join(', ')}` });
  }

  const [spell] = await db.select({ id: spells.id })
    .from(spells).where(and(eq(spells.slug, slug), eq(spells.status, 'approved'))).limit(1);
  if (!spell) return res.status(404).json({ error: 'Spell not found' });

  const [review] = await db.select({ id: spellReviews.id })
    .from(spellReviews)
    .where(and(eq(spellReviews.id, reviewIdNum), eq(spellReviews.spellId, spell.id)))
    .limit(1);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  // One report per user per review
  const [existing] = await db
    .select({ id: reviewReports.id })
    .from(reviewReports)
    .where(and(eq(reviewReports.reviewId, reviewIdNum), eq(reviewReports.userId, session.user.id)))
    .limit(1);
  if (existing) return res.status(409).json({ error: 'You have already reported this review' });

  await db.insert(reviewReports).values({ reviewId: reviewIdNum, userId: session.user.id, reason });
  res.json({ message: 'Report submitted. Our team will review it.' });
}
