/**
 * PUT /api/profile/badges
 * Self-service: toggle interest badge on/off, or update visibility/sort order.
 *
 * Body: { badgeKey: string, action: 'add' | 'remove' | 'toggle_visibility' | 'reorder', sortOrder?: number }
 *
 * Only 'interest' type badges may be self-managed.
 * Official badges can only have their visibility toggled.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { userBadges } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const INTEREST_BADGE_KEYS = [
  'interest.lunar_witch',
  'interest.green_witch',
  'interest.astrology',
  'interest.crystals',
  'interest.tarot',
  'interest.candle_magic',
] as const;

type Action = 'add' | 'remove' | 'toggle_visibility' | 'reorder';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { badgeKey, action, sortOrder } = req.body as {
    badgeKey?: string;
    action?: Action;
    sortOrder?: number;
  };

  if (!badgeKey || !action) {
    return res.status(400).json({ error: 'badgeKey and action are required' });
  }

  const userId = session.user.id as string;

  // Fetch existing badge
  const [existing] = await db
    .select()
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, badgeKey)))
    .limit(1);

  if (action === 'add') {
    // Only interest badges can be self-added
    if (!INTEREST_BADGE_KEYS.includes(badgeKey as typeof INTEREST_BADGE_KEYS[number])) {
      return res.status(403).json({ error: 'This badge can only be granted by an administrator' });
    }
    if (existing) return res.json({ ok: true, badge: existing, changed: false });

    const [inserted] = await db.insert(userBadges).values({
      userId,
      badgeKey,
      badgeType: 'interest',
      isVisible: 1,
      sortOrder: sortOrder ?? 0,
    }).$returningId();
    return res.status(201).json({ ok: true, badgeId: inserted?.id, changed: true });
  }

  if (action === 'remove') {
    if (!existing) return res.json({ ok: true, changed: false });
    // Official badges cannot be self-removed
    if (existing.badgeType === 'official') {
      return res.status(403).json({ error: 'Official badges can only be removed by an administrator' });
    }
    await db.delete(userBadges).where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, badgeKey)));
    return res.json({ ok: true, changed: true });
  }

  if (action === 'toggle_visibility') {
    if (!existing) return res.status(404).json({ error: 'Badge not found' });
    const newVisible = existing.isVisible ? 0 : 1;
    await db.update(userBadges)
      .set({ isVisible: newVisible })
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, badgeKey)));
    return res.json({ ok: true, isVisible: newVisible === 1, changed: true });
  }

  if (action === 'reorder') {
    if (!existing) return res.status(404).json({ error: 'Badge not found' });
    if (sortOrder === undefined) return res.status(400).json({ error: 'sortOrder required for reorder' });
    await db.update(userBadges)
      .set({ sortOrder })
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, badgeKey)));
    return res.json({ ok: true, changed: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
