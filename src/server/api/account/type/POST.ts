/**
 * POST /api/account/type
 * Self-service account type opt-in. Community members may upgrade to 'creator'.
 * Admins may set any type via PATCH /api/admin/roles.
 *
 * Body: { type: 'creator' }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, accountTypeHistory } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const SELF_SERVICE_TYPES = ['creator'] as const;

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { type } = req.body as { type?: string };
  if (!type || !SELF_SERVICE_TYPES.includes(type as typeof SELF_SERVICE_TYPES[number])) {
    return res.status(400).json({ error: 'Only "creator" is available for self-service opt-in' });
  }

  const userId = session.user.id as string;
  const [current] = await db
    .select({ accountType: user.accountType })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const fromType = current?.accountType ?? 'community_member';
  if (fromType === type) {
    return res.json({ ok: true, accountType: type, changed: false });
  }

  // Only community_member can self-upgrade to creator
  if (fromType !== 'community_member') {
    return res.status(403).json({ error: 'Your account type can only be changed by an administrator' });
  }

  await db.update(user).set({ accountType: type }).where(eq(user.id, userId));
  await db.insert(accountTypeHistory).values({
    userId,
    fromType,
    toType: type,
    changedBy: userId,
    reason: 'self-service opt-in',
  });

  return res.json({ ok: true, accountType: type, changed: true });
}
