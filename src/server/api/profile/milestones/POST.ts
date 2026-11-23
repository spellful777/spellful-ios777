/**
 * POST /api/profile/milestones
 * Body: { title, milestoneDate?, note?, visibility?, sourceType? }
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { profileMilestones } from '@/server/db/schema.js';
import { eq, count } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_VIS = new Set(['public', 'coven', 'private']);
const VALID_SOURCE = new Set(['manual', 'join_date', 'first_post']);
const MAX_MILESTONES = 30;

export default async function handler(req: Request, res: Response) {
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { title, milestoneDate = '', note = '', visibility = 'private', sourceType = 'manual' } = req.body as {
    title: string; milestoneDate?: string; note?: string; visibility?: string; sourceType?: string;
  };

  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!VALID_VIS.has(visibility)) return res.status(400).json({ error: 'Invalid visibility' });
  if (!VALID_SOURCE.has(sourceType)) return res.status(400).json({ error: 'Invalid sourceType' });

  const [{ total }] = await db.select({ total: count() }).from(profileMilestones)
    .where(eq(profileMilestones.userId, session.user.id));
  if (total >= MAX_MILESTONES) return res.status(400).json({ error: 'Maximum milestones reached' });

  const [result] = await db.insert(profileMilestones).values({
    userId: session.user.id,
    sourceType,
    title: title.trim().slice(0, 120),
    milestoneDate: milestoneDate.slice(0, 20),
    note: note.slice(0, 300),
    visibility,
    position: total,
  });

  res.status(201).json({ id: result.insertId });
}
