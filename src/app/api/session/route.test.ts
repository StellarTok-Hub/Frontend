import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  encodeSession,
  encodeWalletSession,
  SESSION_COOKIE,
  WALLET_SESSION_COOKIE,
} from '@/lib/session';
import type { TikTokProfile } from '@/lib/tiktok';
import { DELETE, GET } from './route';

const profile: TikTokProfile = {
  openId: 'creator-123',
  username: 'creator',
  displayName: 'Creator',
  avatarUrl: 'https://example.com/avatar.png',
};
const WALLET_ADDRESS = 'GBRVNONUCMSB3ARYCNXH35FUBRYWABMTZH6ABOPLP7IXHWHVIB3OT3EG';

function sessionRequest(cookies: Record<string, string> = {}): NextRequest {
  const headers = new Headers();
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  if (cookieHeader) headers.set('cookie', cookieHeader);
  return new NextRequest('http://localhost/api/session', { headers });
}

describe('GET /api/session', () => {
  it('returns nulls when there are no session cookies', async () => {
    const response = await GET(sessionRequest());
    expect(await response.json()).toEqual({ tiktokProfile: null, walletAddress: null });
  });

  it('returns the decoded TikTok profile and wallet address when both cookies are valid', async () => {
    const sessionCookie = await encodeSession(profile);
    const walletCookie = await encodeWalletSession(WALLET_ADDRESS);
    const response = await GET(
      sessionRequest({ [SESSION_COOKIE]: sessionCookie, [WALLET_SESSION_COOKIE]: walletCookie }),
    );
    expect(await response.json()).toEqual({
      tiktokProfile: profile,
      walletAddress: WALLET_ADDRESS,
    });
  });

  it('returns null for a tampered session cookie without throwing', async () => {
    const sessionCookie = await encodeSession(profile);
    const tampered = sessionCookie.slice(0, -1) + (sessionCookie.endsWith('a') ? 'b' : 'a');
    const response = await GET(sessionRequest({ [SESSION_COOKIE]: tampered }));
    expect(await response.json()).toEqual({ tiktokProfile: null, walletAddress: null });
  });
});

describe('DELETE /api/session', () => {
  it('clears the session cookie', async () => {
    const response = await DELETE();
    expect(await response.json()).toEqual({ ok: true });
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBe('');
  });
});
