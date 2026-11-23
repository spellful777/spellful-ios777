/**
 * PATCH /api/profile/collections/:id/items/:itemId
 * Body: { name?, note?, emoji?, visibility?, position? }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileCollections, profileCollectionItems } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_VIS = new Set(['public', 'coven', 'private']);

export default async function handler(req: Request<{ id: string; itemId: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const collectionId = parseInt(req.params.id, 10);
  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(collectionId) || isNaN(itemId)) return res.status(400).json({ error: 'Invalid id' });

  // Verify ownership via collection
  const [col] = await db.select({ id: profileCollections.id })
    .from(profileCollections)
    .where(and(eq(profileCollections.id, collectionId), eq(profileCollections.userId, session.user.id)))
    .limit(1);
  if (!col) return res.status(404).json({ error: 'Collection not found' });

  const { name, note, emoji, visibility, position } = req.body as {
    name?: string; note?: string; emoji?: string; visibility?: string; position?: number;
  };
  if (visibility && !VALID_VIS.has(visibility)) return res.status(400).json({ error: 'Invalid visibility' });

  const updates: Record<string, string | number> = {};
  if (name !== undefined) updates.name = name.trim().slice(0, 120);
  if (note !== undefined) updates.note = note.trim().slice(0, 200);
  if (emoji !== undefined) updates.emoji = emoji.trim().slice(0, 10);
  if (visibility !== undefined) updates.visibility = visibility;
  if (typeof position === 'number') updates.position = position;
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

  await db.update(profileCollectionItems)
    .set(updates)
    .where(and(eq(profileCollectionItems.id, itemId), eq(profileCollectionItems.collectionId, collectionId)));

  res.json({ ok: true });
}
