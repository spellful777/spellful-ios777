/**
 * POST /api/circles/:id/join
 * Join or leave a Spellful Circle (toggle).
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const circleId = parseInt(req.params.id);
  if (isNaN(circleId)) return res.status(400).json({ error: 'Invalid circle id' });

  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  try {
    // Check if already a member
    const existing = await db.execute(sql`
      SELECT id, status FROM circle_memberships WHERE circle_id = ${circleId} AND user_id = ${myId} LIMIT 1
    `) as unknown as [Array<{ id: number; status: string }>, unknown];

    const isMember = (existing[0] as Array<{ id: number; status: string }>).length > 0;

    if (isMember) {
      // Leave
      await db.execute(sql`
        DELETE FROM circle_memberships WHERE circle_id = ${circleId} AND user_id = ${myId}
      `);
      await db.execute(sql`
        UPDATE spellful_circles SET member_count = GREATEST(0, member_count - 1) WHERE id = ${circleId}
      `);
      res.json({ joined: false });
    } else {
      // Join
      await db.execute(sql`
        INSERT IGNORE INTO circle_memberships (circle_id, user_id, role, status) VALUES (${circleId}, ${myId}, 'member', 'active')
      `);
      await db.execute(sql`
        UPDATE spellful_circles SET member_count = member_count + 1 WHERE id = ${circleId}
      `);
      res.json({ joined: true });
    }
  } catch {
    res.status(503).json({ error: 'Circles feature not yet available' });
  }
}
