import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { herbs } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { herbId, reason, details } = req.body as { herbId?: number; reason?: string; details?: string };
    if (!herbId || !reason) {
      return res.status(400).json({ error: 'herbId and reason are required' });
    }
    // Mark the herb as reported with a timestamp
    await db.update(herbs)
      .set({ reportedAt: new Date(), status: 'flagged' })
      .where(eq(herbs.id, herbId));

    // Log the report (in production this would go to an admin queue / email)
    console.log(`[Herb Report] id=${herbId} reason="${reason}" details="${details ?? ''}"`);

    res.json({ ok: true, message: 'Thank you — your report has been submitted for editorial review.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report', message: 'Internal server error' });
  }
}
