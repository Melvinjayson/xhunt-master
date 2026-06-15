import { NextRequest, NextResponse } from 'next/server';
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/firebase/session';

const PUBLIC_PREFIXES = [
  '/',
  '/about',
  '/blog',
  '/pricing',
  '/careers',
  '/contact',
  '/privacy',
  '/terms',
  '/security',
  '/cookies',
  '/consumer',
  '/enterprise',
  '/developers',
  '/use-cases',
  '/marketplace',
  '/mission-control',
  '/get-started',
  '/missions',
  '/sign-in',
  '/sign-up',
  '/api/auth/',
  '/api/contact',
  '/api/cron/',
  '/api/stripe/webhook',
  '/auth/',
];

const AUTH_PATHS = ['/sign-in', '/sign-up'];

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(p => p !== '/' && pathname.startsWith(p));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets and Next.js internals through immediately
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(ico|png|jpg|jpeg|webp|svg|css|js|woff2?|ttf|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const cookieValue = req.cookies.get(SESSION_COOKIE)?.value ?? null;
  const session     = cookieValue ? await parseSessionCookie(cookieValue) : null;
  const isAuthed    = session !== null;

  // Authenticated users hitting auth pages or root → send to /home
  if (isAuthed && (isAuthPage(pathname) || pathname === '/')) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Unauthenticated users hitting protected routes → /sign-in
  if (!isAuthed && !isPublic(pathname)) {
    const dest = new URL('/sign-in', req.url);
    dest.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(dest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
