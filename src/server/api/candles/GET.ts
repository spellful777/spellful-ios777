import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { candles } from '../../db/schema.js';
import { like, or } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { q = '', spellType = '' } = req.query as Record<string, string>;

    let baseQuery = db.select().from(candles);

    const conditions: ReturnType<typeof like>[] = [];

    if (q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          like(candles.color, term),
          like(candles.magicalUses, term),
          like(candles.notes, term),
          like(candles.element, term),
          like(candles.planet, term)
        ) as ReturnType<typeof like>
      );
    }

    if (spellType.trim()) {
      conditions.push(like(candles.spellTypes, `%${spellType.trim()}%`) as ReturnType<typeof like>);
    }

    const results = conditions.length > 0
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : (conditions.reduce((a, b) => or(a, b) as ReturnType<typeof like>)))
      : await baseQuery;

    res.json({ results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search candles', message: 'Internal server error' });
  }
}
