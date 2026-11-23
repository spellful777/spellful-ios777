/**
 * GET /api/profile/:username/featured
 * Returns featured posts/grimoire entries for a profile.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, profileFeatured, communityPosts } from '@/server/db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
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

  const featured = await db
    .select()
    .from(profileFeatured)
    .where(eq(profileFeatured.userId, profile.id))
    .orderBy(profileFeatured.sortOrder);

  const postIds = featured.filter(f => f.itemType === 'post').map(f => f.itemId);
  let posts: { id: number; title: string; createdAt: Date | null; audience: string | null }[] = [];
  if (postIds.length) {
    posts = await db
      .select({ id: communityPosts.id, title: communityPosts.title, createdAt: communityPosts.createdAt, audience: communityPosts.audience })
      .from(communityPosts)
      .where(and(inArray(communityPosts.id, postIds), eq(communityPosts.isHidden, false)));
  }

  res.json({ featured, posts });
}
