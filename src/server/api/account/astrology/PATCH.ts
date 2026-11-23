/**
 * PATCH /api/account/astrology
 * Updates the authenticated user's stored astrology/birth data.
 * Body: { birthDate, birthTime, birthLocation, sunSign, moonSign, risingSign }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { birthDate, birthTime, birthLocation, sunSign, moonSign, risingSign } = req.body as {
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
    sunSign?: string;
    moonSign?: string;
    risingSign?: string;
  };

  await db
    .update(user)
    .set({
      birthDate: birthDate ?? null,
      birthTime: birthTime ?? null,
      birthLocation: birthLocation ?? null,
      sunSign: sunSign ?? null,
      moonSign: moonSign ?? null,
      risingSign: risingSign ?? null,
    })
    .where(eq(user.id, session.user.id as string));

  return res.json({ ok: true });
}
