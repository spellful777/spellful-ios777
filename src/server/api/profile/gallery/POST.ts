/**
 * POST /api/profile/gallery
 * Body: { imageUrl, caption?, altText?, visibility? }
 * Adds a gallery item for the authenticated user (max 50 items).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileGallery } from '@/server/db/schema.js';
import { eq, count } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_VISIBILITIES = ['public', 'coven', 'private'];
const MAX_GALLERY_ITEMS = 50;

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const { imageUrl, caption, altText, visibility } = req.body as {
    imageUrl?: string; caption?: string; altText?: string; visibility?: string;
  };
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });
  if (visibility && !VALID_VISIBILITIES.includes(visibility))
    return res.status(400).json({ error: 'Invalid visibility' });

  // Enforce max items
  const [{ total }] = await db.select({ total: count() }).from(profileGallery).where(eq(profileGallery.userId, myId));
  if (total >= MAX_GALLERY_ITEMS)
    return res.status(400).json({ error: `Gallery is limited to ${MAX_GALLERY_ITEMS} items.` });

  const [item] = await db.insert(profileGallery).values({
    userId: myId,
    imageUrl,
    caption: caption?.slice(0, 200) ?? '',
    altText: altText?.slice(0, 200) ?? '',
    visibility: visibility ?? 'public',
    sortOrder: total,
  }).$returningId();

  res.status(201).json({ ok: true, id: item.id });
}
