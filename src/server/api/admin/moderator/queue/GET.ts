/**
 * GET /api/admin/moderator/queue
 * Returns community reports scoped to the forums the calling user is assigned to moderate.
 * Admins and owners see all reports.
 * Requires: moderator+ role.
 * Query: ?status=pending&limit=25&offset=0
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import {
  communityReports,
  communityModeratorAssignments,
  communityPosts,
  communityCategories,
} from '@/server/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const userId = session.user.id as string;
  const isAdmin = hasRole(session as { user?: Record<string, unknown> }, 'admin');

  const statusFilter = typeof req.query.status === 'string' ? req.query.status : 'pending';
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;

  // For moderators (not admin), restrict to assigned forums
  let assignedForumSlugs: string[] | null = null;
  if (!isAdmin) {
    const assignments = await db
      .select({ forumSlug: communityModeratorAssignments.forumSlug })
      .from(communityModeratorAssignments)
      .where(eq(communityModeratorAssignments.userId, userId));
    assignedForumSlugs = assignments.map((a) => a.forumSlug);
    if (assignedForumSlugs.length === 0) {
      return res.json({ reports: [], hasMore: false, assignedForums: [] });
    }
  }

  const conditions = [];
  if (['pending', 'resolved', 'dismissed'].includes(statusFilter)) {
    conditions.push(eq(communityReports.status, statusFilter));
  }

  // Join posts → categories to get the category slug for scope filtering
  const rows = await db
    .select({
      id: communityReports.id,
      targetType: communityReports.targetType,
      targetId: communityReports.targetId,
      targetStringId: communityReports.targetStringId,
      reason: communityReports.reason,
      status: communityReports.status,
      createdAt: communityReports.createdAt,
      details: communityReports.details,
      categorySlug: communityCategories.slug,
    })
    .from(communityReports)
    .leftJoin(communityPosts, and(
      eq(communityReports.targetType, 'post'),
      eq(communityReports.targetId, communityPosts.id),
    ))
    .leftJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(communityReports.createdAt))
    .limit(limit + 1)
    .offset(offset);

  // Filter by assigned forums for non-admins
  const filtered = assignedForumSlugs
    ? rows.filter((r) =>
        r.targetType === 'post'
          ? assignedForumSlugs!.includes(r.categorySlug ?? '')
          : true // replies/profile reports: include if moderator has any assignment
      )
    : rows;

  const hasMore = filtered.length > limit;
  return res.json({
    reports: filtered.slice(0, limit),
    hasMore,
    assignedForums: assignedForumSlugs ?? 'all',
  });
}
