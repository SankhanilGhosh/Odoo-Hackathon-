import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');
  const isApi = pathname.startsWith('/api');

  // Don't interfere with API routes
  if (isApi) return NextResponse.next();

  // Read role cookie set on login
  const role = request.cookies.get('hrms_role')?.value;
  const isLoggedIn = !!role;

  // Redirect unauthenticated users to sign-in
  if (!isLoggedIn && (isDashboard || isAdmin)) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthPage) {
    const target = role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // RBAC: employees can't access admin pages
  if (isAdmin && role === 'employee') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // RBAC: admins can't access employee dashboard pages
  if (isDashboard && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/sign-in', '/sign-up'],
};
