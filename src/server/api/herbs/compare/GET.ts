import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { herbs } from '../../../db/schema.js';
import { inArray } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { ids } = req.query as { ids?: string };
    if (!ids) {
      return res.status(400).json({ error: 'Provide ids as comma-separated herb IDs, e.g. ?ids=1,5' });
    }
    const idList = ids.split(',').map((id) => parseInt(id.trim(), 10)).filter((n) => !isNaN(n)).slice(0, 4);
    if (idList.length < 2) {
      return res.status(400).json({ error: 'Provide at least 2 herb IDs to compare' });
    }
    const results = await db.select().from(herbs).where(inArray(herbs.id, idList));
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare herbs', message: 'Internal server error' });
  }
}
