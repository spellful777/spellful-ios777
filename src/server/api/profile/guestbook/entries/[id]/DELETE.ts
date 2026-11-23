/**
 * DELETE /api/profile/guestbook/entries/:id
 * Owner deletes a guestbook entry.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileGuestbookEntries } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  await db.delete(profileGuestbookEntries)
    .where(and(eq(profileGuestbookEntries.id, id), eq(profileGuestbookEntries.profileUserId, session.user.id)));

  res.json({ ok: true });
}
