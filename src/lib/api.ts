import { env } from './env';
import type {
  Challenge,
  ChallengeSubmission,
  CreatorProfile,
  LinkedIdentity,
  OverlaySettings,
  Tip,
} from '@/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(body || response.statusText, response.status);
  }

  return response.json() as Promise<T>;
}

// --- Identity ---------------------------------------------------------

export function linkIdentity(payload: {
  tiktokOpenId: string;
  walletAddress: string;
}): Promise<LinkedIdentity> {
  return request('/identity/link', { method: 'POST', body: JSON.stringify(payload) });
}

export function getCurrentIdentity(): Promise<LinkedIdentity | null> {
  return request('/identity/me');
}

// --- Tipping profile ----------------------------------------------------

export function getCreatorProfile(username: string): Promise<CreatorProfile> {
  return request(`/creators/${encodeURIComponent(username)}`);
}

export function getRecentTips(walletAddress: string): Promise<Tip[]> {
  return request(`/tips?wallet=${encodeURIComponent(walletAddress)}`);
}

// --- Live-stream overlay -------------------------------------------------

export function getOverlaySettings(creatorId: string): Promise<OverlaySettings> {
  return request(`/creators/${creatorId}/overlay`);
}

export function updateOverlaySettings(
  creatorId: string,
  settings: Partial<OverlaySettings>,
): Promise<OverlaySettings> {
  return request(`/creators/${creatorId}/overlay`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

// --- Campaign marketplace -------------------------------------------------

export function listChallenges(): Promise<Challenge[]> {
  return request('/challenges');
}

export function acceptChallenge(challengeId: string): Promise<ChallengeSubmission> {
  return request(`/challenges/${challengeId}/accept`, { method: 'POST' });
}

export function submitChallengeProof(
  challengeId: string,
  tiktokPostUrl: string,
): Promise<ChallengeSubmission> {
  return request(`/challenges/${challengeId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ tiktokPostUrl }),
  });
}

export function createChallenge(payload: {
  title: string;
  description: string;
  hashtag: string;
  rewardAmount: number;
  rewardAsset: 'USDC' | 'XLM';
  slotsTotal: number;
  deadline: string;
}): Promise<Challenge> {
  return request('/brand/challenges', { method: 'POST', body: JSON.stringify(payload) });
}
