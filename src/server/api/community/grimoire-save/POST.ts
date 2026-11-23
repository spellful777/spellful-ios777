import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { grimoireCommunityRefs, communityPosts } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { postId, notes } = req.body as { postId?: number; notes?: string };
  if (!postId) return res.status(400).json({ error: 'postId required' });

  const [post] = await db.select({ title: communityPosts.title, isHidden: communityPosts.isHidden }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (!post || post.isHidden) return res.status(404).json({ error: 'Post not found' });

  const [existing] = await db.select({ id: grimoireCommunityRefs.id }).from(grimoireCommunityRefs)
    .where(and(eq(grimoireCommunityRefs.userId, session.user.id), eq(grimoireCommunityRefs.postId, postId))).limit(1);

  if (existing) {
    await db.update(grimoireCommunityRefs).set({ notes: notes ?? null }).where(eq(grimoireCommunityRefs.id, existing.id));
    return res.json({ ok: true, updated: true });
  }

  await db.insert(grimoireCommunityRefs).values({
    userId: session.user.id,
    postId,
    title: post.title,
    notes: notes ?? null,
  });

  res.status(201).json({ ok: true });
}
