/**
 * GET /api/profile/collections
 * Returns all collections + items for the authenticated user.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileCollections, profileCollectionItems } from '@/server/db/schema.js';
import { eq, asc, inArray } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const collections = await db.select().from(profileCollections)
    .where(eq(profileCollections.userId, session.user.id))
    .orderBy(asc(profileCollections.position));

  if (!collections.length) return res.json({ collections: [] });

  const collectionIds = collections.map(c => c.id);
  const allItems = await db.select().from(profileCollectionItems)
    .where(inArray(profileCollectionItems.collectionId, collectionIds))
    .orderBy(asc(profileCollectionItems.position));

  const itemsByCollection: Record<number, typeof allItems> = {};
  for (const item of allItems) {
    if (!itemsByCollection[item.collectionId]) itemsByCollection[item.collectionId] = [];
    itemsByCollection[item.collectionId].push(item);
  }

  const result = collections.map(c => ({ ...c, items: itemsByCollection[c.id] ?? [] }));
  res.json({ collections: result });
}
