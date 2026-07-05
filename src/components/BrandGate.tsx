'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { Card, CardTitle } from '@/components/ui/Card';

/**
 * Brands don't go through TikTok Login Kit — their identity for now is
 * just their Stellar wallet, since that's what actually funds an escrow.
 * Gating here (rather than a real backend-issued brand session) is a
 * known simplification: there's no brand account system yet, just "does
 * a wallet happen to be connected."
 */
export function BrandGate({ children }: { children: ReactNode }) {
  const { walletAddress, isConnectingWallet } = useAuth();

  if (!walletAddress) {
    return (
      <Card className="mx-auto mt-16 max-w-md text-center">
        <CardTitle>Connect a wallet to continue</CardTitle>
        <p className="my-4 text-sm text-white/60">
          The brand portal funds campaigns from a Stellar wallet — connect one to view and create
          campaigns.
        </p>
        <div className="flex justify-center">
          <WalletConnectButton />
        </div>
        {isConnectingWallet && <p className="mt-2 text-xs text-white/40">Connecting…</p>}
      </Card>
    );
  }

  return <>{children}</>;
}
