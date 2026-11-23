/**
 * POST /api/bug-reports
 * Submit a bug report. Authenticated users only.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { bugReports } from '@/server/db/schema.js';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Sign in to submit a bug report' });
  }
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { title, description, pageUrl } = req.body as {
    title?: string;
    description?: string;
    pageUrl?: string;
  };

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  if (title.length > 255) return res.status(400).json({ error: 'Title too long' });

  await db.insert(bugReports).values({
    reporterId: session.user.id,
    title: title.trim(),
    description: description.trim(),
    pageUrl: (pageUrl ?? '').slice(0, 500),
    status: 'new',
  });

  return res.status(201).json({ ok: true });
}
