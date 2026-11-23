/**
 * GET /api/circles
 * Returns all Spellful Circles with membership status for the current user.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  const myId = session?.user?.id ?? null;

  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  try {
    const circles = await db.execute(sql`
      SELECT
        c.id, c.slug, c.name, c.description, c.icon, c.membership_type, c.member_count, c.created_at,
        ${myId ? sql`(SELECT status FROM circle_memberships WHERE circle_id = c.id AND user_id = ${myId} LIMIT 1)` : sql`NULL`} AS my_status
      FROM spellful_circles c
      ORDER BY c.member_count DESC, c.created_at ASC
    `) as unknown as [Array<{
      id: number;
      slug: string;
      name: string;
      description: string;
      icon: string;
      membership_type: string;
      member_count: number;
      created_at: string;
      my_status: string | null;
    }>, unknown];

    res.json({ circles: circles[0] });
  } catch {
    res.json({ circles: [] });
  }
}
