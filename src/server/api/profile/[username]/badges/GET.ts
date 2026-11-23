/**
 * GET /api/profile/:username/badges
 * Returns visible badges for a public profile.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, userBadges } from '@/server/db/schema.js';
import { eq, and, asc } from 'drizzle-orm';

export default async function handler(req: Request<{ username: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const normalized = req.params.username.toLowerCase();
  const [profile] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.usernameNormalized, normalized))
    .limit(1);

  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const badges = await db
    .select({
      id: userBadges.id,
      badgeKey: userBadges.badgeKey,
      badgeType: userBadges.badgeType,
      isVisible: userBadges.isVisible,
      sortOrder: userBadges.sortOrder,
      createdAt: userBadges.createdAt,
    })
    .from(userBadges)
    .where(and(eq(userBadges.userId, profile.id), eq(userBadges.isVisible, 1)))
    .orderBy(asc(userBadges.sortOrder), asc(userBadges.createdAt));

  return res.json({ badges });
}
