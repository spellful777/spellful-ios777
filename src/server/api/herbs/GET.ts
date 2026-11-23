import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { herbs } from '../../db/schema.js';
import { like, or, eq, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { q = '', category = '', spellType = '', element = '', planet = '', status: statusFilter = 'approved' } = req.query as Record<string, string>;

    const conditions = [];

    // Only show approved herbs by default
    if (statusFilter) {
      conditions.push(eq(herbs.status, statusFilter));
    }

    if (q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          like(herbs.name, term),
          like(herbs.aliases, term),
          like(herbs.magicalUses, term),
          like(herbs.notes, term),
          like(herbs.element, term),
          like(herbs.planet, term),
          like(herbs.zodiac, term),
          like(herbs.botanicalName, term),
          like(herbs.plantFamily, term),
          like(herbs.traditionAttribution, term),
          like(herbs.category, term),
        )
      );
    }

    if (category.trim()) {
      conditions.push(eq(herbs.category, category.trim()));
    }

    if (spellType.trim()) {
      conditions.push(like(herbs.spellTypes, `%${spellType.trim()}%`));
    }

    if (element.trim()) {
      conditions.push(eq(herbs.element, element.trim()));
    }

    if (planet.trim()) {
      conditions.push(eq(herbs.planet, planet.trim()));
    }

    const whereClause = conditions.length > 0
      ? conditions.length === 1 ? conditions[0] : and(...conditions)
      : undefined;

    const results = whereClause
      ? await db.select().from(herbs).where(whereClause).orderBy(herbs.name)
      : await db.select().from(herbs).orderBy(herbs.name);

    // Get distinct categories for filter UI
    const allCategories = await db.selectDistinct({ category: herbs.category }).from(herbs)
      .where(eq(herbs.status, 'approved'));

    res.json({
      results,
      total: results.length,
      categories: allCategories.map((r) => r.category).filter(Boolean).sort(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search herbs', message: 'Internal server error' });
  }
}
