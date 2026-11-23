import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { grimoireEntries } from '../../db/schema.js';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { getAuthSession } from '../../lib/auth-session.js';

const PAGE_SIZE = 20;

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { type, search, favorites, page } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  try {
    const conditions = [eq(grimoireEntries.userId, session.user.id)];

    if (type && type !== 'all') {
      conditions.push(eq(grimoireEntries.type, type));
    }
    if (favorites === 'true') {
      conditions.push(eq(grimoireEntries.isFavorite, true));
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          like(grimoireEntries.title, term),
          like(grimoireEntries.content, term),
          like(grimoireEntries.tags, term),
        )!,
      );
    }

    const where = and(...conditions);

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(grimoireEntries)
        .where(where)
        .orderBy(desc(grimoireEntries.updatedAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(grimoireEntries)
        .where(where),
    ]);

    res.json({
      entries: rows,
      pagination: {
        page: pageNum,
        pageSize: PAGE_SIZE,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / PAGE_SIZE),
        hasMore: offset + rows.length < Number(total),
      },
    });
  } catch (error) {
    console.error('[grimoire/GET] DB error:', error);
    res.status(500).json({ error: 'Failed to fetch entries', message: 'Internal server error' });
  }
}
