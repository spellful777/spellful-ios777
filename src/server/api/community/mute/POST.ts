import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityMutes } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { postId } = req.body as { postId?: number };
  if (!postId) return res.status(400).json({ error: 'postId required' });

  const [existing] = await db.select({ id: communityMutes.id }).from(communityMutes)
    .where(and(eq(communityMutes.userId, session.user.id), eq(communityMutes.postId, postId))).limit(1);

  if (existing) {
    await db.delete(communityMutes).where(eq(communityMutes.id, existing.id));
    return res.json({ muted: false });
  }

  await db.insert(communityMutes).values({ userId: session.user.id, postId });
  res.json({ muted: true });
}
