/**
 * PATCH /api/admin/community/replies/:id
 * Hide or unhide a reply. Admin only.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityReplies, communityModActions } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const replyId = parseInt(req.params.id);
  if (isNaN(replyId)) return res.status(400).json({ error: 'Invalid id' });

  const { isHidden, reason } = req.body as { isHidden?: boolean; reason?: string };
  if (isHidden === undefined) return res.status(400).json({ error: 'isHidden required' });

  await db.update(communityReplies).set({ isHidden }).where(eq(communityReplies.id, replyId));

  await db.insert(communityModActions).values({
    modId: session.user.id,
    targetType: 'reply',
    targetId: String(replyId),
    action: isHidden ? 'hide' : 'unhide',
    reason: reason ?? null,
  });

  res.json({ ok: true });
}
