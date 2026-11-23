import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { user } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';
import { generateDailyHoroscope, sunSignFromDate } from '../../../../lib/horoscope-engine.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [profile] = await db
      .select({ birthDate: user.birthDate, sunSign: user.sunSign, moonSign: user.moonSign, risingSign: user.risingSign })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!profile?.birthDate) {
      return res.status(400).json({ error: 'no_birth_date', message: 'Birth date required for daily horoscope.' });
    }

    // Use stored sunSign if available, otherwise derive from birthDate
    const sign = (profile.sunSign as ReturnType<typeof sunSignFromDate> | null) ?? sunSignFromDate(profile.birthDate);

    // Today's date in UTC (YYYY-MM-DD) — same for all timezones so the reading
    // is consistent regardless of where the user is.
    const today = new Date().toISOString().slice(0, 10);

    // Pass Moon and Rising signs for personalized context lines (optional — only shown when stored)
    const horoscope = generateDailyHoroscope(sign, today, profile.moonSign, profile.risingSign);

    res.json(horoscope);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate horoscope', message: 'Internal server error' });
  }
}
