/**
 * POST /api/creator-applications
 * Submit a new Creator application.
 * - Requires authentication
 * - Blocks duplicate active applications (pending_review | info_requested)
 * - Saves to DB first, then fires email notification asynchronously
 */
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../../db/client.js';
import { creatorApplications, creatorApplicationEvents, user } from '../../db/schema.js';
import { getAuthSession } from '../../lib/auth-session.js';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { sendEmail } from '../../lib/send-email.js';

// Configurable reapplication cooldown after rejection (days)
const REJECTION_COOLDOWN_DAYS = 30;

// Allowed creator categories
const VALID_CATEGORIES = [
  'Tarot & Divination', 'Astrology', 'Herbalism & Botanicals', 'Crystal Work',
  'Spellcraft & Rituals', 'Moon Magic', 'Witchcraft Education', 'Art & Illustration',
  'Writing & Poetry', 'Music & Sound Healing', 'Jewelry & Crafts', 'Shop / Products',
  'Community & Events', 'Other',
];

const VALID_ACCOUNT_TYPES = ['creator', 'organization'] as const;
type RequestedAccountType = typeof VALID_ACCOUNT_TYPES[number];

function sanitize(s: string): string {
  return s.replace(/[<>"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)).trim();
}

function isValidUrl(s: string): boolean {
  if (!s) return true; // optional fields
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidHandle(s: string): boolean {
  if (!s) return true;
  return /^[@]?[\w.\-]{1,100}$/.test(s);
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const userId = session.user.id as string;

  // Block duplicate active applications
  const existing = await db.select({ id: creatorApplications.id, status: creatorApplications.status })
    .from(creatorApplications)
    .where(and(
      eq(creatorApplications.userId, userId),
      inArray(creatorApplications.status, ['pending_review', 'info_requested']),
    ))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: 'You already have an active application under review.' });
    return;
  }

  // Enforce cooldown after rejection
  const [lastRejected] = await db.select({ updatedAt: creatorApplications.updatedAt })
    .from(creatorApplications)
    .where(and(
      eq(creatorApplications.userId, userId),
      eq(creatorApplications.status, 'rejected'),
    ))
    .orderBy(desc(creatorApplications.updatedAt))
    .limit(1);

  if (lastRejected?.updatedAt) {
    const cooldownMs = REJECTION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(lastRejected.updatedAt).getTime();
    if (elapsed < cooldownMs) {
      const daysLeft = Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000));
      res.status(429).json({
        error: `You may reapply in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        cooldownDaysRemaining: daysLeft,
      });
      return;
    }
  }

  const {
    requestedAccountType = 'creator',
    creatorName, contactEmail, websiteUrl = '', instagramHandle = '', blueskyHandle = '',
    threadsHandle = '', xHandle = '', otherSocial = '', creatorCategory,
    workDescription, workSamples, reasonForApplying, additionalNotes = '',
    agreedToGuidelines,
  } = req.body as Record<string, string | boolean>;

  // Validate requestedAccountType
  if (!VALID_ACCOUNT_TYPES.includes(requestedAccountType as RequestedAccountType)) {
    res.status(400).json({ error: 'Invalid account type requested.' }); return;
  }

  // Validation
  if (!creatorName || typeof creatorName !== 'string' || creatorName.trim().length < 2) {
    res.status(400).json({ error: 'Creator/business name is required.' }); return;
  }
  if (!contactEmail || typeof contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    res.status(400).json({ error: 'A valid contact email is required.' }); return;
  }
  if (!VALID_CATEGORIES.includes(creatorCategory as string)) {
    res.status(400).json({ error: 'Please select a valid creator category.' }); return;
  }
  if (!workDescription || typeof workDescription !== 'string' || workDescription.trim().length < 20) {
    res.status(400).json({ error: 'Please describe your work (at least 20 characters).' }); return;
  }
  if (!workSamples || typeof workSamples !== 'string' || workSamples.trim().length < 5) {
    res.status(400).json({ error: 'Please provide at least one work sample or online presence.' }); return;
  }
  if (!reasonForApplying || typeof reasonForApplying !== 'string' || reasonForApplying.trim().length < 10) {
    res.status(400).json({ error: 'Please explain your reason for applying.' }); return;
  }
  if (!agreedToGuidelines) {
    res.status(400).json({ error: 'You must agree to the Creator guidelines and privacy notice.' }); return;
  }
  if (websiteUrl && !isValidUrl(websiteUrl as string)) {
    res.status(400).json({ error: 'Website URL must be a valid https:// or http:// URL.' }); return;
  }
  for (const handle of [instagramHandle, blueskyHandle, threadsHandle, xHandle]) {
    if (handle && !isValidHandle(handle as string)) {
      res.status(400).json({ error: 'Social handles must contain only letters, numbers, dots, hyphens, or underscores.' }); return;
    }
  }

  const referenceId = randomUUID();

  // Fetch username for the email
  const [applicant] = await db.select({ username: user.username, name: user.name })
    .from(user).where(eq(user.id, userId)).limit(1);

  // Save application — DB write is authoritative; email is best-effort
  const [result] = await db.insert(creatorApplications).values({
    referenceId,
    userId,
    status: 'pending_review',
    requestedAccountType: requestedAccountType as string,
    creatorName: sanitize(creatorName as string),
    contactEmail: (contactEmail as string).trim().toLowerCase(),
    websiteUrl: sanitize(websiteUrl as string),
    instagramHandle: sanitize(instagramHandle as string),
    blueskyHandle: sanitize(blueskyHandle as string),
    threadsHandle: sanitize(threadsHandle as string),
    xHandle: sanitize(xHandle as string),
    otherSocial: sanitize(otherSocial as string),
    creatorCategory: creatorCategory as string,
    workDescription: sanitize(workDescription as string),
    workSamples: sanitize(workSamples as string),
    reasonForApplying: sanitize(reasonForApplying as string),
    additionalNotes: sanitize(additionalNotes as string),
    agreedToGuidelines: 1,
  });

  const applicationId = (result as { insertId: number }).insertId;

  // Log submission event
  await db.insert(creatorApplicationEvents).values({
    applicationId,
    actorId: userId,
    eventType: 'submitted',
    note: '',
  });

  // Send review email (best-effort, non-blocking)
  const adminLink = `https://spellful.com/admin/applications`;
  const submittedAt = new Date().toUTCString();
  const emailText = [
    `New Creator Application — Reference: ${referenceId}`,
    ``,
    `Applicant: @${applicant?.username ?? userId} (${applicant?.name ?? ''})`,
    `Requested Account Type: ${requestedAccountType}`,
    `Creator/Business Name: ${sanitize(creatorName as string)}`,
    `Contact Email: ${(contactEmail as string).trim()}`,
    `Website/Portfolio: ${websiteUrl || '(not provided)'}`,
    `Instagram: ${instagramHandle || '—'}`,
    `Bluesky: ${blueskyHandle || '—'}`,
    `Threads: ${threadsHandle || '—'}`,
    `X: ${xHandle || '—'}`,
    `Other Social: ${otherSocial || '—'}`,
    `Category: ${creatorCategory}`,
    ``,
    `Description of Work:`,
    sanitize(workDescription as string),
    ``,
    `Work Samples / Online Presence:`,
    sanitize(workSamples as string),
    ``,
    `Reason for Applying:`,
    sanitize(reasonForApplying as string),
    ``,
    `Additional Notes: ${additionalNotes ? sanitize(additionalNotes as string) : '(none)'}`,
    ``,
    `Submitted: ${submittedAt}`,
    `Reference ID: ${referenceId}`,
    ``,
    `Review this application (requires staff login):`,
    adminLink,
  ].join('\n');

  // Fire-and-forget with retry flag on failure
  sendEmail({
    to: 'bw@spellful.com',
    subject: `Creator Application: ${sanitize(creatorName as string)} (@${applicant?.username ?? userId}) — ${referenceId.slice(0, 8)}`,
    text: emailText,
  }).then(async () => {
    await db.update(creatorApplications)
      .set({ notificationSent: 1, notificationSentAt: new Date() })
      .where(eq(creatorApplications.id, applicationId));
  }).catch(async () => {
    await db.update(creatorApplications)
      .set({ notificationRetries: 1 })
      .where(eq(creatorApplications.id, applicationId));
  });

  res.status(201).json({ ok: true, referenceId, applicationId });
}
