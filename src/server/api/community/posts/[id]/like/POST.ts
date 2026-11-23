import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityLikes, communityPosts } from '@/server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const [existing] = await db.select({ id: communityLikes.id }).from(communityLikes)
    .where(and(eq(communityLikes.userId, session.user.id), eq(communityLikes.targetType, 'post'), eq(communityLikes.targetId, postId))).limit(1);

  if (existing) {
    await db.delete(communityLikes).where(eq(communityLikes.id, existing.id));
    await db.update(communityPosts).set({ likeCount: sql`GREATEST(like_count - 1, 0)` }).where(eq(communityPosts.id, postId));
    return res.json({ liked: false });
  }

  await db.insert(communityLikes).values({ userId: session.user.id, targetType: 'post', targetId: postId });
  await db.update(communityPosts).set({ likeCount: sql`like_count + 1` }).where(eq(communityPosts.id, postId));
  res.json({ liked: true });
}
