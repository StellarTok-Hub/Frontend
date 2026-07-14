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
    const tampered = tamperSignature(sessionCookie);
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
