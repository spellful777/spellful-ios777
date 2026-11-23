/**
 * POST /api/admin/community/badges
 * Award a badge to a user. Admin only.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityUserBadges, communityBadges } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { userId, badgeSlug } = req.body as { userId?: string; badgeSlug?: string };
  if (!userId || !badgeSlug) return res.status(400).json({ error: 'userId and badgeSlug required' });

  const [badge] = await db.select({ id: communityBadges.id }).from(communityBadges).where(eq(communityBadges.slug, badgeSlug)).limit(1);
  if (!badge) return res.status(404).json({ error: 'Badge not found' });

  await db.insert(communityUserBadges).values({ userId, badgeId: badge.id }).catch(() => {});
  res.status(201).json({ ok: true });
}
