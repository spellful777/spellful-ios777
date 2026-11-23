/**
 * POST /api/creator-applications/:id/withdraw
 * Applicant withdraws their own pending application.
 */
import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { creatorApplications, creatorApplicationEvents } from '../../../../db/schema.js';
import { getAuthSession } from '../../../../lib/auth-session.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const userId = session.user.id as string;
  const appId = parseInt(req.params.id, 10);
  if (isNaN(appId)) { res.status(400).json({ error: 'Invalid application ID.' }); return; }

  const [app] = await db.select({ id: creatorApplications.id, status: creatorApplications.status })
    .from(creatorApplications)
    .where(and(eq(creatorApplications.id, appId), eq(creatorApplications.userId, userId)))
    .limit(1);

  if (!app) { res.status(404).json({ error: 'Application not found.' }); return; }
  if (!['pending_review', 'info_requested'].includes(app.status)) {
    res.status(409).json({ error: 'Only pending or info-requested applications can be withdrawn.' });
    return;
  }

  await db.update(creatorApplications)
    .set({ status: 'withdrawn', updatedAt: new Date() })
    .where(eq(creatorApplications.id, appId));

  await db.insert(creatorApplicationEvents).values({
    applicationId: appId,
    actorId: userId,
    eventType: 'withdrawn',
    note: '',
  });

  res.json({ ok: true });
}
