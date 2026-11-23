import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { spells, spellReviews, reviewReports } from '../../../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';
import { user } from '../../../db/schema.js';

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const session = await getAuthSession(req);
  if (!session) { res.status(401).json({ error: 'Unauthorized' }); return false; }
  const [u] = await db.select({ isAdmin: user.isAdmin }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!u?.isAdmin) { res.status(403).json({ error: 'Forbidden' }); return false; }
  return true;
}

export default async function handler(req: Request, res: Response) {
  if (!await requireAdmin(req, res)) return;

  const { tab = 'pending' } = req.query as { tab?: string };

  if (tab === 'reported_reviews') {
    const reports = await db
      .select({
        reportId: reviewReports.id,
        reviewId: reviewReports.reviewId,
        reason: reviewReports.reason,
        reportedAt: reviewReports.createdAt,
        reviewBody: spellReviews.body,
        reviewRating: spellReviews.rating,
        reviewUserId: spellReviews.userId,
        isModerated: spellReviews.isModerated,
        spellId: spellReviews.spellId,
      })
      .from(reviewReports)
      .innerJoin(spellReviews, eq(reviewReports.reviewId, spellReviews.id))
      .orderBy(desc(reviewReports.createdAt))
      .limit(100);

    // Count reports per review
    const reportCounts = await db
      .select({ reviewId: reviewReports.reviewId, count: sql<number>`COUNT(*)` })
      .from(reviewReports)
      .groupBy(reviewReports.reviewId);
    const countMap = Object.fromEntries(reportCounts.map((r) => [r.reviewId, r.count]));

    const unique = new Map<number, typeof reports[0] & { reportCount: number }>();
    for (const r of reports) {
      if (!unique.has(r.reviewId)) {
        unique.set(r.reviewId, { ...r, reportCount: countMap[r.reviewId] ?? 1 });
      }
    }

    return res.json({ reportedReviews: [...unique.values()] });
  }

  // Spells list
  const statusFilter = tab === 'all' ? undefined : tab === 'pending' ? 'pending' : tab === 'rejected' ? 'rejected' : 'approved';
  const rows = await db
    .select({
      id: spells.id,
      slug: spells.slug,
      title: spells.title,
      intention: spells.intention,
      difficulty: spells.difficulty,
      status: spells.status,
      isFeatured: spells.isFeatured,
      isAdminCreated: spells.isAdminCreated,
      submittedByUserId: spells.submittedByUserId,
      saveCount: spells.saveCount,
      ratingCount: spells.ratingCount,
      ratingSum: spells.ratingSum,
      createdAt: spells.createdAt,
    })
    .from(spells)
    .where(statusFilter ? eq(spells.status, statusFilter) : undefined)
    .orderBy(desc(spells.createdAt))
    .limit(200);

  res.json({ spells: rows });
}
