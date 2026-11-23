/**
 * DELETE /api/profile/gallery/:id
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileGallery } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const itemId = parseInt(req.params.id);
  if (isNaN(itemId)) return res.status(400).json({ error: 'Invalid id' });
  await db.delete(profileGallery).where(and(eq(profileGallery.id, itemId), eq(profileGallery.userId, session.user.id)));
  res.json({ ok: true });
}
