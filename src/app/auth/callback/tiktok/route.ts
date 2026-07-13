import { NextRequest, NextResponse } from 'next/server';
import { fetchTikTokProfile } from '@/lib/tiktok';
import { encodeSession, SESSION_COOKIE } from '@/lib/session';
import { serverEnv } from '@/lib/env.server';

const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const STATE_COOKIE = 'stellartok_oauth_state';

function redirectWithError(request: NextRequest, reason: string) {
  const url = new URL('/', request.url);
  url.searchParams.set('error', reason);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

/**
 * Exchanges the TikTok OAuth `code` for an access token server-side (the
 * client secret must never reach the browser), fetches the profile, and
 * stores it in a session cookie. Identity *linking* (associating this
 * TikTok profile with a connected Stellar wallet) happens client-side once
 * both pieces are present — see `AuthContext` — since that's where the
 * wallet address actually becomes known.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!code) return redirectWithError(request, 'tiktok_auth_failed');
  if (!state || !expectedState || state !== expectedState) {
    return redirectWithError(request, 'invalid_state');
  }

  try {
    const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY ?? '',
        client_secret: serverEnv.tiktokClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI ?? '',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`TikTok token exchange failed: ${tokenResponse.status}`);
    }

    const tokenBody = await tokenResponse.json();
    const accessToken = tokenBody.access_token;
    if (!accessToken) throw new Error('TikTok token response was missing access_token.');

    const profile = await fetchTikTokProfile(accessToken);

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.delete(STATE_COOKIE);
    response.cookies.set(SESSION_COOKIE, await encodeSession(profile), {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('TikTok auth callback failed', error);
    return redirectWithError(request, 'tiktok_auth_failed');
  }
}
