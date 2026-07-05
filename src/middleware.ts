import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

/**
 * Server-side guard for the dashboard — the client-side DashboardGate
 * component prevents a content flash, but middleware is what actually
 * stops an unauthenticated request from ever rendering the page.
 * (There's no equivalent for /brand: a brand's only credential right now is
 * a connected wallet, which lives in the browser extension, not a cookie —
 * see the comment on BrandGate for that known gap.)
 */
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    const url = new URL('/', request.url);
    url.searchParams.set('error', 'sign_in_required');
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
