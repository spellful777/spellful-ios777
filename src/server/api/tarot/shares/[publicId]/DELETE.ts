/**
 * DELETE /api/tarot/shares/:publicId
 * Revokes a public share. Only the owner can revoke.
 */

import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request<{ publicId: string }>, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { publicId } = req.params;

  const [rows] = await db.execute(
    sql`SELECT id, owner_user_id, revoked_at FROM tarot_shares WHERE public_id = ${publicId} LIMIT 1`
  ) as unknown as [Array<{ id: number; owner_user_id: string; revoked_at: Date | null }>, unknown];

  const share = rows[0];
  if (!share) {
    res.status(404).json({ error: 'Share not found' });
    return;
  }
  if (share.owner_user_id !== session.user.id) {
    res.status(403).json({ error: 'Not authorised' });
    return;
  }
  if (share.revoked_at != null) {
    res.status(200).json({ ok: true, message: 'Already revoked' });
    return;
  }

  await db.execute(
    sql`UPDATE tarot_shares SET revoked_at = NOW() WHERE id = ${share.id}`
  );

  res.json({ ok: true });
}
