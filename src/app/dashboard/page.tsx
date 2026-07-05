import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/EmptyState';
import { formatAsset, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { getRecentTips } from '@/lib/api';
import { mockCreatorProfile, mockRecentTips } from '@/lib/mock-data';
import type { Tip } from '@/types';

async function loadRecentTips(): Promise<Tip[]> {
  try {
    // TODO: once sessions carry a real identity link, resolve the wallet
    // server-side from the signed-in creator rather than a fixture address.
    return await getRecentTips(mockCreatorProfile.walletAddress);
  } catch {
    return mockRecentTips;
  }
}

export default async function DashboardOverviewPage() {
  const recentTips = await loadRecentTips();
  const totalUsd = recentTips.reduce(
    (sum, tip) => sum + (tip.asset === 'USDC' ? tip.amount : tip.amount * 0.12),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Overview</h1>
        <p className="text-sm text-white/50">Your identity link, tips, and campaign activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tips today"
          value={`~$${totalUsd.toFixed(2)}`}
          hint="Estimated USD value"
        />
        <StatCard
          label="Live overlay"
          value="Not connected"
          hint="Set up in Live Stream Settings"
        />
        <StatCard label="Active campaigns" value="0" hint="Browse the marketplace to accept one" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent tips</CardTitle>
        </CardHeader>
        {recentTips.length === 0 ? (
          <EmptyState
            title="No tips yet"
            description="Share your bio-link profile to start receiving tips."
          />
        ) : (
          <div className="divide-y divide-white/5">
            {recentTips.map((tip) => (
              <div key={tip.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="text-white">{formatAsset(tip.amount, tip.asset)}</p>
                  <p className="text-xs text-white/40">
                    from {truncateAddress(tip.fromWalletAddress)} ·{' '}
                    {formatRelativeTime(tip.createdAt)}
                  </p>
                </div>
                {tip.label && tip.label !== 'none' && <Badge tone="brand">{tip.label}</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
