import type { Request, Response } from 'express';
import { db } from '../../../../../../db/client.js';
import { spells, spellReviews, reviewHelpfulVotes } from '../../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../../../../lib/auth-session.js';

export default async function handler(req: Request<{ slug: string; reviewId: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { slug, reviewId } = req.params;
  const reviewIdNum = parseInt(reviewId, 10);

  const [spell] = await db.select({ id: spells.id })
    .from(spells).where(and(eq(spells.slug, slug), eq(spells.status, 'approved'))).limit(1);
  if (!spell) return res.status(404).json({ error: 'Spell not found' });

  const [review] = await db.select({ id: spellReviews.id, userId: spellReviews.userId, helpfulCount: spellReviews.helpfulCount })
    .from(spellReviews)
    .where(and(eq(spellReviews.id, reviewIdNum), eq(spellReviews.spellId, spell.id), eq(spellReviews.isModerated, false)))
    .limit(1);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  // Cannot mark your own review helpful
  if (review.userId === session.user.id) {
    return res.status(400).json({ error: 'You cannot mark your own review as helpful' });
  }

  const [existing] = await db
    .select({ id: reviewHelpfulVotes.id })
    .from(reviewHelpfulVotes)
    .where(and(eq(reviewHelpfulVotes.reviewId, reviewIdNum), eq(reviewHelpfulVotes.userId, session.user.id)))
    .limit(1);

  if (existing) {
    // Toggle off
    await db.delete(reviewHelpfulVotes).where(eq(reviewHelpfulVotes.id, existing.id));
    await db.update(spellReviews).set({ helpfulCount: Math.max(0, review.helpfulCount - 1) }).where(eq(spellReviews.id, reviewIdNum));
    return res.json({ helpful: false, helpfulCount: Math.max(0, review.helpfulCount - 1) });
  }

  await db.insert(reviewHelpfulVotes).values({ reviewId: reviewIdNum, userId: session.user.id });
  await db.update(spellReviews).set({ helpfulCount: review.helpfulCount + 1 }).where(eq(spellReviews.id, reviewIdNum));
  res.json({ helpful: true, helpfulCount: review.helpfulCount + 1 });
}
