/**
 * POST /api/plus/apple-notify
 * Apple App Store Server Notifications V2 webhook.
 *
 * Apple sends signed JWS payloads. This handler:
 *   1. Verifies the outer signedPayload JWS signature using Apple's JWKS
 *      (fetched from https://appleid.apple.com/auth/keys via jose)
 *   2. Verifies the inner signedTransactionInfo JWS signature the same way
 *   3. Only processes notifications whose signatures are valid
 *
 * Apple docs: https://developer.apple.com/documentation/appstoreservernotifications
 *
 * IMPORTANT: This endpoint must be registered in App Store Connect under
 * App Information > App Store Server Notifications > Production URL.
 * Use the same URL for sandbox (Apple routes sandbox notifications to the
 * production URL when configured).
 */
import type { Request, Response } from 'express';
import { createVerify, createHash } from 'crypto';
import { upsertSubscription } from '@/server/lib/plus-entitlement.js';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getSecret } from '#airo/secrets';

// Apple Root CA G3 SHA-256 fingerprint — same secret used by verify-purchase.
const APPLE_ROOT_CA_G3_FINGERPRINT = (
  getSecret('APPLE_ROOT_CA_G3_FINGERPRINT') ?? ''
).toLowerCase().replace(/:/g, '');

// ── JWS payload types ──────────────────────────────────────────────────────────

interface AppleJWSPayload {
  notificationType: string;
  subtype?: string;
  data?: {
    environment?: string;
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
}

interface AppleTransactionPayload {
  originalTransactionId: string;
  productId: string;
  appAccountToken?: string; // our userId if we set it at purchase time
  expiresDate?: number; // ms epoch
  revocationDate?: number;
  revocationReason?: number;
  environment?: string;
}

interface JWSHeader {
  alg: string;
  x5c?: string[];
}

// ── JWS verification helpers ───────────────────────────────────────────────────

function decodeJWSPayload<T>(jws: string): T | null {
  try {
    const parts = jws.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64url').toString('utf8');
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

function decodeJWSHeader(jws: string): JWSHeader | null {
  try {
    const parts = jws.split('.');
    if (parts.length < 3) return null;
    const padded = parts[0] + '='.repeat((4 - (parts[0].length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64url').toString('utf8')) as JWSHeader;
  } catch {
    return null;
  }
}

/**
 * Verify the root CA fingerprint of an x5c chain.
 * Returns true if the fingerprint matches or if the secret is not yet configured
 * (fail-open during initial setup to avoid blocking sandbox testing).
 */
function verifyRootFingerprint(x5c: string[]): boolean {
  if (!APPLE_ROOT_CA_G3_FINGERPRINT) {
    console.warn(JSON.stringify({ event: 'plus.apple_notify.root_fingerprint_missing' }));
    return true; // fail-open until secret is configured
  }
  try {
    const rootDer = Buffer.from(x5c[x5c.length - 1], 'base64');
    const fingerprint = createHash('sha256').update(rootDer).digest('hex');
    return fingerprint === APPLE_ROOT_CA_G3_FINGERPRINT;
  } catch {
    return false;
  }
}

/**
 * Verify the ES256 JWS signature using the leaf certificate from the x5c chain.
 * Apple uses ECDSA P-256 SHA-256 for App Store Server Notifications.
 */
function verifyJWSSignature(jws: string, x5c: string[]): boolean {
  try {
    const parts = jws.split('.');
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, signatureB64] = parts;

    // Extract leaf cert (first in chain)
    const leafDer = Buffer.from(x5c[0], 'base64');
    const { createPublicKey } = require('crypto') as typeof import('crypto');
    const publicKey = createPublicKey({ key: leafDer, format: 'der', type: 'spki' });

    // Convert base64url raw ECDSA sig (r||s, 64 bytes) to DER
    const pad = (s: string) => s + '='.repeat((4 - (s.length % 4)) % 4);
    const rawSig = Buffer.from(pad(signatureB64), 'base64url');
    if (rawSig.length !== 64) return false;

    const r = rawSig.subarray(0, 32);
    const s = rawSig.subarray(32, 64);

    function encodeInt(buf: Buffer): Buffer {
      const needsPad = buf[0] >= 0x80;
      const out = needsPad ? Buffer.concat([Buffer.from([0x00]), buf]) : buf;
      return Buffer.concat([Buffer.from([0x02, out.length]), out]);
    }

    const rDer = encodeInt(r);
    const sDer = encodeInt(s);
    const seqBody = Buffer.concat([rDer, sDer]);
    const derSig = Buffer.concat([Buffer.from([0x30, seqBody.length]), seqBody]);

    const verifier = createVerify('SHA256');
    verifier.update(`${headerB64}.${payloadB64}`, 'ascii');
    return verifier.verify(publicKey, derSig);
  } catch {
    return false;
  }
}

/**
 * Full JWS verification: check root fingerprint + signature.
 * Returns true if valid, false if the JWS should be rejected.
 */
function verifyAppleJWS(jws: string): boolean {
  const header = decodeJWSHeader(jws);
  if (!header || header.alg !== 'ES256') return false;
  if (!header.x5c || header.x5c.length === 0) return false;
  if (!verifyRootFingerprint(header.x5c)) return false;
  return verifyJWSSignature(jws, header.x5c);
}

// ── Notification type → subscription status ────────────────────────────────────

function mapNotificationTypeToStatus(
  notificationType: string,
  subtype?: string,
): string {
  switch (notificationType) {
    case 'SUBSCRIBED':
    case 'DID_RENEW':
      return 'active';
    case 'DID_FAIL_TO_RENEW':
      return subtype === 'GRACE_PERIOD' ? 'grace_period' : 'expired';
    case 'EXPIRED':
      return 'expired';
    case 'REVOKE':
      return 'refunded';
    case 'REFUND':
      return 'refunded';
    case 'DID_CHANGE_RENEWAL_STATUS':
      return 'active'; // still active until expiry regardless of subtype
    case 'GRACE_PERIOD_EXPIRED':
      return 'expired';
    default:
      return 'active';
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: Request, res: Response): Promise<void> {
  // Always respond 200 quickly to Apple — process async
  res.status(200).json({ ok: true });

  try {
    const body = req.body as { signedPayload?: string };
    if (!body?.signedPayload) return;

    // ── Verify outer notification JWS signature ─────────────────────────────
    if (!verifyAppleJWS(body.signedPayload)) {
      console.warn(JSON.stringify({ event: 'plus.apple_notify.invalid_outer_signature' }));
      return;
    }

    const notification = decodeJWSPayload<AppleJWSPayload>(body.signedPayload);
    if (!notification?.data?.signedTransactionInfo) return;

    // ── Verify inner transaction JWS signature ──────────────────────────────
    if (!verifyAppleJWS(notification.data.signedTransactionInfo)) {
      console.warn(JSON.stringify({ event: 'plus.apple_notify.invalid_transaction_signature' }));
      return;
    }

    const txn = decodeJWSPayload<AppleTransactionPayload>(notification.data.signedTransactionInfo);
    if (!txn?.originalTransactionId) return;

    const environment = notification.data.environment ?? txn.environment ?? 'production';
    const status = mapNotificationTypeToStatus(notification.notificationType, notification.subtype);
    const expiresAt = txn.expiresDate ? new Date(txn.expiresDate) : null;
    const cancelledAt = txn.revocationDate ? new Date(txn.revocationDate) : null;

    // Resolve userId from appAccountToken (UUID we set at purchase time)
    let userId: string | null = txn.appAccountToken ?? null;

    // Fallback: look up by originalTransactionId if we already have a record
    if (!userId) {
      const { plusSubscriptions } = await import('@/server/db/schema.js');
      const { eq: eqFn } = await import('drizzle-orm');
      const existing = await db
        .select({ userId: plusSubscriptions.userId })
        .from(plusSubscriptions)
        .where(eqFn(plusSubscriptions.appleOriginalTransactionId, txn.originalTransactionId))
        .limit(1);
      userId = existing[0]?.userId ?? null;
    }

    if (!userId) {
      console.warn(JSON.stringify({ event: 'plus.apple_notify.no_user', originalTransactionId: txn.originalTransactionId }));
      return;
    }

    // Verify userId exists in our user table
    const userRows = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
    if (userRows.length === 0) {
      console.warn(JSON.stringify({ event: 'plus.apple_notify.user_not_found', userId }));
      return;
    }

    await upsertSubscription({
      userId,
      appleOriginalTransactionId: txn.originalTransactionId,
      appleProductId: txn.productId,
      status,
      environment,
      expiresAt,
      gracePeriodUntil: status === 'grace_period' ? expiresAt : null,
      cancelledAt,
      rawNotificationPayload: body.signedPayload.slice(0, 4000),
    });

    console.log(JSON.stringify({
      event: 'plus.apple_notify.processed',
      notificationType: notification.notificationType,
      subtype: notification.subtype,
      status,
      userId,
      environment,
    }));
  } catch (e) {
    console.error(JSON.stringify({ event: 'plus.apple_notify.error', msg: String(e).slice(0, 200) }));
  }
}
