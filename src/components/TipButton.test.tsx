// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TipButton } from './TipButton';

afterEach(cleanup);

const connectWallet = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    walletAddress: 'GAK5NC4G3IB4XQ54EIP7ZQ6NAMEB4C6MMMDDZ5B6LWTP4YFUCPYAWVU3',
    connectWallet,
  }),
}));

const buildTipViaApi = vi.fn().mockResolvedValue('unsigned-xdr');
const submitPaymentViaApi = vi.fn().mockResolvedValue('tx-hash');
vi.mock('@/lib/stellar-client', () => ({
  buildTipViaApi: (...args: unknown[]) => buildTipViaApi(...args),
  submitPaymentViaApi: (...args: unknown[]) => submitPaymentViaApi(...args),
}));

vi.mock('@/lib/freighter', () => ({
  signTransactionXdr: vi.fn().mockResolvedValue('signed-xdr'),
}));

describe('TipButton', () => {
  it('opens the tip form on click', async () => {
    const user = userEvent.setup();
    render(<TipButton creatorWalletAddress="GDEST...WALLET" videoId="v1" />);

    await user.click(screen.getByRole('button', { name: 'Send Tip' }));

    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  });

  it('shows a validation error and disables submit for an invalid amount', async () => {
    const user = userEvent.setup();
    render(<TipButton creatorWalletAddress="GDEST...WALLET" videoId="v1" />);
    await user.click(screen.getByRole('button', { name: 'Send Tip' }));

    const amountInput = screen.getByLabelText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '0');

    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tip 0/ })).toBeDisabled();
  });

  it('runs build → sign → submit for a valid tip', async () => {
    const user = userEvent.setup();
    render(<TipButton creatorWalletAddress="GDEST...WALLET" videoId="v1" />);
    await user.click(screen.getByRole('button', { name: 'Send Tip' }));

    await user.click(screen.getByRole('button', { name: /Tip 5 USDC/ }));

    await waitFor(() => expect(submitPaymentViaApi).toHaveBeenCalledWith('signed-xdr'));
    expect(buildTipViaApi).toHaveBeenCalledWith(
      expect.objectContaining({ destinationPublicKey: 'GDEST...WALLET', amount: '5' }),
    );
    expect(await screen.findByText('Tip sent ✓')).toBeInTheDocument();
  });
});
