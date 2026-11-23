/**
 * PATCH /api/messages/:id
 * Three operations (mutually exclusive, determined by body shape):
 *   1. Status change:  { status: 'sent' | 'draft' | 'trashed' | 'deleted' }
 *   2. Edit content:   { ciphertext: string, iv: string }  — sets edited_at = NOW()
 *   3. Soft delete:    { softDelete: true }                — sets deleted_at = NOW(), clears ciphertext
 * Only the sender may perform any of these.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { messages } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const ALLOWED_STATUSES = ['sent', 'draft', 'trashed', 'deleted'] as const;
type MessageStatus = typeof ALLOWED_STATUSES[number];

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const msgId = parseInt(req.params.id);
  if (isNaN(msgId)) return res.status(400).json({ error: 'Invalid id' });

  // Only the sender can update their own message
  const [msg] = await db
    .select({ id: messages.id, senderId: messages.senderId })
    .from(messages)
    .where(and(eq(messages.id, msgId), eq(messages.senderId, myId)))
    .limit(1);
  if (!msg) return res.status(404).json({ error: 'Message not found or not yours' });

  const body = req.body as { status?: string; ciphertext?: string; iv?: string; softDelete?: boolean };

  // ── Operation 3: soft delete ──────────────────────────────────────────────
  if (body.softDelete === true) {
    await db.execute(sql`
      UPDATE messages
      SET deleted_at = NOW(), ciphertext = '', iv = ''
      WHERE id = ${msgId}
    `);
    return res.json({ ok: true, id: msgId, action: 'soft_deleted' });
  }

  // ── Operation 2: edit content ─────────────────────────────────────────────
  if (body.ciphertext && body.iv) {
    await db.execute(sql`
      UPDATE messages
      SET ciphertext = ${body.ciphertext}, iv = ${body.iv}, edited_at = NOW()
      WHERE id = ${msgId}
    `);
    return res.json({ ok: true, id: msgId, action: 'edited' });
  }

  // ── Operation 1: status change ────────────────────────────────────────────
  const { status } = body;
  if (!status || !ALLOWED_STATUSES.includes(status as MessageStatus)) {
    return res.status(400).json({ error: `Provide status, ciphertext+iv, or softDelete:true` });
  }

  await db
    .update(messages)
    .set({ status: status as MessageStatus })
    .where(eq(messages.id, msgId));

  res.json({ ok: true, id: msgId, status });
}
