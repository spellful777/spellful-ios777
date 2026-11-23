/**
 * GET /api/profile/:username/guestbook
 * Returns approved guestbook entries for a public profile.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, profileGuestbookSettings, profileGuestbookEntries, covenConnections } from '@/server/db/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { isBlocked } from '@/server/lib/block-check.js';

export default async function handler(req: Request<{ username: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const normalized = req.params.username.toLowerCase();
  const [profileUser] = await db.select({ id: user.id }).from(user)
    .where(eq(user.usernameNormalized, normalized)).limit(1);
  if (!profileUser) return res.status(404).json({ error: 'Not found' });

  const session = await getAuthSession(req);
  const viewerId = session?.user.id ?? null;

  if (viewerId && await isBlocked(profileUser.id, viewerId)) return res.status(404).json({ error: 'Not found' });

  const [settings] = await db.select().from(profileGuestbookSettings)
    .where(eq(profileGuestbookSettings.userId, profileUser.id));

  if (!settings?.enabled) return res.json({ enabled: false, entries: [] });

  const sectionVis = settings.visibility ?? 'coven';
  const isOwner = viewerId === profileUser.id;

  let isCoven = false;
  if (viewerId && !isOwner) {
    const [conn] = await db.select({ id: covenConnections.id })
      .from(covenConnections)
      .where(and(
        or(
          and(eq(covenConnections.requesterId, viewerId), eq(covenConnections.receiverId, profileUser.id)),
          and(eq(covenConnections.requesterId, profileUser.id), eq(covenConnections.receiverId, viewerId)),
        ),
        eq(covenConnections.status, 'accepted'),
      )).limit(1);
    isCoven = !!conn;
  }

  if (sectionVis === 'private' && !isOwner) return res.json({ enabled: false, entries: [] });
  if (sectionVis === 'coven' && !isOwner && !isCoven) return res.json({ enabled: false, entries: [] });

  const entries = await db
    .select({
      id: profileGuestbookEntries.id,
      text: profileGuestbookEntries.text,
      createdAt: profileGuestbookEntries.createdAt,
      authorUsername: user.username,
      authorImage: user.image,
    })
    .from(profileGuestbookEntries)
    .innerJoin(user, eq(profileGuestbookEntries.authorUserId, user.id))
    .where(and(
      eq(profileGuestbookEntries.profileUserId, profileUser.id),
      eq(profileGuestbookEntries.moderationState, 'approved'),
    ))
    .orderBy(desc(profileGuestbookEntries.createdAt))
    .limit(50);

  res.json({ enabled: true, settings: { allowedSubmitters: settings.allowedSubmitters, visibility: sectionVis }, entries });
}
