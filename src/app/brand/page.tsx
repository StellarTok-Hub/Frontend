import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/EmptyState';
import { formatAsset, formatRelativeTime } from '@/lib/utils';
import { listChallenges } from '@/lib/api';
import { mockChallenges } from '@/lib/mock-data';
import type { Challenge } from '@/types';

async function loadChallenges(): Promise<Challenge[]> {
  try {
    // TODO: filter to the signed-in brand's own challenges once the backend
    // can resolve "brand" as an identity, not just a connected wallet.
    return await listChallenges();
  } catch {
    return mockChallenges;
  }
}

export default async function BrandOverviewPage() {
  const challenges = await loadChallenges();
  const escrowLocked = challenges.reduce(
    (sum, c) =>
      sum +
      c.rewardAmount * (c.slotsTotal - c.slotsRemaining === 0 ? c.slotsTotal : c.slotsRemaining),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Escrow locked"
          value={`$${escrowLocked.toLocaleString()}`}
          hint="Across all open campaigns"
        />
        <StatCard label="Active campaigns" value={String(challenges.length)} />
        <StatCard label="Creators engaged" value="0" hint="Updates as creators accept" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your campaigns</CardTitle>
        </CardHeader>
        {challenges.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description='Use "+ New campaign" above to launch your first challenge.'
          />
        ) : (
          <div className="divide-y divide-white/5">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-white">{challenge.title}</p>
                  <p className="text-xs text-white/40">
                    {challenge.hashtag} · ends {formatRelativeTime(challenge.deadline)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">
                    {formatAsset(challenge.rewardAmount, challenge.rewardAsset)}
                  </span>
                  <Badge tone={challenge.status === 'open' ? 'success' : 'neutral'}>
                    {challenge.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
