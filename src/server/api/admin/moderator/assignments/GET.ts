/**
 * GET /api/admin/moderator/assignments
 * List forum-scoped moderator assignments.
 * Requires: admin or owner role.
 * Query: ?userId=&forumSlug=&limit=50&offset=0
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityModeratorAssignments, user } from '@/server/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';
import { alias } from 'drizzle-orm/mysql-core';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { userId, forumSlug, limit: limitQ, offset: offsetQ } = req.query as Record<string, string>;
  const limit = Math.min(Number(limitQ) || 50, 200);
  const offset = Number(offsetQ) || 0;

  const conditions = [];
  if (userId) conditions.push(eq(communityModeratorAssignments.userId, userId));
  if (forumSlug) conditions.push(eq(communityModeratorAssignments.forumSlug, forumSlug));

  const assignedUser = alias(user, 'assigned_user');
  const assignedByUser = alias(user, 'assigned_by_user');

  const rows = await db
    .select({
      id: communityModeratorAssignments.id,
      userId: communityModeratorAssignments.userId,
      forumSlug: communityModeratorAssignments.forumSlug,
      role: communityModeratorAssignments.role,
      assignedBy: communityModeratorAssignments.assignedBy,
      expiresAt: communityModeratorAssignments.expiresAt,
      createdAt: communityModeratorAssignments.createdAt,
      userName: assignedUser.name,
      userUsername: assignedUser.username,
      userImage: assignedUser.image,
      assignedByName: assignedByUser.name,
      assignedByUsername: assignedByUser.username,
    })
    .from(communityModeratorAssignments)
    .leftJoin(assignedUser, eq(communityModeratorAssignments.userId, assignedUser.id))
    .leftJoin(assignedByUser, eq(communityModeratorAssignments.assignedBy, assignedByUser.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(communityModeratorAssignments.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  return res.json({ assignments: rows.slice(0, limit), hasMore });
}
