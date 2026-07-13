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

  it('rejects a cookie with a tampered payload', async () => {
    const cookie = await encodeSession(profile);
    const [payload, signature] = cookie.split('.');
    const tamperedPayload = payload.slice(0, -1) + (payload.at(-1) === 'a' ? 'b' : 'a');
    expect(await decodeSession(`${tamperedPayload}.${signature}`)).toBeNull();
  });

  it('rejects a cookie with a tampered signature', async () => {
    const cookie = await encodeSession(profile);
    const [payload, signature] = cookie.split('.');
    const tamperedSignature = signature.slice(0, -1) + (signature.at(-1) === 'a' ? 'b' : 'a');
    expect(await decodeSession(`${payload}.${tamperedSignature}`)).toBeNull();
  });

  it('rejects a value that is missing the signature segment entirely', async () => {
    expect(await decodeSession('not-a-signed-cookie')).toBeNull();
  });
});
