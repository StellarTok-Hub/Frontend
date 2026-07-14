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
 * A fresh, unguessable value per request, threaded through to Next's own
 * inline hydration/RSC-payload <script> tags (Next reads it back off the
 * CSP header on the incoming request — see the comment further down) so
 * script-src can allow exactly those scripts by nonce instead of falling
 * back to 'unsafe-inline'. Built with Web Crypto, not Node's crypto
 * module, since this file runs on the Edge runtime.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * style-src has no nonce and no 'unsafe-inline': nothing in this app's
 * rendered pages uses an inline `style` attribute or `<style>` tag — the
 * only `style={{...}}` usage in the codebase is in the `next/og`
 * ImageResponse generators (icon.tsx, opengraph-image.tsx), which render
 * to a PNG server-side and never reach the browser DOM. If a future page
 * needs real inline styles, thread the nonce through the same way as
 * script-src rather than reintroducing 'unsafe-inline'.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
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
  return profile ? undefined : redirectToSignIn(request);
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
  return walletAddress ? undefined : redirectToSignIn(request);
}

/**
 * Runs on every page request (see `config.matcher` below) to attach a
 * per-request CSP nonce, and additionally guards /dashboard and /brand.
 * The auth guards run first and can short-circuit with a redirect; either
 * way, the CSP header (with that request's nonce) gets attached to
 * whatever response goes out, since every response needs it, not just the
 * happy path.
 */
export async function middleware(request: NextRequest) {
  let guardResponse: NextResponse | undefined;
  if (request.nextUrl.pathname.startsWith('/brand')) {
    guardResponse = await guardBrand(request);
  } else if (request.nextUrl.pathname.startsWith('/dashboard')) {
    guardResponse = await guardDashboard(request);
  }

  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  if (guardResponse) {
    guardResponse.headers.set('Content-Security-Policy', csp);
    return guardResponse;
  }

  // Next's App Router reads the nonce for its own inline hydration scripts
  // back off the *request*'s Content-Security-Policy header (see
  // parseRequestHeaders in Next's app-render), not the response — so this
  // has to be set on both, not just the outgoing response below.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
