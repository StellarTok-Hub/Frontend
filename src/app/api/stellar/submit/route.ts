import { NextRequest, NextResponse } from 'next/server';
import { describeSubmissionError, submitSignedTransaction } from '@/lib/stellar';
import { getClientKey, isRateLimited } from '@/lib/rate-limit';
import { parseJsonBody } from '@/lib/request-json';

/**
 * Submits an already-signed transaction to Horizon server-side, for the
 * same bundle-size reason as the build route — the client only ever holds
 * XDR strings, never the Stellar SDK itself. Shared by both the tip flow
 * and the brand escrow-funding flow, since submission is asset-agnostic.
 *
 * This is rate-limited but not authenticated: a signed transaction is
 * already user-authorized by definition, so relaying it isn't a
 * confidentiality risk, but an unthrottled version of this endpoint would
 * be a free relay to Horizon for anyone, not just this app's users.
 */
export async function POST(request: NextRequest) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json({ error: 'Too many requests — try again shortly.' }, { status: 429 });
  }

  const body = await parseJsonBody(request);
  if (body === null) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const { signedXdr } = body as { signedXdr?: string };

  if (!signedXdr) {
    return NextResponse.json({ error: 'Missing signedXdr.' }, { status: 400 });
  }

  try {
    const hash = await submitSignedTransaction(signedXdr);
    return NextResponse.json({ hash });
  } catch (error) {
    console.error('Failed to submit transaction', error);
    return NextResponse.json({ error: describeSubmissionError(error) }, { status: 502 });
  }
}
