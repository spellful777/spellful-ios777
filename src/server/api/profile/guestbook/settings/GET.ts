/**
 * GET /api/profile/guestbook/settings
 * Returns the authenticated user's guestbook settings.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileGuestbookSettings } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const [settings] = await db.select().from(profileGuestbookSettings)
    .where(eq(profileGuestbookSettings.userId, session.user.id));

  res.json({ settings: settings ?? { enabled: 0, allowedSubmitters: 'coven', visibility: 'coven', requireApproval: 1 } });
}
