import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityCategories } from '@/server/db/schema.js';
import { asc } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { hasRole } from '@/server/lib/require-role.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id || !hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    return res.status(403).json({ error: 'Admin only' });
  }
  const cats = await db.select().from(communityCategories).orderBy(asc(communityCategories.sortOrder));
  res.json(cats);
}
