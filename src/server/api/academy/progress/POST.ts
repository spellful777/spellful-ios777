import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { academyLessonProgress } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { topicSlug, lessonSlug, completed, quizScore } = req.body as {
    topicSlug: string;
    lessonSlug: string;
    completed?: boolean;
    quizScore?: number;
  };

  if (!topicSlug || !lessonSlug) {
    return res.status(400).json({ error: 'topicSlug and lessonSlug are required' });
  }

  try {
    const [existing] = await db
      .select()
      .from(academyLessonProgress)
      .where(
        and(
          eq(academyLessonProgress.userId, session.user.id),
          eq(academyLessonProgress.topicSlug, topicSlug),
          eq(academyLessonProgress.lessonSlug, lessonSlug),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(academyLessonProgress)
        .set({
          completed: completed ?? existing.completed,
          quizScore: quizScore ?? existing.quizScore,
          completedAt: completed && !existing.completed ? new Date() : existing.completedAt,
        })
        .where(eq(academyLessonProgress.id, existing.id));
    } else {
      await db.insert(academyLessonProgress).values({
        userId: session.user.id,
        topicSlug,
        lessonSlug,
        completed: completed ?? false,
        quizScore: quizScore ?? null,
        completedAt: completed ? new Date() : null,
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[academy/progress/POST] DB error:', error);
    res.status(500).json({ error: 'Failed to save progress', message: 'Internal server error' });
  }
}
