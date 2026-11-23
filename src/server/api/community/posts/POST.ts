/**
 * POST /api/community/posts — create a new post (auth required)
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts, communityCategories, communityPolls } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Sign in to post' });

  const { categoryId, type = 'discussion', title, body, tags = '', imageUrl, poll } = req.body as {
    categoryId?: number;
    type?: string;
    title?: string;
    body?: string;
    tags?: string;
    imageUrl?: string;
    poll?: { question: string; choices: string[]; closesAt?: string };
  };

  if (!categoryId || !title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'categoryId, title, and body are required' });
  }
  if (!['discussion', 'question'].includes(type)) {
    return res.status(400).json({ error: 'Invalid post type' });
  }

  // Verify category exists
  const [cat] = await db.select({ id: communityCategories.id }).from(communityCategories).where(eq(communityCategories.id, categoryId)).limit(1);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  const [result] = await db.insert(communityPosts).values({
    userId: session.user.id,
    categoryId,
    type,
    title: title.trim().slice(0, 300),
    body: body.trim(),
    tags: tags.slice(0, 500),
    imageUrl: imageUrl ?? null,
  });

  const postId = (result as unknown as { insertId: number }).insertId;

  // Create poll if provided
  if (poll?.question && Array.isArray(poll.choices) && poll.choices.length >= 2 && poll.choices.length <= 6) {
    await db.insert(communityPolls).values({
      postId,
      question: poll.question.slice(0, 500),
      choices: poll.choices.map((c: string) => c.trim()).filter(Boolean),
      closesAt: poll.closesAt ? new Date(poll.closesAt) : null,
    });
  }

  res.status(201).json({ id: postId });
}
