/**
 * POST /api/horoscope/share
 * Records a horoscope share event (fire-and-forget from client).
 * Stores sign + platform so the admin dashboard can show share breakdowns.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_PLATFORMS = ['x', 'facebook', 'bluesky', 'threads', 'instagram', 'copy', 'story_download', 'other'];
const VALID_SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { sign, platform } = req.body as { sign?: string; platform?: string };
  const safePlatform = platform && VALID_PLATFORMS.includes(platform) ? platform : 'other';
  const safeSign = sign && VALID_SIGNS.includes(sign) ? sign : null;

  try {
    await db.execute(sql`
      INSERT INTO horoscope_shares (user_id, sign, platform, shared_at)
      VALUES (${session.user.id}, ${safeSign}, ${safePlatform}, NOW())
    `);
  } catch {
    // Table may not exist yet — create it and retry
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS horoscope_shares (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          sign VARCHAR(20),
          platform VARCHAR(30),
          shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_hs_user (user_id),
          INDEX idx_hs_sign (sign),
          INDEX idx_hs_platform (platform)
        )
      `);
      await db.execute(sql`
        INSERT INTO horoscope_shares (user_id, sign, platform, shared_at)
        VALUES (${session.user.id}, ${safeSign}, ${safePlatform}, NOW())
      `);
    } catch { /* non-critical */ }
  }

  return res.json({ ok: true });
}
