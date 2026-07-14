import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildEscrowFundingViaApi, buildTipViaApi, submitPaymentViaApi } from './stellar-client';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const payload = {
  sourcePublicKey: 'GSOURCE',
  destinationPublicKey: 'GDEST',
  asset: 'XLM' as const,
  amount: '5',
};

describe('buildTipViaApi', () => {
  it('POSTs to /api/tip and resolves with the xdr on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { xdr: 'AAAA...' }));
    await expect(buildTipViaApi(payload)).resolves.toBe('AAAA...');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tip',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  });

  it('rejects with the server-provided error message on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: 'Missing required tip fields.' }));
    await expect(buildTipViaApi(payload)).rejects.toThrow('Missing required tip fields.');
  });

  it('rejects with a generic message when the response has no error field', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}));
    await expect(buildTipViaApi(payload)).rejects.toThrow(
      'Something went wrong talking to the server.',
    );
  });

  it('rejects if the response is ok but missing the expected xdr key', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    await expect(buildTipViaApi(payload)).rejects.toThrow(
      'Something went wrong talking to the server.',
    );
  });
});

describe('buildEscrowFundingViaApi', () => {
  it('POSTs to /api/escrow/fund and resolves with the xdr', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { xdr: 'BBBB...' }));
    await expect(buildEscrowFundingViaApi(payload)).resolves.toBe('BBBB...');
    expect(fetchMock).toHaveBeenCalledWith('/api/escrow/fund', expect.any(Object));
  });
});

describe('submitPaymentViaApi', () => {
  it('POSTs the signed xdr to /api/stellar/submit and resolves with the tx hash', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { hash: 'deadbeef' }));
    await expect(submitPaymentViaApi('SIGNED_XDR')).resolves.toBe('deadbeef');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/stellar/submit',
      expect.objectContaining({ body: JSON.stringify({ signedXdr: 'SIGNED_XDR' }) }),
    );
  });
});
