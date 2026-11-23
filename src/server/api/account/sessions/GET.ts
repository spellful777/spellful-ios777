import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { session } from '@/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const currentSession = await getAuthSession(req);
    if (!currentSession?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const sessions = await db
      .select({ id: session.id, userAgent: session.userAgent, ipAddress: session.ipAddress,
        createdAt: session.createdAt, expiresAt: session.expiresAt, token: session.token })
      .from(session)
      .where(eq(session.userId, currentSession.user.id))
      .orderBy(desc(session.createdAt))
      .limit(10);

    const currentToken = currentSession.session?.token ?? '';
    // Never return raw session tokens to the client — only expose isCurrent flag
    res.json({
      sessions: sessions.map(({ token, ...s }) => ({ ...s, isCurrent: token === currentToken })),
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'account.sessions.get.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to load sessions' });
  }
}