/**
 * DELETE /api/admin/moderator/assignments/:id
 * Remove a forum-scoped moderator assignment.
 * Requires: admin or owner role.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityModeratorAssignments } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole, writeAuditEvent } from '@/server/lib/require-role.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const [existing] = await db
    .select({ id: communityModeratorAssignments.id, userId: communityModeratorAssignments.userId, forumSlug: communityModeratorAssignments.forumSlug, role: communityModeratorAssignments.role })
    .from(communityModeratorAssignments)
    .where(eq(communityModeratorAssignments.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: 'Assignment not found' });

  await db.delete(communityModeratorAssignments).where(eq(communityModeratorAssignments.id, id));

  await writeAuditEvent({
    actorId: session.user.id as string,
    targetId: existing.userId,
    action: 'forum_assignment.removed',
    oldValue: JSON.stringify({ forumSlug: existing.forumSlug, role: existing.role }),
    reason: `Removed ${existing.role} assignment for forum ${existing.forumSlug}`,
    ipAddress: req.ip,
  });

  return res.json({ ok: true });
}
