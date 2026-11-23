/**
 * POST /api/profile/soundscapes/playlists
 * Body: { url, customTitle?, description?, visibility? }
 * Adds a new playlist (max 10 per user).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profilePlaylists } from '@/server/db/schema.js';
import { eq, count } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { validatePlaylistUrl } from '@/server/lib/playlist-validator.js';

const VALID_VIS = new Set(['public', 'coven', 'private']);
const MAX_PLAYLISTS = 10;

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { url, customTitle = '', description = '', visibility = 'private' } = req.body as {
    url: string; customTitle?: string; description?: string; visibility?: string;
  };

  if (!url) return res.status(400).json({ error: 'url is required' });
  if (!VALID_VIS.has(visibility)) return res.status(400).json({ error: 'Invalid visibility' });

  let info;
  try {
    info = validatePlaylistUrl(url);
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Invalid URL' });
  }

  // Count existing playlists
  const [{ total }] = await db.select({ total: count() }).from(profilePlaylists)
    .where(eq(profilePlaylists.userId, session.user.id));
  if (total >= MAX_PLAYLISTS) {
    return res.status(400).json({ error: `Maximum ${MAX_PLAYLISTS} playlists allowed` });
  }

  const [result] = await db.insert(profilePlaylists).values({
    userId: session.user.id,
    provider: info.provider,
    canonicalUrl: info.canonicalUrl,
    providerPlaylistId: info.providerPlaylistId,
    customTitle: customTitle.slice(0, 100),
    description: description.slice(0, 300),
    visibility,
    position: total,
  });

  res.status(201).json({ id: result.insertId, ...info, customTitle, description, visibility });
}
