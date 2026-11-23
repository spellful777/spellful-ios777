import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { grimoireEntries } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const [existing] = await db
      .select()
      .from(grimoireEntries)
      .where(and(eq(grimoireEntries.id, id), eq(grimoireEntries.userId, session.user.id)));

    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    await db.delete(grimoireEntries).where(eq(grimoireEntries.id, id));

    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('[grimoire/DELETE] DB error:', error);
    res.status(500).json({ error: 'Failed to delete entry', message: 'Internal server error' });
  }
}
