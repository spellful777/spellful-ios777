import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { spells, spellReviews, user } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '../../../../lib/auth-session.js';

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const session = await getAuthSession(req);
  if (!session) { res.status(401).json({ error: 'Unauthorized' }); return false; }
  const [u] = await db.select({ isAdmin: user.isAdmin }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!u?.isAdmin) { res.status(403).json({ error: 'Forbidden' }); return false; }
  return true;
}

export default async function handler(req: Request<{ id: string }>, res: Response) {
  if (!await requireAdmin(req, res)) return;

  const spellId = parseInt(req.params.id, 10);
  const {
    action,
    rejectionReason,
    isFeatured,
    // Editable fields
    title, subtitle, purpose, intention, difficulty,
    durationMinutes, moonPhase, bestTiming, materials,
    steps, safetyNotes, herbCorrespondences, crystalCorrespondences,
    elementCorrespondences,
    // Review moderation
    reviewId, moderationNote,
  } = req.body as {
    action?: string;
    rejectionReason?: string;
    isFeatured?: boolean;
    title?: string;
    subtitle?: string;
    purpose?: string;
    intention?: string;
    difficulty?: string;
    durationMinutes?: number;
    moonPhase?: string;
    bestTiming?: string;
    materials?: string[];
    steps?: Array<{ order: number; title: string; description: string }>;
    safetyNotes?: string;
    herbCorrespondences?: string[];
    crystalCorrespondences?: string[];
    elementCorrespondences?: string[];
    reviewId?: number;
    moderationNote?: string;
  };

  const [spell] = await db.select().from(spells).where(eq(spells.id, spellId)).limit(1);
  if (!spell) return res.status(404).json({ error: 'Spell not found' });

  if (action === 'approve') {
    await db.update(spells).set({ status: 'approved', rejectionReason: '' }).where(eq(spells.id, spellId));
    return res.json({ message: 'Spell approved' });
  }

  if (action === 'reject') {
    await db.update(spells).set({ status: 'rejected', rejectionReason: rejectionReason ?? '' }).where(eq(spells.id, spellId));
    return res.json({ message: 'Spell rejected' });
  }

  if (action === 'feature') {
    await db.update(spells).set({ isFeatured: isFeatured ?? true }).where(eq(spells.id, spellId));
    return res.json({ message: `Spell ${isFeatured ? 'featured' : 'unfeatured'}` });
  }

  if (action === 'moderate_review' && reviewId) {
    await db.update(spellReviews).set({ isModerated: true, moderationNote: moderationNote ?? '' }).where(eq(spellReviews.id, reviewId));
    // Adjust denormalized counters
    const [review] = await db.select({ rating: spellReviews.rating }).from(spellReviews).where(eq(spellReviews.id, reviewId)).limit(1);
    if (review) {
      await db.update(spells).set({
        ratingCount: Math.max(0, spell.ratingCount - 1),
        ratingSum: Math.max(0, spell.ratingSum - review.rating),
      }).where(eq(spells.id, spellId));
    }
    return res.json({ message: 'Review moderated' });
  }

  if (action === 'delete_review' && reviewId) {
    const [review] = await db.select({ rating: spellReviews.rating }).from(spellReviews).where(eq(spellReviews.id, reviewId)).limit(1);
    await db.delete(spellReviews).where(eq(spellReviews.id, reviewId));
    if (review) {
      await db.update(spells).set({
        ratingCount: Math.max(0, spell.ratingCount - 1),
        ratingSum: Math.max(0, spell.ratingSum - review.rating),
      }).where(eq(spells.id, spellId));
    }
    return res.json({ message: 'Review deleted' });
  }

  // Edit spell fields
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (subtitle !== undefined) updates.subtitle = subtitle;
  if (purpose !== undefined) updates.purpose = purpose;
  if (intention !== undefined) updates.intention = intention;
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
  if (moonPhase !== undefined) updates.moonPhase = moonPhase;
  if (bestTiming !== undefined) updates.bestTiming = bestTiming;
  if (materials !== undefined) updates.materials = materials;
  if (steps !== undefined) updates.steps = steps;
  if (safetyNotes !== undefined) updates.safetyNotes = safetyNotes;
  if (herbCorrespondences !== undefined) updates.herbCorrespondences = herbCorrespondences;
  if (crystalCorrespondences !== undefined) updates.crystalCorrespondences = crystalCorrespondences;
  if (elementCorrespondences !== undefined) updates.elementCorrespondences = elementCorrespondences;
  if (isFeatured !== undefined) updates.isFeatured = isFeatured;

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });

  await db.update(spells).set(updates as unknown as typeof spells.$inferInsert).where(eq(spells.id, spellId));
  res.json({ message: 'Spell updated' });
}
