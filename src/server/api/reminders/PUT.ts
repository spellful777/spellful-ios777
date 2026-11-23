import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { reminderPreferences } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const {
    fullMoonReminder,
    newMoonReminder,
    quarterMoonReminder,
    tarotReminder,
    dreamJournalReminder,
    ritualReminder,
    emailNotifications,
    reminderDaysBefore,
    timezone,
  } = req.body as {
    fullMoonReminder?: boolean;
    newMoonReminder?: boolean;
    quarterMoonReminder?: boolean;
    tarotReminder?: boolean;
    dreamJournalReminder?: boolean;
    ritualReminder?: boolean;
    emailNotifications?: boolean;
    reminderDaysBefore?: number;
    timezone?: string;
  };

  try {
    const [existing] = await db
      .select({ id: reminderPreferences.id })
      .from(reminderPreferences)
      .where(eq(reminderPreferences.userId, session.user.id))
      .limit(1);

    const data = {
      fullMoonReminder: fullMoonReminder ?? false,
      newMoonReminder: newMoonReminder ?? false,
      quarterMoonReminder: quarterMoonReminder ?? false,
      tarotReminder: tarotReminder ?? false,
      dreamJournalReminder: dreamJournalReminder ?? false,
      ritualReminder: ritualReminder ?? false,
      emailNotifications: emailNotifications ?? true,
      reminderDaysBefore: reminderDaysBefore ?? 1,
      timezone: timezone ?? 'UTC',
    };

    if (existing) {
      await db
        .update(reminderPreferences)
        .set(data)
        .where(eq(reminderPreferences.userId, session.user.id));
    } else {
      await db.insert(reminderPreferences).values({ userId: session.user.id, ...data });
    }

    res.json({ ok: true, ...data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save preferences', message: 'Internal server error' });
  }
}
