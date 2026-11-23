/**
 * GET /api/profile/:username/gallery
 * Returns public gallery items for a profile (respects visibility + blocks).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, profileGallery, covenConnections } from '@/server/db/schema.js';
import { eq, and, or, inArray } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { isBlocked } from '@/server/lib/block-check.js';

export default async function handler(req: Request<{ username: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  const viewerId = session?.user?.id ?? null;
  const normalized = req.params.username.toLowerCase();

  const [profile] = await db
    .select({ id: user.id, profileVisibility: user.profileVisibility })
    .from(user).where(eq(user.usernameNormalized, normalized)).limit(1);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  if (viewerId && viewerId !== profile.id) {
    try { if (await isBlocked(viewerId, profile.id)) return res.status(404).json({ error: 'Profile unavailable' }); }
    catch { /* non-fatal */ }
  }

  const visibility = profile.profileVisibility ?? 'private';
  if (visibility === 'private' && profile.id !== viewerId) return res.status(403).json({ error: 'Private profile' });

  let isCoven = false;
  if (viewerId && viewerId !== profile.id) {
    const [conn] = await db.select().from(covenConnections).where(
      and(or(
        and(eq(covenConnections.requesterId, viewerId), eq(covenConnections.receiverId, profile.id)),
        and(eq(covenConnections.requesterId, profile.id), eq(covenConnections.receiverId, viewerId))
      ), eq(covenConnections.status, 'accepted'))
    ).limit(1);
    isCoven = !!conn;
  }

  // Determine which visibility levels the viewer can see
  const allowedVisibilities: string[] = ['public'];
  if (viewerId === profile.id) allowedVisibilities.push('coven', 'private');
  else if (isCoven) allowedVisibilities.push('coven');

  const items = await db
    .select()
    .from(profileGallery)
    .where(and(
      eq(profileGallery.userId, profile.id),
      inArray(profileGallery.visibility, allowedVisibilities),
    ))
    .orderBy(profileGallery.sortOrder, profileGallery.createdAt);

  res.json({ items });
}
