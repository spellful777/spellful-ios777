import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityCategories, communityPosts } from '@/server/db/schema.js';
import { eq, count, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) { res.status(401).json({ error: 'Sign in to view the community' }); return; }
  const cats = await db
    .select({
      id: communityCategories.id,
      name: communityCategories.name,
      slug: communityCategories.slug,
      description: communityCategories.description,
      icon: communityCategories.icon,
      sortOrder: communityCategories.sortOrder,
    })
    .from(communityCategories)
    .where(eq(communityCategories.isActive, true))
    .orderBy(communityCategories.sortOrder);

  // Get post counts per category
  const counts = await db
    .select({ categoryId: communityPosts.categoryId, total: count() })
    .from(communityPosts)
    .where(and(eq(communityPosts.isHidden, false)))
    .groupBy(communityPosts.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, c.total]));

  res.json(cats.map((c) => ({ ...c, postCount: countMap.get(c.id) ?? 0 })));
}
