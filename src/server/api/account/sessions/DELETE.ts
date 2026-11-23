/**
 * DELETE /api/account/sessions
 * Revokes all sessions except the current one.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const currentToken = (session as { session?: { token?: string } }).session?.token;
  if (!currentToken) return res.status(400).json({ error: 'Cannot identify current session' });

  await db.execute(
    sql`DELETE FROM session WHERE user_id = ${session.user.id} AND token != ${currentToken}`
  );

  res.json({ ok: true });
}
