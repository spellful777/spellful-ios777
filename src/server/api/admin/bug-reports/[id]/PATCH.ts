/**
 * PATCH /api/admin/bug-reports/:id
 * Update bug report status and admin note. Requires admin or owner role.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { bugReports } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole, writeAuditEvent } from '@/server/lib/require-role.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { status, adminNote } = req.body as { status?: string; adminNote?: string };
  const validStatuses = ['new', 'in_progress', 'resolved'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updates: Record<string, unknown> = {};
  if (status) {
    updates.status = status;
    if (status === 'resolved') {
      updates.resolvedAt = new Date();
      updates.resolvedBy = session.user.id;
    }
  }
  if (adminNote !== undefined) updates.adminNote = adminNote;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  await db.update(bugReports).set(updates).where(eq(bugReports.id, id));

  await writeAuditEvent({
    actorId: session.user.id,
    action: 'bug_report.update',
    targetId: String(id),
    newValue: status ?? '',
    reason: adminNote ?? '',
  });

  return res.json({ ok: true });
}
