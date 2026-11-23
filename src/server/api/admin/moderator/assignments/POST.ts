/**
 * POST /api/admin/moderator/assignments
 * Create or update a forum-scoped moderator assignment.
 * Requires: admin or owner role.
 * Body: { userId, forumSlug, role: 'moderator'|'community_admin', expiresAt? }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityModeratorAssignments, user } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole, writeAuditEvent } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const actorId = session.user.id as string;
  const { userId, forumSlug, role, expiresAt } = req.body as {
    userId?: string;
    forumSlug?: string;
    role?: string;
    expiresAt?: string;
  };

  if (!userId || !forumSlug || !role) {
    return res.status(400).json({ error: 'userId, forumSlug, and role are required' });
  }
  if (!['moderator', 'community_admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be moderator or community_admin' });
  }

  // Verify target user exists
  const [targetUser] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const expiresAtDate = expiresAt ? new Date(expiresAt) : null;

  // Upsert: delete existing assignment for this user+forum, then insert
  await db.delete(communityModeratorAssignments)
    .where(and(
      eq(communityModeratorAssignments.userId, userId),
      eq(communityModeratorAssignments.forumSlug, forumSlug),
    ));

  const [inserted] = await db.insert(communityModeratorAssignments).values({
    userId,
    forumSlug,
    role,
    assignedBy: actorId,
    expiresAt: expiresAtDate ?? undefined,
  });

  await writeAuditEvent({
    actorId,
    targetId: userId,
    action: 'forum_assignment.created',
    newValue: JSON.stringify({ forumSlug, role }),
    reason: `Assigned ${role} for forum ${forumSlug}`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ ok: true, id: (inserted as { insertId?: number }).insertId });
}
