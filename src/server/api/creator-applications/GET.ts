/**
 * GET /api/creator-applications
 * Returns the current user's own application(s).
 * Applicant data (email, handles) is never exposed to other users.
 */
import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { creatorApplications, creatorApplicationEvents } from '../../db/schema.js';
import { getAuthSession } from '../../lib/auth-session.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const userId = session.user.id as string;

  const apps = await db.select({
    id: creatorApplications.id,
    referenceId: creatorApplications.referenceId,
    status: creatorApplications.status,
    requestedAccountType: creatorApplications.requestedAccountType,
    creatorName: creatorApplications.creatorName,
    creatorCategory: creatorApplications.creatorCategory,
    reviewDecision: creatorApplications.reviewDecision,
    reviewReason: creatorApplications.reviewReason,
    submittedAt: creatorApplications.submittedAt,
    updatedAt: creatorApplications.updatedAt,
  })
    .from(creatorApplications)
    .where(eq(creatorApplications.userId, userId))
    .orderBy(desc(creatorApplications.submittedAt));

  // Fetch public-facing events (no internal staff notes)
  const appIds = apps.map((a) => a.id);
  const events = appIds.length > 0
    ? await db.select({
        applicationId: creatorApplicationEvents.applicationId,
        eventType: creatorApplicationEvents.eventType,
        note: creatorApplicationEvents.note,
        createdAt: creatorApplicationEvents.createdAt,
      })
        .from(creatorApplicationEvents)
        .where(eq(creatorApplicationEvents.applicationId, appIds[0]))
        .orderBy(desc(creatorApplicationEvents.createdAt))
    : [];

  res.json({ applications: apps, events });
}
