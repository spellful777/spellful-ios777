/**
 * GET /api/community/stats
 * Returns:
 *   onlineCount   — unique authenticated users with a presence heartbeat in the last 5 minutes
 *   registeredCount — total valid registered accounts (excludes no email, i.e. soft-deleted rows)
 *
 * Counting rules:
 *   "online"     = one row per user_id in user_presence with last_seen >= NOW() - 5 minutes
 *   "registered" = COUNT(*) from user where email IS NOT NULL (BetterAuth never nulls email on
 *                  a real account; rows without email are orphaned OAuth stubs)
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    const [onlineResult, registeredResult] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(DISTINCT user_id) AS cnt
        FROM user_presence
        WHERE last_seen >= NOW() - INTERVAL 5 MINUTE
      `),
      db.execute(sql`
        SELECT COUNT(*) AS cnt
        FROM user
        WHERE email IS NOT NULL
      `),
    ]);

    const onlineRows     = (onlineResult as unknown as Record<string, unknown>[][])[0] ?? [];
    const registeredRows = (registeredResult as unknown as Record<string, unknown>[][])[0] ?? [];
    const onlineCount     = Number(onlineRows[0]?.cnt ?? 0);
    const registeredCount = Number(registeredRows[0]?.cnt ?? 0);

    res.json({ onlineCount, registeredCount });
  } catch {
    res.status(500).json({ error: 'Failed to load stats' });
  }
}
