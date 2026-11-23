/**
 * Dream Journal Client-Side Encryption
 *
 * Uses Web Crypto API (AES-256-GCM) with PBKDF2 key derivation.
 * All encryption happens in the browser. Only ciphertext, IV, and salt
 * are ever sent to the server. The passphrase and vault key never leave
 * the browser session.
 *
 * Architecture:
 *  - User sets a journal passphrase (separate from account password)
 *  - PBKDF2 derives a wrapping key from the passphrase + a per-user salt
 *  - A random 256-bit vault key is generated once and wrapped (encrypted)
 *    with the wrapping key — the wrapped vault key is stored server-side
 *    in the user's grimoire metadata
 *  - Each entry's title, content, and tags are encrypted with the vault key
 *    using a unique 96-bit IV per encryption
 *  - The vault key lives only in memory; it is cleared on lock/logout/idle
 *
 * Residual risks (disclosed to users):
 *  - A compromised device or browser can expose plaintext before encryption
 *  - Injected malicious JavaScript can intercept the passphrase or vault key
 *  - Account metadata (entry count, dates, moon phases) is NOT encrypted
 *  - Old server backups taken before migration may still contain plaintext
 *  - Lost passphrase = lost access to encrypted entries (no admin backdoor)
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_HASH = 'SHA-256';
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits

// ── Helpers ───────────────────────────────────────────────────────────────────

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length)) as Uint8Array<ArrayBuffer>;
}

// ── Key derivation ────────────────────────────────────────────────────────────

/**
 * Derive a wrapping key from a passphrase + salt using PBKDF2.
 * The wrapping key is used only to wrap/unwrap the vault key.
 */
export async function deriveWrappingKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

// ── Vault key management ──────────────────────────────────────────────────────

/** Generate a new random vault encryption key. */
export async function generateVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true, // extractable so we can wrap it
    ['encrypt', 'decrypt'],
  );
}

export interface WrappedVault {
  wrappedKey: string; // base64
  salt: string;       // base64
  iv: string;         // base64 (used to wrap the vault key)
}

/**
 * Wrap (encrypt) the vault key with the passphrase-derived wrapping key.
 * Returns base64-encoded wrapped key + the salt used for derivation.
 */
export async function wrapVaultKey(vaultKey: CryptoKey, passphrase: string): Promise<WrappedVault> {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const wrappingKey = await deriveWrappingKey(passphrase, salt);
  const wrapped = await crypto.subtle.wrapKey('raw', vaultKey, wrappingKey, {
    name: 'AES-GCM',
    iv,
  });
  return {
    wrappedKey: toBase64(wrapped),
    salt: toBase64(salt.buffer as ArrayBuffer),
    iv: toBase64(iv.buffer as ArrayBuffer),
  };
}

/**
 * Unwrap (decrypt) the vault key using the passphrase.
 * Throws if the passphrase is wrong or data is corrupted.
 */
export async function unwrapVaultKey(vault: WrappedVault, passphrase: string): Promise<CryptoKey> {
  const salt = fromBase64(vault.salt);
  const iv = fromBase64(vault.iv);
  const wrappedKey = fromBase64(vault.wrappedKey);
  const wrappingKey = await deriveWrappingKey(passphrase, salt);
  return crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    wrappingKey,
    { name: 'AES-GCM', iv },
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false, // not extractable after unwrap
    ['encrypt', 'decrypt'],
  );
}

// ── Entry encryption / decryption ─────────────────────────────────────────────

export interface EncryptedField {
  ciphertext: string; // base64
  iv: string;         // base64
}

/** Encrypt a plaintext string with the vault key. Each call uses a fresh IV. */
export async function encryptField(plaintext: string, vaultKey: CryptoKey): Promise<EncryptedField> {
  const iv = randomBytes(IV_LENGTH);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    vaultKey,
    enc.encode(plaintext),
  );
  return { ciphertext: toBase64(ciphertext), iv: toBase64(iv.buffer as ArrayBuffer) };
}

/** Decrypt a ciphertext field. Returns null if decryption fails. */
export async function decryptField(field: EncryptedField, vaultKey: CryptoKey): Promise<string | null> {
  try {
    const iv = fromBase64(field.iv);
    const ciphertext = fromBase64(field.ciphertext);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, vaultKey, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

// ── Entry payload helpers ─────────────────────────────────────────────────────

export interface DreamEncryptedPayload {
  enc: true;
  title: EncryptedField;
  content: EncryptedField;
  tags: EncryptedField;
  dreamType?: EncryptedField;
  mood?: EncryptedField;
}

export interface DreamPlaintextPayload {
  enc?: false;
}

export type DreamMetadata = (DreamEncryptedPayload | DreamPlaintextPayload) & Record<string, unknown>;

/** Returns true if a metadata object contains encrypted dream fields. */
export function isEncrypted(metadata: unknown): metadata is DreamEncryptedPayload {
  return !!(metadata && typeof metadata === 'object' && (metadata as DreamEncryptedPayload).enc === true);
}

/** Returns true if an entry appears to be plaintext (no enc flag). */
export function isPlaintext(metadata: unknown): boolean {
  return !metadata || !(metadata as DreamEncryptedPayload).enc;
}

/**
 * Encrypt all sensitive fields of a dream entry.
 * Returns the metadata object to store server-side, plus sentinel values
 * for title/content/tags (stored as empty strings so the server schema is satisfied).
 */
export async function encryptDreamEntry(
  title: string,
  content: string,
  tags: string,
  dreamType: string,
  mood: string,
  vaultKey: CryptoKey,
): Promise<{ metadata: DreamEncryptedPayload; title: string; content: string; tags: string }> {
  const [eTitle, eContent, eTags, eDreamType, eMood] = await Promise.all([
    encryptField(title, vaultKey),
    encryptField(content, vaultKey),
    encryptField(tags, vaultKey),
    encryptField(dreamType, vaultKey),
    encryptField(mood, vaultKey),
  ]);
  return {
    metadata: {
      enc: true,
      title: eTitle,
      content: eContent,
      tags: eTags,
      dreamType: eDreamType,
      mood: eMood,
    },
    title: '🔒', // sentinel — real title is in metadata
    content: '',
    tags: '',
  };
}

export interface DecryptedDreamEntry {
  title: string;
  content: string;
  tags: string;
  dreamType: string;
  mood: string;
}

/**
 * Decrypt all sensitive fields of a dream entry.
 * Returns null for any field that fails to decrypt.
 */
export async function decryptDreamEntry(
  metadata: DreamEncryptedPayload,
  vaultKey: CryptoKey,
): Promise<DecryptedDreamEntry> {
  const [title, content, tags, dreamType, mood] = await Promise.all([
    decryptField(metadata.title, vaultKey),
    decryptField(metadata.content, vaultKey),
    decryptField(metadata.tags, vaultKey),
    metadata.dreamType ? decryptField(metadata.dreamType, vaultKey) : Promise.resolve(''),
    metadata.mood ? decryptField(metadata.mood, vaultKey) : Promise.resolve(''),
  ]);
  return {
    title: title ?? '[Decryption failed]',
    content: content ?? '[Decryption failed]',
    tags: tags ?? '',
    dreamType: dreamType ?? '',
    mood: mood ?? '',
  };
}
