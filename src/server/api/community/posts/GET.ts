/**
 * GET /api/community/posts
 * Query params: filter (all|latest|popular|unanswered|following|mine), category, page, limit
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts, communityCategories, communityLikes, communityBookmarks, communityFollows, communityBlocks, user } from '@/server/db/schema.js';
import { eq, and, desc, sql, inArray, notInArray } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Sign in to view the community' });
  const myId = session.user.id;

  const filter = (req.query.filter as string) || 'latest';
  const categorySlug = req.query.category as string | undefined;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;

  // Resolve category id
  let categoryId: number | undefined;
  if (categorySlug) {
    const [cat] = await db.select({ id: communityCategories.id }).from(communityCategories).where(eq(communityCategories.slug, categorySlug)).limit(1);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    categoryId = cat.id;
  }

  // Build blocked-user exclusion
  let blockedIds: string[] = [];
  if (myId) {
    const blocks = await db.select({ blockedId: communityBlocks.blockedId }).from(communityBlocks).where(eq(communityBlocks.blockerId, myId));
    blockedIds = blocks.map((b) => b.blockedId);
  }

  // Build following list for "following" filter
  let followingIds: string[] = [];
  if (filter === 'following' && myId) {
    const follows = await db.select({ followingId: communityFollows.followingId }).from(communityFollows).where(eq(communityFollows.followerId, myId));
    followingIds = follows.map((f) => f.followingId);
  }

  const conditions = [eq(communityPosts.isHidden, false)];
  if (categoryId) conditions.push(eq(communityPosts.categoryId, categoryId));
  if (blockedIds.length) conditions.push(notInArray(communityPosts.userId, blockedIds));
  if (filter === 'unanswered') conditions.push(eq(communityPosts.replyCount, 0));
  if (filter === 'mine' && myId) conditions.push(eq(communityPosts.userId, myId));
  if (filter === 'following' && followingIds.length) conditions.push(inArray(communityPosts.userId, followingIds));
  if (filter === 'following' && !followingIds.length) return res.json({ posts: [], total: 0, page, pages: 0 });

  const orderBy = filter === 'popular'
    ? [desc(communityPosts.likeCount), desc(communityPosts.replyCount)]
    : [desc(communityPosts.isPinned), desc(communityPosts.createdAt)];

  const [posts, [{ total }]] = await Promise.all([
    db.select({
      id: communityPosts.id,
      type: communityPosts.type,
      title: communityPosts.title,
      tags: communityPosts.tags,
      isPinned: communityPosts.isPinned,
      isLocked: communityPosts.isLocked,
      likeCount: communityPosts.likeCount,
      replyCount: communityPosts.replyCount,
      viewCount: communityPosts.viewCount,
      acceptedReplyId: communityPosts.acceptedReplyId,
      createdAt: communityPosts.createdAt,
      categoryId: communityPosts.categoryId,
      userId: communityPosts.userId,
      authorName: user.name,
      authorImage: user.image,
      authorUsername: user.username,
      categoryName: communityCategories.name,
      categorySlug: communityCategories.slug,
    })
      .from(communityPosts)
      .leftJoin(user, eq(communityPosts.userId, user.id))
      .leftJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`count(*)` }).from(communityPosts).where(and(...conditions)),
  ]);

  // Attach liked/bookmarked state for authenticated user
  let likedIds = new Set<number>();
  let bookmarkedIds = new Set<number>();
  if (myId && posts.length) {
    const postIds = posts.map((p) => p.id);
    const [likes, bookmarks] = await Promise.all([
      db.select({ targetId: communityLikes.targetId }).from(communityLikes).where(and(eq(communityLikes.userId, myId), eq(communityLikes.targetType, 'post'), inArray(communityLikes.targetId, postIds))),
      db.select({ postId: communityBookmarks.postId }).from(communityBookmarks).where(and(eq(communityBookmarks.userId, myId), inArray(communityBookmarks.postId, postIds))),
    ]);
    likedIds = new Set(likes.map((l) => l.targetId));
    bookmarkedIds = new Set(bookmarks.map((b) => b.postId));
  }

  const pages = Math.ceil(total / limit);
  res.json({
    posts: posts.map((p) => ({ ...p, liked: likedIds.has(p.id), bookmarked: bookmarkedIds.has(p.id) })),
    total,
    page,
    pages,
  });
}
