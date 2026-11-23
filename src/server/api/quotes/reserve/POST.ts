/**
 * POST /api/quotes/reserve
 *
 * Atomically selects and records an unseen magical welcome quote for the
 * authenticated user. Returns the quote text, theme, and accent style.
 *
 * Idempotency: the client sends a per-login `eventKey` (a UUID generated once
 * per welcome-screen mount). If the same eventKey was already used to reserve
 * a quote in this session, the same quote is returned without consuming a new
 * one. This prevents double-consumption on React re-renders or StrictMode
 * double-invocation.
 *
 * Pool exhaustion: when all curated quotes have been seen, returns a graceful
 * fallback message (not recorded as a quote) so the user can still log in.
 */
import type { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getDatabaseCredentials } from '../../../db/config.js';
import { getAuthSession } from '../../../lib/auth-session.js';

interface QuoteRow {
  id: number;
  text: string;
  theme: string;
  accent: string;
}

// In-process idempotency cache: eventKey → { quoteId, text, theme, accent }
// Cleared on server restart (acceptable — a restart is a new session).
const idempotencyCache = new Map<string, { quoteId: number; text: string; theme: string; accent: string }>();

// Prune cache entries older than 2 hours to prevent unbounded growth
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

function pruneCache() {
  const now = Date.now();
  for (const [key, ts] of cacheTimestamps) {
    if (now - ts > CACHE_TTL_MS) {
      idempotencyCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
}

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const userId = session.user.id;
  const { eventKey } = req.body as { eventKey?: string };

  // Validate eventKey — must be a non-empty string (UUID from client)
  if (!eventKey || typeof eventKey !== 'string' || eventKey.length > 128) {
    return res.status(400).json({ error: 'eventKey required' });
  }

  // Idempotency: return cached result for this eventKey
  pruneCache();
  const cached = idempotencyCache.get(eventKey);
  if (cached) {
    return res.json({ ...cached, fallback: false });
  }

  const cfg = getDatabaseCredentials();
  let conn: mysql.Connection | null = null;

  try {
    conn = await mysql.createConnection({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      port: cfg.port,
      ssl: { rejectUnauthorized: false },
    });

    // Atomically select one unseen active quote and record it.
    // Uses a transaction with SELECT ... FOR UPDATE to prevent duplicate
    // delivery from concurrent logins on multiple tabs/devices.
    await conn.beginTransaction();

    let quote: QuoteRow | null = null;
    try {
      // Pick one unseen quote — ordered by id for determinism, LIMIT 1
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT q.id, q.text, q.theme, q.accent
         FROM quotes q
         WHERE q.active = 1
           AND q.id NOT IN (
             SELECT quote_id FROM user_quote_history WHERE user_id = ?
           )
         ORDER BY RAND()
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [userId],
      );

      if (rows.length > 0) {
        quote = rows[0] as QuoteRow;
        // Record as shown
        await conn.execute(
          'INSERT IGNORE INTO user_quote_history (user_id, quote_id) VALUES (?, ?)',
          [userId, quote.id],
        );
      }

      await conn.commit();
    } catch (txErr) {
      await conn.rollback().catch(() => undefined);
      throw txErr;
    }

    if (!quote) {
      // Pool exhausted — return graceful fallback (not recorded)
      return res.json({
        quoteId: null,
        text: 'Welcome back to Spellful ✦',
        theme: 'general',
        accent: 'gold',
        fallback: true,
      });
    }

    const result = {
      quoteId: quote.id,
      text: quote.text,
      theme: quote.theme,
      accent: quote.accent,
      fallback: false,
    };

    // Cache for idempotency
    idempotencyCache.set(eventKey, { quoteId: quote.id, text: quote.text, theme: quote.theme, accent: quote.accent });
    cacheTimestamps.set(eventKey, Date.now());

    return res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(JSON.stringify({ event: 'quotes.reserve.error', msg: msg.slice(0, 200) }));
    // Non-fatal: return fallback so login is never blocked
    return res.json({
      quoteId: null,
      text: 'Welcome back to Spellful ✦',
      theme: 'general',
      accent: 'gold',
      fallback: true,
    });
  } finally {
    if (conn) await conn.end().catch(() => undefined);
  }
}
