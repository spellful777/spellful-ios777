import type { Request, Response } from 'express';
import { db } from '../../../../../db/client.js';
import { spells, spellReviews, user } from '../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../../../lib/auth-session.js';

export default async function handler(req: Request<{ slug: string; reviewId: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { slug, reviewId } = req.params;
  const reviewIdNum = parseInt(reviewId, 10);

  const [spell] = await db.select({ id: spells.id, ratingCount: spells.ratingCount, ratingSum: spells.ratingSum })
    .from(spells).where(and(eq(spells.slug, slug), eq(spells.status, 'approved'))).limit(1);
  if (!spell) return res.status(404).json({ error: 'Spell not found' });

  const [review] = await db.select().from(spellReviews)
    .where(and(eq(spellReviews.id, reviewIdNum), eq(spellReviews.spellId, spell.id)))
    .limit(1);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  // Check ownership or admin
  const [currentUser] = await db.select({ isAdmin: user.isAdmin }).from(user).where(eq(user.id, session.user.id)).limit(1);
  const isAdmin = currentUser?.isAdmin ?? false;

  if (review.userId !== session.user.id && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await db.delete(spellReviews).where(eq(spellReviews.id, reviewIdNum));

  // Update denormalized counters
  if (spell.ratingCount > 0) {
    await db.update(spells).set({
      ratingCount: Math.max(0, spell.ratingCount - 1),
      ratingSum: Math.max(0, spell.ratingSum - review.rating),
    }).where(eq(spells.id, spell.id));
  }

  res.json({ message: 'Review deleted' });
}
