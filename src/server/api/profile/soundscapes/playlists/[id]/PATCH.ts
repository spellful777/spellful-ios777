/**
 * PATCH /api/profile/soundscapes/playlists/:id
 * Body: { customTitle?, description?, visibility?, isFeatured?, isCurrentVibe?, position? }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profilePlaylists } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_VIS = new Set(['public', 'coven', 'private']);

export default async function handler(req: Request<{ id: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { customTitle, description, visibility, isFeatured, isCurrentVibe, position } = req.body as {
    customTitle?: string; description?: string; visibility?: string;
    isFeatured?: number; isCurrentVibe?: number; position?: number;
  };

  if (visibility !== undefined && !VALID_VIS.has(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility' });
  }

  // Enforce single featured / single current-vibe
  if (isFeatured === 1) {
    await db.update(profilePlaylists)
      .set({ isFeatured: 0 })
      .where(eq(profilePlaylists.userId, session.user.id));
  }
  if (isCurrentVibe === 1) {
    await db.update(profilePlaylists)
      .set({ isCurrentVibe: 0 })
      .where(eq(profilePlaylists.userId, session.user.id));
  }

  const updates: Record<string, unknown> = {};
  if (customTitle !== undefined) updates.customTitle = customTitle.slice(0, 100);
  if (description !== undefined) updates.description = description.slice(0, 300);
  if (visibility !== undefined) updates.visibility = visibility;
  if (isFeatured !== undefined) updates.isFeatured = isFeatured;
  if (isCurrentVibe !== undefined) updates.isCurrentVibe = isCurrentVibe;
  if (position !== undefined) updates.position = position;

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });

  await db.update(profilePlaylists)
    .set(updates)
    .where(and(eq(profilePlaylists.id, id), eq(profilePlaylists.userId, session.user.id)));

  res.json({ ok: true });
}
