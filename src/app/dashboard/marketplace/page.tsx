import { ChallengeCard } from '@/components/ChallengeCard';
import { EmptyState } from '@/components/EmptyState';
import { listChallenges } from '@/lib/api';
import { mockChallenges } from '@/lib/mock-data';
import type { Challenge } from '@/types';

async function loadChallenges(): Promise<Challenge[]> {
  try {
    return await listChallenges();
  } catch {
    return mockChallenges;
  }
}

export default async function MarketplacePage() {
  const challenges = await loadChallenges();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Campaign Marketplace</h1>
        <p className="text-sm text-white/50">
          Accept a brand challenge, post the content, and get paid automatically once verified.
        </p>
      </div>

      {challenges.length === 0 ? (
        <EmptyState
          title="No open campaigns right now"
          description="Check back soon — brands post new challenges regularly."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
}
