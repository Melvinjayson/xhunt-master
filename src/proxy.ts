import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_ROUTES = new Set([
  '/',
  '/about',
  '/blog',
  '/careers',
  '/contact',
  '/pricing',
  '/missions',
  '/sign-in',
  '/sign-up',
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
]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  for (const prefix of PUBLIC_ROUTES) {
    if (prefix !== '/' && pathname.startsWith(prefix + '/')) return true;
  }
  // API routes that are public
  if (pathname.startsWith('/api/clerk/')) return true;
  if (pathname.startsWith('/api/contact')) return true;
  if (pathname.startsWith('/api/cron/')) return true;
  if (pathname.startsWith('/api/stripe/webhook')) return true;
  if (pathname.startsWith('/auth/')) return true;
  return false;
}

const AUTH_ROUTES = new Set(['/sign-in', '/sign-up']);
function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.has(pathname) || pathname.startsWith('/sign-in/') || pathname.startsWith('/sign-up/');
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  let session = null;
  try {
    const result = await supabase.auth.getSession();
    session = result.data?.session ?? null;
  } catch {
    // Supabase unreachable (missing/invalid credentials) — treat as unauthenticated
  }

  // Authenticated users hitting sign-in/sign-up → redirect to their dashboard
  if (isAuthRoute(pathname) && session?.user) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Unauthenticated users hitting protected routes → redirect to sign-in
  if (!isPublic(pathname) && !session?.user) {
    const signIn = new URL('/sign-in', req.url);
    signIn.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signIn);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
