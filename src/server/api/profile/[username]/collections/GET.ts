/**
 * GET /api/profile/:username/collections
 * Returns collections + items for a public profile, respecting visibility.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, profileCollections, profileCollectionItems, covenConnections } from '@/server/db/schema.js';
import { eq, and, or, inArray, asc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { isBlocked } from '@/server/lib/block-check.js';

export default async function handler(req: Request<{ username: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const normalized = req.params.username.toLowerCase();
  const [profileUser] = await db.select({ id: user.id })
    .from(user).where(eq(user.usernameNormalized, normalized)).limit(1);
  if (!profileUser) return res.status(404).json({ error: 'Not found' });

  const session = await getAuthSession(req);
  const viewerId = session?.user.id ?? null;

  if (viewerId && await isBlocked(profileUser.id, viewerId)) return res.status(404).json({ error: 'Not found' });

  let isCoven = false;
  if (viewerId && viewerId !== profileUser.id) {
    const [conn] = await db.select({ id: covenConnections.id })
      .from(covenConnections)
      .where(and(
        or(
          and(eq(covenConnections.requesterId, viewerId), eq(covenConnections.receiverId, profileUser.id)),
          and(eq(covenConnections.requesterId, profileUser.id), eq(covenConnections.receiverId, viewerId)),
        ),
        eq(covenConnections.status, 'accepted'),
      )).limit(1);
    isCoven = !!conn;
  }
  const isOwner = viewerId === profileUser.id;

  const allowedCollVis: string[] = ['public'];
  if (isOwner || isCoven) allowedCollVis.push('coven');
  if (isOwner) allowedCollVis.push('private');

  const allowedItemVis: string[] = ['public'];
  if (isOwner || isCoven) allowedItemVis.push('coven');
  if (isOwner) allowedItemVis.push('private');

  const collections = await db.select().from(profileCollections)
    .where(and(eq(profileCollections.userId, profileUser.id), inArray(profileCollections.visibility, allowedCollVis)))
    .orderBy(asc(profileCollections.position));

  if (!collections.length) return res.json({ collections: [] });

  const collectionIds = collections.map(c => c.id);
  const allItems = await db.select().from(profileCollectionItems)
    .where(and(inArray(profileCollectionItems.collectionId, collectionIds), inArray(profileCollectionItems.visibility, allowedItemVis)))
    .orderBy(asc(profileCollectionItems.position));

  const itemsByCollection: Record<number, typeof allItems> = {};
  for (const item of allItems) {
    if (!itemsByCollection[item.collectionId]) itemsByCollection[item.collectionId] = [];
    itemsByCollection[item.collectionId].push(item);
  }

  res.json({ collections: collections.map(c => ({ ...c, items: itemsByCollection[c.id] ?? [] })) });
}
