import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityCategories } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const catId = parseInt(req.params.id);
  if (isNaN(catId)) return res.status(400).json({ error: 'Invalid id' });

  const { name, description, isActive, sortOrder } = req.body as {
    name?: string; description?: string; isActive?: boolean; sortOrder?: number;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim().slice(0, 100);
  if (description !== undefined) updates.description = description.trim();
  if (isActive !== undefined) updates.isActive = isActive;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No changes' });

  await db.update(communityCategories).set(updates).where(eq(communityCategories.id, catId));
  res.json({ ok: true });
}
