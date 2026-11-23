/**
 * Automated welcome message system.
 *
 * Sends a personalized welcome DM from the Spellful Team account to every
 * new user immediately after registration. Idempotent — safe to call multiple
 * times; only sends once per user (guarded by the welcome_sent column).
 *
 * System messages bypass E2E encryption: they are stored as plaintext in the
 * system_message column. The client renders them directly without decryption.
 * These messages are NOT end-to-end encrypted and are transparently identified
 * as system-generated in the UI.
 *
 * Telemetry: structured JSON logs for attempt, sent, failed, duplicate events.
 */
import { db } from '../db/client.js';
import { user, conversations, messages } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

// Fixed ID for the Spellful Team virtual account — never changes.
export const SPELLFUL_TEAM_ID = 'spellful-team-system-001';

// Welcome hero image — white Spellful logo on cosmic starfield
// Alt text: 'Spellful white logo against a mystical moonlit starfield'
// Official white logo on cosmic background — registered via BrandLogo system
export const WELCOME_HERO_IMAGE_URL = '/airo-assets/images/logo/official-white';
export const SPELLFUL_TEAM_NAME = 'Spellful Team';
export const SPELLFUL_TEAM_EMAIL = 'team@spellful.com';

/** Ensure the Spellful Team virtual user exists in the database. */
async function ensureTeamUser(): Promise<void> {
  if (!db) return;
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, SPELLFUL_TEAM_ID))
    .limit(1);

  if (!existing) {
    await db.insert(user).values({
      id: SPELLFUL_TEAM_ID,
      name: SPELLFUL_TEAM_NAME,
      email: SPELLFUL_TEAM_EMAIL,
      emailVerified: true,
      isAdmin: false,
      profileVisibility: 'public',
    });
  }
}

type AccountType = 'community_member' | 'creator' | 'organization' | string;

/** Build the personalised welcome message body based on account type. */
function buildWelcomeText(firstName: string, accountType: AccountType): string {
  const name = firstName.trim() || 'there';

  if (accountType === 'creator') {
    return `🌙✨ Welcome to Spellful, ${name}! ✨🔮

You've joined as a Creator — a space to share your craft, build your audience, and connect with a community that values authentic magical practice.

Here's what's waiting for you:

🎨 **Complete your Creator profile** — Add your bio, specialties, and links so the community can discover your work.

📋 **Check your application status** — Visit your Profile Studio to see the current status of your creator verification.

🌿 **Explore the community** — Join discussions, share insights, and connect with members who share your interests.

✨ **Share your work** — Once verified, your public portfolio will be visible to the entire Spellful community.

Have questions? Visit our Help Center at spellful.com/help or reach out through the contact form.

With love, light & a little magic,
🌙 The Spellful Team 💜`;
  }

  if (accountType === 'organization') {
    return `🌙✨ Welcome to Spellful, ${name}! ✨🔮

Your organization has joined Spellful — a place to introduce your mission, connect with practitioners, and build a meaningful presence in the magical community.

Here's how to get started:

🏛️ **Set up your organization profile** — Add your mission, description, and contact information so members can find and connect with you.

📋 **Review verification next steps** — Visit your Profile Studio to check your organization's verification status and next steps.

🌿 **Connect with the community** — Participate in discussions, share resources, and engage with members who align with your mission.

👥 **Team access** — Multi-member team roles are coming soon. For now, your account holder manages the organization profile.

Have questions? Visit our Help Center at spellful.com/help or reach out through the contact form.

With love, light & a little magic,
🌙 The Spellful Team 💜`;
  }

  // Default: community_member
  return `🌙✨ Welcome to Spellful, ${name}! ✨🔮

You've entered a space where astrology, self-discovery, cosmic connections, and a little everyday magic come together.

Here's some of the magic waiting for you:

🔮 **Daily Horoscopes** — Discover what the stars have in store for your zodiac sign with fresh daily insights.

🌙 **Moon Rituals** — Follow the lunar cycle with guided rituals, intentions, and practices.

📖 **Your Grimoire** — Save spells, herbs, crystals, and tarot readings to your personal Book of Shadows.

🌿 **Discover Your People** — Find members who share your interests, join the Coven, and build meaningful connections.

✨ **Complete your profile** — Add your interests, practice labels, and magical identity to help others find you.

Have questions? Visit our Help Center at spellful.com/help or reach out through the contact form.

With love, light & a little magic,
🌙 The Spellful Team 💜`;
}

/**
 * Send the automated welcome message to a newly registered user.
 * No-ops silently if the DB is unavailable or the message was already sent.
 * Uses an atomic INSERT ... ON DUPLICATE KEY approach to prevent duplicates
 * under concurrent requests.
 */
export async function sendWelcomeMessage(
  userId: string,
  userName: string | null,
  accountType: AccountType = 'community_member',
): Promise<void> {
  if (!db) return;

  const logBase = { userId, accountType };

  try {
    console.log(JSON.stringify({ event: 'welcome_message.attempt', ...logBase }));

    // Atomic idempotency: try to mark welcome_sent = TRUE only if it's currently FALSE.
    // If another concurrent request already set it, this UPDATE affects 0 rows → skip.
    const updateResult = await db.execute(
      sql`UPDATE user SET welcome_sent = TRUE WHERE id = ${userId} AND (welcome_sent IS NULL OR welcome_sent = FALSE)`,
    );
    const affectedRows = (updateResult as unknown as [{ affectedRows: number }])[0].affectedRows;

    if (affectedRows === 0) {
      // Already sent (or user doesn't exist)
      console.log(JSON.stringify({ event: 'welcome_message.duplicate_suppressed', ...logBase }));
      return;
    }

    await ensureTeamUser();

    // Canonical participant order (smaller id first)
    const [p1, p2] =
      SPELLFUL_TEAM_ID < userId
        ? [SPELLFUL_TEAM_ID, userId]
        : [userId, SPELLFUL_TEAM_ID];

    // Find or create conversation
    const existing = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.participant1Id, p1),
          eq(conversations.participant2Id, p2),
        ),
      )
      .limit(1);

    let convId: number;
    if (existing.length) {
      convId = existing[0].id;
    } else {
      const result = await db
        .insert(conversations)
        .values({ participant1Id: p1, participant2Id: p2 });
      convId = (result as unknown as [{ insertId: number }])[0].insertId;
    }

    // Insert the system message (plaintext — no E2E encryption for system messages)
    const firstName = (userName ?? '').split(' ')[0] ?? '';
    const body = buildWelcomeText(firstName, accountType);

    await db.insert(messages).values({
      conversationId: convId,
      senderId: SPELLFUL_TEAM_ID,
      ciphertext: '',          // empty — system messages are not encrypted
      iv: '',                  // empty — system messages are not encrypted
      status: 'sent',
      systemMessage: body,
    });

    // Bump conversation timestamp
    await db.execute(
      sql`UPDATE conversations SET updated_at = NOW() WHERE id = ${convId}`,
    );

    console.log(JSON.stringify({ event: 'welcome_message.sent', ...logBase, convId }));
  } catch (err) {
    // Non-fatal — log and continue; never block registration
    console.error(
      JSON.stringify({
        event: 'welcome_message.error',
        ...logBase,
        msg: err instanceof Error ? err.message.slice(0, 200) : String(err),
      }),
    );
  }
}
