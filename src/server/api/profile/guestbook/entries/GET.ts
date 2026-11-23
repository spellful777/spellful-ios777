/**
 * GET /api/profile/guestbook/entries
 * Returns all guestbook entries for the authenticated user (owner view, includes pending).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileGuestbookEntries, user } from '@/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const entries = await db
    .select({
      id: profileGuestbookEntries.id,
      text: profileGuestbookEntries.text,
      moderationState: profileGuestbookEntries.moderationState,
      createdAt: profileGuestbookEntries.createdAt,
      authorUsername: user.username,
      authorImage: user.image,
    })
    .from(profileGuestbookEntries)
    .innerJoin(user, eq(profileGuestbookEntries.authorUserId, user.id))
    .where(eq(profileGuestbookEntries.profileUserId, session.user.id))
    .orderBy(desc(profileGuestbookEntries.createdAt));

  res.json({ entries });
}
