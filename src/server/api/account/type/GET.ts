/**
 * GET /api/account/type
 * Returns the current user's account_type.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const [row] = await db
    .select({ accountType: user.accountType })
    .from(user)
    .where(eq(user.id, session.user.id as string))
    .limit(1);

  return res.json({ accountType: row?.accountType ?? 'community_member' });
}
