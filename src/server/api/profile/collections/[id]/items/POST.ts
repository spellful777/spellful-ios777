/**
 * POST /api/profile/collections/:id/items
 * Body: { name, note?, emoji?, visibility? }
 * Adds an item to a collection (max 20 items).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileCollections, profileCollectionItems } from '@/server/db/schema.js';
import { eq, and, count } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_VIS = new Set(['public', 'coven', 'private']);
const MAX_ITEMS = 20;

export default async function handler(req: Request<{ id: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const collectionId = parseInt(req.params.id, 10);
  if (isNaN(collectionId)) return res.status(400).json({ error: 'Invalid id' });

  // Verify ownership
  const [col] = await db.select({ id: profileCollections.id })
    .from(profileCollections)
    .where(and(eq(profileCollections.id, collectionId), eq(profileCollections.userId, session.user.id)))
    .limit(1);
  if (!col) return res.status(404).json({ error: 'Collection not found' });

  const [{ total }] = await db.select({ total: count() })
    .from(profileCollectionItems)
    .where(eq(profileCollectionItems.collectionId, collectionId));
  if (total >= MAX_ITEMS) return res.status(400).json({ error: `Max ${MAX_ITEMS} items per collection` });

  const { name, note = '', emoji = '', visibility = 'public' } = req.body as {
    name?: string; note?: string; emoji?: string; visibility?: string;
  };
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  if (!VALID_VIS.has(visibility)) return res.status(400).json({ error: 'Invalid visibility' });

  const [item] = await db.insert(profileCollectionItems)
    .values({
      collectionId,
      name: name.trim().slice(0, 120),
      note: note.trim().slice(0, 200),
      emoji: emoji.trim().slice(0, 10),
      visibility,
      position: total,
    }).$returningId();

  res.status(201).json({ ok: true, id: item.id });
}
