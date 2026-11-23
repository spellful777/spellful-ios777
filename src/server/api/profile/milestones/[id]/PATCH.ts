/**
 * PATCH /api/profile/milestones/:id
 * Body: { title?, milestoneDate?, note?, visibility?, position? }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileMilestones } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_VIS = new Set(['public', 'coven', 'private']);

export default async function handler(req: Request<{ id: string }>, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { title, milestoneDate, note, visibility, position } = req.body as {
    title?: string; milestoneDate?: string; note?: string; visibility?: string; position?: number;
  };

  if (visibility !== undefined && !VALID_VIS.has(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility' });
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim().slice(0, 120);
  if (milestoneDate !== undefined) updates.milestoneDate = milestoneDate.slice(0, 20);
  if (note !== undefined) updates.note = note.slice(0, 300);
  if (visibility !== undefined) updates.visibility = visibility;
  if (position !== undefined) updates.position = position;

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });

  await db.update(profileMilestones)
    .set(updates)
    .where(and(eq(profileMilestones.id, id), eq(profileMilestones.userId, session.user.id)));

  res.json({ ok: true });
}
