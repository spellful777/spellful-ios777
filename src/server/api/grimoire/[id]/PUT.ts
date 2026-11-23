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
    // Verify ownership
    const [existing] = await db
      .select()
      .from(grimoireEntries)
      .where(and(eq(grimoireEntries.id, id), eq(grimoireEntries.userId, session.user.id)));

    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    const { title, content, notes, tags, category, isFavorite, moonPhase, entryDate, metadata } = req.body as {
      title?: string;
      content?: string;
      notes?: string;
      tags?: string;
      category?: string;
      isFavorite?: boolean;
      moonPhase?: string;
      entryDate?: string;
      metadata?: Record<string, unknown>;
    };

    await db
      .update(grimoireEntries)
      .set({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(category !== undefined && { category }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(moonPhase !== undefined && { moonPhase }),
        ...(entryDate !== undefined && { entryDate }),
        ...(metadata !== undefined && { metadata }),
      })
      .where(eq(grimoireEntries.id, id));

    res.json({ message: 'Entry updated' });
  } catch (error) {
    console.error('[grimoire/PUT] DB error:', error);
    res.status(500).json({ error: 'Failed to update entry', message: 'Internal server error' });
  }
}
