import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, SESSION_COOKIE } from '@/lib/firebase/session';
import { createAdminClient } from '@/lib/supabase/admin';

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// Verify a Firebase ID token using the Firebase REST identitytoolkit API
async function verifyFirebaseToken(idToken: string): Promise<{
  uid: string; email: string; displayName?: string; photoUrl?: string;
} | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: Array<{
      localId: string; email?: string; displayName?: string; photoUrl?: string;
    }> };
    const u = data.users?.[0];
    if (!u) return null;
    return { uid: u.localId, email: u.email ?? '', displayName: u.displayName, photoUrl: u.photoUrl };
  } catch {
    return null;
  }
}

// POST /api/auth/session — create session cookie from Firebase ID token
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }

  const { token } = body;
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const firebaseUser = await verifyFirebaseToken(token);
  if (!firebaseUser) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // Provision Supabase user_profiles row on first sign-in
  try {
    const supabase = createAdminClient();
    await supabase.from('user_profiles').upsert(
      {
        clerk_user_id: firebaseUser.uid, // reuse the column for Firebase UID
        display_name:  firebaseUser.displayName ?? firebaseUser.email.split('@')[0],
        email:         firebaseUser.email,
        avatar_url:    firebaseUser.photoUrl ?? null,
        role:          'user',
      },
      { onConflict: 'clerk_user_id', ignoreDuplicates: true },
    );
  } catch {
    // Non-fatal — DB provisioning errors don't block sign-in
  }

  const sessionToken = await createSessionCookie(firebaseUser.uid, firebaseUser.email);

  const res = NextResponse.json({ ok: true, uid: firebaseUser.uid });
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
  });
  return res;
}

// DELETE /api/auth/session — clear session cookie
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  });
  return res;
}
