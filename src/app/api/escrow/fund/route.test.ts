import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Account } from '@stellar/stellar-sdk';
import type * as StellarSdk from '@stellar/stellar-sdk';
import { NextRequest } from 'next/server';
import { encodeWalletSession, WALLET_SESSION_COOKIE } from '@/lib/session';

const loadAccountMock = vi.fn();

/** Same mocking approach as stellar.test.ts — avoids a real Horizon network call. */
vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof StellarSdk>();
  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      Server: vi.fn().mockImplementation(function MockServer() {
        return { loadAccount: loadAccountMock };
      }),
    },
  };
});

const { POST } = await import('./route');

const SOURCE = 'GBRVNONUCMSB3ARYCNXH35FUBRYWABMTZH6ABOPLP7IXHWHVIB3OT3EG';
const OTHER_WALLET = 'GDL6PDJP4I5MF6FIODERJDGHTJ3H57PRMI367FGW2R7CHKSDSJNX7PSV';
const ESCROW = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';

let requestCounter = 0;

function escrowFundRequest(body: unknown, cookieValue?: string): NextRequest {
  requestCounter++;
  const headers = new Headers({
    'content-type': 'application/json',
    'x-forwarded-for': `10.0.1.${requestCounter}`,
  });
  if (cookieValue) headers.set('cookie', `${WALLET_SESSION_COOKIE}=${cookieValue}`);
  return new NextRequest('http://localhost/api/escrow/fund', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  loadAccountMock.mockReset();
  loadAccountMock.mockResolvedValue(new Account(SOURCE, '100'));
});

describe('POST /api/escrow/fund', () => {
  it('401s when there is no wallet-session cookie at all', async () => {
    const response = await POST(
      escrowFundRequest({
        sourcePublicKey: SOURCE,
        destinationPublicKey: ESCROW,
        asset: 'XLM',
        amount: '500',
      }),
    );
    expect(response.status).toBe(401);
    expect(loadAccountMock).not.toHaveBeenCalled();
  });

  it("401s when sourcePublicKey does not match the caller's connected wallet", async () => {
    const cookie = await encodeWalletSession(OTHER_WALLET);
    const response = await POST(
      escrowFundRequest(
        { sourcePublicKey: SOURCE, destinationPublicKey: ESCROW, asset: 'XLM', amount: '500' },
        cookie,
      ),
    );
    expect(response.status).toBe(401);
    expect(loadAccountMock).not.toHaveBeenCalled();
  });

  it('builds the transaction when sourcePublicKey matches the wallet-session cookie', async () => {
    const cookie = await encodeWalletSession(SOURCE);
    const response = await POST(
      escrowFundRequest(
        { sourcePublicKey: SOURCE, destinationPublicKey: ESCROW, asset: 'XLM', amount: '500' },
        cookie,
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.xdr).toBe('string');
    expect(loadAccountMock).toHaveBeenCalledWith(SOURCE);
  });
});
