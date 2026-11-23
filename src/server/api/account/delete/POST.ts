/**
 * POST /api/account/delete
 * Initiates account deletion with a 30-day grace period.
 * Body: { password: string }
 * Verifies password via BetterAuth before scheduling deletion.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { getAuth } from '@/lib/auth/auth.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const userId = session.user.id;

  const { password } = req.body as { password?: string };
  if (!password) return res.status(400).json({ error: 'Password required' });

  // Fetch user email and deletion status
  const [u] = await db.select({ id: user.id, email: user.email, deletionRequestedAt: user.deletionRequestedAt })
    .from(user).where(eq(user.id, userId)).limit(1);

  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u.deletionRequestedAt) {
    return res.status(409).json({ error: 'Deletion already requested', requestedAt: u.deletionRequestedAt });
  }

  // Verify password by attempting a credential check via BetterAuth
  try {
    const auth = getAuth();
    const verifyResult = await (auth.api as unknown as {
      signInEmail: (opts: { body: { email: string; password: string } }) => Promise<{ error?: { message?: string } } | null>
    }).signInEmail({ body: { email: u.email!, password } });
    if (!verifyResult || (verifyResult as { error?: { message?: string } }).error) {
      return res.status(403).json({ error: 'Incorrect password' });
    }
  } catch {
    return res.status(403).json({ error: 'Incorrect password' });
  }

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 30);

  await db.update(user).set({ deletionRequestedAt: new Date() }).where(eq(user.id, userId));

  res.json({ ok: true, scheduledDeletionAt: scheduledAt.toISOString() });
}
