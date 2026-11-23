import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { session } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const currentSession = await getAuthSession(req);
    if (!currentSession?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    await db.delete(session).where(
      and(eq(session.id, req.params.id), eq(session.userId, currentSession.user.id))
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'account.sessions.delete.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to revoke session' });
  }
}