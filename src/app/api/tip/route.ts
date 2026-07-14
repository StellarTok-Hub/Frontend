import { NextRequest, NextResponse } from 'next/server';
import { buildPaymentTransaction, InvalidPaymentError } from '@/lib/stellar';
import { getClientKey, isRateLimited } from '@/lib/rate-limit';
import { parseJsonBody } from '@/lib/request-json';
import { ownsSourcePublicKey } from '@/lib/wallet-auth';
import type { StellarAsset } from '@/types';

const VALID_TIP_MEMOS = new Set(['play_sound', 'confetti', 'shoutout']);

interface TipRequestBody {
  sourcePublicKey?: string;
  destinationPublicKey?: string;
  asset?: StellarAsset;
  amount?: string;
  memo?: string;
}

/**
 * Builds an unsigned tip transaction server-side. Building requires loading
 * the source account's current sequence number from Horizon, which has no
 * reason to happen in the browser — this keeps `@stellar/stellar-sdk`
 * (and its native crypto dependencies) out of the client bundle entirely.
 * The client only ever receives an unsigned XDR envelope to hand to Freighter.
 */
export async function POST(request: NextRequest) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json({ error: 'Too many requests — try again shortly.' }, { status: 429 });
  }

  const body = await parseJsonBody(request);
  if (body === null) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const { sourcePublicKey, destinationPublicKey, asset, amount, memo } = body as TipRequestBody;

  if (!sourcePublicKey || !destinationPublicKey || !asset || !amount) {
    return NextResponse.json({ error: 'Missing required tip fields.' }, { status: 400 });
  }

  if (!(await ownsSourcePublicKey(request, sourcePublicKey))) {
    return NextResponse.json(
      { error: 'sourcePublicKey must match your connected wallet session.' },
      { status: 401 },
    );
  }

  if (memo !== undefined && !VALID_TIP_MEMOS.has(memo)) {
    return NextResponse.json({ error: 'Unrecognized alert label.' }, { status: 400 });
  }

  try {
    const xdr = await buildPaymentTransaction({
      sourcePublicKey,
      destinationPublicKey,
      asset,
      amount,
      memo,
    });
    return NextResponse.json({ xdr });
  } catch (error) {
    if (error instanceof InvalidPaymentError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to build tip transaction', error);
    return NextResponse.json({ error: 'Could not build the tip transaction.' }, { status: 502 });
  }
}
