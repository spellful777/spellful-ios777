/**
 * GET /api/admin/community/reports
 * Returns reports with reporter info and target content preview. Admin only.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityReports, communityPosts, communityReplies, user } from '@/server/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const status = (req.query.status as string) || 'pending';

  // Fetch reports with reporter info
  const reports = await db.select({
    id: communityReports.id,
    targetType: communityReports.targetType,
    targetId: communityReports.targetId,
    targetStringId: communityReports.targetStringId,
    reason: communityReports.reason,
    details: communityReports.details,
    status: communityReports.status,
    createdAt: communityReports.createdAt,
    reporterName: user.name,
    reporterUsername: user.username,
  })
    .from(communityReports)
    .leftJoin(user, eq(communityReports.reporterId, user.id))
    .where(eq(communityReports.status, status))
    .orderBy(desc(communityReports.createdAt))
    .limit(100);

  if (reports.length === 0) return res.json([]);

  // Enrich with target content in a second pass
  const postIds = reports.filter(r => r.targetType === 'post').map(r => r.targetId);
  const replyIds = reports.filter(r => r.targetType === 'reply').map(r => r.targetId);
  // Profile reports use targetStringId (UUID) not targetId
  const profileIds = reports.filter(r => r.targetType === 'profile' && r.targetStringId).map(r => r.targetStringId as string);

  const postMap = new Map<number, { title: string; isHidden: boolean; authorUsername: string | null }>();
  const replyMap = new Map<number, { bodySnippet: string; isHidden: boolean; authorUsername: string | null; postId: number }>();
  const profileMap = new Map<string, { username: string | null; bioSnippet: string | null }>();

  if (postIds.length > 0) {
    const postAuthor = alias(user, 'postAuthor');
    const rows = await db.select({
      id: communityPosts.id,
      title: communityPosts.title,
      isHidden: communityPosts.isHidden,
      authorUsername: postAuthor.username,
    })
      .from(communityPosts)
      .leftJoin(postAuthor, eq(communityPosts.userId, postAuthor.id))
      .where(sql`${communityPosts.id} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`);
    for (const row of rows) {
      postMap.set(row.id, { title: row.title, isHidden: row.isHidden ?? false, authorUsername: row.authorUsername });
    }
  }

  if (replyIds.length > 0) {
    const replyAuthor = alias(user, 'replyAuthor');
    const rows = await db.select({
      id: communityReplies.id,
      body: communityReplies.body,
      isHidden: communityReplies.isHidden,
      postId: communityReplies.postId,
      authorUsername: replyAuthor.username,
    })
      .from(communityReplies)
      .leftJoin(replyAuthor, eq(communityReplies.userId, replyAuthor.id))
      .where(sql`${communityReplies.id} IN (${sql.join(replyIds.map(id => sql`${id}`), sql`, `)})`);
    for (const row of rows) {
      // Strip HTML tags for snippet
      const snippet = (row.body ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
      replyMap.set(row.id, { bodySnippet: snippet, isHidden: row.isHidden ?? false, authorUsername: row.authorUsername, postId: row.postId });
    }
  }

  if (profileIds.length > 0) {
    const rows = await db.select({ id: user.id, username: user.username, bio: user.bio })
      .from(user)
      .where(sql`${user.id} IN (${sql.join(profileIds.map(id => sql`${id}`), sql`, `)})`);
    for (const row of rows) {
      const bioSnippet = (row.bio ?? '').slice(0, 200) || null;
      profileMap.set(row.id, { username: row.username, bioSnippet });
    }
  }

  const enriched = reports.map(r => {
    if (r.targetType === 'post') {
      const p = postMap.get(r.targetId);
      return { ...r, targetTitle: p?.title ?? null, targetSnippet: null, targetIsHidden: p?.isHidden ?? false, targetAuthorUsername: p?.authorUsername ?? null, targetPostId: r.targetId };
    }
    if (r.targetType === 'reply') {
      const rep = replyMap.get(r.targetId);
      return { ...r, targetTitle: null, targetSnippet: rep?.bodySnippet ?? null, targetIsHidden: rep?.isHidden ?? false, targetAuthorUsername: rep?.authorUsername ?? null, targetPostId: rep?.postId ?? null };
    }
    // profile — look up by targetStringId (UUID)
    const prof = r.targetStringId ? profileMap.get(r.targetStringId) : undefined;
    return { ...r, targetTitle: prof?.username ? `@${prof.username}` : null, targetSnippet: prof?.bioSnippet ?? null, targetIsHidden: false, targetAuthorUsername: prof?.username ?? null, targetPostId: null };
  });

  res.json(enriched);
}
