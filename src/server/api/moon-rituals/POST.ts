import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { moonRituals } from '../../db/schema.js';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const {
    moonPhase, intention, ritualName, herbs, crystals,
    affirmations, journalPrompts, steps, scheduledDate, notes,
  } = req.body as {
    moonPhase?: string;
    intention?: string;
    ritualName?: string;
    herbs?: string[];
    crystals?: string[];
    affirmations?: string[];
    journalPrompts?: string[];
    steps?: string[];
    scheduledDate?: string;
    notes?: string;
  };

  if (!moonPhase || !intention || !ritualName) {
    return res.status(400).json({ error: 'moonPhase, intention, and ritualName are required' });
  }

  try {
    const [ritual] = await db.insert(moonRituals).values({
      userId: session.user.id,
      moonPhase,
      intention,
      ritualName,
      herbs: herbs ?? [],
      crystals: crystals ?? [],
      affirmations: affirmations ?? [],
      journalPrompts: journalPrompts ?? [],
      steps: steps ?? [],
      scheduledDate: scheduledDate ?? '',
      notes: notes ?? '',
    }).$returningId();

    res.status(201).json({ id: ritual.id, message: 'Ritual saved' });
  } catch (error) {
    console.error('[moon-rituals/POST] DB error:', error);
    res.status(500).json({ error: 'Failed to save ritual', message: 'Internal server error' });
  }
}
