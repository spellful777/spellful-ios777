import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { reminderPreferences } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [prefs] = await db
      .select()
      .from(reminderPreferences)
      .where(eq(reminderPreferences.userId, session.user.id))
      .limit(1);

    if (!prefs) {
      return res.json({
        fullMoonReminder: false,
        newMoonReminder: false,
        quarterMoonReminder: false,
        tarotReminder: false,
        dreamJournalReminder: false,
        ritualReminder: false,
        emailNotifications: true,
        reminderDaysBefore: 1,
        timezone: 'UTC',
      });
    }

    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences', message: 'Internal server error' });
  }
}
