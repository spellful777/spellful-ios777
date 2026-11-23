/**
 * POST /api/username/change
 * Body: { username: string }
 * Validates format, reserved list, uniqueness, 30-day cooldown.
 * Atomically updates user + inserts username_history row.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, usernameHistory } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import {
  validateUsernameFormat,
  normalizeUsername,
  usernameErrorMessage,
  USERNAME_COOLDOWN_MS,
} from '@/server/lib/username-rules.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const { username } = req.body as { username?: string };
  if (!username) return res.status(400).json({ error: 'username required' });

  // Format validation
  const formatErr = validateUsernameFormat(username);
  if (formatErr) return res.status(400).json({ error: usernameErrorMessage(formatErr), code: formatErr });

  const normalized = normalizeUsername(username);

  // Load current user
  const [me] = await db
    .select({ id: user.id, username: user.username, usernameNormalized: user.usernameNormalized, usernameChangedAt: user.usernameChangedAt })
    .from(user).where(eq(user.id, myId)).limit(1);
  if (!me) return res.status(404).json({ error: 'User not found' });

  // No-op if same username
  if (me.usernameNormalized === normalized) return res.json({ ok: true, username });

  // Cooldown check
  if (me.usernameChangedAt) {
    const elapsed = Date.now() - new Date(me.usernameChangedAt).getTime();
    if (elapsed < USERNAME_COOLDOWN_MS) {
      const daysLeft = Math.ceil((USERNAME_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
      return res.status(429).json({
        error: `You can change your username again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        code: 'cooldown',
        daysLeft,
      });
    }
  }

  // Uniqueness check
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.usernameNormalized, normalized))
    .limit(1);
  if (existing && existing.id !== myId)
    return res.status(409).json({ error: usernameErrorMessage('taken'), code: 'taken' });

  // Persist old username to history if they had one
  if (me.username && me.usernameNormalized) {
    await db.insert(usernameHistory).values({
      userId: myId,
      oldUsername: me.username,
      oldUsernameNormalized: me.usernameNormalized,
    });
  }

  // Update user atomically
  await db.update(user).set({
    username,
    usernameNormalized: normalized,
    usernameChangedAt: new Date(),
  }).where(eq(user.id, myId));

  res.json({ ok: true, username });
}
