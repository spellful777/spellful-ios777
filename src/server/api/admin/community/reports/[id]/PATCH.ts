/**
 * PATCH /api/admin/community/reports/:id
 * Resolve or dismiss a report. Admin only.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityReports, communityModActions } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const reportId = parseInt(req.params.id);
  if (isNaN(reportId)) return res.status(400).json({ error: 'Invalid id' });

  const { status, reason } = req.body as { status?: string; reason?: string };
  if (!status || !['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'status must be resolved or dismissed' });
  }

  await db.update(communityReports).set({
    status,
    resolvedBy: session.user.id,
    resolvedAt: new Date(),
  }).where(eq(communityReports.id, reportId));

  await db.insert(communityModActions).values({
    modId: session.user.id,
    targetType: 'report',
    targetId: String(reportId),
    action: status,
    reason: reason ?? null,
  });

  res.json({ ok: true });
}
