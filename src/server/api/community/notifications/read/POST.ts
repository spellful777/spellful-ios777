import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityNotifications } from '@/server/db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { ids } = req.body as { ids?: number[] };

  if (ids?.length) {
    await db.update(communityNotifications).set({ isRead: true })
      .where(and(eq(communityNotifications.userId, session.user.id), inArray(communityNotifications.id, ids)));
  } else {
    // Mark all as read
    await db.update(communityNotifications).set({ isRead: true }).where(eq(communityNotifications.userId, session.user.id));
  }

  res.json({ ok: true });
}
