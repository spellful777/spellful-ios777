/**
 * GET /api/profile/identity
 * Returns all identity fields for the authenticated user.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileIdentityFields } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const fields = await db
    .select()
    .from(profileIdentityFields)
    .where(eq(profileIdentityFields.userId, session.user.id));

  res.json({ fields });
}
