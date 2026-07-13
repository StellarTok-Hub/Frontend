import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Account, TransactionBuilder } from '@stellar/stellar-sdk';
import { networkPassphrase } from './stellar-network';

const loadAccountMock = vi.fn();
const submitTransactionMock = vi.fn();

/**
 * Only Horizon.Server is mocked (avoids a real network call to Horizon) —
 * everything else (Account, Asset, Operation, TransactionBuilder) is the
 * real SDK, so the built XDR is real and can be decoded back and asserted
 * on rather than just checking that some string came out.
 */
vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      // Must be a real constructor function, not an arrow function — the
      // real code does `new Horizon.Server(...)`.
      Server: vi.fn().mockImplementation(function MockServer() {
        return { loadAccount: loadAccountMock, submitTransaction: submitTransactionMock };
      }),
    },
  };
});

const {
  buildPaymentTransaction,
  submitSignedTransaction,
  describeSubmissionError,
  InvalidPaymentError,
} = await import('./stellar');

const SOURCE = 'GBRVNONUCMSB3ARYCNXH35FUBRYWABMTZH6ABOPLP7IXHWHVIB3OT3EG';
const DEST = 'GDL6PDJP4I5MF6FIODERJDGHTJ3H57PRMI367FGW2R7CHKSDSJNX7PSV';

beforeEach(() => {
  loadAccountMock.mockReset();
  submitTransactionMock.mockReset();
});

describe('buildPaymentTransaction', () => {
  it('builds an XLM payment against the loaded source account', async () => {
    loadAccountMock.mockResolvedValue(new Account(SOURCE, '100'));

    const xdr = await buildPaymentTransaction({
      sourcePublicKey: SOURCE,
      destinationPublicKey: DEST,
      asset: 'XLM',
      amount: '5',
    });

    expect(loadAccountMock).toHaveBeenCalledWith(SOURCE);

    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    expect(tx.operations).toHaveLength(1);
    const [op] = tx.operations;
    if (op.type !== 'payment') throw new Error('expected a payment operation');
    expect(op.destination).toBe(DEST);
    expect(op.amount).toBe('5.0000000');
    expect(op.asset.isNative()).toBe(true);
  });

  it('resolves USDC to the configured testnet issuer', async () => {
    loadAccountMock.mockResolvedValue(new Account(SOURCE, '100'));

    const xdr = await buildPaymentTransaction({
      sourcePublicKey: SOURCE,
      destinationPublicKey: DEST,
      asset: 'USDC',
      amount: '10',
    });

    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    const [op] = tx.operations;
    if (op.type !== 'payment') throw new Error('expected a payment operation');
    expect(op.asset.isNative()).toBe(false);
    expect(op.asset.getCode()).toBe('USDC');
    expect(op.asset.getIssuer()).toBe(process.env.STELLAR_USDC_ISSUER_TESTNET);
  });

  it('rejects an invalid amount before ever calling loadAccount', async () => {
    await expect(
      buildPaymentTransaction({
        sourcePublicKey: SOURCE,
        destinationPublicKey: DEST,
        asset: 'XLM',
        amount: 'not-a-number',
      }),
    ).rejects.toThrow(InvalidPaymentError);

    expect(loadAccountMock).not.toHaveBeenCalled();
  });

  it('truncates a memo to the 28-byte Stellar text-memo limit', async () => {
    loadAccountMock.mockResolvedValue(new Account(SOURCE, '100'));

    const longMemo = 'this_memo_is_way_longer_than_the_stellar_limit';
    const xdr = await buildPaymentTransaction({
      sourcePublicKey: SOURCE,
      destinationPublicKey: DEST,
      asset: 'XLM',
      amount: '1',
      memo: longMemo,
    });

    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    expect(tx.memo.type).toBe('text');
    expect(String(tx.memo.value)).toBe(longMemo.slice(0, 28));
  });

  it('omits the memo when none is given', async () => {
    loadAccountMock.mockResolvedValue(new Account(SOURCE, '100'));

    const xdr = await buildPaymentTransaction({
      sourcePublicKey: SOURCE,
      destinationPublicKey: DEST,
      asset: 'XLM',
      amount: '1',
    });

    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    expect(tx.memo.type).toBe('none');
  });
});

describe('submitSignedTransaction', () => {
  it('parses the XDR and returns the hash Horizon reports', async () => {
    loadAccountMock.mockResolvedValue(new Account(SOURCE, '100'));
    const xdr = await buildPaymentTransaction({
      sourcePublicKey: SOURCE,
      destinationPublicKey: DEST,
      asset: 'XLM',
      amount: '1',
    });
    submitTransactionMock.mockResolvedValue({ hash: 'abc123hash' });

    const hash = await submitSignedTransaction(xdr);

    expect(hash).toBe('abc123hash');
    expect(submitTransactionMock).toHaveBeenCalledTimes(1);
  });
});

describe('describeSubmissionError', () => {
  it('maps op_no_trust to a friendly trustline message', () => {
    const error = {
      response: { data: { extras: { result_codes: { operations: ['op_no_trust'] } } } },
    };
    expect(describeSubmissionError(error)).toMatch(/trustline/i);
  });

  it('falls back to a generic message for unrecognized errors', () => {
    expect(describeSubmissionError(new Error('boom'))).toBe('Could not submit the transaction.');
  });
});
