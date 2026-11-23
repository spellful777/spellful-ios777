import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPolls, communityPollVotes } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const [poll] = await db.select().from(communityPolls).where(eq(communityPolls.postId, postId)).limit(1);
  if (!poll) return res.status(404).json({ error: 'No poll on this post' });
  if (poll.isClosed || (poll.closesAt && new Date(poll.closesAt) < new Date())) {
    return res.status(400).json({ error: 'Poll is closed' });
  }

  const { choiceIndex } = req.body as { choiceIndex?: number };
  if (choiceIndex === undefined || choiceIndex < 0 || choiceIndex >= (poll.choices as string[]).length) {
    return res.status(400).json({ error: 'Invalid choice' });
  }

  const [existing] = await db.select({ id: communityPollVotes.id }).from(communityPollVotes)
    .where(and(eq(communityPollVotes.pollId, poll.id), eq(communityPollVotes.userId, session.user.id))).limit(1);
  if (existing) return res.status(409).json({ error: 'Already voted' });

  await db.insert(communityPollVotes).values({ pollId: poll.id, userId: session.user.id, choiceIndex });
  res.json({ ok: true });
}
