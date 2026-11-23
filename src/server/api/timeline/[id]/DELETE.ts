import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { timelineEntries } from '../../../db/schema.js';
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
      .from(timelineEntries)
      .where(and(eq(timelineEntries.id, id), eq(timelineEntries.userId, session.user.id)));

    if (!existing) return res.status(404).json({ error: 'Not found' });

    await db
      .delete(timelineEntries)
      .where(and(eq(timelineEntries.id, id), eq(timelineEntries.userId, session.user.id)));

    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[timeline/DELETE] DB error:', error);
    res.status(500).json({ error: 'Failed to delete timeline entry', message: 'Internal server error' });
  }
}
