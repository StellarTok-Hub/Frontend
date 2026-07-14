import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from './env';
import {
  acceptChallenge,
  ApiError,
  createChallenge,
  getCreatorProfile,
  getRecentTips,
  linkIdentity,
  listChallenges,
  submitChallengeProof,
} from './api';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function errorResponse(status: number, text: string): Response {
  return { ok: false, status, statusText: text, text: async () => text } as Response;
}

describe('request (via linkIdentity)', () => {
  it('prefixes every call with env.apiUrl and sets a JSON content type', async () => {
    fetchMock.mockResolvedValue(okResponse({ tiktokId: 'a', walletAddress: 'G...' }));
    await linkIdentity({ tiktokOpenId: 'a', walletAddress: 'G...' });

    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}/identity/link`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('throws an ApiError carrying the response status and body text on failure', async () => {
    fetchMock.mockResolvedValue(errorResponse(503, 'Service unavailable'));
    await expect(linkIdentity({ tiktokOpenId: 'a', walletAddress: 'G...' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      message: 'Service unavailable',
    });
  });

  it('falls back to statusText when the error body is empty', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '',
    } as Response);
    await expect(linkIdentity({ tiktokOpenId: 'a', walletAddress: 'G...' })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe('URL building for path-parameterized endpoints', () => {
  it('encodes the username in getCreatorProfile', async () => {
    fetchMock.mockResolvedValue(okResponse({}));
    await getCreatorProfile('a creator/weird name');
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}/creators/${encodeURIComponent('a creator/weird name')}`,
      expect.any(Object),
    );
  });

  it('encodes the wallet address in getRecentTips', async () => {
    fetchMock.mockResolvedValue(okResponse([]));
    await getRecentTips('G&WEIRD');
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}/tips?wallet=${encodeURIComponent('G&WEIRD')}`,
      expect.any(Object),
    );
  });

  it('POSTs to /challenges/:id/accept for acceptChallenge', async () => {
    fetchMock.mockResolvedValue(okResponse({}));
    await acceptChallenge('challenge-1');
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}/challenges/challenge-1/accept`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('POSTs the tiktokPostUrl body for submitChallengeProof', async () => {
    fetchMock.mockResolvedValue(okResponse({}));
    await submitChallengeProof('challenge-1', 'https://tiktok.com/@x/video/1');
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}/challenges/challenge-1/submit`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ tiktokPostUrl: 'https://tiktok.com/@x/video/1' }),
      }),
    );
  });
});

describe('listChallenges / createChallenge', () => {
  it('GETs /challenges', async () => {
    fetchMock.mockResolvedValue(okResponse([]));
    await listChallenges();
    expect(fetchMock).toHaveBeenCalledWith(`${env.apiUrl}/challenges`, expect.any(Object));
  });

  it('POSTs the full payload to /brand/challenges', async () => {
    fetchMock.mockResolvedValue(okResponse({}));
    const payload = {
      title: 'Post a dance video',
      description: 'desc',
      hashtag: '#stellartok',
      rewardAmount: 100,
      rewardAsset: 'USDC' as const,
      slotsTotal: 5,
      deadline: '2026-08-01',
    };
    await createChallenge(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.apiUrl}/brand/challenges`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    );
  });
});
