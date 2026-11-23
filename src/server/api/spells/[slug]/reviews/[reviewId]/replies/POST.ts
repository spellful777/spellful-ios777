import type { Request, Response } from 'express';
import { db } from '../../../../../../db/client.js';
import { spells, spellReviews, reviewReplies } from '../../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../../../../lib/auth-session.js';

export default async function handler(req: Request<{ slug: string; reviewId: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { slug, reviewId } = req.params;
  const reviewIdNum = parseInt(reviewId, 10);
  const { body } = req.body as { body: string };

  if (!body || body.trim().length < 2) return res.status(400).json({ error: 'Reply must be at least 2 characters' });
  if (body.length > 1000) return res.status(400).json({ error: 'Reply too long (max 1000 characters)' });

  const [spell] = await db.select({ id: spells.id })
    .from(spells).where(and(eq(spells.slug, slug), eq(spells.status, 'approved'))).limit(1);
  if (!spell) return res.status(404).json({ error: 'Spell not found' });

  const [review] = await db.select({ id: spellReviews.id })
    .from(spellReviews)
    .where(and(eq(spellReviews.id, reviewIdNum), eq(spellReviews.spellId, spell.id), eq(spellReviews.isModerated, false)))
    .limit(1);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  // Rate limit: max 5 replies per user per review
  const replyCount = await db.$count(
    reviewReplies,
    and(eq(reviewReplies.reviewId, reviewIdNum), eq(reviewReplies.userId, session.user.id))
  );
  if (replyCount >= 5) return res.status(429).json({ error: 'Too many replies on this review' });

  const [result] = await db.insert(reviewReplies).values({
    reviewId: reviewIdNum,
    userId: session.user.id,
    body: body.trim(),
    isModerated: false,
  });

  res.status(201).json({ id: result.insertId, message: 'Reply posted' });
}
