import { cookies } from 'next/headers';
import { parseSessionCookie, SESSION_COOKIE, type SessionPayload } from './session';

export async function getServerUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    return parseSessionCookie(raw);
  } catch {
    return null;
  }
}
