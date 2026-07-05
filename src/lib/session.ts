import type { TikTokProfile } from './tiktok';

export const SESSION_COOKIE = 'stellartok_session';

/**
 * Placeholder session encoding — base64 JSON, unsigned. It's fine for local
 * development because it only carries public-ish profile fields (no
 * secrets), but it is NOT tamper-proof: a user could edit this cookie to
 * claim a different TikTok identity client-side. Before this links to
 * anything that moves money, replace this with a signed/encrypted session
 * (e.g. `iron-session`, or a JWT signed with a server secret) so the value
 * can't be forged.
 */
export function encodeSession(profile: TikTokProfile): string {
  return Buffer.from(JSON.stringify(profile)).toString('base64');
}

export function decodeSession(value: string | undefined): TikTokProfile | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64').toString('utf-8'));
    if (typeof parsed?.openId !== 'string') return null;
    return parsed as TikTokProfile;
  } catch {
    return null;
  }
}
