import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { covenConnections } from '@/server/db/schema.js';
import { eq, and, or } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ userId: string }>, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.json({ status: null, connectionId: null });

    const uid = session.user.id;
    const { userId } = req.params;

    const [row] = await db
      .select({ id: covenConnections.id, status: covenConnections.status, requesterId: covenConnections.requesterId })
      .from(covenConnections)
      .where(or(
        and(eq(covenConnections.requesterId, uid), eq(covenConnections.receiverId, userId)),
        and(eq(covenConnections.requesterId, userId), eq(covenConnections.receiverId, uid))
      ))
      .limit(1);

    if (!row) return res.json({ status: null, connectionId: null });

    // pending_sent = I sent it; pending_received = they sent it
    let status = row.status;
    if (status === 'pending') {
      status = row.requesterId === uid ? 'pending_sent' : 'pending_received';
    }

    res.json({ status, connectionId: row.id });
  } catch (err) {
    console.error(JSON.stringify({ event: 'coven.status.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to check status' });
  }
}
