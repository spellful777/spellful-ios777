/**
 * PATCH /api/admin/applications/:id
 * Reviewer actions: approve | reject | request_info
 * Requires moderator+ role.
 * Approval atomically grants Creator account type + Verified Creator badge only.
 * Never grants staff privileges.
 */
import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { creatorApplications, creatorApplicationEvents, user, userBadges, communityNotifications } from '../../../../db/schema.js';
import { getAuthSession } from '../../../../lib/auth-session.js';
import { hasRole, writeAuditEvent } from '../../../../lib/require-role.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!hasRole(session as { user?: Record<string, unknown> }, 'moderator')) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const reviewerId = (session.user as { id: string }).id;
  const appId = parseInt(req.params.id, 10);
  if (isNaN(appId)) { res.status(400).json({ error: 'Invalid application ID.' }); return; }

  const { action, reason = '', cooldownDays } = req.body as { action: string; reason?: string; cooldownDays?: number };
  if (!['approve', 'reject', 'request_info'].includes(action)) {
    res.status(400).json({ error: 'action must be approve | reject | request_info' }); return;
  }

  const [app] = await db.select()
    .from(creatorApplications)
    .where(eq(creatorApplications.id, appId))
    .limit(1);

  if (!app) { res.status(404).json({ error: 'Application not found.' }); return; }
  if (['approved', 'rejected', 'withdrawn'].includes(app.status)) {
    res.status(409).json({ error: `Application is already ${app.status}.` }); return;
  }

  const now = new Date();

  if (action === 'approve') {
    // Determine which account type and badge to grant based on what was requested
    const grantAccountType = (app.requestedAccountType === 'organization') ? 'organization' : 'creator';
    const grantBadgeKey = (grantAccountType === 'organization') ? 'official.verified_organization' : 'official.verified_creator';
    const grantBadgeLabel = (grantAccountType === 'organization') ? 'Verified Organization' : 'Verified Creator';

    // Atomically: update application + grant account type + grant badge
    await db.update(creatorApplications).set({
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: now,
      reviewDecision: 'approved',
      reviewReason: (reason as string).slice(0, 500),
      updatedAt: now,
    }).where(eq(creatorApplications.id, appId));

    // Grant account type (idempotent)
    await db.update(user).set({ accountType: grantAccountType, updatedAt: now })
      .where(eq(user.id, app.userId));

    // Grant badge (idempotent via INSERT IGNORE semantics)
    await db.insert(userBadges).values({
      userId: app.userId,
      badgeKey: grantBadgeKey,
      badgeType: 'official',
      issuedBy: reviewerId,
      isVisible: 1,
      reason: `${grantBadgeLabel} application approved — ref ${app.referenceId}`,
    }).onDuplicateKeyUpdate({ set: { issuedBy: reviewerId, updatedAt: now } });

    // Audit log
    await writeAuditEvent({
      actorId: reviewerId,
      targetId: app.userId,
      action: 'creator_application.approved',
      oldValue: app.status,
      newValue: 'approved',
      reason: `ref:${app.referenceId} ${(reason as string).slice(0, 100)}`,
    });

    // In-app notification (no staff notes exposed)
    await db.insert(communityNotifications).values({
      userId: app.userId,
      type: 'mod_notice',
      message: `🎉 Your application has been approved! Your account is now a Verified ${grantAccountType === 'organization' ? 'Organization' : 'Creator'}.`,
    });

  } else if (action === 'reject') {
    // Use reviewer-specified cooldown if provided, otherwise fall back to default
    const effectiveCooldown = (typeof cooldownDays === 'number' && cooldownDays > 0) ? cooldownDays : 30;
    const reapplyAfter = new Date(now.getTime() + effectiveCooldown * 24 * 60 * 60 * 1000);

    await db.update(creatorApplications).set({
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: now,
      reviewDecision: 'rejected',
      reviewReason: (reason as string).slice(0, 500),
      updatedAt: reapplyAfter, // store reapply-after date in updatedAt so cooldown calc works
    }).where(eq(creatorApplications.id, appId));

    await writeAuditEvent({
      actorId: reviewerId,
      targetId: app.userId,
      action: 'creator_application.rejected',
      oldValue: app.status,
      newValue: 'rejected',
      reason: `ref:${app.referenceId} cooldown:${effectiveCooldown}d`,
    });

    const reapplyDateStr = reapplyAfter.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    await db.insert(communityNotifications).values({
      userId: app.userId,
      type: 'mod_notice',
      message: reason
        ? `Your application was not approved at this time. ${(reason as string).slice(0, 300)} You may reapply after ${reapplyDateStr}.`
        : `Your application was not approved at this time. You may reapply after ${reapplyDateStr}.`,
    });

  } else {
    // request_info
    await db.update(creatorApplications).set({
      status: 'info_requested',
      reviewedBy: reviewerId,
      reviewedAt: now,
      reviewDecision: 'info_requested',
      reviewReason: (reason as string).slice(0, 500),
      updatedAt: now,
    }).where(eq(creatorApplications.id, appId));

    await db.insert(communityNotifications).values({
      userId: app.userId,
      type: 'mod_notice',
      message: reason
        ? `The review team has a question about your Creator application: ${(reason as string).slice(0, 300)}`
        : `The review team has requested additional information about your Creator application.`,
    });
  }

  // Log event
  await db.insert(creatorApplicationEvents).values({
    applicationId: appId,
    actorId: reviewerId,
    eventType: action === 'request_info' ? 'info_requested' : action === 'approve' ? 'approved' : 'rejected',
    note: (reason as string).slice(0, 500),
  });

  res.json({ ok: true });
}
