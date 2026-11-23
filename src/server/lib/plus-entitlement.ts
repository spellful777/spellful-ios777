/**
 * Spellful Plus — server-side entitlement service.
 *
 * NEVER trust a client-supplied flag. All entitlement checks go through this
 * module, which reads only from the database.
 *
 * Status lifecycle:
 *   pending → active → grace_period → expired
 *                    ↘ cancelled
 *                    ↘ refunded
 */
import { db } from '@/server/db/client.js';
import { plusSubscriptions, plusSettings, user as userTable } from '@/server/db/schema.js';
import { eq, and, or, gt, isNull } from 'drizzle-orm';

// Platform roles that receive full Plus access without a subscription
const ADMIN_ROLES = new Set(['owner', 'admin', 'moderator']);

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EntitlementResult {
  isPlus: boolean;
  isGracePeriod: boolean;
  status: string | null;
  expiresAt: Date | null;
  gracePeriodUntil: Date | null;
  environment: string | null;
}

export interface PlusSettingsResult {
  showSupporterBadge: boolean;
  activeTheme: string;
  activeLayout: string;
  practiceWidgetOrder: string[] | null;
}

// ── Entitlement check ──────────────────────────────────────────────────────────

/**
 * Returns whether a user currently has an active Spellful Plus entitlement.
 * Checks the database — never trusts a client flag.
 *
 * "Active" means:
 *   - status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
 *   - OR status = 'grace_period' AND grace_period_until > NOW()
 */
export async function getEntitlement(userId: string): Promise<EntitlementResult> {
  // Admins, moderators, and the owner always have full Plus access
  const userRows = await db
    .select({ platformRole: userTable.platformRole })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  const platformRole = userRows[0]?.platformRole ?? 'member';
  if (ADMIN_ROLES.has(platformRole)) {
    return {
      isPlus: true,
      isGracePeriod: false,
      status: 'admin_bypass',
      expiresAt: null,
      gracePeriodUntil: null,
      environment: 'production',
    };
  }

  const now = new Date();

  const rows = await db
    .select()
    .from(plusSubscriptions)
    .where(
      and(
        eq(plusSubscriptions.userId, userId),
        or(
          and(
            eq(plusSubscriptions.status, 'active'),
            or(isNull(plusSubscriptions.expiresAt), gt(plusSubscriptions.expiresAt, now)),
          ),
          and(
            eq(plusSubscriptions.status, 'grace_period'),
            gt(plusSubscriptions.gracePeriodUntil, now),
          ),
        ),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    // No active row — check if there's any row at all for status reporting
    const anyRows = await db
      .select({
        status: plusSubscriptions.status,
        expiresAt: plusSubscriptions.expiresAt,
        gracePeriodUntil: plusSubscriptions.gracePeriodUntil,
        environment: plusSubscriptions.environment,
      })
      .from(plusSubscriptions)
      .where(eq(plusSubscriptions.userId, userId))
      .orderBy(plusSubscriptions.updatedAt)
      .limit(1);

    const latest = anyRows[0] ?? null;
    return {
      isPlus: false,
      isGracePeriod: false,
      status: latest?.status ?? null,
      expiresAt: latest?.expiresAt ?? null,
      gracePeriodUntil: latest?.gracePeriodUntil ?? null,
      environment: latest?.environment ?? null,
    };
  }

  const row = rows[0];
  const isGracePeriod = row.status === 'grace_period';

  return {
    isPlus: true,
    isGracePeriod,
    status: row.status,
    expiresAt: row.expiresAt,
    gracePeriodUntil: row.gracePeriodUntil,
    environment: row.environment,
  };
}

// ── Plus settings ──────────────────────────────────────────────────────────────

export async function getPlusSettings(userId: string): Promise<PlusSettingsResult> {
  const rows = await db
    .select()
    .from(plusSettings)
    .where(eq(plusSettings.userId, userId))
    .limit(1);

  if (rows.length === 0) {
    return { showSupporterBadge: false, activeTheme: '', activeLayout: '', practiceWidgetOrder: null };
  }

  const row = rows[0];
  return {
    showSupporterBadge: row.showSupporterBadge,
    activeTheme: row.activeTheme,
    activeLayout: row.activeLayout,
    practiceWidgetOrder: row.practiceWidgetOrder ?? null,
  };
}

export async function upsertPlusSettings(
  userId: string,
  patch: Partial<PlusSettingsResult>,
): Promise<void> {
  // Verify entitlement before allowing badge opt-in — prevents client forgery
  if (patch.showSupporterBadge === true) {
    const ent = await getEntitlement(userId);
    if (!ent.isPlus) {
      throw new Error('PLUS_REQUIRED');
    }
  }

  await db
    .insert(plusSettings)
    .values({
      userId,
      showSupporterBadge: patch.showSupporterBadge ?? false,
      activeTheme: patch.activeTheme ?? '',
      activeLayout: patch.activeLayout ?? '',
      practiceWidgetOrder: patch.practiceWidgetOrder ?? null,
    })
    .onDuplicateKeyUpdate({
      set: {
        ...(patch.showSupporterBadge !== undefined && { showSupporterBadge: patch.showSupporterBadge }),
        ...(patch.activeTheme !== undefined && { activeTheme: patch.activeTheme }),
        ...(patch.activeLayout !== undefined && { activeLayout: patch.activeLayout }),
        ...(patch.practiceWidgetOrder !== undefined && { practiceWidgetOrder: patch.practiceWidgetOrder }),
      },
    });
}

// ── Supporter badge — public display check ─────────────────────────────────────

/**
 * Returns true only when:
 *   1. The user has an active Plus entitlement (server-verified)
 *   2. The user has explicitly opted in to showing the badge
 *
 * This is the ONLY function that should be used to decide whether to render
 * the supporter badge in community posts, profiles, etc.
 */
export async function shouldShowSupporterBadge(userId: string): Promise<boolean> {
  const [ent, settings] = await Promise.all([
    getEntitlement(userId),
    getPlusSettings(userId),
  ]);
  return ent.isPlus && settings.showSupporterBadge;
}

// ── Upsert subscription record ─────────────────────────────────────────────────

export interface UpsertSubscriptionInput {
  userId: string;
  appleOriginalTransactionId: string;
  appleProductId: string;
  status: string;
  environment: string;
  expiresAt: Date | null;
  gracePeriodUntil: Date | null;
  cancelledAt: Date | null;
  rawNotificationPayload?: string;
}

export async function upsertSubscription(input: UpsertSubscriptionInput): Promise<void> {
  const now = new Date();
  await db
    .insert(plusSubscriptions)
    .values({
      userId: input.userId,
      appleOriginalTransactionId: input.appleOriginalTransactionId,
      appleProductId: input.appleProductId,
      status: input.status,
      environment: input.environment,
      expiresAt: input.expiresAt,
      gracePeriodUntil: input.gracePeriodUntil,
      cancelledAt: input.cancelledAt,
      lastVerifiedAt: now,
      rawNotificationPayload: input.rawNotificationPayload
        ? input.rawNotificationPayload.slice(0, 4000)
        : null,
    })
    .onDuplicateKeyUpdate({
      set: {
        userId: input.userId,
        status: input.status,
        expiresAt: input.expiresAt,
        gracePeriodUntil: input.gracePeriodUntil,
        cancelledAt: input.cancelledAt,
        lastVerifiedAt: now,
        rawNotificationPayload: input.rawNotificationPayload
          ? input.rawNotificationPayload.slice(0, 4000)
          : null,
      },
    });
}
