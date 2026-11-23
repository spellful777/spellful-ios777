import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { timelineEntries } from '../../db/schema.js';
import { eq, and, desc, like, or } from 'drizzle-orm';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { type, search, tag } = req.query as Record<string, string>;

  const conditions = [eq(timelineEntries.userId, session.user.id)];

  if (type && type !== 'all') {
    conditions.push(eq(timelineEntries.type, type));
  }
  if (search) {
    conditions.push(
      or(
        like(timelineEntries.title, `%${search}%`),
        like(timelineEntries.content, `%${search}%`),
        like(timelineEntries.tags, `%${search}%`)
      )!
    );
  }
  if (tag) {
    conditions.push(like(timelineEntries.tags, `%${tag}%`));
  }

  const entries = await db
    .select()
    .from(timelineEntries)
    .where(and(...conditions))
    .orderBy(desc(timelineEntries.eventDate));

  res.json(entries);
}
