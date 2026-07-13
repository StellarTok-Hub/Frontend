import { beforeAll, describe, expect, it } from 'vitest';
import { decodeSession, encodeSession } from './session';
import type { TikTokProfile } from './tiktok';

const profile: TikTokProfile = {
  openId: 'creator-123',
  username: 'creator',
  displayName: 'Creator',
  avatarUrl: 'https://example.com/avatar.png',
};

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-'.repeat(4);
});

describe('encodeSession / decodeSession', () => {
  it('round-trips a valid signed session', async () => {
    const cookie = await encodeSession(profile);
    expect(await decodeSession(cookie)).toEqual(profile);
  });
});
