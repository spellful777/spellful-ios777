/**
 * GET /api/birthday/reflection
 *
 * Returns the current birthday-week reflection for the authenticated user.
 * If none exists for this year, generates one and persists it.
 *
 * Response:
 *   200 { reflection, year, journalSaved, dismissed, inBirthdayWeek }
 *   401 if not authenticated
 *   404 if user has no birth_date set
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '../../../lib/auth-session.js';
import { db } from '../../../db/client.js';
import { sql } from 'drizzle-orm';

// ── Birthday-week helpers ─────────────────────────────────────────────────────

/**
 * Parse a stored birth_date string (YYYY-MM-DD or MM-DD or similar) into
 * { month: 1-12, day: 1-31 }.  Returns null if unparseable.
 */
function parseBirthMonthDay(birthDate: string): { month: number; day: number } | null {
  const parts = birthDate.split('-').map(Number);
  if (parts.length === 3) {
    // YYYY-MM-DD
    const [, m, d] = parts;
    if (m && d && m >= 1 && m <= 12 && d >= 1 && d <= 31) return { month: m, day: d };
  }
  if (parts.length === 2) {
    // MM-DD
    const [m, d] = parts;
    if (m && d && m >= 1 && m <= 12 && d >= 1 && d <= 31) return { month: m, day: d };
  }
  return null;
}

/**
 * Determine whether today (in the given timezone) falls within the birthday week.
 * Birthday week = birthday day and the 6 preceding calendar days.
 * Feb 29 policy: treat as Feb 28 in non-leap years.
 */
function isInBirthdayWeek(birthDate: string, timezone: string): boolean {
  let bd = parseBirthMonthDay(birthDate);
  if (!bd) return false;

  // Resolve the user's local "today"
  const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  const todayYear = nowLocal.getFullYear();
  const todayMonth = nowLocal.getMonth() + 1; // 1-based
  const todayDay = nowLocal.getDate();

  // Feb 29 → Feb 28 in non-leap years
  if (bd.month === 2 && bd.day === 29) {
    const isLeap = (todayYear % 4 === 0 && todayYear % 100 !== 0) || todayYear % 400 === 0;
    if (!isLeap) bd = { month: 2, day: 28 };
  }

  // Build the birthday Date for this year (midnight local)
  const birthdayThisYear = new Date(todayYear, bd.month - 1, bd.day);

  // Window: birthday day and 6 preceding days
  const windowStart = new Date(birthdayThisYear);
  windowStart.setDate(windowStart.getDate() - 6);

  const today = new Date(todayYear, todayMonth - 1, todayDay);

  return today >= windowStart && today <= birthdayThisYear;
}

/** Return the calendar year of the birthday this year (used as the reflection key). */
function birthdayYear(birthDate: string, timezone: string): number {
  const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  return nowLocal.getFullYear();
}

// ── Fallback reflections (used when no generation service is available) ───────
const FALLBACK_REFLECTIONS = [
  `This solar return marks another full revolution around the sun — a journey only you have taken, in exactly the way you have taken it. The stars that watched over your birth are watching still, and they see someone who has grown in ways both visible and invisible. May this year bring you clarity in the places that have felt murky, warmth in the places that have felt cold, and magic in the ordinary moments you might otherwise overlook. You are exactly where you need to be.`,
  `Every birthday is a threshold — a doorway between who you were and who you are becoming. As you step through this one, carry with you the wisdom you have gathered, the resilience you have built, and the softness you have chosen to keep. The universe conspired to bring you here, to this exact moment, and it is conspiring still on your behalf. Trust the unfolding.`,
  `Your solar return is a sacred pause — a moment to honour the full, complicated, luminous person you are. You have navigated seasons of change, held space for others, and found your way back to yourself more times than you can count. This year, may you receive even a fraction of the care you so freely give. You deserve to be celebrated, not just today, but in all the quiet days that follow.`,
  `The sun returns to the place it occupied the moment you arrived in this world, and in doing so it offers you a gift: the chance to begin again. Not from scratch — you carry everything you have learned — but with fresh eyes and an open heart. Whatever you are hoping for this year, let yourself hope for it fully. The magic you seek is already moving toward you.`,
  `There is a particular kind of courage in continuing — in showing up, day after day, as yourself. You have that courage. This birthday, let it be a reminder that your presence in the world matters in ways you may never fully see. The ripples you create reach further than you know. May this year be one of deep nourishment, unexpected joy, and the quiet satisfaction of a life lived with intention.`,
];

function getFallbackReflection(userId: string, year: number): string {
  // Deterministic selection so the same user always gets the same fallback for a given year
  const hash = [...userId].reduce((acc, c) => acc + c.charCodeAt(0), 0) + year;
  return FALLBACK_REFLECTIONS[hash % FALLBACK_REFLECTIONS.length]!;
}

// ── Handler ───────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string | null;
  birth_date: string | null;
}

interface ReflectionRow {
  id: number;
  reflection: string;
  journal_saved: number;
  dismissed: number;
}

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const myId = session.user.id;

  try {
    // Load user birth_date
    const [userRows] = await db.execute(sql`
      SELECT id, name, birth_date FROM user WHERE id = ${myId} LIMIT 1
    `) as unknown as [UserRow[], unknown];

    const userRow = (userRows as UserRow[])[0];
    if (!userRow?.birth_date) {
      return res.status(404).json({ error: 'No birth date set', inBirthdayWeek: false });
    }

    // Determine timezone from query param (client sends its own timezone)
    const timezone = (req.query.tz as string) || 'UTC';
    const inBirthdayWeek = isInBirthdayWeek(userRow.birth_date, timezone);
    const year = birthdayYear(userRow.birth_date, timezone);

    // Check for existing reflection
    const [existingRows] = await db.execute(sql`
      SELECT id, reflection, journal_saved, dismissed
      FROM birthday_reflections
      WHERE user_id = ${myId} AND year = ${year}
      LIMIT 1
    `) as unknown as [ReflectionRow[], unknown];

    const existing = (existingRows as ReflectionRow[])[0];

    if (existing) {
      return res.json({
        reflection: existing.reflection,
        year,
        journalSaved: Boolean(existing.journal_saved),
        dismissed: Boolean(existing.dismissed),
        inBirthdayWeek,
        name: userRow.name,
      });
    }

    // Generate a new reflection (fallback — no external AI key required)
    const reflection = getFallbackReflection(myId, year);

    // Persist it
    await db.execute(sql`
      INSERT INTO birthday_reflections (user_id, year, reflection)
      VALUES (${myId}, ${year}, ${reflection})
      ON DUPLICATE KEY UPDATE reflection = VALUES(reflection)
    `);

    return res.json({
      reflection,
      year,
      journalSaved: false,
      dismissed: false,
      inBirthdayWeek,
      name: userRow.name,
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'birthday.reflection.get.error', msg: String(err).slice(0, 200) }));
    return res.status(500).json({ error: 'Failed to load reflection' });
  }
}
