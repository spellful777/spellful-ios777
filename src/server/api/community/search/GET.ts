import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts, communityCategories, communityBlocks, user } from '@/server/db/schema.js';
import { eq, and, like, or, desc, notInArray } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Sign in to search the community' });
  const myId = session.user.id;

  const q = ((req.query.q as string) || '').trim().slice(0, 200);
  const category = req.query.category as string | undefined;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(30, parseInt(req.query.limit as string) || 15);
  const offset = (page - 1) * limit;

  if (!q) return res.json({ posts: [], total: 0 });

  let blockedIds: string[] = [];
  if (myId) {
    const blocks = await db.select({ blockedId: communityBlocks.blockedId }).from(communityBlocks).where(eq(communityBlocks.blockerId, myId));
    blockedIds = blocks.map((b) => b.blockedId);
  }

  const conditions = [
    eq(communityPosts.isHidden, false),
    or(like(communityPosts.title, `%${q}%`), like(communityPosts.body, `%${q}%`), like(communityPosts.tags, `%${q}%`)),
  ];
  if (category) {
    const [cat] = await db.select({ id: communityCategories.id }).from(communityCategories).where(eq(communityCategories.slug, category)).limit(1);
    if (cat) conditions.push(eq(communityPosts.categoryId, cat.id));
  }
  if (blockedIds.length) conditions.push(notInArray(communityPosts.userId, blockedIds));

  const posts = await db.select({
    id: communityPosts.id,
    type: communityPosts.type,
    title: communityPosts.title,
    tags: communityPosts.tags,
    likeCount: communityPosts.likeCount,
    replyCount: communityPosts.replyCount,
    createdAt: communityPosts.createdAt,
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
    .orderBy(desc(communityPosts.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ posts, total: posts.length });
}
