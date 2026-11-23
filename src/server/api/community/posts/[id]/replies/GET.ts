import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityReplies, communityLikes, user } from '@/server/db/schema.js';
import { eq, and, asc, inArray, notInArray } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Sign in to view the community' });
  const myId = session.user.id;
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const sort = req.query.sort === 'liked' ? 'liked' : 'chrono';

  // Get all blocked user IDs in both directions (mutual block)
  let blockedIds: string[] = [];
  if (myId) {
    const { getBlockedUserIds } = await import('@/server/lib/block-check.js');
    const blockedSet = await getBlockedUserIds(myId);
    blockedIds = Array.from(blockedSet);
  }

  const conditions = [eq(communityReplies.postId, postId), eq(communityReplies.isHidden, false)];
  if (blockedIds.length) conditions.push(notInArray(communityReplies.userId, blockedIds));

  const replies = await db.select({
    id: communityReplies.id,
    postId: communityReplies.postId,
    parentId: communityReplies.parentId,
    body: communityReplies.body,
    likeCount: communityReplies.likeCount,
    depth: communityReplies.depth,
    createdAt: communityReplies.createdAt,
    updatedAt: communityReplies.updatedAt,
    userId: communityReplies.userId,
    authorName: user.name,
    authorImage: user.image,
    authorUsername: user.username,
    authorLocation: user.location,
  })
    .from(communityReplies)
    .leftJoin(user, eq(communityReplies.userId, user.id))
    .where(and(...conditions))
    .orderBy(sort === 'liked' ? communityReplies.likeCount : asc(communityReplies.createdAt));

  // Liked state
  let likedIds = new Set<number>();
  if (myId && replies.length) {
    const replyIds = replies.map((r) => r.id);
    const likes = await db.select({ targetId: communityLikes.targetId }).from(communityLikes)
      .where(and(eq(communityLikes.userId, myId), eq(communityLikes.targetType, 'reply'), inArray(communityLikes.targetId, replyIds)));
    likedIds = new Set(likes.map((l) => l.targetId));
  }

  res.json(replies.map((r) => ({ ...r, liked: likedIds.has(r.id), isOwner: myId === r.userId })));
}
