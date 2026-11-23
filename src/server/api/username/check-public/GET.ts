/**
 * GET /api/username/check-public?username=Foo
 * Public availability check — no auth required.
 * Used during signup before the user has a session.
 * Returns { available: boolean, error?: string }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { validateUsernameFormat, normalizeUsername, usernameErrorMessage } from '@/server/lib/username-rules.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const raw = (req.query.username as string) ?? '';
  const formatErr = validateUsernameFormat(raw);
  if (formatErr) return res.json({ available: false, error: usernameErrorMessage(formatErr) });

  const normalized = normalizeUsername(raw);
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.usernameNormalized, normalized))
    .limit(1);

  res.json({ available: !existing });
}
