'use client';

import { cn, formatAsset } from '@/lib/utils';
import type { AlertRule, StellarAsset } from '@/types';

export interface OverlayEvent {
  label: string;
  amount: number;
  asset: StellarAsset;
  fromWalletShort: string;
}

const ANIMATION_CLASS: Record<AlertRule['animation'], string> = {
  confetti: 'bg-gradient-to-br from-pink-500 to-brand',
  bounce: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  flash: 'bg-gradient-to-br from-amber-400 to-orange-500',
  none: 'bg-ink-800',
};

export function OverlayAlert({
  event,
  animation,
}: {
  event: OverlayEvent;
  animation: AlertRule['animation'];
}) {
  return (
    <div
      className={cn(
        'flex animate-alert-in items-center gap-4 rounded-2xl px-6 py-4 text-white shadow-2xl',
        ANIMATION_CLASS[animation],
      )}
    >
      <div className="text-3xl">🎉</div>
      <div>
        <p className="text-lg font-bold">{formatAsset(event.amount, event.asset)} tip!</p>
        <p className="text-sm text-white/80">from {event.fromWalletShort}</p>
      </div>
    </div>
  );
}
