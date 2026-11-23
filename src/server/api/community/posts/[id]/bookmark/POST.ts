import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityBookmarks } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const [existing] = await db.select({ id: communityBookmarks.id }).from(communityBookmarks)
    .where(and(eq(communityBookmarks.userId, session.user.id), eq(communityBookmarks.postId, postId))).limit(1);

  if (existing) {
    await db.delete(communityBookmarks).where(eq(communityBookmarks.id, existing.id));
    return res.json({ bookmarked: false });
  }

  await db.insert(communityBookmarks).values({ userId: session.user.id, postId });
  res.json({ bookmarked: true });
}
