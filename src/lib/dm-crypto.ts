/**
 * End-to-end encryption for Spellful DMs.
 *
 * Scheme: ECDH (P-256) key exchange → shared secret → AES-GCM-256 per message.
 *
 * Private keys NEVER leave the browser — they live in localStorage only.
 * The server stores only the ECDH public key (JWK) and the AES-GCM ciphertext + IV.
 *
 * Key storage keys:
 *   spellful_dm_privkey  — JWK JSON of the user's ECDH private key
 *   spellful_dm_pubkey   — JWK JSON of the user's ECDH public key (cached locally)
 */

const PRIV_KEY = 'spellful_dm_privkey';
const PUB_KEY  = 'spellful_dm_pubkey';

// ── Key generation & storage ──────────────────────────────────────────────────

export async function getOrCreateKeyPair(): Promise<{ publicKeyJwk: string }> {
  const stored = localStorage.getItem(PRIV_KEY);
  if (stored) {
    const pub = localStorage.getItem(PUB_KEY) ?? '';
    return { publicKeyJwk: pub };
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey'],
  );

  const privJwk = JSON.stringify(await crypto.subtle.exportKey('jwk', keyPair.privateKey));
  const pubJwk  = JSON.stringify(await crypto.subtle.exportKey('jwk', keyPair.publicKey));

  localStorage.setItem(PRIV_KEY, privJwk);
  localStorage.setItem(PUB_KEY,  pubJwk);

  return { publicKeyJwk: pubJwk };
}

async function getPrivateKey(): Promise<CryptoKey | null> {
  const stored = localStorage.getItem(PRIV_KEY);
  if (!stored) return null;
  return crypto.subtle.importKey(
    'jwk',
    JSON.parse(stored) as JsonWebKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey'],
  );
}

async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    JSON.parse(jwkString) as JsonWebKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
}

async function deriveSharedKey(theirPublicKey: CryptoKey): Promise<CryptoKey> {
  const myPriv = await getPrivateKey();
  if (!myPriv) throw new Error('No local private key — call getOrCreateKeyPair first');
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPriv,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ── Encrypt / Decrypt ─────────────────────────────────────────────────────────

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/**
 * Encrypt a plaintext string using the recipient's public key.
 * Returns { ciphertext, iv } — both base64 strings safe to store on the server.
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKeyJwk: string,
): Promise<{ ciphertext: string; iv: string }> {
  const theirKey = await importPublicKey(recipientPublicKeyJwk);
  const sharedKey = await deriveSharedKey(theirKey);

  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes },
    sharedKey,
    encoded,
  );

  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(ivBytes.buffer),
  };
}

/**
 * Decrypt a message using the sender's public key.
 * Returns the plaintext string, or null if decryption fails.
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  senderPublicKeyJwk: string,
): Promise<string | null> {
  try {
    const theirKey = await importPublicKey(senderPublicKeyJwk);
    const sharedKey = await deriveSharedKey(theirKey);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(iv) as Uint8Array<ArrayBuffer> },
      sharedKey,
      fromBase64(ciphertext) as Uint8Array<ArrayBuffer>,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/** True if the user has a local keypair already. */
export function hasLocalKeyPair(): boolean {
  return !!localStorage.getItem(PRIV_KEY);
}
