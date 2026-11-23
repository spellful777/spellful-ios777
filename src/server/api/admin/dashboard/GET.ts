/**
 * GET /api/admin/dashboard
 * Returns summary counts and recent activity for the admin dashboard.
 * Requires: admin or owner role.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { creatorApplications, communityReports, auditEvents, user } from '@/server/db/schema.js';
import { eq, desc, count, or, sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    [pendingApps],
    [openReports],
    recentApps,
    recentAudit,
  ] = await Promise.all([
    // Pending application count
    db.select({ n: count() }).from(creatorApplications)
      .where(or(
        eq(creatorApplications.status, 'pending_review'),
        eq(creatorApplications.status, 'info_requested'),
      )),
    // Open report count
    db.select({ n: count() }).from(communityReports)
      .where(eq(communityReports.status, 'pending')),
    // 5 most recent applications
    db.select({
      id: creatorApplications.id,
      referenceId: creatorApplications.referenceId,
      creatorName: creatorApplications.creatorName,
      status: creatorApplications.status,
      requestedAccountType: creatorApplications.requestedAccountType,
      submittedAt: creatorApplications.submittedAt,
      applicantUsername: user.username,
      applicantImage: user.image,
    })
      .from(creatorApplications)
      .leftJoin(user, eq(creatorApplications.userId, user.id))
      .where(or(
        eq(creatorApplications.status, 'pending_review'),
        eq(creatorApplications.status, 'info_requested'),
      ))
      .orderBy(desc(creatorApplications.submittedAt))
      .limit(5),
    // 10 most recent audit events — use sql template to avoid nullable-column type error
    db.select({
      id: auditEvents.id,
      action: auditEvents.action,
      oldValue: auditEvents.oldValue,
      newValue: auditEvents.newValue,
      reason: auditEvents.reason,
      createdAt: auditEvents.createdAt,
      actorId: auditEvents.actorId,
    })
      .from(auditEvents)
      .where(sql`${auditEvents.createdAt} IS NOT NULL AND ${auditEvents.createdAt} >= ${since30d}`)
      .orderBy(desc(auditEvents.createdAt))
      .limit(10),
  ]);

  return res.json({
    pendingApplications: Number(pendingApps?.n ?? 0),
    openReports: Number(openReports?.n ?? 0),
    recentApplications: recentApps,
    recentAudit,
  });
}
