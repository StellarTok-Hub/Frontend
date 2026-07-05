/**
 * Server-only. This module pulls in `@stellar/stellar-sdk`, which bundles
 * native crypto dependencies — it must only be imported from Route Handlers
 * (see `src/app/api/**`), never from a client component. Client code that
 * needs the network passphrase should import `./stellar-network` instead.
 */
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { env } from './env';
import { serverEnv } from './env.server';
import { networkPassphrase } from './stellar-network';
import { assertValidPaymentAmount, InvalidPaymentError } from './payment-validation';
import type { StellarAsset } from '@/types';

export { InvalidPaymentError };

const server = new Horizon.Server(env.horizonUrl);

function resolveAsset(asset: StellarAsset): Asset {
  if (asset === 'XLM') return Asset.native();

  const issuer =
    env.stellarNetwork === 'public' ? serverEnv.usdcIssuerMainnet : serverEnv.usdcIssuerTestnet;

  if (!issuer) {
    throw new InvalidPaymentError(
      `USDC is not configured for the ${env.stellarNetwork} network. Set ` +
        `STELLAR_USDC_ISSUER_${env.stellarNetwork === 'public' ? 'MAINNET' : 'TESTNET'} ` +
        'after verifying the issuer address independently — there is no safe default.',
    );
  }

  return new Asset('USDC', issuer);
}

export interface BuildPaymentParams {
  sourcePublicKey: string;
  destinationPublicKey: string;
  asset: StellarAsset;
  amount: string;
  /** Attached to the tx memo — e.g. "play_sound" to trigger a live-stream alert. */
  memo?: string;
}

/**
 * Builds an unsigned payment transaction for Freighter to sign. Used for
 * both viewer tips (Feature 1) and brand escrow funding (Feature 3) — this
 * never touches a private key, it only assembles the XDR envelope.
 */
export async function buildPaymentTransaction({
  sourcePublicKey,
  destinationPublicKey,
  asset,
  amount,
  memo,
}: BuildPaymentParams): Promise<string> {
  assertValidPaymentAmount(amount);

  const sourceAccount = await server.loadAccount(sourcePublicKey);

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: destinationPublicKey,
        asset: resolveAsset(asset),
        amount,
      }),
    )
    .addMemo(memo ? Memo.text(memo.slice(0, 28)) : Memo.none())
    .setTimeout(60)
    .build();

  return transaction.toXDR();
}

interface HorizonResultCodes {
  transaction?: string;
  operations?: string[];
}

function extractResultCodes(error: unknown): HorizonResultCodes | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const response = (
    error as { response?: { data?: { extras?: { result_codes?: HorizonResultCodes } } } }
  ).response;
  return response?.data?.extras?.result_codes;
}

const OPERATION_ERROR_MESSAGES: Record<string, string> = {
  op_no_trust: "This wallet hasn't set up a trustline for this asset yet — try a different asset.",
  op_underfunded: 'Insufficient balance to cover this payment.',
  op_no_destination: "The destination account doesn't exist on this network yet.",
  op_line_full: "The destination's trustline is full and can't accept more of this asset.",
};

/**
 * Turns a raw Horizon submission failure into a message a user can act on.
 * Falls back to a generic message for codes we don't have specific copy for.
 */
export function describeSubmissionError(error: unknown): string {
  const codes = extractResultCodes(error);
  const operationCode = codes?.operations?.[0];
  if (operationCode && OPERATION_ERROR_MESSAGES[operationCode]) {
    return OPERATION_ERROR_MESSAGES[operationCode];
  }
  if (codes?.transaction) {
    return `Transaction rejected by the network (${codes.transaction}).`;
  }
  return 'Could not submit the transaction.';
}

export async function submitSignedTransaction(signedXdr: string): Promise<string> {
  const transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const result = await server.submitTransaction(transaction);
  return result.hash;
}
