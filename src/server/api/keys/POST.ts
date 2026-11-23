/**
 * POST /api/keys
 * Publishes the caller's ECDH public key (JWK JSON string).
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';

import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { publicKey } = req.body as { publicKey?: string };
  if (!publicKey || typeof publicKey !== 'string') {
    return res.status(400).json({ error: 'publicKey required' });
  }

  // Validate it's valid JSON (basic sanity check)
  try { JSON.parse(publicKey); } catch {
    return res.status(400).json({ error: 'publicKey must be a JWK JSON string' });
  }

  await db.execute(sql`
    INSERT INTO user_public_keys (user_id, public_key, created_at, updated_at)
    VALUES (${session.user.id}, ${publicKey}, NOW(), NOW())
    ON DUPLICATE KEY UPDATE public_key = ${publicKey}, updated_at = NOW()
  `);

  res.json({ ok: true });
}
