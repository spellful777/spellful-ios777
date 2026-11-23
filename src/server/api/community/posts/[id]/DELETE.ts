import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const [post] = await db.select({ userId: communityPosts.userId }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin;
  if (post.userId !== session.user.id && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

  await db.delete(communityPosts).where(eq(communityPosts.id, postId));
  res.json({ ok: true });
}
