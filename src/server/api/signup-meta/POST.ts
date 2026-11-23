import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { backupEmail, birthDate, referralSource } = req.body as {
      backupEmail?: string;
      birthDate?: string;
      referralSource?: string;
    };

    const updates: Partial<typeof user.$inferInsert> = {};

    if (backupEmail !== undefined) {
      const trimmed = backupEmail.trim();
      if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return res.status(400).json({ error: 'Invalid backup email address.' });
      }
      updates.backupEmail = trimmed || null;
    }

    if (birthDate !== undefined) {
      updates.birthDate = birthDate.trim() || null;
    }

    if (referralSource !== undefined) {
      updates.referralSource = referralSource.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    await db.update(user).set(updates).where(eq(user.id, session.user.id));

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save signup info', message: 'Internal server error' });
  }
}
