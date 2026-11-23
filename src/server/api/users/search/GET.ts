/**
 * GET /api/users/search?q=<query>
 * Search for users by name or username (for starting a new DM conversation).
 * Returns up to 10 results, excluding the current user.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '../../../lib/auth-session.js';
import { db } from '../../../db/client.js';
import { user } from '../../../db/schema.js';
import { and, like, ne, or } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const q = ((req.query.q as string) || '').trim().slice(0, 100);
  if (q.length < 2) return res.json({ users: [] });

  const pattern = `%${q}%`;

  const results = await db
    .select({ id: user.id, name: user.name, username: user.username, image: user.image })
    .from(user)
    .where(
      and(
        ne(user.id, myId),
        or(like(user.name, pattern), like(user.username, pattern)),
      )
    )
    .limit(10);

  res.json({ users: results });
}
