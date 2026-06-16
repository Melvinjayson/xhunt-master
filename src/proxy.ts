import { NextRequest, NextResponse } from 'next/server';
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/firebase/session';

// Consumer routes (/home, /explore, /missions, /profile, /messages) are public
// — they render in preview mode when unauthenticated.
const PROTECTED_PREFIXES = ['/workspace', '/admin', '/get-started'];
const AUTH_REDIRECT_PREFIXES = ['/sign-in', '/sign-up'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes: auth handled per-route. Static assets: always pass through.
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  let session = null;
  if (sessionCookie) session = await parseSessionCookie(sessionCookie);

  // Signed-in users don't need to see auth pages
  if (session && AUTH_REDIRECT_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Guard protected routes
  if (PROTECTED_PREFIXES.some(p => pathname.startsWith(p))) {
    if (!session) {
      const dest = new URL('/sign-in', req.url);
      dest.searchParams.set('redirect_url', pathname);
      const res = NextResponse.redirect(dest);
      // Clear any stale/expired cookie
      if (sessionCookie) {
        res.cookies.set(SESSION_COOKIE, '', {
          maxAge: 0, path: '/', httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js|map)).*)',
  ],
};

