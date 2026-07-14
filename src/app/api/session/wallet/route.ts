import { NextRequest, NextResponse } from 'next/server';
import {
  encodeWalletSession,
  WALLET_SESSION_COOKIE,
  WALLET_SESSION_MAX_AGE_SECONDS,
} from '@/lib/session';
import { parseJsonBody } from '@/lib/request-json';

/**
 * Sets the signed wallet-session cookie once AuthContext has a Freighter
 * public key, so middleware can gate /brand server-side instead of relying
 * solely on the client-side BrandGate check.
 */
export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (body === null) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const { walletAddress } = body as { walletAddress?: string };
  if (!walletAddress) {
    return NextResponse.json({ error: 'Missing walletAddress.' }, { status: 400 });
  }

  let cookieValue: string;
  try {
    cookieValue = await encodeWalletSession(walletAddress);
  } catch {
    return NextResponse.json({ error: 'Not a valid Stellar public key.' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(WALLET_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: WALLET_SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(WALLET_SESSION_COOKIE);
  return response;
}
