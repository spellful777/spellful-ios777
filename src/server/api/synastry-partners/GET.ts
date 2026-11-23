import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { synastryPartners } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const rows = await db
    .select()
    .from(synastryPartners)
    .where(eq(synastryPartners.userId, session.user.id))
    .orderBy(desc(synastryPartners.createdAt));

  res.json(rows);
}
