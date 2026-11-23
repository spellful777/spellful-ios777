import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { dashboardPreferences } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '../../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { onboardingComplete, interests, theme, density, dashboardTitle, timezone } =
    req.body as {
      onboardingComplete?: boolean;
      interests?: string[];
      theme?: string;
      density?: string;
      dashboardTitle?: string;
      timezone?: string;
    };

  const update: Partial<typeof dashboardPreferences.$inferInsert> = {};
  if (onboardingComplete !== undefined) update.onboardingComplete = onboardingComplete;
  if (Array.isArray(interests)) update.interests = interests;
  if (theme) update.theme = theme;
  if (density) update.density = density;
  if (dashboardTitle !== undefined) update.dashboardTitle = dashboardTitle.slice(0, 80);
  if (timezone) update.timezone = timezone;

  const existing = await db
    .select({ userId: dashboardPreferences.userId })
    .from(dashboardPreferences)
    .where(eq(dashboardPreferences.userId, session.user.id))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(dashboardPreferences).values({
      userId: session.user.id,
      ...update,
    });
  } else {
    await db
      .update(dashboardPreferences)
      .set(update)
      .where(eq(dashboardPreferences.userId, session.user.id));
  }

  res.json({ ok: true });
}
