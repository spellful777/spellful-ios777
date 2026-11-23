import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { grimoireEntries } from '../../db/schema.js';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { type, title, content, notes, tags, category, isFavorite, moonPhase, entryDate, metadata } = req.body as {
    type: string;
    title: string;
    content: string;
    notes?: string;
    tags?: string;
    category?: string;
    isFavorite?: boolean;
    moonPhase?: string;
    entryDate?: string;
    metadata?: Record<string, unknown>;
  };

  if (!type || !title || !content) {
    return res.status(400).json({ error: 'type, title, and content are required' });
  }

  const validTypes = ['spell', 'herb', 'crystal', 'ritual', 'tarot', 'dream', 'journal'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid entry type' });
  }

  try {
    const [result] = await db.insert(grimoireEntries).values({
      userId: session.user.id,
      type,
      title,
      content,
      notes: notes ?? '',
      tags: tags ?? '',
      category: category ?? '',
      isFavorite: isFavorite ?? false,
      moonPhase: moonPhase ?? '',
      entryDate: entryDate ?? new Date().toISOString().split('T')[0],
      metadata: metadata ?? {},
    });

    res.status(201).json({ id: result.insertId, message: 'Entry created' });
  } catch (error) {
    console.error('[grimoire/POST] DB error:', error);
    res.status(500).json({ error: 'Failed to create entry', message: 'Internal server error' });
  }
}
