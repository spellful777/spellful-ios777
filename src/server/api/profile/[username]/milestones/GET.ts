/**
 * GET /api/profile/:username/milestones
 * Returns visible milestones for a public profile.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, profileMilestones, covenConnections } from '@/server/db/schema.js';
import { eq, and, or, inArray, asc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { isBlocked } from '@/server/lib/block-check.js';

export default async function handler(req: Request<{ username: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const normalized = req.params.username.toLowerCase();
  const [profileUser] = await db.select({ id: user.id }).from(user)
    .where(eq(user.usernameNormalized, normalized)).limit(1);
  if (!profileUser) return res.status(404).json({ error: 'Not found' });

  const session = await getAuthSession(req);
  const viewerId = session?.user.id ?? null;

  if (viewerId && await isBlocked(profileUser.id, viewerId)) return res.status(404).json({ error: 'Not found' });

  let isCoven = false;
  if (viewerId && viewerId !== profileUser.id) {
    const [conn] = await db.select({ id: covenConnections.id })
      .from(covenConnections)
      .where(and(
        or(
          and(eq(covenConnections.requesterId, viewerId), eq(covenConnections.receiverId, profileUser.id)),
          and(eq(covenConnections.requesterId, profileUser.id), eq(covenConnections.receiverId, viewerId)),
        ),
        eq(covenConnections.status, 'accepted'),
      )).limit(1);
    isCoven = !!conn;
  }
  const isOwner = viewerId === profileUser.id;

  const allowed: string[] = ['public'];
  if (isOwner || isCoven) allowed.push('coven');
  if (isOwner) allowed.push('private');

  const milestones = await db.select().from(profileMilestones)
    .where(and(
      eq(profileMilestones.userId, profileUser.id),
      inArray(profileMilestones.visibility, allowed),
    ))
    .orderBy(asc(profileMilestones.position));

  res.json({ milestones });
}
