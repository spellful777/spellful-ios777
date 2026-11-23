import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { spells, spellSaves, grimoireEntries } from '../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '../../../../lib/auth-session.js';

export default async function handler(req: Request<{ slug: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { slug } = req.params;

  try {
    const [spell] = await db
      .select()
      .from(spells)
      .where(and(eq(spells.slug, slug), eq(spells.status, 'approved')))
      .limit(1);
    if (!spell) return res.status(404).json({ error: 'Spell not found' });

    // Check if already saved
    const [existing] = await db
      .select({ id: spellSaves.id })
      .from(spellSaves)
      .where(and(eq(spellSaves.spellId, spell.id), eq(spellSaves.userId, session.user.id)))
      .limit(1);

    if (existing) {
      // Unsave
      await db.delete(spellSaves).where(eq(spellSaves.id, existing.id));
      await db
        .update(spells)
        .set({ saveCount: Math.max(0, spell.saveCount - 1) })
        .where(eq(spells.id, spell.id));
      return res.json({ saved: false, saveCount: Math.max(0, spell.saveCount - 1) });
    }

    // Save to spell_saves
    await db.insert(spellSaves).values({ spellId: spell.id, userId: session.user.id });
    await db.update(spells).set({ saveCount: spell.saveCount + 1 }).where(eq(spells.id, spell.id));

    // Also save to grimoire as a spell entry
    const materialsText = spell.materials.join(', ');
    const stepsText = spell.steps
      .map((s: { order: number; title: string; description: string }) => `${s.order}. ${s.title}: ${s.description}`)
      .join('\n\n');
    const content = `**Purpose:** ${spell.purpose}\n\n**Materials:** ${materialsText}\n\n**Steps:**\n${stepsText}${spell.safetyNotes ? `\n\n**Safety Notes:** ${spell.safetyNotes}` : ''}`;

    await db.insert(grimoireEntries).values({
      userId: session.user.id,
      type: 'spell',
      title: spell.title,
      content,
      notes: `Saved from Spell Library. Difficulty: ${spell.difficulty}. Duration: ${spell.durationMinutes} min.`,
      tags: [spell.intention, spell.difficulty, ...(spell.herbCorrespondences ?? []).slice(0, 3)].join(','),
      category: spell.intention,
      isFavorite: false,
      moonPhase: spell.moonPhase ?? '',
      entryDate: new Date().toISOString().split('T')[0],
      metadata: { sourceSpellId: spell.id, sourceSpellSlug: spell.slug },
    });

    res.json({ saved: true, saveCount: spell.saveCount + 1 });
  } catch (error) {
    console.error('[spells/save/POST] DB error:', error);
    res.status(500).json({ error: 'Failed to save spell', message: 'Internal server error' });
  }
}
