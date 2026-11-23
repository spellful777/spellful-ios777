/**
 * POST /api/profile/guestbook/bans
 * Body: { bannedUserId }
 * Owner bans a member from submitting.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileGuestbookBans } from '@/server/db/schema.js';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { bannedUserId } = req.body as { bannedUserId: string };
  if (!bannedUserId) return res.status(400).json({ error: 'bannedUserId is required' });
  if (bannedUserId === session.user.id) return res.status(400).json({ error: 'Cannot ban yourself' });

  await db.insert(profileGuestbookBans)
    .values({ profileUserId: session.user.id, bannedUserId })
    .onDuplicateKeyUpdate({ set: { profileUserId: session.user.id } });

  res.json({ ok: true });
}
