/**
 * GET /api/profile/:username/identity
 * Returns identity fields for a public profile, respecting visibility.
 * Viewer auth determines which visibility tiers are shown.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, profileIdentityFields, covenConnections } from '@/server/db/schema.js';
import { eq, and, or, inArray } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { isBlocked } from '@/server/lib/block-check.js';

export default async function handler(req: Request<{ username: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const normalized = req.params.username.toLowerCase();
  const [profileUser] = await db.select({ id: user.id, profileVisibility: user.profileVisibility })
    .from(user).where(eq(user.usernameNormalized, normalized)).limit(1);
  if (!profileUser) return res.status(404).json({ error: 'Not found' });

  const session = await getAuthSession(req);
  const viewerId = session?.user.id ?? null;

  // Block check
  if (viewerId && await isBlocked(profileUser.id, viewerId)) return res.status(404).json({ error: 'Not found' });

  // Determine viewer relationship
  let isCoven = false;
  if (viewerId && viewerId !== profileUser.id) {
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
  const isOwner = viewerId === profileUser.id;

  // Build allowed visibilities
  const allowed: string[] = ['public'];
  if (isOwner || isCoven) allowed.push('coven');
  if (isOwner) allowed.push('private');

  const fields = await db.select()
    .from(profileIdentityFields)
    .where(and(
      eq(profileIdentityFields.userId, profileUser.id),
      inArray(profileIdentityFields.visibility, allowed),
    ));

  res.json({ fields });
}
