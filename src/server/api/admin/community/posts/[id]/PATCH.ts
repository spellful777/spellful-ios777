/**
 * PATCH /api/admin/community/posts/:id
 * Pin, lock, or hide a post. Admin only.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts, communityModActions } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const { isPinned, isLocked, isHidden, reason } = req.body as {
    isPinned?: boolean; isLocked?: boolean; isHidden?: boolean; reason?: string;
  };

  const updates: Record<string, unknown> = {};
  const actions: string[] = [];

  if (isPinned !== undefined) { updates.isPinned = isPinned; actions.push(isPinned ? 'pin' : 'unpin'); }
  if (isLocked !== undefined) { updates.isLocked = isLocked; actions.push(isLocked ? 'lock' : 'unlock'); }
  if (isHidden !== undefined) { updates.isHidden = isHidden; actions.push(isHidden ? 'hide' : 'unhide'); }

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No changes specified' });

  await db.update(communityPosts).set(updates).where(eq(communityPosts.id, postId));

  await db.insert(communityModActions).values({
    modId: session.user.id,
    targetType: 'post',
    targetId: String(postId),
    action: actions.join(','),
    reason: reason ?? null,
  });

  res.json({ ok: true });
}
