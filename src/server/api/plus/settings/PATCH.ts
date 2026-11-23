/**
 * PATCH /api/plus/settings
 * Update Plus user preferences (badge opt-in, theme, layout, widget order).
 * Entitlement is re-verified server-side before allowing badge opt-in.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { upsertPlusSettings } from '@/server/lib/plus-entitlement.js';

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const { showSupporterBadge, activeTheme, activeLayout, practiceWidgetOrder } = req.body as {
    showSupporterBadge?: boolean;
    activeTheme?: string;
    activeLayout?: string;
    practiceWidgetOrder?: string[];
  };

  try {
    await upsertPlusSettings(session.user.id, {
      ...(showSupporterBadge !== undefined && { showSupporterBadge }),
      ...(activeTheme !== undefined && { activeTheme }),
      ...(activeLayout !== undefined && { activeLayout }),
      ...(practiceWidgetOrder !== undefined && { practiceWidgetOrder }),
    });
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === 'PLUS_REQUIRED') {
      res.status(403).json({ error: 'PLUS_REQUIRED', message: 'Active Spellful Plus subscription required.' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: String(e) });
  }
}
