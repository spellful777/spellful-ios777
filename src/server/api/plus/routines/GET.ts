/**
 * GET /api/plus/routines
 * Returns the signed-in user's practice routines.
 * Free users: max 1 routine returned. Plus users: all routines.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { practiceRoutines } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getEntitlement } from '@/server/lib/plus-entitlement.js';

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }

  const [rows, ent] = await Promise.all([
    db.select().from(practiceRoutines).where(eq(practiceRoutines.userId, session.user.id)),
    getEntitlement(session.user.id),
  ]);

  const routines = ent.isPlus ? rows : rows.slice(0, 1);
  res.json({ routines, isPlus: ent.isPlus, totalCount: rows.length });
}
