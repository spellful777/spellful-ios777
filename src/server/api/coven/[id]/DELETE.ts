import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { covenConnections } from '@/server/db/schema.js';
import { eq, and, or } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const uid = session.user.id;
    const connectionId = parseInt(req.params.id, 10);
    if (isNaN(connectionId)) return res.status(400).json({ error: 'Invalid id' });

    // Only allow deletion if the current user is a participant
    await db.delete(covenConnections).where(
      and(
        eq(covenConnections.id, connectionId),
        or(
          eq(covenConnections.requesterId, uid),
          eq(covenConnections.receiverId, uid)
        )
      )
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'coven.delete.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to remove connection' });
  }
}
