import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about(.*)',
  '/blog(.*)',
  '/pricing(.*)',
  '/careers(.*)',
  '/contact(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/security(.*)',
  '/cookies(.*)',
  '/consumer(.*)',
  '/enterprise(.*)',
  '/developers(.*)',
  '/use-cases(.*)',
  '/marketplace(.*)',
  '/mission-control(.*)',
  '/missions',
  '/get-started(.*)',
  '/api/contact(.*)',
  '/api/cron/(.*)',
  '/api/stripe/webhook(.*)',
  '/api/clerk/(.*)',
  '/auth/(.*)',
]);

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  if (!isPublicRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
