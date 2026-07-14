import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  encodeSession,
  encodeWalletSession,
  SESSION_COOKIE,
  WALLET_SESSION_COOKIE,
} from '@/lib/session';
import type { TikTokProfile } from '@/lib/tiktok';
import { middleware } from './middleware';

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

describe('middleware — /dashboard (guardDashboard)', () => {
  it('redirects to sign-in when there is no session cookie', async () => {
    const response = await middleware(requestFor('/dashboard'));
    expect(isRedirectToSignIn(response)).toBe(true);
  });

  it('redirects to sign-in when the session cookie is tampered', async () => {
    const valid = await encodeSession(profile);
    const tampered = valid.slice(0, -1) + (valid.endsWith('a') ? 'b' : 'a');
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
    const tampered = valid.slice(0, -1) + (valid.endsWith('a') ? 'b' : 'a');
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
