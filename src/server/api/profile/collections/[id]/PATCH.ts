/**
 * PATCH /api/profile/collections/:id
 * Body: { title?, visibility? }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileCollections } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_VIS = new Set(['public', 'coven', 'private']);

export default async function handler(req: Request<{ id: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { title, visibility } = req.body as { title?: string; visibility?: string };
  if (visibility && !VALID_VIS.has(visibility)) return res.status(400).json({ error: 'Invalid visibility' });

  const updates: Record<string, string> = {};
  if (title) updates.title = title.trim().slice(0, 80);
  if (visibility) updates.visibility = visibility;
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

  await db.update(profileCollections)
    .set(updates)
    .where(and(eq(profileCollections.id, id), eq(profileCollections.userId, session.user.id)));

  res.json({ ok: true });
}
