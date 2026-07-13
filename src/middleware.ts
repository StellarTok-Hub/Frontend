import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/session';

/**
 * Server-side guard for the dashboard. Checks that the session cookie is
 * present *and* that its HMAC signature verifies — checking presence alone
 * would let anyone in with a hand-crafted `{"openId":"..."}` cookie, since
 * the client never proves it, it just claims it. The client-side
 * DashboardGate component still exists to prevent a content flash, but
 * this is what actually stops an unauthenticated (or forged) request from
 * ever rendering the page.
 */
export async function middleware(request: NextRequest) {
  const profile = await decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!profile) {
    const url = new URL('/', request.url);
    url.searchParams.set('error', 'sign_in_required');
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
