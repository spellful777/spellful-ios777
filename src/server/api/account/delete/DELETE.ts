/**
 * DELETE /api/account/delete
 * Cancels a pending account deletion request.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  await db.update(user).set({ deletionRequestedAt: null }).where(eq(user.id, session.user.id));

  res.json({ ok: true });
}
