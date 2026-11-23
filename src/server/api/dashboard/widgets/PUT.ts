import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { dashboardWidgets } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

interface WidgetUpdate {
  widgetType: string;
  sortOrder: number;
  isVisible: boolean;
  settings?: Record<string, unknown>;
}

const ALLOWED_TYPES = new Set([
  'moon', 'tarot', 'affirmation', 'herb-crystal', 'grimoire',
  'events', 'journal', 'spell', 'messages', 'quick-links',
]);

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const widgets = req.body as WidgetUpdate[];
  if (!Array.isArray(widgets)) return res.status(400).json({ error: 'Expected array of widgets' });

  // Validate
  for (const w of widgets) {
    if (!ALLOWED_TYPES.has(w.widgetType)) {
      return res.status(400).json({ error: `Unknown widget type: ${w.widgetType}` });
    }
  }

  // Upsert each widget — delete removed types, insert/update the rest
  const incomingTypes = new Set(widgets.map((w) => w.widgetType));

  // Remove widgets not in the incoming list
  const existing = await db
    .select({ widgetType: dashboardWidgets.widgetType })
    .from(dashboardWidgets)
    .where(eq(dashboardWidgets.userId, session.user.id));

  for (const row of existing) {
    if (!incomingTypes.has(row.widgetType)) {
      await db
        .delete(dashboardWidgets)
        .where(
          and(
            eq(dashboardWidgets.userId, session.user.id),
            eq(dashboardWidgets.widgetType, row.widgetType),
          ),
        );
    }
  }

  // Upsert each incoming widget
  for (const w of widgets) {
    const existingRow = existing.find((r) => r.widgetType === w.widgetType);
    if (existingRow) {
      await db
        .update(dashboardWidgets)
        .set({
          sortOrder: w.sortOrder,
          isVisible: w.isVisible,
          settings: w.settings ?? {},
        })
        .where(
          and(
            eq(dashboardWidgets.userId, session.user.id),
            eq(dashboardWidgets.widgetType, w.widgetType),
          ),
        );
    } else {
      await db.insert(dashboardWidgets).values({
        userId: session.user.id,
        widgetType: w.widgetType,
        sortOrder: w.sortOrder,
        isVisible: w.isVisible,
        settings: w.settings ?? {},
      });
    }
  }

  res.json({ ok: true });
}
