/**
 * POST /api/profile/collections
 * Body: { type, title, visibility }
 * Creates or updates a collection (one per type per user).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileCollections } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_TYPES = new Set(['crystals', 'herbs', 'tarot_decks', 'bookshelf', 'tools', 'inspirations']);
const VALID_VIS = new Set(['public', 'coven', 'private']);

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { type, title, visibility = 'private' } = req.body as {
    type?: string; title?: string; visibility?: string;
  };

  if (!type || !VALID_TYPES.has(type)) return res.status(400).json({ error: 'Invalid type' });
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  if (!VALID_VIS.has(visibility)) return res.status(400).json({ error: 'Invalid visibility' });

  await db.insert(profileCollections)
    .values({ userId: session.user.id, type, title: title.trim().slice(0, 80), visibility })
    .onDuplicateKeyUpdate({ set: { title: title.trim().slice(0, 80), visibility } });

  const [col] = await db.select().from(profileCollections)
    .where(and(eq(profileCollections.userId, session.user.id), eq(profileCollections.type, type)))
    .limit(1);

  res.status(201).json({ ok: true, collection: col });
}
