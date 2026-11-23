/**
 * DELETE /api/profile/guestbook/bans/:bannedUserId
 * Owner lifts a ban.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileGuestbookBans } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ bannedUserId: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  await db.delete(profileGuestbookBans)
    .where(and(
      eq(profileGuestbookBans.profileUserId, session.user.id),
      eq(profileGuestbookBans.bannedUserId, req.params.bannedUserId),
    ));

  res.json({ ok: true });
}
