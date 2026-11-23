import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { spells, spellReviews } from '../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../../lib/auth-session.js';

export default async function handler(req: Request<{ slug: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { slug } = req.params;
  const { rating, body } = req.body as { rating: number; body: string };

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be 1–5' });
  }
  if (!body || body.trim().length < 10) {
    return res.status(400).json({ error: 'Review must be at least 10 characters' });
  }
  if (body.length > 2000) {
    return res.status(400).json({ error: 'Review too long (max 2000 characters)' });
  }

  try {
    const [spell] = await db
      .select({ id: spells.id, ratingCount: spells.ratingCount, ratingSum: spells.ratingSum })
      .from(spells)
      .where(and(eq(spells.slug, slug), eq(spells.status, 'approved')))
      .limit(1);
    if (!spell) return res.status(404).json({ error: 'Spell not found' });

    // One review per user per spell
    const [existing] = await db
      .select({ id: spellReviews.id })
      .from(spellReviews)
      .where(and(eq(spellReviews.spellId, spell.id), eq(spellReviews.userId, session.user.id)))
      .limit(1);
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this spell. Edit your existing review.' });
    }

    const [result] = await db.insert(spellReviews).values({
      spellId: spell.id,
      userId: session.user.id,
      rating,
      body: body.trim(),
      isModerated: false,
      helpfulCount: 0,
    });

    // Update denormalized counters
    await db
      .update(spells)
      .set({
        ratingCount: spell.ratingCount + 1,
        ratingSum: spell.ratingSum + rating,
      })
      .where(eq(spells.id, spell.id));

    res.status(201).json({ id: result.insertId, message: 'Review submitted' });
  } catch (error) {
    console.error('[spells/reviews/POST] DB error:', error);
    res.status(500).json({ error: 'Failed to submit review', message: 'Internal server error' });
  }
}
