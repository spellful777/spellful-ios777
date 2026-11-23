/**
 * GET /api/admin/applications
 * Reviewer dashboard: paginated list of Creator applications.
 * Requires admin+ role.
 * Applicant contact data (email, handles) is included only for authorized reviewers.
 */
import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { creatorApplications, user } from '../../../db/schema.js';
import { getAuthSession } from '../../../lib/auth-session.js';
import { hasRole } from '../../../lib/require-role.js';
import { eq, desc, and, sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const { status, q, limit = '25', offset = '0' } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit, 10) || 25, 100);
  const off = parseInt(offset, 10) || 0;

  const conditions = [];
  if (status && ['pending_review', 'info_requested', 'approved', 'rejected', 'withdrawn'].includes(status)) {
    conditions.push(eq(creatorApplications.status, status));
  }
  if (q) {
    conditions.push(
      sql`(${creatorApplications.referenceId} LIKE ${`%${q}%`} OR ${creatorApplications.creatorName} LIKE ${`%${q}%`})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const apps = await db.select({
    id: creatorApplications.id,
    referenceId: creatorApplications.referenceId,
    userId: creatorApplications.userId,
    status: creatorApplications.status,
    requestedAccountType: creatorApplications.requestedAccountType,
    creatorName: creatorApplications.creatorName,
    contactEmail: creatorApplications.contactEmail,
    websiteUrl: creatorApplications.websiteUrl,
    instagramHandle: creatorApplications.instagramHandle,
    blueskyHandle: creatorApplications.blueskyHandle,
    threadsHandle: creatorApplications.threadsHandle,
    xHandle: creatorApplications.xHandle,
    otherSocial: creatorApplications.otherSocial,
    creatorCategory: creatorApplications.creatorCategory,
    workDescription: creatorApplications.workDescription,
    workSamples: creatorApplications.workSamples,
    reasonForApplying: creatorApplications.reasonForApplying,
    additionalNotes: creatorApplications.additionalNotes,
    reviewDecision: creatorApplications.reviewDecision,
    reviewReason: creatorApplications.reviewReason,
    notificationSent: creatorApplications.notificationSent,
    submittedAt: creatorApplications.submittedAt,
    updatedAt: creatorApplications.updatedAt,
    // Applicant info
    applicantUsername: user.username,
    applicantName: user.name,
    applicantImage: user.image,
  })
    .from(creatorApplications)
    .leftJoin(user, eq(creatorApplications.userId, user.id))
    .where(whereClause)
    .orderBy(desc(creatorApplications.submittedAt))
    .limit(lim + 1)
    .offset(off);

  const hasMore = apps.length > lim;
  res.json({ applications: apps.slice(0, lim), hasMore });
}
