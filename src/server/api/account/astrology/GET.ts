/**
 * GET /api/account/astrology
 * Returns the authenticated user's stored astrology/birth data.
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

  const [row] = await db
    .select({
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthLocation: user.birthLocation,
      sunSign: user.sunSign,
      moonSign: user.moonSign,
      risingSign: user.risingSign,
    })
    .from(user)
    .where(eq(user.id, session.user.id as string))
    .limit(1);

  return res.json({
    astrology: {
      birthDate: row?.birthDate ?? '',
      birthTime: row?.birthTime ?? '',
      birthLocation: row?.birthLocation ?? '',
      sunSign: row?.sunSign ?? '',
      moonSign: row?.moonSign ?? '',
      risingSign: row?.risingSign ?? '',
    },
  });
}
