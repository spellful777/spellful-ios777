/**
 * PUT /api/community/posts/:id
 * Edit a community post (author only). Updates title, body, tags, audience.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { communityPosts } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const myId = session.user.id;
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const { title, body, tags, audience } = req.body as {
    title?: string;
    body?: string;
    tags?: string;
    audience?: string;
  };

  if (!title?.trim() && !body?.trim()) {
    return res.status(400).json({ error: 'title or body required' });
  }

  const VALID_AUDIENCES = ['public', 'coven'];
  if (audience && !VALID_AUDIENCES.includes(audience)) {
    return res.status(400).json({ error: 'Invalid audience' });
  }

  // Verify ownership
  const [post] = await db.select({ id: communityPosts.id, userId: communityPosts.userId })
    .from(communityPosts)
    .where(and(eq(communityPosts.id, postId), eq(communityPosts.userId, myId)))
    .limit(1);
  if (!post) return res.status(404).json({ error: 'Post not found or not yours' });

  await db.update(communityPosts).set({
    ...(title !== undefined ? { title: title.slice(0, 300) } : {}),
    ...(body !== undefined ? { body } : {}),
    ...(tags !== undefined ? { tags: tags.slice(0, 500) } : {}),
    ...(audience !== undefined ? { audience } : {}),
    editedAt: new Date(),
  }).where(eq(communityPosts.id, postId));

  res.json({ ok: true });
}
