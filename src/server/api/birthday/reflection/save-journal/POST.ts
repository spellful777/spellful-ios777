/**
 * POST /api/birthday/reflection/save-journal
 * Saves the birthday reflection to the user's grimoire and marks it as saved.
 * Body: { year: number }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '../../../../lib/auth-session.js';
import { db } from '../../../../db/client.js';
import { sql } from 'drizzle-orm';

interface ReflectionRow {
  reflection: string;
  journal_saved: number;
}

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const myId = session.user.id;
  const year = Number(req.body?.year);
  if (!year || year < 2000 || year > 2100) return res.status(400).json({ error: 'Invalid year' });

  try {
    // Load the reflection
    const [rows] = await db.execute(sql`
      SELECT reflection, journal_saved
      FROM birthday_reflections
      WHERE user_id = ${myId} AND year = ${year}
      LIMIT 1
    `) as unknown as [ReflectionRow[], unknown];

    const row = (rows as ReflectionRow[])[0];
    if (!row) return res.status(404).json({ error: 'Reflection not found' });
    if (row.journal_saved) return res.json({ ok: true, alreadySaved: true });

    const title = `Solar Return ${year} — My Birthday Reflection`;
    const content = row.reflection;

    // Save to grimoire as a journal entry
    await db.execute(sql`
      INSERT INTO grimoire_entries (user_id, type, title, content, notes, tags, is_private)
      VALUES (${myId}, 'journal', ${title}, ${content}, '', '["birthday","solar-return"]', TRUE)
    `);

    // Mark as saved
    await db.execute(sql`
      UPDATE birthday_reflections
      SET journal_saved = TRUE, journal_saved_at = NOW()
      WHERE user_id = ${myId} AND year = ${year}
    `);

    return res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'birthday.reflection.save_journal.error', msg: String(err).slice(0, 200) }));
    return res.status(500).json({ error: 'Failed to save to journal' });
  }
}
