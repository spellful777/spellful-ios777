/**
 * POST /api/profile/:username/guestbook
 * Body: { text }
 * Submit a guestbook entry. Rate-limited: 3 per submitter per profile per 24h.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import {
  user, profileGuestbookSettings, profileGuestbookEntries, profileGuestbookBans, covenConnections,
} from '@/server/db/schema.js';
import { eq, and, or, gte, count } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { isBlocked } from '@/server/lib/block-check.js';

const RATE_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export default async function handler(req: Request<{ username: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const normalized = req.params.username.toLowerCase();
  const [profileUser] = await db.select({ id: user.id }).from(user)
    .where(eq(user.usernameNormalized, normalized)).limit(1);
  if (!profileUser) return res.status(404).json({ error: 'Not found' });

  if (profileUser.id === session.user.id) {
    return res.status(400).json({ error: 'Cannot sign your own guestbook' });
  }

  // Block check (silent — return 404 to not reveal block status)
  if (await isBlocked(profileUser.id, session.user.id)) return res.status(404).json({ error: 'Not found' });

  // Guestbook settings
  const [settings] = await db.select().from(profileGuestbookSettings)
    .where(eq(profileGuestbookSettings.userId, profileUser.id));
  if (!settings?.enabled) return res.status(403).json({ error: 'Guestbook is not open' });
  if (settings.allowedSubmitters === 'nobody') return res.status(403).json({ error: 'Guestbook is not open' });

  // Coven check if required
  if (settings.allowedSubmitters === 'coven') {
    const [conn] = await db.select({ id: covenConnections.id })
      .from(covenConnections)
      .where(and(
        or(
          and(eq(covenConnections.requesterId, session.user.id), eq(covenConnections.receiverId, profileUser.id)),
          and(eq(covenConnections.requesterId, profileUser.id), eq(covenConnections.receiverId, session.user.id)),
        ),
        eq(covenConnections.status, 'accepted'),
      )).limit(1);
    if (!conn) return res.status(403).json({ error: 'Only Coven members may sign this guestbook' });
  }

  // Ban check
  const [ban] = await db.select({ id: profileGuestbookBans.id }).from(profileGuestbookBans)
    .where(and(
      eq(profileGuestbookBans.profileUserId, profileUser.id),
      eq(profileGuestbookBans.bannedUserId, session.user.id),
    )).limit(1);
  if (ban) return res.status(403).json({ error: 'You may not sign this guestbook' });

  // Rate limit
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const [{ total }] = await db.select({ total: count() }).from(profileGuestbookEntries)
    .where(and(
      eq(profileGuestbookEntries.profileUserId, profileUser.id),
      eq(profileGuestbookEntries.authorUserId, session.user.id),
      gte(profileGuestbookEntries.createdAt, windowStart),
    ));
  if (total >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit reached — try again later' });
  }

  const { text } = req.body as { text: string };
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  const state = settings.requireApproval ? 'pending' : 'approved';

  const [result] = await db.insert(profileGuestbookEntries).values({
    profileUserId: profileUser.id,
    authorUserId: session.user.id,
    text: text.trim().slice(0, 300),
    moderationState: state,
  });

  res.status(201).json({ id: result.insertId, moderationState: state });
}
