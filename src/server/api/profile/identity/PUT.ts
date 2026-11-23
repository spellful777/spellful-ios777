/**
 * PUT /api/profile/identity
 * Body: { fieldKey, value, visibility }
 * Upserts one identity field for the authenticated user.
 * Pass value: '' to clear/delete the field.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileIdentityFields } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_KEYS = new Set(['magical_name', 'magical_path', 'experience_level', 'favorite_element', 'personal_motto']);
const VALID_VISIBILITIES = new Set(['public', 'coven', 'private']);
const CHAR_LIMITS: Record<string, number> = {
  magical_name: 60,
  magical_path: 500,
  experience_level: 50,
  favorite_element: 30,
  personal_motto: 120,
};

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { fieldKey, value, visibility = 'private' } = req.body as {
    fieldKey?: string; value?: string; visibility?: string;
  };

  if (!fieldKey || !VALID_KEYS.has(fieldKey)) return res.status(400).json({ error: 'Invalid fieldKey' });
  if (typeof value !== 'string') return res.status(400).json({ error: 'value required' });
  if (!VALID_VISIBILITIES.has(visibility)) return res.status(400).json({ error: 'Invalid visibility' });

  const limit = CHAR_LIMITS[fieldKey] ?? 200;
  const trimmed = value.trim().slice(0, limit);

  // Delete if empty
  if (!trimmed) {
    await db.delete(profileIdentityFields).where(
      and(eq(profileIdentityFields.userId, session.user.id), eq(profileIdentityFields.fieldKey, fieldKey))
    );
    return res.json({ ok: true, deleted: true });
  }

  // Upsert
  await db.insert(profileIdentityFields)
    .values({ userId: session.user.id, fieldKey, value: trimmed, visibility })
    .onDuplicateKeyUpdate({ set: { value: trimmed, visibility } });

  res.json({ ok: true });
}
