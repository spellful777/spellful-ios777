import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { dashboardPreferences } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const rows = await db
    .select()
    .from(dashboardPreferences)
    .where(eq(dashboardPreferences.userId, session.user.id))
    .limit(1);

  if (rows.length === 0) {
    // Return defaults for first-time users — no row yet
    return res.json({
      onboardingComplete: false,
      interests: [],
      theme: 'celestial',
      density: 'comfortable',
      dashboardTitle: '',
      timezone: 'UTC',
    });
  }

  res.json(rows[0]);
}
