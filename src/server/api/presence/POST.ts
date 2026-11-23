import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';

import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  await db.execute(sql`
    INSERT INTO user_presence (user_id, last_seen)
    VALUES (${session.user.id}, NOW())
    ON DUPLICATE KEY UPDATE last_seen = NOW()
  `);

  res.json({ ok: true });
}
