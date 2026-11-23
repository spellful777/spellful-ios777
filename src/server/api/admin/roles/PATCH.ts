/**
 * PATCH /api/admin/roles
 * Update a member's platform role or account type.
 * Requires: admin (for most changes) or owner (for owner grants and admin grants).
 *
 * Body: { targetId, field: 'platformRole' | 'accountType', value, reason? }
 *
 * Rules enforced:
 * - Only owner can grant/revoke owner or admin roles.
 * - Cannot remove the last owner.
 * - Cannot change your own role (prevents self-escalation).
 * - All changes are written to audit_events.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, accountTypeHistory } from '@/server/db/schema.js';
import { eq, and, ne, count } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole, writeAuditEvent } from '@/server/lib/require-role.js';
import type { PlatformRole, AccountType } from '@/server/lib/require-role.js';

const VALID_ROLES: PlatformRole[] = ['owner', 'admin', 'moderator', 'support', 'member'];
const VALID_ACCOUNT_TYPES: AccountType[] = ['community_member', 'creator', 'organization', 'official'];

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasRole(session as { user?: Record<string, unknown> }, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const actorId = session.user.id as string;
  const actorRole = (session.user as { platformRole?: string }).platformRole as PlatformRole ?? 'member';
  const { targetId, field, value, reason } = req.body as {
    targetId?: string;
    field?: string;
    value?: string;
    reason?: string;
  };

  if (!targetId || !field || !value) {
    return res.status(400).json({ error: 'targetId, field, and value are required' });
  }
  // Only the Platform Owner may change their own role; all others are blocked from self-role changes
  if (targetId === actorId && field === 'platformRole' && actorRole !== 'owner') {
    return res.status(400).json({ error: 'You cannot change your own platform role' });
  }

  // Fetch target's current values
  const [target] = await db
    .select({ id: user.id, platformRole: user.platformRole, accountType: user.accountType })
    .from(user)
    .where(eq(user.id, targetId))
    .limit(1);

  if (!target) return res.status(404).json({ error: 'Member not found' });

  if (field === 'platformRole') {
    if (!VALID_ROLES.includes(value as PlatformRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const newRole = value as PlatformRole;
    // Only owner can grant/revoke owner or admin
    if ((newRole === 'owner' || newRole === 'admin' || target.platformRole === 'owner' || target.platformRole === 'admin')
        && actorRole !== 'owner') {
      return res.status(403).json({ error: 'Only the Platform Owner can grant or revoke owner/admin roles' });
    }
    // Prevent removing the last owner
    if (target.platformRole === 'owner' && newRole !== 'owner') {
      const [ownerCount] = await db
        .select({ n: count() })
        .from(user)
        .where(and(eq(user.platformRole, 'owner'), ne(user.id, targetId)));
      if (Number(ownerCount?.n ?? 0) === 0) {
        return res.status(400).json({ error: 'Cannot remove the last Platform Owner' });
      }
    }

    await db.update(user).set({ platformRole: newRole }).where(eq(user.id, targetId));
    await writeAuditEvent({
      actorId,
      targetId,
      action: 'role.grant',
      oldValue: target.platformRole ?? 'member',
      newValue: newRole,
      reason: reason ?? '',
      ipAddress: req.ip ?? '',
    });
    return res.json({ ok: true, platformRole: newRole });
  }

  if (field === 'accountType') {
    if (!VALID_ACCOUNT_TYPES.includes(value as AccountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    // Only owner can provision official accounts
    if (value === 'official' && actorRole !== 'owner') {
      return res.status(403).json({ error: 'Only the Platform Owner can provision Official Spellful accounts' });
    }
    const newType = value as AccountType;
    await db.update(user).set({ accountType: newType }).where(eq(user.id, targetId));
    await db.insert(accountTypeHistory).values({
      userId: targetId,
      fromType: target.accountType ?? 'community_member',
      toType: newType,
      changedBy: actorId,
      reason: reason ?? '',
    });
    await writeAuditEvent({
      actorId,
      targetId,
      action: 'account_type.change',
      oldValue: target.accountType ?? 'community_member',
      newValue: newType,
      reason: reason ?? '',
      ipAddress: req.ip ?? '',
    });
    return res.json({ ok: true, accountType: newType });
  }

  return res.status(400).json({ error: 'field must be platformRole or accountType' });
}
