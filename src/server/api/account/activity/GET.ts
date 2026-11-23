import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { loginActivity } from '@/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const activity = await db
      .select()
      .from(loginActivity)
      .where(eq(loginActivity.userId, session.user.id))
      .orderBy(desc(loginActivity.createdAt))
      .limit(10);

    res.json({ activity });
  } catch (err) {
    console.error(JSON.stringify({ event: 'account.activity.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to load activity' });
  }
}