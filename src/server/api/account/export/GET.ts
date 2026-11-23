/**
 * GET /api/account/export
 * Returns a JSON export of the authenticated user's personal data.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import {
  user, communityPosts, communityReplies, covenConnections,
  communityBlocks,
} from '@/server/db/schema.js';
import { eq, or } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const userId = session.user.id;

  const [profile] = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    bio: user.bio,
    location: user.location,
    witchPath: user.witchPath,
    pronouns: user.pronouns,
    interestTags: user.interestTags,
    profileVisibility: user.profileVisibility,
    messagePermission: user.messagePermission,
    invitePermission: user.invitePermission,
    createdAt: user.createdAt,
  }).from(user).where(eq(user.id, userId)).limit(1);

  const [posts, replies, connections, blocks] = await Promise.all([
    db.select({
      id: communityPosts.id,
      title: communityPosts.title,
      body: communityPosts.body,
      audience: communityPosts.audience,
      createdAt: communityPosts.createdAt,
      editedAt: communityPosts.editedAt,
    }).from(communityPosts).where(eq(communityPosts.userId, userId)),

    db.select({
      id: communityReplies.id,
      postId: communityReplies.postId,
      body: communityReplies.body,
      createdAt: communityReplies.createdAt,
    }).from(communityReplies).where(eq(communityReplies.userId, userId)),

    db.select({
      id: covenConnections.id,
      status: covenConnections.status,
      createdAt: covenConnections.createdAt,
    }).from(covenConnections).where(
      or(eq(covenConnections.requesterId, userId), eq(covenConnections.receiverId, userId))
    ),

    db.select({
      id: communityBlocks.id,
      createdAt: communityBlocks.createdAt,
    }).from(communityBlocks).where(eq(communityBlocks.blockerId, userId)),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile,
    posts,
    replies,
    covenConnections: connections,
    blockedCount: blocks.length,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="spellful-data-export.json"');
  res.json(exportData);
}
