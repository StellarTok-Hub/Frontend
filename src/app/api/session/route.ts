import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/session';

export async function GET(request: NextRequest) {
  const profile = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ tiktokProfile: profile });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
