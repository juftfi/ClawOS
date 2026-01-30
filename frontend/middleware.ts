import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/reset-password', '/'];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    try {
      // Check for Supabase session
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Get session from Supabase (this checks the auth token in cookies)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // No valid session, redirect to login
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Valid session, allow access
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware auth error:', error);
      // On error, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
