import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { decodeWalletSession, WALLET_SESSION_COOKIE } from '@/lib/session';
import { DELETE, POST } from './route';

const WALLET_ADDRESS = 'GBRVNONUCMSB3ARYCNXH35FUBRYWABMTZH6ABOPLP7IXHWHVIB3OT3EG';

function walletRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/session/wallet', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function malformedJsonRequest(): NextRequest {
  return new NextRequest('http://localhost/api/session/wallet', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not valid json',
  });
}

describe('POST /api/session/wallet', () => {
  it('sets a signed wallet-session cookie for a valid Stellar public key', async () => {
    const response = await POST(walletRequest({ walletAddress: WALLET_ADDRESS }));
    expect(await response.json()).toEqual({ ok: true });
    const cookie = response.cookies.get(WALLET_SESSION_COOKIE)?.value;
    expect(await decodeWalletSession(cookie)).toBe(WALLET_ADDRESS);
  });

  it('400s for a value that is not a valid Stellar public key', async () => {
    const response = await POST(walletRequest({ walletAddress: 'not-a-public-key' }));
    expect(response.status).toBe(400);
    expect(response.cookies.get(WALLET_SESSION_COOKIE)).toBeUndefined();
  });

  it('400s when walletAddress is missing', async () => {
    const response = await POST(walletRequest({}));
    expect(response.status).toBe(400);
  });

  it('400s on a malformed JSON body', async () => {
    const response = await POST(malformedJsonRequest());
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/session/wallet', () => {
  it('clears the wallet-session cookie', async () => {
    const response = await DELETE();
    expect(await response.json()).toEqual({ ok: true });
    expect(response.cookies.get(WALLET_SESSION_COOKIE)?.value).toBe('');
  });
});
