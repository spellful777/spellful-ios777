/**
 * GET /api/username/check?username=Foo
 * Returns { available: boolean, error?: string }
 * Rate-limited by session (no anonymous checks).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { validateUsernameFormat, normalizeUsername, usernameErrorMessage } from '@/server/lib/username-rules.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const raw = (req.query.username as string) ?? '';
  const formatErr = validateUsernameFormat(raw);
  if (formatErr) return res.json({ available: false, error: usernameErrorMessage(formatErr) });

  const normalized = normalizeUsername(raw);
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.usernameNormalized, normalized))
    .limit(1);

  // Available if no match, or the match is the current user
  const available = !existing || existing.id === session.user.id;
  res.json({ available });
}
