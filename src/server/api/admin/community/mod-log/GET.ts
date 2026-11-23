import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityModActions, user } from '@/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const actions = await db.select({
    id: communityModActions.id,
    targetType: communityModActions.targetType,
    targetId: communityModActions.targetId,
    action: communityModActions.action,
    reason: communityModActions.reason,
    createdAt: communityModActions.createdAt,
    modName: user.name,
    modUsername: user.username,
  })
    .from(communityModActions)
    .leftJoin(user, eq(communityModActions.modId, user.id))
    .orderBy(desc(communityModActions.createdAt))
    .limit(200);

  res.json(actions);
}
