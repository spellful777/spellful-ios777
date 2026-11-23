import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { tarotReadings } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    await db
      .delete(tarotReadings)
      .where(and(eq(tarotReadings.id, id), eq(tarotReadings.userId, session.user.id)));

    res.json({ message: 'Reading deleted' });
  } catch (error) {
    console.error('[tarot/DELETE] DB error:', error);
    res.status(500).json({ error: 'Failed to delete reading', message: 'Internal server error' });
  }
}
