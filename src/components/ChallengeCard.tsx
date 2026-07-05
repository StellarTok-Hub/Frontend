'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatAsset, formatRelativeTime } from '@/lib/utils';
import { acceptChallenge, submitChallengeProof } from '@/lib/api';
import type { Challenge } from '@/types';

type Stage = 'browsing' | 'accepting' | 'accepted' | 'submitting' | 'submitted';

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const [stage, setStage] = useState<Stage>('browsing');
  const [postUrl, setPostUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setStage('accepting');
    setError(null);
    try {
      await acceptChallenge(challenge.id);
      setStage('accepted');
    } catch (err) {
      setStage('browsing');
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the backend to accept this challenge — try again once it's live.",
      );
    }
  }

  async function handleSubmitProof(e: FormEvent) {
    e.preventDefault();
    setStage('submitting');
    setError(null);
    try {
      await submitChallengeProof(challenge.id, postUrl);
      setStage('submitted');
    } catch (err) {
      setStage('accepted');
      setError(
        err instanceof Error ? err.message : "Couldn't submit your proof — try again shortly.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Image
            src={challenge.brandLogoUrl}
            alt={challenge.brandName}
            width={36}
            height={36}
            className="rounded-full"
          />
          <div>
            <CardTitle>{challenge.title}</CardTitle>
            <p className="text-xs text-white/50">{challenge.brandName}</p>
          </div>
        </div>
        <Badge tone="brand">{challenge.hashtag}</Badge>
      </CardHeader>

      <p className="mb-4 text-sm text-white/70">{challenge.description}</p>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-white">
          {formatAsset(challenge.rewardAmount, challenge.rewardAsset)}
        </span>
        <span className="text-white/50">
          {challenge.slotsRemaining}/{challenge.slotsTotal} slots left
        </span>
      </div>

      {error && <p className="mb-3 text-xs text-amber-400">{error}</p>}

      {stage === 'submitted' ? (
        <Badge tone="success">Submitted for verification</Badge>
      ) : stage === 'accepted' || stage === 'submitting' ? (
        <form onSubmit={handleSubmitProof} className="space-y-2">
          <label className="block text-xs text-white/50" htmlFor={`proof-url-${challenge.id}`}>
            Your TikTok post URL
          </label>
          <input
            id={`proof-url-${challenge.id}`}
            required
            type="url"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@you/video/..."
            className="input"
          />
          <Button type="submit" size="sm" className="w-full" isLoading={stage === 'submitting'}>
            Submit for verification
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">
            Ends {formatRelativeTime(challenge.deadline)}
          </span>
          <Button type="button" size="sm" isLoading={stage === 'accepting'} onClick={handleAccept}>
            Accept challenge
          </Button>
        </div>
      )}
    </Card>
  );
}
