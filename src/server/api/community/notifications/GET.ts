import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityNotifications, user } from '@/server/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 30;
  const offset = (page - 1) * limit;

  const [notifications, [{ unread }]] = await Promise.all([
    db.select({
      id: communityNotifications.id,
      type: communityNotifications.type,
      postId: communityNotifications.postId,
      replyId: communityNotifications.replyId,
      message: communityNotifications.message,
      isRead: communityNotifications.isRead,
      createdAt: communityNotifications.createdAt,
      actorName: user.name,
      actorImage: user.image,
      actorUsername: user.username,
    })
      .from(communityNotifications)
      .leftJoin(user, eq(communityNotifications.actorId, user.id))
      .where(eq(communityNotifications.userId, session.user.id))
      .orderBy(desc(communityNotifications.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ unread: sql<number>`SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END)` })
      .from(communityNotifications)
      .where(eq(communityNotifications.userId, session.user.id)),
  ]);

  res.json({ notifications, unread: unread ?? 0 });
}
