import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { academyLessonProgress, academyBookmarks } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [progress, bookmarks] = await Promise.all([
      db.select().from(academyLessonProgress).where(eq(academyLessonProgress.userId, session.user.id)),
      db.select().from(academyBookmarks).where(eq(academyBookmarks.userId, session.user.id)),
    ]);
    res.json({ progress, bookmarks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress', message: 'Internal server error' });
  }
}
