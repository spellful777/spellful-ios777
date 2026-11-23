import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { validateUsernameFormat, normalizeUsername, usernameErrorMessage } from '@/server/lib/username-rules.js';

const VALID_ACCENTS = ['', 'gold', 'lavender', 'rose', 'sage', 'sky', 'ember', 'violet', 'moon'];
const VALID_THEMES = ['', 'celestial', 'forest', 'lunar', 'gothic', 'cottage', 'crystal'];
const VALID_LAYOUTS = ['compact', 'classic', 'immersive'];
const VALID_FRAMES = ['', 'moon', 'celestial', 'botanical', 'crystal', 'ornate'];
const VALID_PRESETS = ['', 'default-hat-black', 'default-hat-blue', 'default-hat-green', 'default-hat-lesbian', 'default-hat-orange', 'default-hat-purple', 'default-hat-rainbow', 'default-hat-red', 'default-hat-trans'];

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    const session = await getAuthSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const body = req.body as {
      name?: string;
      username?: string;
      bio?: string;
      location?: string;
      witchPath?: string;
      profileVisibility?: string;
      messagePermission?: string;
      invitePermission?: string;
      notificationPreferences?: Record<string, boolean>;
      sunSign?: string;
      moonSign?: string;
      risingSign?: string;
      coverImage?: string | null;
      coverPreset?: string;
      accentColor?: string;
      pronouns?: string;
      interestTags?: string[];
      socialLinks?: Record<string, string>;
      // Profile 3.0
      avatarPreset?: string;
      profileTheme?: string;
      avatarFrame?: string;
      practiceLabels?: string[];
      profileStatus?: string;
      profileSections?: { id: string; enabled: boolean; order: number }[];
      hideOnlineStatus?: boolean;
      // Profile 4.0
      profileLayout?: string;
      // Profile 5.0 — field-level visibility
      bioVisibility?: string;
      locationVisibility?: string;
      zodiacVisibility?: string;
      socialLinksVisibility?: string;
    };

    const {
      name, username, bio, location, witchPath, profileVisibility,
      messagePermission, invitePermission, notificationPreferences,
      sunSign, moonSign, risingSign,
      coverImage, coverPreset, accentColor, pronouns,
      interestTags, socialLinks,
      avatarPreset, profileTheme, avatarFrame, practiceLabels, profileStatus, profileSections,
      hideOnlineStatus, profileLayout,
      bioVisibility, locationVisibility, zodiacVisibility, socialLinksVisibility,
    } = body;

    const VALID_MSG_PERMS = ['everyone', 'coven', 'nobody'];
    const VALID_INVITE_PERMS = ['everyone', 'nobody'];
    if (messagePermission && !VALID_MSG_PERMS.includes(messagePermission))
      return res.status(400).json({ error: 'Invalid messagePermission' });
    if (invitePermission && !VALID_INVITE_PERMS.includes(invitePermission))
      return res.status(400).json({ error: 'Invalid invitePermission' });

    // Validate username format + uniqueness if changing
    if (username !== undefined) {
      const fmtErr = validateUsernameFormat(username);
      if (fmtErr) return res.status(400).json({ error: usernameErrorMessage(fmtErr), code: fmtErr });
      const normalized = normalizeUsername(username);
      const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.usernameNormalized, normalized)).limit(1);
      if (existing && existing.id !== session.user.id)
        return res.status(409).json({ error: usernameErrorMessage('taken'), code: 'taken' });
    }

    if (profileTheme !== undefined && !VALID_THEMES.includes(profileTheme))
      return res.status(400).json({ error: 'Invalid profile theme' });
    if (avatarFrame !== undefined && !VALID_FRAMES.includes(avatarFrame))
      return res.status(400).json({ error: 'Invalid avatar frame' });
    if (avatarPreset !== undefined && !VALID_PRESETS.includes(avatarPreset))
      return res.status(400).json({ error: 'Invalid avatar preset' });
    if (profileStatus !== undefined && profileStatus.length > 100)
      return res.status(400).json({ error: 'Status must be 100 characters or fewer' });
    if (profileLayout !== undefined && !VALID_LAYOUTS.includes(profileLayout))
      return res.status(400).json({ error: 'Invalid profile layout' });
    const VALID_VIS = ['public', 'coven', 'private'];
    if (bioVisibility !== undefined && !VALID_VIS.includes(bioVisibility))
      return res.status(400).json({ error: 'Invalid bioVisibility' });
    if (locationVisibility !== undefined && !VALID_VIS.includes(locationVisibility))
      return res.status(400).json({ error: 'Invalid locationVisibility' });
    if (zodiacVisibility !== undefined && !VALID_VIS.includes(zodiacVisibility))
      return res.status(400).json({ error: 'Invalid zodiacVisibility' });
    if (socialLinksVisibility !== undefined && !VALID_VIS.includes(socialLinksVisibility))
      return res.status(400).json({ error: 'Invalid socialLinksVisibility' });

    if (bio && bio.length > 160) return res.status(400).json({ error: 'Bio must be 160 characters or less' });
    if (pronouns && pronouns.length > 60) return res.status(400).json({ error: 'Pronouns must be 60 characters or less' });

    if (accentColor !== undefined && !VALID_ACCENTS.includes(accentColor))
      return res.status(400).json({ error: 'Invalid accent color' });

    // Sanitize social links — only allow http/https URLs
    const cleanSocial: Record<string, string> = {};
    if (socialLinks && typeof socialLinks === 'object') {
      for (const [k, v] of Object.entries(socialLinks)) {
        if (typeof v === 'string' && (v === '' || /^https?:\/\//.test(v))) {
          cleanSocial[k] = v.slice(0, 300);
        }
      }
    }

    await db.update(user).set({
      ...(name !== undefined ? { name: name.slice(0, 80) } : {}),
      ...(username !== undefined ? { username, usernameNormalized: normalizeUsername(username) } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(witchPath !== undefined ? { witchPath } : {}),
      ...(profileVisibility ? { profileVisibility } : {}),
      ...(messagePermission ? { messagePermission } : {}),
      ...(invitePermission ? { invitePermission } : {}),
      ...(notificationPreferences !== undefined ? { notificationPreferences } : {}),
      ...(sunSign !== undefined ? { sunSign } : {}),
      ...(moonSign !== undefined ? { moonSign } : {}),
      ...(risingSign !== undefined ? { risingSign } : {}),
      ...(coverImage !== undefined ? { coverImage } : {}),
      ...(coverPreset !== undefined ? { coverPreset } : {}),
      ...(accentColor !== undefined ? { accentColor } : {}),
      ...(pronouns !== undefined ? { pronouns } : {}),
      ...(interestTags !== undefined ? { interestTags } : {}),
      ...(socialLinks !== undefined ? { socialLinks: cleanSocial } : {}),
      ...(profileTheme !== undefined ? { profileTheme } : {}),
      ...(avatarPreset !== undefined ? { avatarPreset } : {}),
      ...(avatarFrame !== undefined ? { avatarFrame } : {}),
      ...(practiceLabels !== undefined ? { practiceLabels } : {}),
      ...(profileStatus !== undefined ? { profileStatus } : {}),
      ...(profileSections !== undefined ? { profileSections } : {}),
      ...(hideOnlineStatus !== undefined ? { hideOnlineStatus } : {}),
      ...(profileLayout !== undefined ? { profileLayout } : {}),
      ...(bioVisibility !== undefined ? { bioVisibility } : {}),
      ...(locationVisibility !== undefined ? { locationVisibility } : {}),
      ...(zodiacVisibility !== undefined ? { zodiacVisibility } : {}),
      ...(socialLinksVisibility !== undefined ? { socialLinksVisibility } : {}),
    }).where(eq(user.id, session.user.id));

    res.json({ ok: true });
  } catch (err) {
    console.error('[profile/PATCH] DB error:', err);
    console.error(JSON.stringify({ event: 'profile.patch.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
