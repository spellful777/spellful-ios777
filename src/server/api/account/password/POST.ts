/**
 * POST /api/account/password
 * Change the authenticated user's password.
 * Body: { currentPassword: string; newPassword: string }
 * Verifies the current password via BetterAuth before updating.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { getAuth } from '@/lib/auth/auth.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 12) {
    return res.status(400).json({ error: 'Password must be at least 12 characters' });
  }

  try {
    const auth = getAuth();
    // Use BetterAuth's changePassword API
    const result = await (auth.api as unknown as {
      changePassword: (opts: {
        body: { currentPassword: string; newPassword: string; revokeOtherSessions: boolean };
        headers: Record<string, string>;
      }) => Promise<{ error?: { message?: string } } | null>;
    }).changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: false },
      headers: { cookie: req.headers.cookie ?? '' },
    });

    if (!result || (result as { error?: { message?: string } }).error) {
      const msg = (result as { error?: { message?: string } } | null)?.error?.message;
      return res.status(403).json({ error: msg ?? 'Incorrect current password' });
    }

    return res.json({ ok: true });
  } catch {
    return res.status(403).json({ error: 'Incorrect current password' });
  }
}
