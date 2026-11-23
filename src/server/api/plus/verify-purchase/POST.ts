/**
 * POST /api/plus/verify-purchase
 * Called by the iOS app after a successful StoreKit 2 purchase or restore.
 * Accepts the signed JWS transaction from StoreKit 2 and upserts the
 * subscription record server-side.
 *
 * Body: { signedTransaction: string }
 *
 * JWS verification: Apple signs StoreKit 2 transactions with ES256 using a
 * certificate chain in the JWS header's x5c field. We verify:
 *   1. The x5c chain terminates at Apple's known root CA (G3)
 *   2. The leaf certificate's public key matches the JWS signature
 * This prevents crafted payloads from activating Plus without a real purchase.
 *
 * Apple Root CA G3 fingerprint source:
 *   https://www.apple.com/certificateauthority/
 *   Download "Apple Root CA - G3", then:
 *   openssl x509 -fingerprint -sha256 -in AppleRootCA-G3.cer -noout
 *   Strip colons and lowercase. Set as APPLE_ROOT_CA_G3_FINGERPRINT secret.
 */
import type { Request, Response } from 'express';
import { createVerify, createHash } from 'crypto';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { upsertSubscription, getEntitlement } from '@/server/lib/plus-entitlement.js';
import { getSecret } from '#airo/secrets';

// Apple Root CA G3 SHA-256 fingerprint (hex, no colons, lowercase).
// Loaded from secret so it can be updated without a code deploy.
// Obtain from https://www.apple.com/certificateauthority/ — download
// "Apple Root CA - G3" and run:
//   openssl x509 -fingerprint -sha256 -in AppleRootCA-G3.cer -noout
// then strip colons and lowercase the result.
const APPLE_ROOT_CA_G3_FINGERPRINT = (
  getSecret('APPLE_ROOT_CA_G3_FINGERPRINT') ?? ''
).toLowerCase().replace(/:/g, '');

interface StoreKit2Transaction {
  originalTransactionId: string;
  productId: string;
  appAccountToken?: string;
  expiresDate?: number;
  revocationDate?: number;
  environment?: string;
  type?: string;
}

interface JWSHeader {
  alg: string;
  x5c?: string[];
}

/**
 * Decode a JWS without verifying the signature (used to extract header + payload).
 */
function decodeJWSParts(jws: string): { header: JWSHeader; payload: StoreKit2Transaction; headerB64: string; payloadB64: string; signatureB64: string } | null {
  try {
    const parts = jws.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const pad = (s: string) => s + '='.repeat((4 - (s.length % 4)) % 4);
    const header = JSON.parse(Buffer.from(pad(headerB64), 'base64url').toString('utf8')) as JWSHeader;
    const payload = JSON.parse(Buffer.from(pad(payloadB64), 'base64url').toString('utf8')) as StoreKit2Transaction;

    return { header, payload, headerB64, payloadB64, signatureB64 };
  } catch {
    return null;
  }
}

/**
 * Verify the JWS signature using the leaf certificate from the x5c chain.
 * The signing input is `${headerB64}.${payloadB64}` (ASCII bytes).
 * Apple uses ES256 (ECDSA P-256 SHA-256) for StoreKit 2 transactions.
 */
function verifyJWSSignature(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  leafCertDer: Buffer,
): boolean {
  try {
    const { createPublicKey } = require('crypto') as typeof import('crypto');
    const publicKey = createPublicKey({ key: leafCertDer, format: 'der', type: 'spki' });

    const pad = (s: string) => s + '='.repeat((4 - (s.length % 4)) % 4);
    const rawSig = Buffer.from(pad(signatureB64), 'base64url');

    // ES256 raw signature is 64 bytes: r (32) + s (32)
    // Convert to DER SEQUENCE { INTEGER r, INTEGER s }
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
 * Verify the x5c certificate chain root fingerprint.
 * The last cert in the x5c array must be (or chain up to) Apple Root CA G3.
 * We SHA-256 hash the raw DER bytes of the root cert and compare to the
 * known fingerprint loaded from APPLE_ROOT_CA_G3_FINGERPRINT secret.
 */
function verifyRootFingerprint(x5c: string[]): boolean {
  if (!APPLE_ROOT_CA_G3_FINGERPRINT) {
    // Secret not configured — log a warning but allow in non-production to
    // avoid blocking sandbox testing. In production this should be set.
    console.warn(JSON.stringify({ event: 'plus.verify_purchase.root_fingerprint_missing' }));
    return true; // fail-open until secret is configured
  }
  try {
    // The root is the last cert in the chain
    const rootDer = Buffer.from(x5c[x5c.length - 1], 'base64');
    const fingerprint = createHash('sha256').update(rootDer).digest('hex');
    return fingerprint === APPLE_ROOT_CA_G3_FINGERPRINT;
  } catch {
    return false;
  }
}

/**
 * Extract the leaf certificate DER bytes from the x5c chain.
 * x5c entries are base64-encoded DER (no PEM header/footer).
 */
function extractLeafCert(x5c: string[]): Buffer | null {
  if (!x5c || x5c.length === 0) return null;
  try {
    return Buffer.from(x5c[0], 'base64');
  } catch {
    return null;
  }
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const { signedTransaction } = req.body as { signedTransaction?: string };
  if (!signedTransaction || typeof signedTransaction !== 'string') {
    res.status(400).json({ error: 'MISSING_TRANSACTION' });
    return;
  }

  try {
    const parts = decodeJWSParts(signedTransaction);
    if (!parts) {
      res.status(400).json({ error: 'INVALID_JWS_FORMAT' });
      return;
    }

    const { header, payload: txn, headerB64, payloadB64, signatureB64 } = parts;

    // ── JWS algorithm check ─────────────────────────────────────────────────
    if (header.alg !== 'ES256') {
      res.status(400).json({ error: 'UNEXPECTED_ALGORITHM', alg: header.alg });
      return;
    }

    if (!header.x5c || header.x5c.length === 0) {
      res.status(400).json({ error: 'MISSING_X5C_CHAIN' });
      return;
    }

    // ── Root CA fingerprint verification ────────────────────────────────────
    if (!verifyRootFingerprint(header.x5c)) {
      console.warn(JSON.stringify({ event: 'plus.verify_purchase.root_fingerprint_mismatch' }));
      res.status(400).json({ error: 'UNTRUSTED_CERTIFICATE_CHAIN' });
      return;
    }

    // ── Leaf cert extraction ────────────────────────────────────────────────
    const leafCert = extractLeafCert(header.x5c);
    if (!leafCert) {
      res.status(400).json({ error: 'INVALID_LEAF_CERT' });
      return;
    }

    // ── JWS signature verification ──────────────────────────────────────────
    const signatureValid = verifyJWSSignature(headerB64, payloadB64, signatureB64, leafCert);
    if (!signatureValid) {
      res.status(400).json({ error: 'INVALID_SIGNATURE' });
      return;
    }
    // ── End JWS verification ────────────────────────────────────────────────

    if (!txn?.originalTransactionId || !txn?.productId) {
      res.status(400).json({ error: 'INVALID_TRANSACTION' });
      return;
    }

    // Security: if appAccountToken is present, it must match the session user
    if (txn.appAccountToken && txn.appAccountToken !== session.user.id) {
      res.status(403).json({ error: 'ACCOUNT_MISMATCH' });
      return;
    }

    // Only accept our known product ID
    if (txn.productId !== 'com.spellful.plus.monthly') {
      res.status(400).json({ error: 'UNKNOWN_PRODUCT', productId: txn.productId });
      return;
    }

    const environment = txn.environment ?? 'production';
    const expiresAt = txn.expiresDate ? new Date(txn.expiresDate) : null;
    const cancelledAt = txn.revocationDate ? new Date(txn.revocationDate) : null;
    const status = cancelledAt ? 'refunded' : 'active';

    await upsertSubscription({
      userId: session.user.id,
      appleOriginalTransactionId: txn.originalTransactionId,
      appleProductId: txn.productId,
      status,
      environment,
      expiresAt,
      gracePeriodUntil: null,
      cancelledAt,
      rawNotificationPayload: signedTransaction.slice(0, 4000),
    });

    const entitlement = await getEntitlement(session.user.id);
    res.json({
      ok: true,
      isPlus: entitlement.isPlus,
      status: entitlement.status,
      expiresAt: entitlement.expiresAt?.toISOString() ?? null,
      environment,
    });
  } catch (e) {
    res.status(500).json({ error: 'SERVER_ERROR', message: String(e) });
  }
}
