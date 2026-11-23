/**
 * GET /api/conversations/:id/wallpaper
 * Returns the shared wallpaper preference for this conversation.
 * Both participants see the same wallpaper.
 * Response: { themeId, customImageUrl, dimAmount, blurAmount }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations } from '@/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const convId = parseInt(req.params.id);
  if (isNaN(convId)) return res.status(400).json({ error: 'Invalid id' });

  // Verify participant
  const [conv] = await db
    .select({ p1: conversations.participant1Id, p2: conversations.participant2Id })
    .from(conversations)
    .where(eq(conversations.id, convId))
    .limit(1);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.p1 !== myId && conv.p2 !== myId) return res.status(403).json({ error: 'Forbidden' });

  const rawResult = await db.execute(sql`
    SELECT theme_id, custom_image_url, dim_amount, blur_amount
    FROM messenger_wallpapers
    WHERE conversation_id = ${convId}
    LIMIT 1
  `) as unknown as [{ theme_id: string; custom_image_url: string | null; dim_amount: number; blur_amount: number }[], unknown];

  const rows = rawResult[0] as { theme_id: string; custom_image_url: string | null; dim_amount: number; blur_amount: number }[];

  if (!rows || rows.length === 0) {
    return res.json({ themeId: 'default', customImageUrl: null, dimAmount: 40, blurAmount: 0 });
  }

  const row = rows[0];
  res.json({
    themeId: row.theme_id,
    customImageUrl: row.custom_image_url ?? null,
    dimAmount: row.dim_amount,
    blurAmount: row.blur_amount,
  });
}
