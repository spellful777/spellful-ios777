import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { dashboardWidgets } from '../../../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

// Default widget layout for new users
const DEFAULT_WIDGETS = [
  { widgetType: 'moon',        sortOrder: 0 },
  { widgetType: 'tarot',       sortOrder: 1 },
  { widgetType: 'affirmation', sortOrder: 2 },
  { widgetType: 'herb-crystal',sortOrder: 3 },
  { widgetType: 'events',      sortOrder: 4 },
  { widgetType: 'grimoire',    sortOrder: 5 },
  { widgetType: 'journal',     sortOrder: 6 },
  { widgetType: 'spell',       sortOrder: 7 },
];

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const rows = await db
    .select()
    .from(dashboardWidgets)
    .where(eq(dashboardWidgets.userId, session.user.id))
    .orderBy(asc(dashboardWidgets.sortOrder));

  if (rows.length === 0) {
    // Return defaults — client will save them on first customise
    return res.json(DEFAULT_WIDGETS.map((w) => ({ ...w, isVisible: true, settings: {} })));
  }

  res.json(rows);
}
