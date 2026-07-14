import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  encodeSession,
  encodeWalletSession,
  SESSION_COOKIE,
  WALLET_SESSION_COOKIE,
} from '@/lib/session';
import type { TikTokProfile } from '@/lib/tiktok';
import { config, middleware } from './middleware';

const profile: TikTokProfile = {
  openId: 'creator-123',
  username: 'creator',
  displayName: 'Creator',
  avatarUrl: 'https://example.com/avatar.png',
};
const WALLET_ADDRESS = 'GBRVNONUCMSB3ARYCNXH35FUBRYWABMTZH6ABOPLP7IXHWHVIB3OT3EG';

function requestFor(path: string, cookies: Record<string, string> = {}): NextRequest {
  const headers = new Headers();
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  if (cookieHeader) headers.set('cookie', cookieHeader);
  return new NextRequest(`http://localhost${path}`, { headers });
}

function isRedirectToSignIn(response: Awaited<ReturnType<typeof middleware>>): boolean {
  const location = response.headers.get('location');
  if (!location) return false;
  const url = new URL(location);
  return url.pathname === '/' && url.searchParams.get('error') === 'sign_in_required';
}

/**
 * Flips the *first* character of a signed cookie's signature segment.
 * Flipping the last character is unreliable — see the identical helper
 * (and its full explanation) in src/lib/session.test.ts: the final
 * character of a base64url-encoded HMAC-SHA256 signature can encode
 * "don't care" padding bits that decode discards, so two different last
 * characters can legitimately decode to the same bytes. The first
 * character is always byte-aligned and always significant.
 */
function tamperSignature(cookie: string): string {
  const separatorIndex = cookie.lastIndexOf('.');
  const payload = cookie.slice(0, separatorIndex);
  const signature = cookie.slice(separatorIndex + 1);
  const flipped = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1);
  return `${payload}.${flipped}`;
}

describe('middleware — /dashboard (guardDashboard)', () => {
  it('redirects to sign-in when there is no session cookie', async () => {
    const response = await middleware(requestFor('/dashboard'));
    expect(isRedirectToSignIn(response)).toBe(true);
  });

  it('redirects to sign-in when the session cookie is tampered', async () => {
    const valid = await encodeSession(profile);
    const tampered = tamperSignature(valid);
    const response = await middleware(requestFor('/dashboard', { [SESSION_COOKIE]: tampered }));
    expect(isRedirectToSignIn(response)).toBe(true);
  });

  it('lets the request through with a valid signed session cookie', async () => {
    const cookie = await encodeSession(profile);
    const response = await middleware(requestFor('/dashboard', { [SESSION_COOKIE]: cookie }));
    expect(isRedirectToSignIn(response)).toBe(false);
    expect(response.headers.get('location')).toBeNull();
  });

  it('does not accept a wallet-session cookie in place of a TikTok session', async () => {
    const cookie = await encodeWalletSession(WALLET_ADDRESS);
    const response = await middleware(
      requestFor('/dashboard', { [WALLET_SESSION_COOKIE]: cookie }),
    );
    expect(isRedirectToSignIn(response)).toBe(true);
  });
});

describe('middleware — /brand (guardBrand)', () => {
  it('redirects to sign-in when there is no wallet-session cookie', async () => {
    const response = await middleware(requestFor('/brand'));
    expect(isRedirectToSignIn(response)).toBe(true);
  });

  it('redirects to sign-in when the wallet-session cookie is tampered', async () => {
    const valid = await encodeWalletSession(WALLET_ADDRESS);
    const tampered = tamperSignature(valid);
    const response = await middleware(requestFor('/brand', { [WALLET_SESSION_COOKIE]: tampered }));
    expect(isRedirectToSignIn(response)).toBe(true);
  });

  it('lets the request through with a valid signed wallet-session cookie', async () => {
    const cookie = await encodeWalletSession(WALLET_ADDRESS);
    const response = await middleware(requestFor('/brand', { [WALLET_SESSION_COOKIE]: cookie }));
    expect(isRedirectToSignIn(response)).toBe(false);
    expect(response.headers.get('location')).toBeNull();
  });

  it('does not accept a TikTok session cookie in place of a wallet session', async () => {
    const cookie = await encodeSession(profile);
    const response = await middleware(requestFor('/brand', { [SESSION_COOKIE]: cookie }));
    expect(isRedirectToSignIn(response)).toBe(true);
  });
});

describe('middleware — Content-Security-Policy nonce', () => {
  function extractNonce(csp: string): string | null {
    const match = csp.match(/script-src[^;]*'nonce-([^']+)'/);
    return match?.[1] ?? null;
  }

  it('attaches a nonce-based CSP (no unsafe-inline) to an allowed page response', async () => {
    const response = await middleware(requestFor('/'));
    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).not.toContain('unsafe-inline');
    expect(extractNonce(csp!)).not.toBeNull();
  });

  it('attaches a CSP header even to a sign-in redirect', async () => {
    const response = await middleware(requestFor('/dashboard'));
    expect(isRedirectToSignIn(response)).toBe(true);
    expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'self'");
  });

  it('uses a different nonce on every request', async () => {
    const first = extractNonce(
      (await middleware(requestFor('/'))).headers.get('Content-Security-Policy')!,
    );
    const second = extractNonce(
      (await middleware(requestFor('/'))).headers.get('Content-Security-Policy')!,
    );
    expect(first).not.toEqual(second);
  });
});

describe('middleware config.matcher', () => {
  const { source } = config.matcher[0] as { source: string };
  const matcher = new RegExp(`^${source}$`);

  it('matches ordinary pages', () => {
    expect(matcher.test('/')).toBe(true);
    expect(matcher.test('/dashboard')).toBe(true);
    expect(matcher.test('/some-creator')).toBe(true);
  });

  it('excludes API routes and Next internals so the CSP nonce work is skipped there', () => {
    expect(matcher.test('/api/tip')).toBe(false);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/_next/image')).toBe(false);
    expect(matcher.test('/favicon.ico')).toBe(false);
  });
});
