/**
 * GET /api/spells/saved — returns the authenticated user's saved spells.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { spellSaves, spells } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await db
      .select({
        saveId: spellSaves.id,
        savedAt: spellSaves.createdAt,
        id: spells.id,
        slug: spells.slug,
        title: spells.title,
        subtitle: spells.subtitle,
        intention: spells.intention,
        difficulty: spells.difficulty,
        durationMinutes: spells.durationMinutes,
        moonPhase: spells.moonPhase,
        saveCount: spells.saveCount,
        ratingCount: spells.ratingCount,
        ratingSum: spells.ratingSum,
        isFeatured: spells.isFeatured,
      })
      .from(spellSaves)
      .innerJoin(spells, eq(spellSaves.spellId, spells.id))
      .where(eq(spellSaves.userId, session.user.id))
      .orderBy(spellSaves.createdAt);

    res.json({ spells: rows });
  } catch (err) {
    console.error('[spells/saved/GET] error:', err);
    res.status(500).json({ error: 'Failed to fetch saved spells' });
  }
}
