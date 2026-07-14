import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/session';
import { GET } from './route';

// Not exported from route.ts (kept as a local const there) — mirrored here
// rather than exported purely for a test to import, matching the sibling
// start route's own unexported copy of the same string.
const STATE_COOKIE = 'stellartok_oauth_state';

function callbackRequest(params: Record<string, string>, stateCookie?: string): NextRequest {
  const url = new URL('http://localhost/auth/callback/tiktok');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const headers = new Headers();
  if (stateCookie) headers.set('cookie', `${STATE_COOKIE}=${stateCookie}`);
  return new NextRequest(url, { headers });
}

function redirectErrorReason(response: Response): string | null {
  const location = response.headers.get('location');
  return location ? new URL(location).searchParams.get('error') : null;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /auth/callback/tiktok', () => {
  it('redirects with tiktok_auth_failed when the code param is missing', async () => {
    const response = await GET(callbackRequest({ state: 'abc' }, 'abc'));
    expect(redirectErrorReason(response)).toBe('tiktok_auth_failed');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects with invalid_state when there is no state cookie to compare against', async () => {
    const response = await GET(callbackRequest({ code: 'auth-code', state: 'abc' }));
    expect(redirectErrorReason(response)).toBe('invalid_state');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects with invalid_state when the state param doesn't match the cookie", async () => {
    const response = await GET(
      callbackRequest({ code: 'auth-code', state: 'attacker-supplied' }, 'real-state'),
    );
    expect(redirectErrorReason(response)).toBe('invalid_state');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects with tiktok_auth_failed when the token exchange fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }));
    const response = await GET(callbackRequest({ code: 'auth-code', state: 'abc' }, 'abc'));
    expect(redirectErrorReason(response)).toBe('tiktok_auth_failed');
  });

  it('redirects to /dashboard and sets a valid session cookie on success', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'token-123' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              user: {
                open_id: 'creator-123',
                username: 'creator',
                display_name: 'Creator',
                avatar_url: 'https://example.com/avatar.png',
              },
            },
          }),
          { status: 200 },
        ),
      );

    const response = await GET(callbackRequest({ code: 'auth-code', state: 'abc' }, 'abc'));

    expect(response.headers.get('location')).toBe('http://localhost/dashboard');
    const cookie = response.cookies.get(SESSION_COOKIE)?.value;
    expect(await decodeSession(cookie)).toEqual({
      openId: 'creator-123',
      username: 'creator',
      displayName: 'Creator',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });
});
