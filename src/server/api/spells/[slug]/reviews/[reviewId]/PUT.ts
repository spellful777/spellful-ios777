import type { Request, Response } from 'express';
import { db } from '../../../../../db/client.js';
import { spells, spellReviews } from '../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../../../lib/auth-session.js';

export default async function handler(req: Request<{ slug: string; reviewId: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { slug, reviewId } = req.params;
  const reviewIdNum = parseInt(reviewId, 10);
  const { rating, body } = req.body as { rating?: number; body?: string };

  if (rating !== undefined && (rating < 1 || rating > 5)) return res.status(400).json({ error: 'rating must be 1–5' });
  if (body !== undefined && body.trim().length < 10) return res.status(400).json({ error: 'Review must be at least 10 characters' });
  if (body !== undefined && body.length > 2000) return res.status(400).json({ error: 'Review too long' });

  const [spell] = await db.select({ id: spells.id, ratingCount: spells.ratingCount, ratingSum: spells.ratingSum })
    .from(spells).where(and(eq(spells.slug, slug), eq(spells.status, 'approved'))).limit(1);
  if (!spell) return res.status(404).json({ error: 'Spell not found' });

  const [review] = await db
    .select()
    .from(spellReviews)
    .where(and(eq(spellReviews.id, reviewIdNum), eq(spellReviews.spellId, spell.id), eq(spellReviews.userId, session.user.id)))
    .limit(1);
  if (!review) return res.status(404).json({ error: 'Review not found or not yours' });

  const updates: Partial<typeof review> = {};
  if (body !== undefined) updates.body = body.trim();

  if (rating !== undefined && rating !== review.rating) {
    updates.rating = rating;
    // Adjust denormalized sum
    await db.update(spells).set({
      ratingSum: spell.ratingSum - review.rating + rating,
    }).where(eq(spells.id, spell.id));
  }

  await db.update(spellReviews).set(updates).where(eq(spellReviews.id, reviewIdNum));
  res.json({ message: 'Review updated' });
}
