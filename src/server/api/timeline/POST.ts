import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { timelineEntries } from '../../db/schema.js';
import { getAuthSession } from '../../lib/auth-session.js';

const VALID_TYPES = ['milestone', 'journal', 'tarot', 'ritual', 'dream', 'relationship'];

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { type, title, content, tags, moonPhase, eventDate, isPrivate, metadata } = req.body as {
    type: string;
    title: string;
    content: string;
    tags?: string;
    moonPhase?: string;
    eventDate: string;
    isPrivate?: boolean;
    metadata?: Record<string, unknown>;
  };

  if (!type || !title || !content || !eventDate) {
    return res.status(400).json({ error: 'type, title, content, and eventDate are required' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid entry type' });
  }

  try {
    const [result] = await db.insert(timelineEntries).values({
      userId: session.user.id,
      type,
      title,
      content,
      tags: tags ?? '',
      moonPhase: moonPhase ?? '',
      eventDate,
      isPrivate: isPrivate ?? true,
      metadata: metadata ?? {},
    });

    res.status(201).json({ id: result.insertId, message: 'Timeline entry created' });
  } catch (error) {
    console.error('[timeline/POST] DB error:', error);
    res.status(500).json({ error: 'Failed to create timeline entry', message: 'Internal server error' });
  }
}
