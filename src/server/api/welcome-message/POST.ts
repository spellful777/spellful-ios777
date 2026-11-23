/**
 * POST /api/welcome-message
 * Sends the automated Spellful Team welcome DM to the authenticated user.
 * Called once from the signup flow after account creation is confirmed.
 * Idempotent — safe to call multiple times; only sends once per user.
 * Passes the user's account_type so the correct template is used.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { sendWelcomeMessage } from '@/server/lib/welcome-message.js';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { id, name } = session.user as { id: string; name?: string | null };

    // Fetch the user's account_type from DB for accurate template selection
    let accountType = 'community_member';
    if (db) {
      const [u] = await db
        .select({ accountType: user.accountType })
        .from(user)
        .where(eq(user.id, id))
        .limit(1);
      if (u?.accountType) accountType = u.accountType;
    }

    // Fire-and-forget — never block the signup flow
    void sendWelcomeMessage(id, name ?? null, accountType);

    res.json({ ok: true });
  } catch (error) {
    // Non-fatal — log and return success so signup is never blocked
    console.error(JSON.stringify({ event: 'welcome_message.api.error', msg: String(error).slice(0, 200) }));
    res.json({ ok: true });
  }
}
