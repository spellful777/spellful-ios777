/**
 * GET /api/admin/inbox
 * Unified community management inbox: applications, reports, bug reports, and site stats.
 * Requires: admin or owner role.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import {
  creatorApplications,
  communityReports,
  bugReports,
  user,
  account,
  communityPosts,
  communityReplies,
} from '@/server/db/schema.js';
import { eq, desc, count, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const category = (req.query.category as string) || 'all';
  const status = (req.query.status as string) || '';
  const sort = (req.query.sort as string) === 'asc' ? 'asc' : 'desc';
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  // ── Stats (always returned, independent of category filter) ──────────────────
  const statsPromise = (async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Wrap each query in its own try/catch so a missing table (failed migration)
    // returns 0 instead of crashing the entire stats block.
    const safeCount = async (query: Promise<{ n: unknown }[]>): Promise<number> => {
      try {
        const [row] = await query;
        return Number(row?.n ?? 0);
      } catch {
        return 0;
      }
    };

    const [totalUsers, newUsersToday, newUsersWeek, newUsersMonth,
           pendingApplications, openReports, newBugReports] = await Promise.all([
      safeCount(db.select({ n: count() }).from(user)),
      safeCount(db.select({ n: count() }).from(user).where(sql`${user.createdAt} >= ${today}`)),
      safeCount(db.select({ n: count() }).from(user).where(sql`${user.createdAt} >= ${week}`)),
      safeCount(db.select({ n: count() }).from(user).where(sql`${user.createdAt} >= ${month}`)),
      safeCount(db.select({ n: count() }).from(creatorApplications)
        .where(or(
          eq(creatorApplications.status, 'pending_review'),
          eq(creatorApplications.status, 'info_requested'),
        ))),
      safeCount(db.select({ n: count() }).from(communityReports)
        .where(eq(communityReports.status, 'pending'))),
      safeCount(db.select({ n: count() }).from(bugReports)
        .where(eq(bugReports.status, 'new'))),
    ]);

    // Registration breakdown by auth provider (email / google / apple)
    let registrationByProvider: Array<{ provider: string; n: number }> = [];
    try {
      const provRows = await db
        .select({ provider: account.providerId, n: count() })
        .from(account)
        .groupBy(account.providerId);
      registrationByProvider = provRows.map(pRow => ({ provider: pRow.provider, n: Number(pRow.n) }));
    } catch { /* table may not exist yet */ }

    // Registration breakdown by signup source (how they found Spellful)
    let registrationBySource: Array<{ source: string; n: number }> = [];
    try {
      const srcRows = await db
        .select({ source: user.signupSource, n: count() })
        .from(user)
        .where(sql`${user.signupSource} != '' AND ${user.signupSource} IS NOT NULL`)
        .groupBy(user.signupSource);
      registrationBySource = srcRows.map(sRow => ({ source: sRow.source ?? '', n: Number(sRow.n) }));
    } catch { /* column may not exist yet */ }

    // Top shared community posts
    let topSharedPosts: Array<{ id: number; title: string; shareCount: number; authorUsername: string | null }> = [];
    try {
      const sharedRows = await db
        .select({
          id: communityPosts.id,
          title: communityPosts.title,
          shareCount: communityPosts.shareCount,
          authorUsername: user.username,
        })
        .from(communityPosts)
        .leftJoin(user, eq(communityPosts.userId, user.id))
        .where(sql`${communityPosts.shareCount} > 0`)
        .orderBy(desc(communityPosts.shareCount))
        .limit(10);
      topSharedPosts = sharedRows.map(sr => ({
        id: sr.id,
        title: sr.title,
        shareCount: sr.shareCount ?? 0,
        authorUsername: sr.authorUsername,
      }));
    } catch { /* column may not exist yet */ }

    // Content share totals — tarot readings, horoscopes, birth charts
    let contentShareTotals: Array<{ type: string; total: number }> = [];
    try {
      const [tarotRows] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM tarot_shares WHERE revoked_at IS NULL`
      ) as unknown as [Array<{ cnt: number }>, unknown];
      const tarotTotal = Number(tarotRows[0]?.cnt ?? 0);

      let horoscopeTotal = 0;
      let birthChartTotal = 0;
      try {
        const [hRows] = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM horoscope_shares`
        ) as unknown as [Array<{ cnt: number }>, unknown];
        horoscopeTotal = Number(hRows[0]?.cnt ?? 0);
      } catch { /* table not yet created */ }
      try {
        const [bRows] = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM birth_chart_shares`
        ) as unknown as [Array<{ cnt: number }>, unknown];
        birthChartTotal = Number(bRows[0]?.cnt ?? 0);
      } catch { /* table not yet created */ }

      // Community post shares (sum of share_count column)
      const [cpRows] = await db.execute(
        sql`SELECT COALESCE(SUM(share_count), 0) as total FROM community_posts`
      ) as unknown as [Array<{ total: number }>, unknown];
      const communityTotal = Number(cpRows[0]?.total ?? 0);

      contentShareTotals = [
        { type: 'Tarot readings', total: tarotTotal },
        { type: 'Horoscopes', total: horoscopeTotal },
        { type: 'Birth charts', total: birthChartTotal },
        { type: 'Community posts', total: communityTotal },
      ].filter(x => x.total > 0);
    } catch { /* non-critical */ }

    return {
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      pendingApplications,
      openReports,
      newBugReports,
      registrationByProvider,
      registrationBySource,
      topSharedPosts,
      contentShareTotals,
    };
  })();

  // ── Applications ──────────────────────────────────────────────────────────────
  const appsPromise = (category === 'all' || category === 'applications') ? (async () => {
    try {
    const statusFilter = status
      ? eq(creatorApplications.status, status)
      : or(
          eq(creatorApplications.status, 'pending_review'),
          eq(creatorApplications.status, 'info_requested'),
        );
    const rows = await db.select({
      id: creatorApplications.id,
      referenceId: creatorApplications.referenceId,
      creatorName: creatorApplications.creatorName,
      status: creatorApplications.status,
      requestedAccountType: creatorApplications.requestedAccountType,
      creatorCategory: creatorApplications.creatorCategory,
      workDescription: creatorApplications.workDescription,
      contactEmail: creatorApplications.contactEmail,
      submittedAt: creatorApplications.submittedAt,
      applicantId: user.id,
      applicantUsername: user.username,
      applicantImage: user.image,
    })
      .from(creatorApplications)
      .leftJoin(user, eq(creatorApplications.userId, user.id))
      .where(statusFilter)
      .orderBy(sort === 'asc' ? creatorApplications.submittedAt : desc(creatorApplications.submittedAt))
      .limit(limit);
    return rows.map(r => ({ ...r, _type: 'application' as const }));
    } catch { return []; }
  })() : Promise.resolve([]);

  // ── Community Reports ─────────────────────────────────────────────────────────
  const reportsPromise = (category === 'all' || category === 'reports') ? (async () => {
    const statusFilter = status
      ? eq(communityReports.status, status)
      : eq(communityReports.status, 'pending');
    const reporter = alias(user, 'reporter');
    const rows = await db.select({
      id: communityReports.id,
      targetType: communityReports.targetType,
      targetId: communityReports.targetId,
      targetStringId: communityReports.targetStringId,
      reason: communityReports.reason,
      details: communityReports.details,
      status: communityReports.status,
      createdAt: communityReports.createdAt,
      reporterName: reporter.name,
      reporterUsername: reporter.username,
    })
      .from(communityReports)
      .leftJoin(reporter, eq(communityReports.reporterId, reporter.id))
      .where(statusFilter)
      .orderBy(sort === 'asc' ? communityReports.createdAt : desc(communityReports.createdAt))
      .limit(limit);

    // Enrich with target content
    const postIds = rows.filter(r => r.targetType === 'post').map(r => r.targetId);
    const replyIds = rows.filter(r => r.targetType === 'reply').map(r => r.targetId);
    const profileIds = rows.filter(r => r.targetType === 'profile' && r.targetStringId).map(r => r.targetStringId as string);

    const postMap = new Map<number, { title: string; authorUsername: string | null }>();
    const replyMap = new Map<number, { snippet: string; authorUsername: string | null }>();
    const profileMap = new Map<string, { username: string | null }>();

    if (postIds.length > 0) {
      const postAuthor = alias(user, 'postAuthor');
      const pRows = await db.select({ id: communityPosts.id, title: communityPosts.title, authorUsername: postAuthor.username })
        .from(communityPosts)
        .leftJoin(postAuthor, eq(communityPosts.userId, postAuthor.id))
        .where(sql`${communityPosts.id} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`);
      for (const p of pRows) postMap.set(p.id, { title: p.title, authorUsername: p.authorUsername });
    }
    if (replyIds.length > 0) {
      const replyAuthor = alias(user, 'replyAuthor');
      const rRows = await db.select({ id: communityReplies.id, body: communityReplies.body, authorUsername: replyAuthor.username })
        .from(communityReplies)
        .leftJoin(replyAuthor, eq(communityReplies.userId, replyAuthor.id))
        .where(sql`${communityReplies.id} IN (${sql.join(replyIds.map(id => sql`${id}`), sql`, `)})`);
      for (const r of rRows) {
        const snippet = (r.body ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        replyMap.set(r.id, { snippet, authorUsername: r.authorUsername });
      }
    }
    if (profileIds.length > 0) {
      const pRows = await db.select({ id: user.id, username: user.username })
        .from(user)
        .where(sql`${user.id} IN (${sql.join(profileIds.map(id => sql`${id}`), sql`, `)})`);
      for (const p of pRows) profileMap.set(p.id, { username: p.username });
    }

    return rows.map(r => {
      let targetLabel = '';
      if (r.targetType === 'post') targetLabel = postMap.get(r.targetId)?.title ?? `Post #${r.targetId}`;
      else if (r.targetType === 'reply') targetLabel = replyMap.get(r.targetId)?.snippet ?? `Reply #${r.targetId}`;
      else if (r.targetType === 'profile') targetLabel = profileMap.get(r.targetStringId ?? '')?.username ? `@${profileMap.get(r.targetStringId ?? '')?.username}` : 'Profile';
      return { ...r, targetLabel, _type: 'report' as const };
    });
  })() : Promise.resolve([]);

  // ── Bug Reports ───────────────────────────────────────────────────────────────
  const bugsPromise = (category === 'all' || category === 'bugs') ? (async () => {
    try {
    const bugReporter = alias(user, 'bugReporter');
    const statusFilter = status ? eq(bugReports.status, status) : undefined;
    const rows = await db.select({
      id: bugReports.id,
      title: bugReports.title,
      description: bugReports.description,
      pageUrl: bugReports.pageUrl,
      status: bugReports.status,
      adminNote: bugReports.adminNote,
      createdAt: bugReports.createdAt,
      reporterName: bugReporter.name,
      reporterUsername: bugReporter.username,
    })
      .from(bugReports)
      .leftJoin(bugReporter, eq(bugReports.reporterId, bugReporter.id))
      .where(statusFilter)
      .orderBy(sort === 'asc' ? bugReports.createdAt : desc(bugReports.createdAt))
      .limit(limit);
    return rows.map(r => ({ ...r, _type: 'bug' as const }));
    } catch { return []; }
  })() : Promise.resolve([]);

  // ── Resolve all in parallel ───────────────────────────────────────────────────
  const [stats, apps, reports, bugs] = await Promise.all([
    statsPromise,
    appsPromise,
    reportsPromise,
    bugsPromise,
  ]);

  // Merge and sort unified inbox
  type InboxItem = (typeof apps)[number] | (typeof reports)[number] | (typeof bugs)[number];
  const allItems: InboxItem[] = [...apps, ...reports, ...bugs];
  allItems.sort((a, b) => {
    const aTime = new Date('submittedAt' in a ? (a.submittedAt ?? 0) : (a.createdAt ?? 0)).getTime();
    const bTime = new Date('submittedAt' in b ? (b.submittedAt ?? 0) : (b.createdAt ?? 0)).getTime();
    return sort === 'asc' ? aTime - bTime : bTime - aTime;
  });

  return res.json({ stats, items: allItems });
}
