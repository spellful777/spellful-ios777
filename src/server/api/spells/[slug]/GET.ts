import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { spells, spellReviews, reviewReplies, reviewHelpfulVotes, user } from '../../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request<{ slug: string }>, res: Response) {
  const { slug } = req.params;
  const session = await getAuthSession(req);

  const [spell] = await db.select().from(spells).where(eq(spells.slug, slug)).limit(1);
  if (!spell) return res.status(404).json({ error: 'Spell not found' });
  if (spell.status !== 'approved') return res.status(404).json({ error: 'Spell not found' });

  // Fetch related spells
  let relatedSpells: Array<{ id: number; slug: string; title: string; intention: string; difficulty: string }> = [];
  if (spell.relatedSpellIds && spell.relatedSpellIds.length > 0) {
    relatedSpells = await db
      .select({ id: spells.id, slug: spells.slug, title: spells.title, intention: spells.intention, difficulty: spells.difficulty })
      .from(spells)
      .where(eq(spells.status, 'approved'))
      .limit(4);
  } else {
    // Auto-related: same intention, different spell
    relatedSpells = await db
      .select({ id: spells.id, slug: spells.slug, title: spells.title, intention: spells.intention, difficulty: spells.difficulty })
      .from(spells)
      .where(and(eq(spells.intention, spell.intention), eq(spells.status, 'approved')))
      .limit(5);
    relatedSpells = relatedSpells.filter((s) => s.id !== spell.id).slice(0, 4);
  }

  // Fetch reviews (non-moderated only)
  const reviews = await db
    .select({
      id: spellReviews.id,
      userId: spellReviews.userId,
      rating: spellReviews.rating,
      body: spellReviews.body,
      helpfulCount: spellReviews.helpfulCount,
      createdAt: spellReviews.createdAt,
      updatedAt: spellReviews.updatedAt,
    })
    .from(spellReviews)
    .where(and(eq(spellReviews.spellId, spell.id), eq(spellReviews.isModerated, false)))
    .orderBy(desc(spellReviews.helpfulCount), desc(spellReviews.createdAt))
    .limit(20);

  // Fetch reviewer names
  const reviewerIds = [...new Set(reviews.map((r) => r.userId))];
  const reviewers = reviewerIds.length > 0
    ? await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, reviewerIds[0])).limit(reviewerIds.length)
    : [];
  const reviewerMap = Object.fromEntries(reviewers.map((u) => [u.id, u.name]));

  // Fetch replies for each review
  const reviewIds = reviews.map((r) => r.id);
  const allReplies = reviewIds.length > 0
    ? await db
        .select({
          id: reviewReplies.id,
          reviewId: reviewReplies.reviewId,
          userId: reviewReplies.userId,
          body: reviewReplies.body,
          createdAt: reviewReplies.createdAt,
        })
        .from(reviewReplies)
        .where(eq(reviewReplies.isModerated, false))
        .orderBy(reviewReplies.createdAt)
    : [];

  // Fetch helpful votes for current user
  let userHelpfulVotes: number[] = [];
  let userReviewId: number | null = null;
  let userRating: number | null = null;
  let userSaved = false;

  if (session) {
    const [userReview] = await db
      .select({ id: spellReviews.id, rating: spellReviews.rating })
      .from(spellReviews)
      .where(and(eq(spellReviews.spellId, spell.id), eq(spellReviews.userId, session.user.id)))
      .limit(1);
    if (userReview) {
      userReviewId = userReview.id;
      userRating = userReview.rating;
    }

    const votes = await db
      .select({ reviewId: reviewHelpfulVotes.reviewId })
      .from(reviewHelpfulVotes)
      .where(eq(reviewHelpfulVotes.userId, session.user.id));
    userHelpfulVotes = votes.map((v) => v.reviewId);

    // Check if saved to grimoire
    const { spellSaves } = await import('../../../db/schema.js');
    const [saved] = await db
      .select({ id: spellSaves.id })
      .from(spellSaves)
      .where(and(eq(spellSaves.spellId, spell.id), eq(spellSaves.userId, session.user.id)))
      .limit(1);
    userSaved = !!saved;
  }

  // Rating distribution
  const allRatings = await db
    .select({ rating: spellReviews.rating })
    .from(spellReviews)
    .where(and(eq(spellReviews.spellId, spell.id), eq(spellReviews.isModerated, false)));

  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: allRatings.filter((r) => r.rating === star).length,
  }));

  const reviewsWithMeta = reviews.map((r) => ({
    ...r,
    authorName: reviewerMap[r.userId] ?? 'Member',
    isOwn: session?.user.id === r.userId,
    replies: allReplies
      .filter((reply) => reply.reviewId === r.id)
      .map((reply) => ({
        ...reply,
        isOwn: session?.user.id === reply.userId,
      })),
    userMarkedHelpful: userHelpfulVotes.includes(r.id),
  }));

  res.json({
    spell,
    relatedSpells,
    reviews: reviewsWithMeta,
    ratingDistribution: distribution,
    userState: {
      reviewId: userReviewId,
      rating: userRating,
      saved: userSaved,
    },
  });
}
