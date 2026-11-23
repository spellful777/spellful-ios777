import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { userPresence, user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { isBlocked } from '@/server/lib/block-check.js';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export default async function handler(req: Request<{ userId: string }>, res: Response) {
  const { userId } = req.params;

  // If the viewer is blocked by or has blocked this user, return offline
  const session = await getAuthSession(req);
  if (session?.user?.id && session.user.id !== userId) {
    try {
      if (await isBlocked(session.user.id, userId)) {
        return res.json({ online: false, lastSeen: null });
      }
    } catch { /* non-fatal */ }
  }

  // Check if user has hidden their online status (column may not exist yet — degrade gracefully)
  try {
    const [userRow] = await db.select({ hideOnlineStatus: user.hideOnlineStatus })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRow?.hideOnlineStatus) {
      return res.json({ online: false, lastSeen: null });
    }
  } catch {
    // Column not yet migrated — continue without hide check
  }

  const rows = await db.select().from(userPresence).where(eq(userPresence.userId, userId)).limit(1);
  if (!rows.length) return res.json({ online: false, lastSeen: null });

  const lastSeen = rows[0].lastSeen;
  const online = lastSeen ? Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS : false;

  res.json({ online, lastSeen: lastSeen ?? null });
}
