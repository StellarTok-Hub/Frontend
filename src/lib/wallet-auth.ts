import type { NextRequest } from 'next/server';
import { decodeWalletSession, WALLET_SESSION_COOKIE } from './session';

/**
 * Confirms the caller's signed wallet-session cookie matches the
 * `sourcePublicKey` they're asking a transaction to be built from. Without
 * this, /api/tip and /api/escrow/fund would build a transaction — which
 * requires loading account state from Horizon — for *any* public key a
 * caller supplies, not just their own connected wallet. That never risks
 * moving funds by itself (Freighter still has to sign the result), but it
 * turns the endpoint into an unauthenticated relay for probing arbitrary
 * Stellar accounts through this server. There's no reason to allow building
 * a transaction sourced from a wallet the caller hasn't connected.
 */
export async function ownsSourcePublicKey(
  request: NextRequest,
  sourcePublicKey: string,
): Promise<boolean> {
  const walletAddress = await decodeWalletSession(
    request.cookies.get(WALLET_SESSION_COOKIE)?.value,
  );
  return walletAddress !== null && walletAddress === sourcePublicKey;
}
