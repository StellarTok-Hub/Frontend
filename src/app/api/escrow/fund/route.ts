import { NextRequest, NextResponse } from 'next/server';
import { buildPaymentTransaction, InvalidPaymentError } from '@/lib/stellar';
import { getClientKey, isRateLimited } from '@/lib/rate-limit';
import { parseJsonBody } from '@/lib/request-json';
import { ownsSourcePublicKey } from '@/lib/wallet-auth';
import type { StellarAsset } from '@/types';

interface EscrowFundRequestBody {
  sourcePublicKey?: string;
  destinationPublicKey?: string;
  asset?: StellarAsset;
  amount?: string;
  memo?: string;
}

/**
 * Builds an unsigned payment transaction funding a brand's escrow deposit.
 * The destination must be an escrow address the backend has already
 * allocated for a specific challenge — this route does not create escrow
 * accounts, it only builds the funding transfer into one that exists.
 */
export async function POST(request: NextRequest) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json({ error: 'Too many requests — try again shortly.' }, { status: 429 });
  }

  const body = await parseJsonBody(request);
  if (body === null) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const { sourcePublicKey, destinationPublicKey, asset, amount, memo } =
    body as EscrowFundRequestBody;

  if (!sourcePublicKey || !destinationPublicKey || !asset || !amount) {
    return NextResponse.json({ error: 'Missing required escrow funding fields.' }, { status: 400 });
  }

  if (!(await ownsSourcePublicKey(request, sourcePublicKey))) {
    return NextResponse.json(
      { error: 'sourcePublicKey must match your connected wallet session.' },
      { status: 401 },
    );
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
    console.error('Failed to build escrow funding transaction', error);
    return NextResponse.json(
      { error: 'Could not build the escrow funding transaction.' },
      { status: 502 },
    );
  }
}
