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

  const { notes } = req.body as { notes?: string };
  if (typeof notes !== 'string') {
    return res.status(400).json({ error: 'notes must be a string' });
  }

  try {
    await db
      .update(moonRituals)
      .set({ notes: notes.trim() })
      .where(and(eq(moonRituals.id, id), eq(moonRituals.userId, session.user.id)));

    res.json({ message: 'Notes updated' });
  } catch (error) {
    console.error('[moon-rituals/PATCH] DB error:', error);
    res.status(500).json({ error: 'Failed to update notes', message: 'Internal server error' });
  }
}
