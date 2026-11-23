/**
 * GET /api/conversations/:id/typing
 * Returns whether the OTHER participant is currently typing.
 * A typing indicator expires after 4 seconds.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const TYPING_TTL_MS = 4000;

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;
  const convId = parseInt(req.params.id);
  if (isNaN(convId)) return res.status(400).json({ error: 'Invalid id' });

  // Verify participant
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (conv.participant1Id !== myId && conv.participant2Id !== myId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const otherId = conv.participant1Id === myId ? conv.participant2Id : conv.participant1Id;
  if (!otherId) return res.json({ typing: false });

  const rows = await db.execute(sql`
    SELECT updated_at FROM typing_indicators
    WHERE user_id = ${otherId} AND conversation_id = ${convId}
    LIMIT 1
  `) as unknown as { updated_at: Date | string | null }[][];

  const row = Array.isArray(rows[0]) ? rows[0][0] : (rows as unknown as { updated_at: Date | string | null }[])[0];
  if (!row?.updated_at) return res.json({ typing: false });

  const age = Date.now() - new Date(row.updated_at).getTime();
  res.json({ typing: age < TYPING_TTL_MS });
}
