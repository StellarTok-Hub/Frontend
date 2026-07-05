import { env } from './env';

const TIKTOK_AUTHORIZE_URL = 'https://www.tiktok.com/v2/auth/authorize/';

/**
 * Builds the TikTok Login Kit authorization URL. The `state` should be a
 * per-session random value the callback route verifies to prevent CSRF.
 */
export function buildTikTokLoginUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: env.tiktokClientKey,
    scope: 'user.info.basic,video.list',
    response_type: 'code',
    redirect_uri: env.tiktokRedirectUri,
    state,
  });

  return `${TIKTOK_AUTHORIZE_URL}?${params.toString()}`;
}

export interface TikTokProfile {
  openId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export function isTikTokConfigured(): boolean {
  return Boolean(env.tiktokClientKey && env.tiktokRedirectUri);
}

const TIKTOK_USER_INFO_URL =
  'https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name,avatar_url';

/**
 * Server-only: exchanges an authorized access token for the TikTok profile
 * fields this app needs. Called from the OAuth callback route right after
 * the code-for-token exchange.
 */
export async function fetchTikTokProfile(accessToken: string): Promise<TikTokProfile> {
  const response = await fetch(TIKTOK_USER_INFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`TikTok user info request failed: ${response.status}`);
  }

  const body = await response.json();
  const user = body?.data?.user;
  if (!user?.open_id) {
    throw new Error('TikTok user info response was missing expected fields.');
  }

  return {
    openId: user.open_id,
    username: user.username ?? '',
    displayName: user.display_name ?? user.username ?? '',
    avatarUrl: user.avatar_url ?? '',
  };
}
