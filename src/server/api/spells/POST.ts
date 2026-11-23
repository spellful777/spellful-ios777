import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { spells } from '../../db/schema.js';
import { getAuthSession } from '../../lib/auth-session.js';
import { eq, and } from 'drizzle-orm';

const VALID_INTENTIONS = ['protection', 'love', 'abundance', 'healing', 'clarity', 'banishing', 'divination', 'grounding'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const {
    title, subtitle, purpose, intention, difficulty,
    durationMinutes, moonPhase, bestTiming, materials,
    steps, safetyNotes, herbCorrespondences, crystalCorrespondences,
    elementCorrespondences,
  } = req.body as {
    title: string;
    subtitle?: string;
    purpose: string;
    intention: string;
    difficulty: string;
    durationMinutes: number;
    moonPhase?: string;
    bestTiming?: string;
    materials: string[];
    steps: Array<{ order: number; title: string; description: string }>;
    safetyNotes?: string;
    herbCorrespondences?: string[];
    crystalCorrespondences?: string[];
    elementCorrespondences?: string[];
  };

  if (!title || !purpose || !intention || !difficulty || !durationMinutes || !materials?.length || !steps?.length) {
    return res.status(400).json({ error: 'title, purpose, intention, difficulty, durationMinutes, materials, and steps are required' });
  }
  if (!VALID_INTENTIONS.includes(intention)) {
    return res.status(400).json({ error: `intention must be one of: ${VALID_INTENTIONS.join(', ')}` });
  }
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}` });
  }
  if (title.length > 255) return res.status(400).json({ error: 'title too long' });
  if (steps.length > 20) return res.status(400).json({ error: 'Maximum 20 steps' });
  if (materials.length > 30) return res.status(400).json({ error: 'Maximum 30 materials' });

  // Rate limit: max 3 pending submissions per user
  const pendingCount = await db.$count(
    spells,
    and(eq(spells.submittedByUserId, session.user.id), eq(spells.status, 'pending'))
  );
  if (pendingCount >= 3) {
    return res.status(429).json({ error: 'You have too many pending submissions. Please wait for them to be reviewed.' });
  }

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const existing = await db.select({ id: spells.id }).from(spells).where(eq(spells.slug, slug)).limit(1);
    if (existing.length === 0) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const [result] = await db.insert(spells).values({
    slug,
    title,
    subtitle: subtitle ?? '',
    purpose,
    intention,
    difficulty,
    durationMinutes,
    moonPhase: moonPhase ?? '',
    bestTiming: bestTiming ?? '',
    materials,
    steps,
    safetyNotes: safetyNotes ?? '',
    herbCorrespondences: herbCorrespondences ?? [],
    crystalCorrespondences: crystalCorrespondences ?? [],
    elementCorrespondences: elementCorrespondences ?? [],
    relatedSpellIds: [],
    submittedByUserId: session.user.id,
    status: 'pending',
    isAdminCreated: false,
    isFeatured: false,
    saveCount: 0,
    ratingCount: 0,
    ratingSum: 0,
  });

  res.status(201).json({ id: result.insertId, slug, status: 'pending', message: 'Spell submitted for review. You will be notified when it is approved.' });
}
