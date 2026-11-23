/**
 * GET /api/keys?userId=xxx
 * Returns the ECDH public key for a user (needed by sender to encrypt a message).
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { userPublicKeys } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const targetId = req.query.userId as string;
  if (!targetId) return res.status(400).json({ error: 'userId required' });

  const rows = await db.select().from(userPublicKeys).where(eq(userPublicKeys.userId, targetId)).limit(1);
  if (!rows.length) return res.status(404).json({ error: 'No public key found' });

  res.json({ publicKey: rows[0].publicKey });
}
