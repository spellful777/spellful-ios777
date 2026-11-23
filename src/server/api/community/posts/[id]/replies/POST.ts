import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityReplies, communityPosts, communityNotifications } from '@/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const MAX_DEPTH = 4;

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Sign in to reply' });

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const [post] = await db.select({ userId: communityPosts.userId, isLocked: communityPosts.isLocked }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.isLocked) return res.status(403).json({ error: 'Post is locked' });

  const { body, parentId } = req.body as { body?: string; parentId?: number };
  if (!body?.trim()) return res.status(400).json({ error: 'body is required' });

  let depth = 0;
  if (parentId) {
    const [parent] = await db.select({ depth: communityReplies.depth }).from(communityReplies).where(eq(communityReplies.id, parentId)).limit(1);
    if (parent) depth = Math.min((parent.depth ?? 0) + 1, MAX_DEPTH);
  }

  const [result] = await db.insert(communityReplies).values({
    postId,
    userId: session.user.id,
    parentId: parentId ?? null,
    body: body.trim(),
    depth,
  });
  const replyId = (result as unknown as { insertId: number }).insertId;

  // Increment reply count
  await db.update(communityPosts).set({ replyCount: sql`reply_count + 1` }).where(eq(communityPosts.id, postId));

  // Notify post author (if not self)
  if (post.userId !== session.user.id) {
    await db.insert(communityNotifications).values({
      userId: post.userId,
      type: 'reply',
      actorId: session.user.id,
      postId,
      replyId,
      message: 'Someone replied to your post.',
    }).catch(() => {});
  }

  res.status(201).json({ id: replyId });
}
