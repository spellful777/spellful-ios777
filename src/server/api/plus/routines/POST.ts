/**
 * POST /api/plus/routines
 * Create a new practice routine.
 * Free users: limited to 1 routine. Plus users: unlimited.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { practiceRoutines } from '@/server/db/schema.js';
import { eq, count } from 'drizzle-orm';
import { getEntitlement } from '@/server/lib/plus-entitlement.js';

const FREE_ROUTINE_LIMIT = 1;

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }

  const { name, description, steps, reminderEnabled, reminderTime, reminderDays } = req.body as {
    name?: string;
    description?: string;
    steps?: Array<{ id: string; type: string; label: string; durationMin: number }>;
    reminderEnabled?: boolean;
    reminderTime?: string;
    reminderDays?: number[];
  };

  if (!name?.trim()) {
    res.status(400).json({ error: 'NAME_REQUIRED' });
    return;
  }

  const [ent, countRows] = await Promise.all([
    getEntitlement(session.user.id),
    db.select({ n: count() }).from(practiceRoutines).where(eq(practiceRoutines.userId, session.user.id)),
  ]);

  const currentCount = Number(countRows[0]?.n ?? 0);
  if (!ent.isPlus && currentCount >= FREE_ROUTINE_LIMIT) {
    res.status(403).json({
      error: 'PLUS_REQUIRED',
      message: `Free accounts can have up to ${FREE_ROUTINE_LIMIT} routine. Upgrade to Spellful Plus for unlimited routines.`,
      currentCount,
      limit: FREE_ROUTINE_LIMIT,
    });
    return;
  }

  const [result] = await db.insert(practiceRoutines).values({
    userId: session.user.id,
    name: name.trim().slice(0, 100),
    description: (description ?? '').slice(0, 300),
    steps: steps ?? [],
    reminderEnabled: reminderEnabled ?? false,
    reminderTime: reminderTime ?? '',
    reminderDays: reminderDays ?? [],
    isTemplate: false,
    sortOrder: currentCount,
  });

  res.status(201).json({ id: (result as { insertId: number }).insertId, ok: true });
}
