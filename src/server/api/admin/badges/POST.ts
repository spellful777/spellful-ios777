/**
 * POST /api/admin/badges
 * Grant or revoke a badge for any user. Admin+ only.
 *
 * Body: { targetId: string, badgeKey: string, action: 'grant' | 'revoke', reason?: string }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { userBadges } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireRole, writeAuditEvent } from '@/server/lib/require-role.js';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default [
  requireRole('moderator'),
  async function handler(req: Request, res: Response) {
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const { targetId, badgeKey, action, reason } = req.body as {
      targetId?: string;
      badgeKey?: string;
      action?: 'grant' | 'revoke';
      reason?: string;
    };

    if (!targetId || !badgeKey || !action) {
      return res.status(400).json({ error: 'targetId, badgeKey, and action are required' });
    }

    const actorId = session.user.id as string;

    if (action === 'grant') {
      const [existing] = await db
        .select({ id: userBadges.id })
        .from(userBadges)
        .where(and(eq(userBadges.userId, targetId), eq(userBadges.badgeKey, badgeKey)))
        .limit(1);

      if (existing) return res.json({ ok: true, changed: false });

      await db.insert(userBadges).values({
        userId: targetId,
        badgeKey,
        badgeType: badgeKey.startsWith('interest.') ? 'interest' : 'official',
        issuedBy: actorId,
        isVisible: 1,
        sortOrder: 0,
        reason: reason ?? '',
      });

      await writeAuditEvent({
        actorId,
        targetId,
        action: 'badge.grant',
        oldValue: null,
        newValue: badgeKey,
        reason: reason ?? undefined,
      });

      return res.status(201).json({ ok: true, changed: true });
    }

    if (action === 'revoke') {
      const [existing] = await db
        .select({ id: userBadges.id })
        .from(userBadges)
        .where(and(eq(userBadges.userId, targetId), eq(userBadges.badgeKey, badgeKey)))
        .limit(1);

      if (!existing) return res.json({ ok: true, changed: false });

      await db.delete(userBadges)
        .where(and(eq(userBadges.userId, targetId), eq(userBadges.badgeKey, badgeKey)));

      await writeAuditEvent({
        actorId,
        targetId,
        action: 'badge.revoke',
        oldValue: badgeKey,
        newValue: null,
        reason: reason ?? undefined,
      });

      return res.json({ ok: true, changed: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  },
];
