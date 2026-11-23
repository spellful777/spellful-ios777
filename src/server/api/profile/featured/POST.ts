/**
 * POST /api/profile/featured
 * Body: { itemType: 'post' | 'grimoire', itemId: number }
 * Pins up to 5 items.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileFeatured } from '@/server/db/schema.js';
import { eq, count } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const MAX_FEATURED = 5;

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const { itemType, itemId } = req.body as { itemType?: string; itemId?: number };
  if (!itemType || !['post', 'grimoire'].includes(itemType)) return res.status(400).json({ error: 'Invalid itemType' });
  if (!itemId || typeof itemId !== 'number') return res.status(400).json({ error: 'itemId required' });

  const [{ total }] = await db.select({ total: count() }).from(profileFeatured).where(eq(profileFeatured.userId, myId));
  if (total >= MAX_FEATURED) return res.status(400).json({ error: `You can feature up to ${MAX_FEATURED} items.` });

  await db.insert(profileFeatured).ignore().values({ userId: myId, itemType, itemId, sortOrder: total });
  res.status(201).json({ ok: true });
}
