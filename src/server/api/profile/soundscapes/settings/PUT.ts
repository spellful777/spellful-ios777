/**
 * PUT /api/profile/soundscapes/settings
 * Body: { enabled?, visibility? }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileSoundscapesSettings } from '@/server/db/schema.js';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_VIS = new Set(['public', 'coven', 'private']);

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { enabled, visibility } = req.body as { enabled?: number; visibility?: string };

  if (visibility !== undefined && !VALID_VIS.has(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility' });
  }

  await db.insert(profileSoundscapesSettings)
    .values({
      userId: session.user.id,
      enabled: enabled ?? 0,
      visibility: visibility ?? 'private',
    })
    .onDuplicateKeyUpdate({
      set: {
        ...(enabled !== undefined ? { enabled } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
      },
    });

  res.json({ ok: true });
}
