/**
 * GET /api/community/discover
 * Returns discoverable public members, optionally filtered by interest tags,
 * username search, and account type. All filtering is DB-side for accurate pagination.
 *
 * Query:
 *   ?tags=tarot,crystals   — filter by interest tags (DB-side LIKE)
 *   &q=username            — search by username or name
 *   &type=member|creator|organization — filter by account type
 *   &limit=20&offset=0     — pagination
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user, covenConnections } from '@/server/db/schema.js';
import { eq, or, and, ne, sql } from 'drizzle-orm';

function normalizeInstagram(handle: string): string | null {
  if (!handle) return null;
  const match = handle.match(/(?:instagram\.com\/)?@?([A-Za-z0-9_.]{1,30})\/?$/);
  if (!match) return null;
  return 'https://www.instagram.com/' + match[1] + '/';
}
import { getAuthSession } from '@/server/lib/auth-session.js';
import { getBlockedUserIds } from '@/server/lib/block-check.js';
import { SPELLFUL_TEAM_ID } from '@/server/lib/welcome-message.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  const viewerId = session?.user?.id ?? null;

  const tagsParam = (req.query.tags as string) || '';
  const rawQ = ((req.query.q as string) || '').trim().toLowerCase().slice(0, 50);
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = parseInt(req.query.offset as string) || 0;
  const typeFilter = (req.query.type as string) || ''; // 'member' | 'creator' | 'organization' | ''

  const filterTags = tagsParam ? tagsParam.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

  const blockedIds: Set<string> = viewerId ? await getBlockedUserIds(viewerId) : new Set();

  // Build DB-side where clause
  const conditions = [
    eq(user.profileVisibility, 'public'),
    // Exclude system account
    ne(user.id, SPELLFUL_TEAM_ID),
  ];

  if (viewerId) {
    conditions.push(ne(user.id, viewerId));
  }

  if (rawQ) {
    const qLike = `%${rawQ}%`;
    conditions.push(sql`(LOWER(${user.username}) LIKE ${qLike} OR LOWER(${user.name}) LIKE ${qLike})`);
  }

  // Account type filter — DB-side
  if (typeFilter === 'creator') {
    conditions.push(eq(user.accountType, 'creator'));
  } else if (typeFilter === 'organization') {
    conditions.push(eq(user.accountType, 'organization'));
  } else if (typeFilter === 'member') {
    conditions.push(eq(user.accountType, 'community_member'));
  }

  // Tag filter — DB-side using JSON_CONTAINS or LIKE on the JSON column
  if (filterTags.length > 0) {
    const tagConditions = filterTags.map((tag) =>
      sql`JSON_CONTAINS(${user.interestTags}, ${JSON.stringify(tag)}, '$')`,
    );
    conditions.push(or(...tagConditions)!);
  }

  // Blocked users excluded DB-side when possible
  const blockedArr = [...blockedIds];
  if (blockedArr.length > 0) {
    conditions.push(sql`${user.id} NOT IN (${sql.join(blockedArr.map((id) => sql`${id}`), sql`, `)})`);
  }

  const whereClause = and(...conditions);

  // Count total for accurate hasMore
  const [countRow] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(user)
    .where(whereClause);
  const total = Number(countRow?.total ?? 0);

  const rows = await db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      bio: user.bio,
      interestTags: user.interestTags,
      witchPath: user.witchPath,
      accountType: user.accountType,
    })
    .from(user)
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  // Batch Coven connection status for all returned members
  const covenMap = new Map<string, { status: string; connectionId: number }>();
  if (viewerId && rows.length > 0) {
    const memberIds = rows.map((r) => r.id);
    const idList = sql.join(memberIds.map((id) => sql`${id}`), sql`, `);
    const connections = await db
      .select({
        id: covenConnections.id,
        requesterId: covenConnections.requesterId,
        receiverId: covenConnections.receiverId,
        status: covenConnections.status,
      })
      .from(covenConnections)
      .where(
        and(
          or(eq(covenConnections.requesterId, viewerId), eq(covenConnections.receiverId, viewerId)),
          sql`(${covenConnections.requesterId} IN (${idList}) OR ${covenConnections.receiverId} IN (${idList}))`,
        ),
      );
    for (const c of connections) {
      const otherId = c.requesterId === viewerId ? c.receiverId : c.requesterId;
      const statusLabel = c.status === 'accepted'
        ? 'accepted'
        : c.requesterId === viewerId
          ? 'pending_sent'
          : 'pending_received';
      covenMap.set(otherId, { status: statusLabel, connectionId: c.id });
    }
  }

  // Batch follow status
  const followMap = new Map<string, boolean>();
  if (viewerId && rows.length > 0) {
    const memberIds = rows.map((r) => r.id);
    try {
      const followRows = await db.execute(sql`
        SELECT following_id FROM user_follows
        WHERE follower_id = ${viewerId}
          AND following_id IN (${sql.join(memberIds.map((id) => sql`${id}`), sql`, `)})
      `) as unknown as [Array<{ following_id: string }>, unknown];
      for (const row of followRows[0] as Array<{ following_id: string }>) {
        followMap.set(row.following_id, true);
      }
    } catch {
      // user_follows table may not exist yet — ignore
    }
  }

  // Batch instagram — columns may not exist yet; degrade gracefully
  const igMap = new Map<string, string | null>();
  if (rows.length > 0) {
    try {
      const memberIds = rows.map((r) => r.id);
      const igRows = await db.execute(sql`
        SELECT id, instagram_handle, show_instagram_public
        FROM user
        WHERE id IN (${sql.join(memberIds.map((id) => sql`${id}`), sql`, `)})
      `) as unknown as [Array<{ id: string; instagram_handle: string | null; show_instagram_public: number | null }>, unknown];
      for (const row of igRows[0]) {
        if (row.show_instagram_public) {
          igMap.set(row.id, normalizeInstagram(row.instagram_handle ?? ''));
        }
      }
    } catch {
      // instagram columns not yet migrated — skip
    }
  }

  const members = rows.map((r) => {
    const coven = covenMap.get(r.id) ?? null;
    const igUrl = igMap.get(r.id) ?? null;
    return {
      id: r.id,
      username: r.username,
      name: r.name,
      image: r.image,
      bio: r.bio ? r.bio.slice(0, 120) : null,
      interestTags: (r.interestTags as string[] | null) ?? [],
      witchPath: r.witchPath,
      accountType: r.accountType ?? 'community_member',
      covenStatus: coven?.status ?? null,
      covenConnectionId: coven?.connectionId ?? null,
      isFollowing: followMap.get(r.id) ?? false,
      publicInstagramUrl: igUrl,
    };
  });

  res.json({ members, hasMore: total > offset + limit, total });
}
