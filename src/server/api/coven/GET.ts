import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { covenConnections, user } from '@/server/db/schema.js';
import { eq, or, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const uid = session.user.id;

    const connections = await db
      .select({
        id: covenConnections.id,
        status: covenConnections.status,
        requesterId: covenConnections.requesterId,
        receiverId: covenConnections.receiverId,
        createdAt: covenConnections.createdAt,
        otherName: user.name,
        otherUsername: user.username,
        otherImage: user.image,
      })
      .from(covenConnections)
      .innerJoin(user, or(
        and(eq(covenConnections.requesterId, uid), eq(user.id, covenConnections.receiverId)),
        and(eq(covenConnections.receiverId, uid), eq(user.id, covenConnections.requesterId))
      ))
      .where(or(eq(covenConnections.requesterId, uid), eq(covenConnections.receiverId, uid)));

    res.json({ connections });
  } catch (err) {
    console.error(JSON.stringify({ event: 'coven.get.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to load connections' });
  }
}