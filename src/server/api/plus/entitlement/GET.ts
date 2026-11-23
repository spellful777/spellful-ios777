/**
 * GET /api/plus/entitlement
 * Returns the signed-in user's current Plus entitlement status.
 * Never trusts client-supplied flags — reads from DB only.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { getEntitlement, getPlusSettings } from '@/server/lib/plus-entitlement.js';

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  try {
    const [entitlement, settings] = await Promise.all([
      getEntitlement(session.user.id),
      getPlusSettings(session.user.id),
    ]);

    res.json({
      isPlus: entitlement.isPlus,
      isGracePeriod: entitlement.isGracePeriod,
      status: entitlement.status,
      expiresAt: entitlement.expiresAt?.toISOString() ?? null,
      gracePeriodUntil: entitlement.gracePeriodUntil?.toISOString() ?? null,
      environment: entitlement.environment,
      settings: {
        showSupporterBadge: settings.showSupporterBadge,
        activeTheme: settings.activeTheme,
        activeLayout: settings.activeLayout,
        practiceWidgetOrder: settings.practiceWidgetOrder,
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'SERVER_ERROR', message: String(e) });
  }
}
