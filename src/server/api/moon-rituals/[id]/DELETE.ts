import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { moonRituals } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    await db
      .delete(moonRituals)
      .where(and(eq(moonRituals.id, id), eq(moonRituals.userId, session.user.id)));

    res.json({ message: 'Ritual deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ritual', message: 'Internal server error' });
  }
}
