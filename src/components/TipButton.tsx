'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { networkPassphrase } from '@/lib/stellar-network';
import { signTransactionXdr } from '@/lib/freighter';
import { buildTipViaApi, submitPaymentViaApi } from '@/lib/stellar-client';
import { validatePaymentAmount } from '@/lib/payment-validation';
import type { AlertLabel, StellarAsset } from '@/types';

interface TipButtonProps {
  creatorWalletAddress: string;
  videoId: string;
}

type Status = 'idle' | 'open' | 'building' | 'signing' | 'submitting' | 'success' | 'error';

const LABEL_OPTIONS: { value: AlertLabel; title: string }[] = [
  { value: 'none', title: 'Just a tip' },
  { value: 'play_sound', title: 'Play sound on stream' },
  { value: 'confetti', title: 'Confetti on stream' },
  { value: 'shoutout', title: 'Shoutout on stream' },
];

export function TipButton({ creatorWalletAddress, videoId }: TipButtonProps) {
  const { walletAddress, connectWallet } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [asset, setAsset] = useState<StellarAsset>('USDC');
  const [amount, setAmount] = useState('5');
  const [label, setLabel] = useState<AlertLabel>('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amountError = validatePaymentAmount(amount);

  async function handleSendTip() {
    if (!walletAddress) {
      await connectWallet();
      return;
    }
    if (amountError) return;

    setErrorMessage(null);
    try {
      setStatus('building');
      const xdr = await buildTipViaApi({
        sourcePublicKey: walletAddress,
        destinationPublicKey: creatorWalletAddress,
        asset,
        amount,
        memo: label !== 'none' ? label : undefined,
      });

      setStatus('signing');
      const signedXdr = await signTransactionXdr(xdr, { networkPassphrase });

      setStatus('submitting');
      await submitPaymentViaApi(signedXdr);

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Tip failed — please try again.');
    }
  }

  if (status === 'idle') {
    return (
      <Button type="button" size="sm" onClick={() => setStatus('open')} data-video-id={videoId}>
        Send Tip
      </Button>
    );
  }

  if (status === 'success') {
    return (
      <Button type="button" size="sm" variant="secondary" disabled>
        Tip sent ✓
      </Button>
    );
  }

  const isBusy = status === 'building' || status === 'signing' || status === 'submitting';

  return (
    <div className="w-64 rounded-xl border border-white/10 bg-ink-900 p-4">
      <div className="mb-3 flex gap-2" role="group" aria-label="Asset">
        {(['USDC', 'XLM'] as StellarAsset[]).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={asset === option}
            onClick={() => setAsset(option)}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              asset === option ? 'bg-brand text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs text-white/50" htmlFor={`tip-amount-${videoId}`}>
          Amount
        </label>
        <input
          id={`tip-amount-${videoId}`}
          type="number"
          min="0.0000001"
          step="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={Boolean(amountError)}
          className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white"
          placeholder="Amount"
        />
        {amountError && <p className="mt-1 text-xs text-amber-400">{amountError}</p>}
      </div>

      <label className="mb-1 block text-xs text-white/50" htmlFor={`tip-alert-${videoId}`}>
        Stream alert
      </label>
      <select
        id={`tip-alert-${videoId}`}
        value={label}
        onChange={(e) => setLabel(e.target.value as AlertLabel)}
        className="mb-3 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white"
      >
        {LABEL_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.title}
          </option>
        ))}
      </select>

      {errorMessage && <p className="mb-2 text-xs text-red-400">{errorMessage}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setStatus('idle')}
          disabled={isBusy}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          onClick={handleSendTip}
          isLoading={isBusy}
          disabled={Boolean(amountError)}
        >
          {isBusy ? 'Confirm in Freighter…' : `Tip ${amount} ${asset}`}
        </Button>
      </div>
    </div>
  );
}
