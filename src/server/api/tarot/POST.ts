import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { tarotReadings } from '../../db/schema.js';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { spreadType, spreadName, intention, cards, notes, moonPhase } = req.body as {
    spreadType?: string;
    spreadName?: string;
    intention?: string;
    cards?: Array<{ position: string; cardId: number; reversed: boolean }>;
    notes?: string;
    moonPhase?: string;
  };

  if (!spreadType || !spreadName || !cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'spreadType, spreadName, and cards are required' });
  }

  try {
    const [reading] = await db.insert(tarotReadings).values({
      userId: session.user.id,
      spreadType,
      spreadName,
      intention: intention ?? '',
      cards,
      notes: notes ?? '',
      moonPhase: moonPhase ?? '',
    }).$returningId();

    res.status(201).json({ id: reading.id, message: 'Reading saved' });
  } catch (error) {
    console.error('[tarot/POST] DB error:', error);
    res.status(500).json({ error: 'Failed to save reading', message: 'Internal server error' });
  }
}
