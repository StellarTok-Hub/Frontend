import { NextRequest, NextResponse } from 'next/server';
import {
  decodeSession,
  decodeWalletSession,
  SESSION_COOKIE,
  WALLET_SESSION_COOKIE,
} from '@/lib/session';

function redirectToSignIn(request: NextRequest) {
  const url = new URL('/', request.url);
  url.searchParams.set('error', 'sign_in_required');
  return NextResponse.redirect(url);
}

/**
 * Server-side guard for the dashboard. Checks that the session cookie is
 * present *and* that its HMAC signature verifies — checking presence alone
 * would let anyone in with a hand-crafted `{"openId":"..."}` cookie, since
 * the client never proves it, it just claims it. The client-side
 * DashboardGate component still exists to prevent a content flash, but
 * this is what actually stops an unauthenticated (or forged) request from
 * ever rendering the page.
 */
async function guardDashboard(request: NextRequest) {
  const profile = await decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  return profile ? NextResponse.next() : redirectToSignIn(request);
}

/**
 * Server-side guard for the brand portal. Same idea as guardDashboard, but
 * checks the signed wallet cookie instead of the TikTok session — brand
 * identity is "a connected wallet," not a TikTok login. This still isn't
 * proof of wallet *ownership* (see the comment on encodeWalletSession), but
 * it closes the gap where /brand pages previously shipped their full HTML
 * and JS to a browser with no credential at all, relying only on a client
 * component to hide the content after the fact.
 */
async function guardBrand(request: NextRequest) {
  const walletAddress = await decodeWalletSession(
    request.cookies.get(WALLET_SESSION_COOKIE)?.value,
  );
  return walletAddress ? NextResponse.next() : redirectToSignIn(request);
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/brand')) {
    return guardBrand(request);
  }
  return guardDashboard(request);
}

export const config = {
  matcher: ['/dashboard/:path*', '/brand/:path*'],
};
