/**
 * GET /api/coven/suggestions
 * Returns up to 10 member suggestions for the current user.
 * Excludes: self, existing connections (any status), blocked users.
 * Prioritizes members with overlapping interest_tags.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { user, covenConnections } from '@/server/db/schema.js';
import { eq, and, or, ne, notInArray, isNotNull } from 'drizzle-orm';
import { getBlockedUserIds } from '@/server/lib/block-check.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const myId = session.user.id;

  // Get my interest tags
  const [me] = await db.select({ interestTags: user.interestTags, invitePermission: user.invitePermission })
    .from(user).where(eq(user.id, myId)).limit(1);
  const myTags: string[] = Array.isArray(me?.interestTags) ? (me.interestTags as string[]) : [];

  // Get all connected user IDs (any status)
  const connections = await db.select({
    requesterId: covenConnections.requesterId,
    receiverId: covenConnections.receiverId,
  }).from(covenConnections).where(
    or(eq(covenConnections.requesterId, myId), eq(covenConnections.receiverId, myId)),
  );
  const connectedIds = new Set<string>([myId]);
  for (const c of connections) {
    connectedIds.add(c.requesterId);
    connectedIds.add(c.receiverId);
  }

  // Get blocked IDs
  const blockedIds = await getBlockedUserIds(myId);
  for (const id of blockedIds) connectedIds.add(id);

  const excludeIds = Array.from(connectedIds);

  // Fetch candidates — public profiles only, with a username set
  const candidates = await db.select({
    id: user.id,
    name: user.name,
    username: user.username,
    image: user.image,
    witchPath: user.witchPath,
    interestTags: user.interestTags,
    invitePermission: user.invitePermission,
  })
    .from(user)
    .where(
      excludeIds.length
        ? and(isNotNull(user.username), ne(user.profileVisibility, 'private'), notInArray(user.id, excludeIds))
        : and(isNotNull(user.username), ne(user.profileVisibility, 'private')),
    )
    .limit(50);

  // Score by shared tags, filter out nobody invite permission
  const scored = candidates
    .filter((c) => (c.invitePermission ?? 'everyone') !== 'nobody')
    .map((c) => {
      const theirTags: string[] = Array.isArray(c.interestTags) ? (c.interestTags as string[]) : [];
      const shared = myTags.filter((t) => theirTags.includes(t)).length;
      return { ...c, sharedTags: shared };
    })
    .sort((a, b) => b.sharedTags - a.sharedTags)
    .slice(0, 10)
    .map(({ interestTags: _it, invitePermission: _ip, ...rest }) => rest);

  res.json({ suggestions: scored });
}
