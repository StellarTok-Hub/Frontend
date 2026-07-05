import { NextRequest, NextResponse } from 'next/server';
import { buildTikTokLoginUrl } from '@/lib/tiktok';

const STATE_COOKIE = 'stellartok_oauth_state';

/**
 * Starts the TikTok Login Kit flow. Generating the CSRF `state` value here
 * (server-side, in an httpOnly cookie) rather than in client JS means it
 * can't be read or tampered with by a script running on the page.
 */
export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();

  const response = NextResponse.redirect(buildTikTokLoginUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });
  return response;
}
