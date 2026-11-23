import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { academyBookmarks } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { topicSlug, lessonSlug, action } = req.body as {
    topicSlug: string;
    lessonSlug: string;
    action: 'add' | 'remove';
  };

  if (!topicSlug || !lessonSlug || !action) {
    return res.status(400).json({ error: 'topicSlug, lessonSlug, and action are required' });
  }

  try {
    if (action === 'add') {
      await db
        .insert(academyBookmarks)
        .values({ userId: session.user.id, topicSlug, lessonSlug })
        .onDuplicateKeyUpdate({ set: { userId: session.user.id } });
    } else {
      await db
        .delete(academyBookmarks)
        .where(
          and(
            eq(academyBookmarks.userId, session.user.id),
            eq(academyBookmarks.topicSlug, topicSlug),
            eq(academyBookmarks.lessonSlug, lessonSlug),
          ),
        );
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('[academy/bookmarks/POST] DB error:', error);
    res.status(500).json({ error: 'Failed to update bookmark', message: 'Internal server error' });
  }
}
