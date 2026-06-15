// Edge-runtime compatible HMAC session cookie utilities.
// No external dependencies — uses the Web Crypto API available everywhere.

export const SESSION_COOKIE = '__xhunt_fb_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  return process.env.SESSION_SECRET ?? 'xhunt-dev-secret-replace-in-production';
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export interface SessionPayload {
  uid:   string;
  email: string;
  exp:   number; // Unix ms
}

export async function createSessionCookie(uid: string, email: string): Promise<string> {
  const payload: SessionPayload = { uid, email, exp: Date.now() + SESSION_TTL_MS };
  const encoded = btoa(JSON.stringify(payload));
  const sig     = await hmac(encoded, getSecret());
  return `${encoded}.${sig}`;
}

export async function parseSessionCookie(cookie: string): Promise<SessionPayload | null> {
  const dot = cookie.lastIndexOf('.');
  if (dot === -1) return null;

  const encoded = cookie.slice(0, dot);
  const sig     = cookie.slice(dot + 1);

  // Constant-time comparison using HMAC verify
  const key      = await importKey(getSecret());
  const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0));
  const valid    = await crypto.subtle.verify(
    'HMAC', key,
    sigBytes,
    new TextEncoder().encode(encoded),
  );

  if (!valid) return null;

  try {
    const payload = JSON.parse(atob(encoded)) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
