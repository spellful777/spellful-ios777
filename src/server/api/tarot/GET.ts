import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { tarotReadings } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const readings = await db
      .select()
      .from(tarotReadings)
      .where(eq(tarotReadings.userId, session.user.id))
      .orderBy(desc(tarotReadings.createdAt))
      .limit(50);

    res.json(readings);
  } catch (error) {
    console.error('[tarot/GET] DB error:', error);
    res.status(500).json({ error: 'Failed to fetch readings', message: 'Internal server error' });
  }
}
