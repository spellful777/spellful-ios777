/**
 * GET /api/admin/audit
 * Returns recent audit events. Requires admin or owner role.
 * Query: ?targetId=&action=&limit=50&offset=0
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { auditEvents, user } from '@/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const actor = alias(user, 'actor');
  const target = alias(user, 'target');

  const rows = await db
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      oldValue: auditEvents.oldValue,
      newValue: auditEvents.newValue,
      reason: auditEvents.reason,
      createdAt: auditEvents.createdAt,
      actorId: auditEvents.actorId,
      actorName: actor.name,
      actorUsername: actor.username,
      targetId: auditEvents.targetId,
      targetName: target.name,
      targetUsername: target.username,
    })
    .from(auditEvents)
    .leftJoin(actor, eq(auditEvents.actorId, actor.id))
    .leftJoin(target, eq(auditEvents.targetId, target.id))
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit)
    .offset(offset);

  return res.json({ events: rows });
}
