import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { covenConnections } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { connectionId, action } = req.body as { connectionId: number; action: 'accept' | 'decline' };
    if (!connectionId || !action) return res.status(400).json({ error: 'connectionId and action required' });

    await db.update(covenConnections)
      .set({ status: action === 'accept' ? 'accepted' : 'declined' })
      .where(and(eq(covenConnections.id, connectionId), eq(covenConnections.receiverId, session.user.id)));

    res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'coven.respond.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to respond' });
  }
}