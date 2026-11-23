/**
 * POST /api/community/posts/:id/share
 * Increments the share_count on a community post.
 * Called fire-and-forget when a member copies the post link.
 * Requires authentication (prevents bots from inflating counts).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts } from '@/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post id' });

  try {
    await db.update(communityPosts)
      .set({ shareCount: sql`COALESCE(share_count, 0) + 1` })
      .where(eq(communityPosts.id, postId));
    return res.json({ ok: true });
  } catch {
    // Non-critical — silently fail
    return res.json({ ok: false });
  }
}
