/**
 * GET /api/profile/badges
 * Returns the current user's badges (all, including hidden).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { userBadges } from '@/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const badges = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, session.user.id as string))
    .orderBy(asc(userBadges.sortOrder), asc(userBadges.createdAt));

  return res.json({ badges });
}
