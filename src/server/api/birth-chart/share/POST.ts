/**
 * POST /api/birth-chart/share
 * Records a birth chart share event (fire-and-forget from client).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_PLATFORMS = ['x', 'facebook', 'linkedin', 'instagram', 'copy', 'other'];

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { platform } = req.body as { platform?: string };
  const safePlatform = platform && VALID_PLATFORMS.includes(platform) ? platform : 'other';

  try {
    await db.execute(sql`
      INSERT INTO birth_chart_shares (user_id, platform, shared_at)
      VALUES (${session.user.id}, ${safePlatform}, NOW())
    `);
  } catch {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS birth_chart_shares (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          platform VARCHAR(30),
          shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_bcs_user (user_id),
          INDEX idx_bcs_platform (platform)
        )
      `);
      await db.execute(sql`
        INSERT INTO birth_chart_shares (user_id, platform, shared_at)
        VALUES (${session.user.id}, ${safePlatform}, NOW())
      `);
    } catch { /* non-critical */ }
  }

  return res.json({ ok: true });
}
