import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityBookmarks, communityPosts, communityCategories, user } from '@/server/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const bookmarks = await db.select({
    bookmarkId: communityBookmarks.id,
    bookmarkedAt: communityBookmarks.createdAt,
    id: communityPosts.id,
    type: communityPosts.type,
    title: communityPosts.title,
    tags: communityPosts.tags,
    likeCount: communityPosts.likeCount,
    replyCount: communityPosts.replyCount,
    createdAt: communityPosts.createdAt,
    isHidden: communityPosts.isHidden,
    authorName: user.name,
    authorImage: user.image,
    authorUsername: user.username,
    categoryName: communityCategories.name,
    categorySlug: communityCategories.slug,
  })
    .from(communityBookmarks)
    .leftJoin(communityPosts, eq(communityBookmarks.postId, communityPosts.id))
    .leftJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
    .where(and(eq(communityBookmarks.userId, session.user.id)))
    .orderBy(desc(communityBookmarks.createdAt));

  res.json(bookmarks.filter((b) => !b.isHidden));
}
