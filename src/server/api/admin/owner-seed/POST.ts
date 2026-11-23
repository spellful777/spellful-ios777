/**
 * POST /api/admin/owner-seed
 *
 * One-time privileged endpoint to assign the `owner` platform role to the
 * designated Platform Owner account (bw@spellful.com).
 *
 * Security model:
 *  - Requires the `X-Seed-Token` header to equal BETTER_AUTH_SECRET.
 *    This secret is never exposed to the browser; the request must be made
 *    from a trusted context (curl, Codemagic post-deploy script, etc.).
 *  - Idempotent: safe to call multiple times — if the role is already `owner`
 *    it returns 200 with `{ ok: true, alreadyOwner: true }`.
 *  - Writes an audit event on every successful promotion.
 *  - Does NOT create a new user — only promotes an existing verified account.
 *
 * Usage (from a trusted terminal):
 *   curl -X POST https://spellful.com/api/admin/owner-seed \
 *     -H "X-Seed-Token: <BETTER_AUTH_SECRET>"
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { writeAuditEvent } from '@/server/lib/require-role.js';
import { getSecret } from '#airo/secrets';

const OWNER_EMAIL = 'bw@spellful.com';

export default async function handler(req: Request, res: Response): Promise<void> {
  // ── Token gate ────────────────────────────────────────────────────────────
  const secret = getSecret('BETTER_AUTH_SECRET');
  const tokenHeader = req.headers['x-seed-token'];
  const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
  if (!secret || !token || token !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!db) {
    res.status(503).json({ error: 'Database unavailable' });
    return;
  }

  // ── Look up the owner account by email ────────────────────────────────────
  const [target] = await db
    .select({ id: user.id, email: user.email, platformRole: user.platformRole, username: user.username })
    .from(user)
    .where(eq(user.email, OWNER_EMAIL))
    .limit(1);

  if (!target) {
    res.status(404).json({ error: 'Owner account not found', email: OWNER_EMAIL });
    return;
  }

  // ── Idempotent: already owner ─────────────────────────────────────────────
  if (target.platformRole === 'owner') {
    res.json({ ok: true, alreadyOwner: true, userId: target.id, username: target.username });
    return;
  }

  // ── Promote to owner ──────────────────────────────────────────────────────
  await db.update(user).set({ platformRole: 'owner' }).where(eq(user.id, target.id));

  await writeAuditEvent({
    actorId: 'system',
    targetId: target.id,
    action: 'role.grant',
    oldValue: target.platformRole ?? 'member',
    newValue: 'owner',
    reason: 'Initial platform owner seed via /api/admin/owner-seed',
    ipAddress: req.ip ?? '',
  });

  res.json({
    ok: true,
    alreadyOwner: false,
    userId: target.id,
    username: target.username,
    email: target.email,
    platformRole: 'owner',
  });
}
