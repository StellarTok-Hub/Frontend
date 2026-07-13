import { NextRequest, NextResponse } from 'next/server';
import {
  decodeSession,
  decodeWalletSession,
  SESSION_COOKIE,
  WALLET_SESSION_COOKIE,
} from '@/lib/session';

export async function GET(request: NextRequest) {
  const [profile, walletAddress] = await Promise.all([
    decodeSession(request.cookies.get(SESSION_COOKIE)?.value),
    decodeWalletSession(request.cookies.get(WALLET_SESSION_COOKIE)?.value),
  ]);
  return NextResponse.json({ tiktokProfile: profile, walletAddress });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
