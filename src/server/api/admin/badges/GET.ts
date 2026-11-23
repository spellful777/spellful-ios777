/**
 * GET /api/admin/badges?userId=:id
 * Returns all badges (including hidden) for a given user. Admin+ only.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { userBadges } from '@/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { requireRole } from '@/server/lib/require-role.js';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default [
  requireRole('moderator'),
  async function handler(req: Request, res: Response) {
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const { userId } = req.query as { userId?: string };
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const badges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(asc(userBadges.sortOrder), asc(userBadges.createdAt));

    return res.json({ badges });
  },
];
