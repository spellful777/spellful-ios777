/**
 * PUT /api/profile/guestbook/settings
 * Body: { enabled?, allowedSubmitters?, visibility?, requireApproval? }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileGuestbookSettings } from '@/server/db/schema.js';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_SUBMITTERS = new Set(['everyone', 'coven', 'nobody']);
const VALID_VIS = new Set(['public', 'coven', 'private']);

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { enabled, allowedSubmitters, visibility, requireApproval } = req.body as {
    enabled?: number; allowedSubmitters?: string; visibility?: string; requireApproval?: number;
  };

  if (allowedSubmitters !== undefined && !VALID_SUBMITTERS.has(allowedSubmitters)) {
    return res.status(400).json({ error: 'Invalid allowedSubmitters' });
  }
  if (visibility !== undefined && !VALID_VIS.has(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility' });
  }

  await db.insert(profileGuestbookSettings)
    .values({
      userId: session.user.id,
      enabled: enabled ?? 0,
      allowedSubmitters: allowedSubmitters ?? 'coven',
      visibility: visibility ?? 'coven',
      requireApproval: requireApproval ?? 1,
    })
    .onDuplicateKeyUpdate({
      set: {
        ...(enabled !== undefined ? { enabled } : {}),
        ...(allowedSubmitters !== undefined ? { allowedSubmitters } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(requireApproval !== undefined ? { requireApproval } : {}),
      },
    });

  res.json({ ok: true });
}
