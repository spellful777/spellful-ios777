import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import {
  grimoireEntries,
  tarotReadings,
  moonRituals,
  timelineEntries,
  synastryPartners,
} from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '../../lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const uid = session.user.id;

  const [grimoire, tarot, rituals, timeline, connections] = await Promise.all([
    db
      .select({
        id: grimoireEntries.id,
        type: grimoireEntries.type,
        title: grimoireEntries.title,
        moonPhase: grimoireEntries.moonPhase,
        isFavorite: grimoireEntries.isFavorite,
        updatedAt: grimoireEntries.updatedAt,
      })
      .from(grimoireEntries)
      .where(eq(grimoireEntries.userId, uid))
      .orderBy(desc(grimoireEntries.updatedAt))
      .limit(5),

    db
      .select({
        id: tarotReadings.id,
        spreadName: tarotReadings.spreadName,
        spreadType: tarotReadings.spreadType,
        intention: tarotReadings.intention,
        moonPhase: tarotReadings.moonPhase,
        createdAt: tarotReadings.createdAt,
      })
      .from(tarotReadings)
      .where(eq(tarotReadings.userId, uid))
      .orderBy(desc(tarotReadings.createdAt))
      .limit(3),

    db
      .select({
        id: moonRituals.id,
        ritualName: moonRituals.ritualName,
        moonPhase: moonRituals.moonPhase,
        intention: moonRituals.intention,
        createdAt: moonRituals.createdAt,
      })
      .from(moonRituals)
      .where(eq(moonRituals.userId, uid))
      .orderBy(desc(moonRituals.createdAt))
      .limit(3),

    db
      .select({
        id: timelineEntries.id,
        type: timelineEntries.type,
        title: timelineEntries.title,
        eventDate: timelineEntries.eventDate,
        moonPhase: timelineEntries.moonPhase,
        updatedAt: timelineEntries.updatedAt,
      })
      .from(timelineEntries)
      .where(eq(timelineEntries.userId, uid))
      .orderBy(desc(timelineEntries.updatedAt))
      .limit(3),

    db
      .select({
        id: synastryPartners.id,
        partnerName: synastryPartners.partnerName,
        createdAt: synastryPartners.createdAt,
      })
      .from(synastryPartners)
      .where(eq(synastryPartners.userId, uid))
      .orderBy(desc(synastryPartners.createdAt))
      .limit(3),
  ]);

  // Counts for the hub cards
  const [grimoireCount, tarotCount, ritualCount, timelineCount, connectionCount] =
    await Promise.all([
      db.$count(grimoireEntries, eq(grimoireEntries.userId, uid)),
      db.$count(tarotReadings, eq(tarotReadings.userId, uid)),
      db.$count(moonRituals, eq(moonRituals.userId, uid)),
      db.$count(timelineEntries, eq(timelineEntries.userId, uid)),
      db.$count(synastryPartners, eq(synastryPartners.userId, uid)),
    ]);

  // Favorites
  const favorites = grimoire.filter((e) => e.isFavorite).slice(0, 3);

  // Derive "continue where you left off" — most recently touched item across all types
  type RecentItem = {
    type: string;
    title: string;
    href: string;
    date: Date | null;
    badge: string;
  };

  const recentItems: RecentItem[] = [
    ...grimoire.slice(0, 1).map((e) => ({
      type: 'grimoire',
      title: e.title,
      href: '/grimoire',
      date: e.updatedAt,
      badge: e.type,
    })),
    ...tarot.slice(0, 1).map((e) => ({
      type: 'tarot',
      title: e.spreadName,
      href: '/tarot',
      date: e.createdAt,
      badge: e.spreadType,
    })),
    ...rituals.slice(0, 1).map((e) => ({
      type: 'ritual',
      title: e.ritualName,
      href: '/moon-ritual',
      date: e.createdAt,
      badge: e.moonPhase,
    })),
    ...timeline.slice(0, 1).map((e) => ({
      type: 'timeline',
      title: e.title,
      href: '/timeline',
      date: e.updatedAt,
      badge: e.type,
    })),
  ]
    .filter((i) => i.date !== null)
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 3);

  return res.json({
    counts: {
      grimoire: grimoireCount,
      tarot: tarotCount,
      rituals: ritualCount,
      timeline: timelineCount,
      connections: connectionCount,
    },
    recent: {
      grimoire,
      tarot,
      rituals,
      timeline,
      connections,
    },
    favorites,
    continueItems: recentItems,
  });
}
