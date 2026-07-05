'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createChallenge } from '@/lib/api';
import { buildEscrowFundingViaApi, submitPaymentViaApi } from '@/lib/stellar-client';
import { signTransactionXdr } from '@/lib/freighter';
import { networkPassphrase } from '@/lib/stellar-network';
import { validatePaymentAmount } from '@/lib/payment-validation';
import type { StellarAsset } from '@/types';

type Stage = 'idle' | 'creating' | 'funding' | 'signing' | 'submitting' | 'done';

export default function NewCampaignPage() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    hashtag: '',
    rewardAmount: '25',
    rewardAsset: 'USDC' as StellarAsset,
    slotsTotal: '100',
    deadline: '',
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const totalAmount = String(Number(form.rewardAmount) * Number(form.slotsTotal));
  const totalAmountError = validatePaymentAmount(totalAmount);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!walletAddress || totalAmountError) return;

    setError(null);

    try {
      // Step 1: ask the backend to create the challenge and allocate an
      // escrow account for it. We deliberately do NOT build a Stellar
      // payment until this succeeds — sending funds to a guessed or
      // client-generated address would be an actual loss-of-funds bug.
      setStage('creating');
      const challenge = await createChallenge({
        title: form.title,
        description: form.description,
        hashtag: form.hashtag,
        rewardAmount: Number(form.rewardAmount),
        rewardAsset: form.rewardAsset,
        slotsTotal: Number(form.slotsTotal),
        deadline: new Date(form.deadline).toISOString(),
      });

      // Step 2: build the funding transfer into the escrow account the
      // backend just allocated.
      setStage('funding');
      const xdr = await buildEscrowFundingViaApi({
        sourcePublicKey: walletAddress,
        destinationPublicKey: challenge.escrowAddress,
        asset: form.rewardAsset,
        amount: totalAmount,
        memo: `escrow:${challenge.id}`.slice(0, 28),
      });

      setStage('signing');
      const signedXdr = await signTransactionXdr(xdr, { networkPassphrase });

      setStage('submitting');
      await submitPaymentViaApi(signedXdr);

      setStage('done');
      router.push('/brand');
    } catch (err) {
      setStage('idle');
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the StellarTok backend to allocate an escrow account, so no funds were moved. This form is ready for when the backend is live.",
      );
    }
  }

  // BrandGate (in the layout) already guarantees a connected wallet before
  // this page renders; this guard only protects the TypeScript narrowing
  // inside handleSubmit above.
  if (!walletAddress) return null;

  const isBusy = stage !== 'idle';
  const stageLabel: Record<Stage, string> = {
    idle: 'Fund escrow & launch campaign',
    creating: 'Creating campaign…',
    funding: 'Preparing escrow deposit…',
    signing: 'Confirm in Freighter…',
    submitting: 'Submitting to Stellar…',
    done: 'Done ✓',
  };

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Create a campaign</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Campaign title">
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="input"
            placeholder="Nova Drop Dance Challenge"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="input min-h-24"
            placeholder="What should creators post?"
          />
        </Field>

        <Field label="Required hashtag">
          <input
            required
            value={form.hashtag}
            onChange={(e) => update('hashtag', e.target.value)}
            className="input"
            placeholder="#NovaStepChallenge"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Reward per creator">
            <div className="flex gap-2">
              <input
                required
                type="number"
                min="1"
                value={form.rewardAmount}
                onChange={(e) => update('rewardAmount', e.target.value)}
                className="input"
              />
              <select
                value={form.rewardAsset}
                onChange={(e) => update('rewardAsset', e.target.value as StellarAsset)}
                className="input w-24"
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
            </div>
          </Field>

          <Field label="Number of creator slots">
            <input
              required
              type="number"
              min="1"
              value={form.slotsTotal}
              onChange={(e) => update('slotsTotal', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Deadline">
          <input
            required
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={form.deadline}
            onChange={(e) => update('deadline', e.target.value)}
            className="input"
          />
        </Field>

        <p className="text-xs text-white/40">
          Submitting locks{' '}
          <strong className="text-white/70">
            {form.rewardAmount || 0} × {form.slotsTotal || 0} {form.rewardAsset}
          </strong>{' '}
          into a Stellar escrow account until creators are verified and paid out.
        </p>

        {totalAmountError && <p className="text-xs text-amber-400">{totalAmountError}</p>}
        {error && <p className="text-sm text-amber-400">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          isLoading={isBusy}
          disabled={Boolean(totalAmountError)}
        >
          {stageLabel[stage]}
        </Button>
      </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-white/60">{label}</span>
      {children}
    </label>
  );
}
