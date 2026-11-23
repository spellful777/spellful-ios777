import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { moonRituals } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const rituals = await db
      .select()
      .from(moonRituals)
      .where(eq(moonRituals.userId, session.user.id))
      .orderBy(desc(moonRituals.createdAt))
      .limit(50);

    res.json(rituals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rituals', message: 'Internal server error' });
  }
}
