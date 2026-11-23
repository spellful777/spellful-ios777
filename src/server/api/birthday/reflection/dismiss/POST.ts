/**
 * POST /api/birthday/reflection/dismiss
 * Marks the current year's birthday reflection as dismissed.
 * Body: { year: number }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '../../../../lib/auth-session.js';
import { db } from '../../../../db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const myId = session.user.id;
  const year = Number(req.body?.year);
  if (!year || year < 2000 || year > 2100) return res.status(400).json({ error: 'Invalid year' });

  try {
    await db.execute(sql`
      UPDATE birthday_reflections
      SET dismissed = TRUE, dismissed_at = NOW()
      WHERE user_id = ${myId} AND year = ${year}
    `);
    return res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'birthday.reflection.dismiss.error', msg: String(err).slice(0, 200) }));
    return res.status(500).json({ error: 'Failed to dismiss' });
  }
}
