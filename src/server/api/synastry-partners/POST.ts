import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { synastryPartners } from '../../db/schema.js';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { partnerName, birthDate, birthTime, birthCity, lat, lon, utcOffset, scores, summary, notes } = req.body as {
    partnerName: string;
    birthDate: string;
    birthTime?: string;
    birthCity: string;
    lat: string;
    lon: string;
    utcOffset?: string;
    scores: { love: number; stability: number; sexual: number; communication: number; longterm: number; overall: number };
    summary: string;
    notes?: string;
  };

  if (!partnerName || !birthDate || !birthCity || !lat || !lon || !scores) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const [row] = await db.insert(synastryPartners).values({
    userId: session.user.id,
    partnerName,
    birthDate,
    birthTime: birthTime ?? '12:00',
    birthCity,
    lat,
    lon,
    utcOffset: utcOffset ?? '0',
    scores,
    summary,
    notes: notes ?? '',
  }).$returningId();

  res.status(201).json({ id: row.id });
}
