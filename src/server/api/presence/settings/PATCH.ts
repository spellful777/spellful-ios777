import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { hideOnlineStatus } = req.body as { hideOnlineStatus: boolean };
    if (typeof hideOnlineStatus !== 'boolean') return res.status(400).json({ error: 'hideOnlineStatus (boolean) required' });

    await db.update(user)
      .set({ hideOnlineStatus })
      .where(eq(user.id, session.user.id));

    res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'presence.settings.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to update presence settings' });
  }
}
