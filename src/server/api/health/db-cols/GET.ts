import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'DB unavailable' });
    const rawResult = await db.execute(sql`SHOW COLUMNS FROM user`) as unknown as [Array<{ Field: string }>, unknown];
    const rows = rawResult[0];
    res.json({ columns: rows.map(r => r.Field) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
