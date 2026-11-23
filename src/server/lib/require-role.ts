/**
 * require-role.ts
 * Centralized RBAC authorization helpers for API routes.
 *
 * Platform roles (highest → lowest):
 *   owner → admin → moderator → support → member
 *
 * Usage:
 *   const session = await getAuthSession(req);
 *   if (!hasRole(session, 'admin')) return res.status(403).json({ error: 'Forbidden' });
 *
 *   // Or as Express middleware:
 *   app.get('/api/admin/roles', requireRole('admin'), handler);
 */
import type { Request, Response, NextFunction } from 'express';
import { getAuthSession } from './auth-session.js';
import { db } from '../db/client.js';
import { auditEvents } from '../db/schema.js';

export type PlatformRole = 'owner' | 'admin' | 'moderator' | 'support' | 'member';
export type AccountType = 'community_member' | 'creator' | 'organization' | 'official';

// Role hierarchy — higher index = more privilege
const ROLE_ORDER: PlatformRole[] = ['member', 'support', 'moderator', 'admin', 'owner'];

/**
 * Returns true if the session user's role is at least `minRole`.
 * Also accepts the legacy `isAdmin` boolean as an admin-level grant.
 */
export function hasRole(
  session: { user?: Record<string, unknown> } | null,
  minRole: PlatformRole,
): boolean {
  if (!session?.user) return false;
  const u = session.user as { platformRole?: string; isAdmin?: boolean };
  // Legacy isAdmin flag counts as admin
  const role = (u.platformRole as PlatformRole | undefined) ?? (u.isAdmin ? 'admin' : 'member');
  const userIdx = ROLE_ORDER.indexOf(role);
  const minIdx = ROLE_ORDER.indexOf(minRole);
  return userIdx >= minIdx;
}

/**
 * Express middleware factory. Rejects with 401/403 if the caller doesn't
 * hold at least `minRole`.
 */
export function requireRole(minRole: PlatformRole) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await getAuthSession(req);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!hasRole(session as { user?: Record<string, unknown> }, minRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

/**
 * Write an audit event row. Non-fatal — errors are logged but not thrown.
 */
export async function writeAuditEvent(opts: {
  actorId: string;
  targetId?: string | null;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    if (!db) return;
    await db.insert(auditEvents).values({
      actorId: opts.actorId,
      targetId: opts.targetId ?? null,
      action: opts.action,
      oldValue: opts.oldValue ?? null,
      newValue: opts.newValue ?? null,
      reason: opts.reason ?? '',
      ipAddress: opts.ipAddress ?? '',
    });
  } catch (e) {
    console.error(JSON.stringify({ event: 'audit.write.error', msg: String(e).slice(0, 120) }));
  }
}
