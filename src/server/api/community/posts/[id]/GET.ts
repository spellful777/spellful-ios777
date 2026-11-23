import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts, communityCategories, communityPolls, communityPollVotes, communityLikes, communityBookmarks, communityMutes, user } from '@/server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Sign in to view the community' });
  const myId = session.user.id;
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const [post] = await db.select({
    id: communityPosts.id,
    type: communityPosts.type,
    title: communityPosts.title,
    body: communityPosts.body,
    imageUrl: communityPosts.imageUrl,
    tags: communityPosts.tags,
    isPinned: communityPosts.isPinned,
    isLocked: communityPosts.isLocked,
    isHidden: communityPosts.isHidden,
    acceptedReplyId: communityPosts.acceptedReplyId,
    likeCount: communityPosts.likeCount,
    replyCount: communityPosts.replyCount,
    viewCount: communityPosts.viewCount,
    createdAt: communityPosts.createdAt,
    updatedAt: communityPosts.updatedAt,
    userId: communityPosts.userId,
    categoryId: communityPosts.categoryId,
    authorName: user.name,
    authorImage: user.image,
    authorUsername: user.username,
    authorLocation: user.location,
    categoryName: communityCategories.name,
    categorySlug: communityCategories.slug,
  })
    .from(communityPosts)
    .leftJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
    .where(eq(communityPosts.id, postId))
    .limit(1);

  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.isHidden && post.userId !== myId) return res.status(404).json({ error: 'Post not found' });

  // Increment view count (fire-and-forget)
  db.update(communityPosts).set({ viewCount: sql`view_count + 1` }).where(eq(communityPosts.id, postId)).catch(() => {});

  // Poll
  let poll = null;
  const [pollRow] = await db.select().from(communityPolls).where(eq(communityPolls.postId, postId)).limit(1);
  if (pollRow) {
    const votes = await db.select({ choiceIndex: communityPollVotes.choiceIndex }).from(communityPollVotes).where(eq(communityPollVotes.pollId, pollRow.id));
    const tallies = (pollRow.choices as string[]).map((_, i) => votes.filter((v) => v.choiceIndex === i).length);
    let myVote: number | null = null;
    if (myId) {
      const [myVoteRow] = await db.select({ choiceIndex: communityPollVotes.choiceIndex }).from(communityPollVotes).where(and(eq(communityPollVotes.pollId, pollRow.id), eq(communityPollVotes.userId, myId))).limit(1);
      myVote = myVoteRow?.choiceIndex ?? null;
    }
    poll = { ...pollRow, tallies, totalVotes: votes.length, myVote };
  }

  // Liked / bookmarked / muted
  let liked = false, bookmarked = false, muted = false;
  if (myId) {
    const [likeRow, bookmarkRow, muteRow] = await Promise.all([
      db.select({ id: communityLikes.id }).from(communityLikes).where(and(eq(communityLikes.userId, myId), eq(communityLikes.targetType, 'post'), eq(communityLikes.targetId, postId))).limit(1),
      db.select({ id: communityBookmarks.id }).from(communityBookmarks).where(and(eq(communityBookmarks.userId, myId), eq(communityBookmarks.postId, postId))).limit(1),
      db.select({ id: communityMutes.id }).from(communityMutes).where(and(eq(communityMutes.userId, myId), eq(communityMutes.postId, postId))).limit(1),
    ]);
    liked = !!likeRow[0];
    bookmarked = !!bookmarkRow[0];
    muted = !!muteRow[0];
  }

  res.json({ ...post, poll, liked, bookmarked, muted, isOwner: myId === post.userId });
}
