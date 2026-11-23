/**
 * block-check.ts
 * Shared helper to check if a block exists between two users.
 * Used by profile, presence, messaging, feed, and search endpoints.
 */
import { db } from '@/server/db/client.js';
import { communityBlocks } from '@/server/db/schema.js';
import { or, and, eq } from 'drizzle-orm';

/**
 * Returns true if either user has blocked the other.
 * Mutual: A blocks B OR B blocks A → both are blocked from each other.
 */
export async function isBlocked(userA: string, userB: string): Promise<boolean> {
  if (!db) return false;
  const [row] = await db
    .select({ id: communityBlocks.id })
    .from(communityBlocks)
    .where(
      or(
        and(eq(communityBlocks.blockerId, userA), eq(communityBlocks.blockedId, userB)),
        and(eq(communityBlocks.blockerId, userB), eq(communityBlocks.blockedId, userA)),
      ),
    )
    .limit(1);
  return !!row;
}

/**
 * Returns the set of user IDs that the given user has blocked OR been blocked by.
 * Used for feed/search filtering.
 */
export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  if (!db) return new Set();
  const rows = await db
    .select({ blockerId: communityBlocks.blockerId, blockedId: communityBlocks.blockedId })
    .from(communityBlocks)
    .where(
      or(
        eq(communityBlocks.blockerId, userId),
        eq(communityBlocks.blockedId, userId),
      ),
    );
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.blockerId === userId) ids.add(row.blockedId);
    else ids.add(row.blockerId);
  }
  return ids;
}
