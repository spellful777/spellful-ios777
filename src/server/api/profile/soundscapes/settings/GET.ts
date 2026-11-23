/**
 * GET /api/profile/soundscapes/settings
 * Returns the authenticated user's soundscapes settings + all playlists.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileSoundscapesSettings, profilePlaylists } from '@/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const [settings] = await db.select().from(profileSoundscapesSettings)
    .where(eq(profileSoundscapesSettings.userId, session.user.id));

  const playlists = await db.select().from(profilePlaylists)
    .where(eq(profilePlaylists.userId, session.user.id))
    .orderBy(asc(profilePlaylists.position));

  res.json({
    settings: settings ?? { enabled: 0, visibility: 'private' },
    playlists,
  });
}
