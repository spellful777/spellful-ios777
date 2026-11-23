/**
 * DELETE /api/profile/collections/:id/items/:itemId
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileCollections, profileCollectionItems } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string; itemId: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const collectionId = parseInt(req.params.id, 10);
  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(collectionId) || isNaN(itemId)) return res.status(400).json({ error: 'Invalid id' });

  const [col] = await db.select({ id: profileCollections.id })
    .from(profileCollections)
    .where(and(eq(profileCollections.id, collectionId), eq(profileCollections.userId, session.user.id)))
    .limit(1);
  if (!col) return res.status(404).json({ error: 'Collection not found' });

  await db.delete(profileCollectionItems)
    .where(and(eq(profileCollectionItems.id, itemId), eq(profileCollectionItems.collectionId, collectionId)));

  res.json({ ok: true });
}
