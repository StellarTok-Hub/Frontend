'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { truncateAddress } from '@/lib/utils';

export function WalletConnectButton() {
  const { walletAddress, isConnectingWallet, error, connectWallet } = useAuth();

  if (walletAddress) {
    return (
      <div
        className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 px-4 py-2 text-sm text-white/80"
        aria-label={`Wallet connected: ${walletAddress}`}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
        {truncateAddress(walletAddress)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={connectWallet} isLoading={isConnectingWallet}>
        Connect Freighter
      </Button>
      {error && (
        <span className="text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
