// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChallengeCard } from './ChallengeCard';
import type { Challenge } from '@/types';

afterEach(cleanup);

const acceptChallenge = vi.fn();
const submitChallengeProof = vi.fn();
vi.mock('@/lib/api', () => ({
  acceptChallenge: (...args: unknown[]) => acceptChallenge(...args),
  submitChallengeProof: (...args: unknown[]) => submitChallengeProof(...args),
}));

const challenge: Challenge = {
  id: 'c1',
  brandName: 'Nova Sneakers',
  brandLogoUrl: 'https://example.com/logo.png',
  title: 'Nova Drop Dance Challenge',
  description: 'Post a 15s clip',
  hashtag: '#NovaStepChallenge',
  rewardAmount: 25,
  rewardAsset: 'USDC',
  escrowAddress: 'GESCROW',
  slotsTotal: 100,
  slotsRemaining: 34,
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  status: 'open',
};

describe('ChallengeCard', () => {
  it('accepts a challenge and reveals the proof submission form', async () => {
    acceptChallenge.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<ChallengeCard challenge={challenge} />);

    await user.click(screen.getByRole('button', { name: 'Accept challenge' }));

    expect(await screen.findByLabelText('Your TikTok post URL')).toBeInTheDocument();
    expect(acceptChallenge).toHaveBeenCalledWith('c1');
  });

  it('shows an error and stays in the browsing state if accepting fails', async () => {
    acceptChallenge.mockRejectedValueOnce(new Error('backend unreachable'));
    const user = userEvent.setup();
    render(<ChallengeCard challenge={challenge} />);

    await user.click(screen.getByRole('button', { name: 'Accept challenge' }));

    expect(await screen.findByText('backend unreachable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept challenge' })).toBeInTheDocument();
  });

  it('submits proof and shows the submitted state', async () => {
    acceptChallenge.mockResolvedValueOnce({});
    submitChallengeProof.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<ChallengeCard challenge={challenge} />);

    await user.click(screen.getByRole('button', { name: 'Accept challenge' }));
    const urlInput = await screen.findByLabelText('Your TikTok post URL');
    await user.type(urlInput, 'https://www.tiktok.com/@me/video/123');
    await user.click(screen.getByRole('button', { name: 'Submit for verification' }));

    await waitFor(() =>
      expect(submitChallengeProof).toHaveBeenCalledWith(
        'c1',
        'https://www.tiktok.com/@me/video/123',
      ),
    );
    expect(await screen.findByText('Submitted for verification')).toBeInTheDocument();
  });
});
