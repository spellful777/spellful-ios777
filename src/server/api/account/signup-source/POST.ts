/**
 * POST /api/account/signup-source
 * One-time write: saves how a new member found Spellful.
 * Only writes if the field is currently empty (prevents overwriting).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_SOURCES = [
  'instagram', 'tiktok', 'facebook', 'threads', 'bluesky', 'x_twitter',
  'youtube', 'pinterest', 'reddit', 'google_search', 'friend_referral',
  'podcast', 'blog_article', 'pwa', 'apple_app_store', 'google_play_store', 'other',
];

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { source } = req.body as { source?: string };
  if (!source || !VALID_SOURCES.includes(source)) {
    return res.status(400).json({ error: 'Invalid source' });
  }

  // Only write if not already set — prevents overwriting on re-login
  await db.update(user)
    .set({ signupSource: source })
    .where(
      eq(user.id, session.user.id),
    );

  // Re-fetch to confirm (only update if currently empty)
  const [row] = await db.select({ signupSource: user.signupSource })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return res.json({ ok: true, signupSource: row?.signupSource ?? source });
}


