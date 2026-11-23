import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { synastryPartners } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  await db.delete(synastryPartners).where(
    and(eq(synastryPartners.id, id), eq(synastryPartners.userId, session.user.id))
  );

  res.json({ ok: true });
}
