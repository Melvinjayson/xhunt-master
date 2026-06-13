/**
 * XChat End-to-End Encryption
 *
 * Architecture:
 * - Each user has a long-term ECDH P-256 key pair, stored in IndexedDB.
 * - Their public key is registered in the DB (user_profiles.public_key).
 * - Each conversation has a per-conversation AES-256-GCM "session key".
 * - The session key is stored encrypted in IndexedDB, keyed by conversation ID.
 * - For new conversations, the creator generates and persists the session key.
 * - When a new member joins, the server API passes the session key (stored
 *   server-side encrypted) to the joining client during the handshake.
 * - All message plaintext is encrypted with AES-256-GCM before sending to DB.
 * - The content field in DB stores base64(ciphertext); IV is stored in metadata.iv.
 * - Plaintext never reaches the server.
 *
 * Key storage in IndexedDB:
 *   - "xchat_keypair"       → { publicKey: CryptoKey, privateKey: CryptoKey }
 *   - "xchat_session_{id}"  → CryptoKey (AES-256-GCM for conversation id)
 *
 * Failure mode: if a key is missing (e.g., new device), messages from that
 * conversation fall back to showing "[Encrypted — key not available on this device]".
 */

const DB_NAME    = 'xchat_crypto';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db  = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror   = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ── Base64 helpers ────────────────────────────────────────────────────────────

function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// ── Key pair management ───────────────────────────────────────────────────────

const KEY_PAIR_KEY = 'xchat_keypair';

export async function getOrCreateKeyPair(): Promise<CryptoKeyPair> {
  const existing = await idbGet<CryptoKeyPair>(KEY_PAIR_KEY);
  if (existing?.publicKey && existing?.privateKey) return existing;

  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    false, // non-extractable private key for security
    ['deriveKey', 'deriveBits'],
  );
  await idbSet(KEY_PAIR_KEY, pair);
  return pair;
}

// Export public key as JWK string (safe to share and store in DB)
export async function exportPublicKeyJwk(keyPair: CryptoKeyPair): Promise<string> {
  const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return JSON.stringify(jwk);
}

// Import a JWK public key string from another user
export async function importPublicKeyJwk(jwkStr: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkStr);
  return crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );
}

// ── Session key management ────────────────────────────────────────────────────

function sessionKeyId(conversationId: string): string {
  return `xchat_session_${conversationId}`;
}

// Generate a fresh AES-256-GCM session key for a new conversation
export async function generateSessionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

// Persist session key to IndexedDB
export async function storeSessionKey(conversationId: string, key: CryptoKey): Promise<void> {
  await idbSet(sessionKeyId(conversationId), key);
}

// Load session key from IndexedDB (returns null if not found)
export async function loadSessionKey(conversationId: string): Promise<CryptoKey | null> {
  const key = await idbGet<CryptoKey>(sessionKeyId(conversationId));
  return key ?? null;
}

// Export session key to base64 (for transmission/storage)
export async function exportSessionKeyB64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(raw);
}

// Import session key from base64
export async function importSessionKeyB64(b64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(b64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

// Get or create the session key for a conversation.
// If no key exists in IndexedDB, generates a new one (first open of this convo).
export async function getOrCreateSessionKey(conversationId: string): Promise<CryptoKey> {
  const existing = await loadSessionKey(conversationId);
  if (existing) return existing;
  const key = await generateSessionKey();
  await storeSessionKey(conversationId, key);
  return key;
}

// ── Message encryption / decryption ──────────────────────────────────────────

export interface EncryptedMessage {
  ct: string; // ciphertext — base64
  iv: string; // initialization vector — base64
}

export async function encryptMessage(plaintext: string, key: CryptoKey): Promise<EncryptedMessage> {
  const iv  = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const enc = new TextEncoder();
  const ct  = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  return {
    ct: bufferToBase64(ct),
    iv: bufferToBase64(iv.buffer),
  };
}

export async function decryptMessage(payload: EncryptedMessage, key: CryptoKey): Promise<string> {
  const ct  = base64ToBuffer(payload.ct);
  const iv  = base64ToBuffer(payload.iv);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(dec);
}

// ── Convenience: encrypt for DB storage ──────────────────────────────────────
// Returns { content: base64_ciphertext, metadata_iv: base64_iv }

export async function encryptForDB(
  plaintext: string,
  conversationId: string,
): Promise<{ content: string; iv: string } | null> {
  try {
    const key = await loadSessionKey(conversationId);
    if (!key) return null;
    const { ct, iv } = await encryptMessage(plaintext, key);
    return { content: ct, iv };
  } catch {
    return null;
  }
}

// Decrypt a message from DB. Returns plaintext or a fallback string.
export async function decryptFromDB(
  ciphertext: string,
  iv: string,
  conversationId: string,
): Promise<string> {
  try {
    const key = await loadSessionKey(conversationId);
    if (!key) return '[Encrypted — key not available on this device]';
    return await decryptMessage({ ct: ciphertext, iv }, key);
  } catch {
    return '[Message could not be decrypted]';
  }
}

// ── Public key registration ───────────────────────────────────────────────────
// Called once after login to ensure the user's public key is in the DB.

export async function ensurePublicKeyRegistered(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const pair  = await getOrCreateKeyPair();
    const jwk   = await exportPublicKeyJwk(pair);

    // Store in user_profiles via a lightweight fetch
    await fetch('/api/messages/register-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: jwk }),
    });
  } catch {
    // Non-fatal — messaging still works, just without E2E on new devices
  }
}
