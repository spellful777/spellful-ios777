/**
 * POST /api/admin/community/announcements
 * Create a pinned announcement post. Admin only.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts, communityCategories } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { title, body, categorySlug } = req.body as {
    title?: string;
    body?: string;
    categorySlug?: string;
  };

  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  // Resolve category — default to first category if not specified
  let categoryId: number;
  if (categorySlug) {
    const [cat] = await db
      .select({ id: communityCategories.id })
      .from(communityCategories)
      .where(eq(communityCategories.slug, categorySlug))
      .limit(1);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    categoryId = cat.id;
  } else {
    const [first] = await db
      .select({ id: communityCategories.id })
      .from(communityCategories)
      .limit(1);
    if (!first) return res.status(500).json({ error: 'No categories found' });
    categoryId = first.id;
  }

  const [result] = await db.insert(communityPosts).values({
    userId: session.user.id,
    categoryId,
    title: title.trim(),
    body: body.trim(),
    type: 'discussion',
    isPinned: true,
    tags: 'announcement',
  });

  res.status(201).json({ ok: true, postId: (result as { insertId?: number }).insertId });
}
