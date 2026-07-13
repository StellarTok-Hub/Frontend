import { describe, expect, it } from 'vitest';
import { decodeSession, decodeWalletSession, encodeSession, encodeWalletSession } from './session';
import type { TikTokProfile } from './tiktok';

const profile: TikTokProfile = {
  openId: 'creator-123',
  username: 'creator',
  displayName: 'Creator',
  avatarUrl: 'https://example.com/avatar.png',
};

const VALID_WALLET_ADDRESS = 'GAK5NC4G3IB4XQ54EIP7ZQ6NAMEB4C6MMMDDZ5B6LWTP4YFUCPYAWVU3';

/** Splits a `payload.signature` cookie, asserting both segments exist (they always do for a value we just signed). */
function splitCookie(cookie: string): [string, string] {
  const separatorIndex = cookie.lastIndexOf('.');
  if (separatorIndex === -1) throw new Error(`Not a signed cookie: ${cookie}`);
  return [cookie.slice(0, separatorIndex), cookie.slice(separatorIndex + 1)];
}

/**
 * Flips the *first* character of a base64url string. Flipping the last
 * character instead is unreliable here: the final character of a base64
 * group can encode "don't care" padding bits that get discarded on decode
 * (e.g. for a 32-byte HMAC-SHA256 signature, the last character only
 * carries 4 significant bits), so two different last characters can
 * legitimately decode to the identical byte string — which isn't tampering
 * at all, it's just an alternate encoding of the same bytes. The first
 * character is always byte-aligned and always significant.
 */
function flipFirstChar(value: string): string {
  return (value[0] === 'a' ? 'b' : 'a') + value.slice(1);
}

describe('encodeSession / decodeSession', () => {
  it('round-trips a valid signed session', async () => {
    const cookie = await encodeSession(profile);
    expect(await decodeSession(cookie)).toEqual(profile);
  });

  it('rejects a cookie with a tampered payload', async () => {
    const cookie = await encodeSession(profile);
    const [payload, signature] = splitCookie(cookie);
    expect(await decodeSession(`${flipFirstChar(payload)}.${signature}`)).toBeNull();
  });

  it('rejects a cookie with a tampered signature', async () => {
    const cookie = await encodeSession(profile);
    const [payload, signature] = splitCookie(cookie);
    expect(await decodeSession(`${payload}.${flipFirstChar(signature)}`)).toBeNull();
  });

  it('rejects a value that is missing the signature segment entirely', async () => {
    expect(await decodeSession('not-a-signed-cookie')).toBeNull();
  });
});

describe('encodeWalletSession / decodeWalletSession', () => {
  it('round-trips a valid Stellar public key', async () => {
    const cookie = await encodeWalletSession(VALID_WALLET_ADDRESS);
    expect(await decodeWalletSession(cookie)).toBe(VALID_WALLET_ADDRESS);
  });

  it('rejects a value that does not look like a Stellar public key', async () => {
    await expect(encodeWalletSession('not-a-public-key')).rejects.toThrow();
  });

  it('rejects a tampered wallet cookie', async () => {
    const cookie = await encodeWalletSession(VALID_WALLET_ADDRESS);
    const [payload, signature] = splitCookie(cookie);
    expect(await decodeWalletSession(`${payload}.${flipFirstChar(signature)}`)).toBeNull();
  });
});
