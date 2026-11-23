/**
 * POST /api/community/reports
 * Submit a report for a post, reply, or profile.
 * Returns 409 if the same user already reported the same target (pending).
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityReports } from '@/server/db/schema.js';
import { and, eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

const VALID_TYPES = ['post', 'reply', 'profile'] as const;
const VALID_REASONS = ['harassment', 'hate_speech', 'spam', 'misinformation', 'inappropriate', 'other'] as const;

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { targetType, targetId, reason, details } = req.body as {
    targetType?: string; targetId?: number | string; reason?: string; details?: string;
  };

  if (!targetType || targetId === undefined || !reason) {
    return res.status(400).json({ error: 'targetType, targetId, reason required' });
  }
  if (!VALID_TYPES.includes(targetType as typeof VALID_TYPES[number])) {
    return res.status(400).json({ error: 'Invalid targetType' });
  }
  if (!VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
    return res.status(400).json({ error: 'Invalid reason' });
  }

  // Profile reports use a string userId; post/reply use a numeric id
  const isProfile = targetType === 'profile';
  const targetStringId = isProfile ? String(targetId) : null;
  const targetIdNum = isProfile ? 0 : (typeof targetId === 'string' ? parseInt(targetId) : targetId);
  if (!isProfile && isNaN(targetIdNum as number)) return res.status(400).json({ error: 'Invalid targetId' });

  // Dedup: one pending report per user per target
  const dedup = isProfile
    ? and(
        eq(communityReports.reporterId, session.user.id),
        eq(communityReports.targetType, targetType),
        eq(communityReports.targetStringId, targetStringId!),
        eq(communityReports.status, 'pending'),
      )
    : and(
        eq(communityReports.reporterId, session.user.id),
        eq(communityReports.targetType, targetType),
        eq(communityReports.targetId, targetIdNum as number),
        eq(communityReports.status, 'pending'),
      );

  const [existing] = await db.select({ id: communityReports.id })
    .from(communityReports)
    .where(dedup)
    .limit(1);

  if (existing) return res.status(409).json({ error: 'Already reported' });

  await db.insert(communityReports).values({
    reporterId: session.user.id,
    targetType,
    targetId: targetIdNum as number,
    targetStringId,
    reason: reason.slice(0, 100),
    details: details?.slice(0, 500) ?? null,
  });

  res.status(201).json({ ok: true });
}
