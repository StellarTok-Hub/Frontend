'use client';

import type { StellarAsset } from '@/types';

interface ApiErrorBody {
  error: string;
}

async function postJson<T>(url: string, payload: unknown, resultKey: keyof T): Promise<T[keyof T]> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as T & Partial<ApiErrorBody>;
  if (!response.ok || !data[resultKey]) {
    throw new Error(data.error ?? 'Something went wrong talking to the server.');
  }
  return data[resultKey];
}

export interface BuildPaymentPayload {
  sourcePublicKey: string;
  destinationPublicKey: string;
  asset: StellarAsset;
  amount: string;
  memo?: string;
}

export function buildTipViaApi(payload: BuildPaymentPayload): Promise<string> {
  return postJson<{ xdr: string }>('/api/tip', payload, 'xdr');
}

export function buildEscrowFundingViaApi(payload: BuildPaymentPayload): Promise<string> {
  return postJson<{ xdr: string }>('/api/escrow/fund', payload, 'xdr');
}

export function submitPaymentViaApi(signedXdr: string): Promise<string> {
  return postJson<{ hash: string }>('/api/stellar/submit', { signedXdr }, 'hash');
}
