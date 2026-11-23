/**
 * GET /api/profile/milestones
 * Returns all milestones for the authenticated user.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileMilestones } from '@/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const milestones = await db.select().from(profileMilestones)
    .where(eq(profileMilestones.userId, session.user.id))
    .orderBy(asc(profileMilestones.position));

  res.json({ milestones });
}
