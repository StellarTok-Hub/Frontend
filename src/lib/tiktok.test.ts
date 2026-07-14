import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTikTokLoginUrl, fetchTikTokProfile, isTikTokConfigured } from './tiktok';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('buildTikTokLoginUrl', () => {
  it('builds an authorize URL carrying the given state and the OAuth scopes this app needs', () => {
    const url = new URL(buildTikTokLoginUrl('csrf-state-123'));
    expect(url.origin + url.pathname).toBe('https://www.tiktok.com/v2/auth/authorize/');
    expect(url.searchParams.get('state')).toBe('csrf-state-123');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('user.info.basic,video.list');
  });
});

describe('isTikTokConfigured', () => {
  // env.tiktokClientKey/tiktokRedirectUri are unset in the test environment
  // (src/test/setup.ts only sets SESSION_SECRET and the USDC issuer), so
  // this reflects that default, unconfigured state.
  it('is false when no TikTok client key/redirect URI is configured', () => {
    expect(isTikTokConfigured()).toBe(false);
  });
});

describe('fetchTikTokProfile', () => {
  it('maps a successful TikTok user-info response to a TikTokProfile', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          user: {
            open_id: 'open-1',
            username: 'creator',
            display_name: 'Creator Name',
            avatar_url: 'https://example.com/a.png',
          },
        },
      }),
    });

    await expect(fetchTikTokProfile('token')).resolves.toEqual({
      openId: 'open-1',
      username: 'creator',
      displayName: 'Creator Name',
      avatarUrl: 'https://example.com/a.png',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://open.tiktokapis.com/v2/user/info/'),
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
  });

  it('falls back to username, then empty string, for a missing display_name', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { user: { open_id: 'open-1', username: 'creator' } } }),
    });
    await expect(fetchTikTokProfile('token')).resolves.toMatchObject({
      displayName: 'creator',
      avatarUrl: '',
    });
  });

  it('rejects when the HTTP response is not ok', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    await expect(fetchTikTokProfile('bad-token')).rejects.toThrow(
      'TikTok user info request failed: 401',
    );
  });

  it('rejects when the response is missing open_id', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { user: {} } }) });
    await expect(fetchTikTokProfile('token')).rejects.toThrow(
      'TikTok user info response was missing expected fields.',
    );
  });
});
