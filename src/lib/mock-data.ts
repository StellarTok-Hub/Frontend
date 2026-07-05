import type { Challenge, CreatorProfile, OverlaySettings, Tip } from '@/types';

/**
 * Static fixtures so every route renders a realistic screen before the
 * StellarTok backend exists. Swap for the corresponding `lib/api.ts` call
 * once the backend is live.
 */

export const mockCreatorProfile: CreatorProfile = {
  tiktokUsername: 'ariadances',
  displayName: 'Aria Dances',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
  bio: 'Dance covers, choreo breakdowns, and way too much energy. Tips keep the lights on ✨',
  walletAddress: 'GAK5NC4G3IB4XQ54EIP7ZQ6NAMEB4C6MMMDDZ5B6LWTP4YFUCPYAWVU3',
  videos: [
    {
      id: 'v1',
      thumbnailUrl: 'https://picsum.photos/seed/stellartok-1/400/700',
      caption: 'when the beat drops mid-choreo 💥',
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      viewCount: 482_000,
      likeCount: 61_200,
      shareUrl: 'https://www.tiktok.com/@ariadances/video/1',
    },
    {
      id: 'v2',
      thumbnailUrl: 'https://picsum.photos/seed/stellartok-2/400/700',
      caption: 'teaching my mom this one, wish me luck',
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      viewCount: 128_400,
      likeCount: 19_800,
      shareUrl: 'https://www.tiktok.com/@ariadances/video/2',
    },
    {
      id: 'v3',
      thumbnailUrl: 'https://picsum.photos/seed/stellartok-3/400/700',
      caption: 'reply to @user request for the full routine',
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      viewCount: 903_100,
      likeCount: 140_500,
      shareUrl: 'https://www.tiktok.com/@ariadances/video/3',
    },
  ],
};

export const mockRecentTips: Tip[] = [
  {
    id: 't1',
    fromWalletAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    toWalletAddress: mockCreatorProfile.walletAddress,
    asset: 'USDC',
    amount: 5,
    label: 'play_sound',
    memo: 'play_sound',
    txHash: '9f1c2e...a4d7',
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 't2',
    fromWalletAddress: 'GBLD5V4EGVFKB2VOAWOKS7ODFLXHMOWTZLKC5NLC6WEA5DYKQ3SL7NCF',
    toWalletAddress: mockCreatorProfile.walletAddress,
    asset: 'XLM',
    amount: 40,
    label: 'confetti',
    memo: 'confetti',
    txHash: '2b7e91...c810',
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
];

export const mockOverlaySettings: OverlaySettings = {
  creatorId: 'creator_ariadances',
  overlayToken: 'ovr_7f3ka9x2m1',
  alertRules: [
    {
      id: 'r1',
      label: 'play_sound',
      animation: 'bounce',
      soundUrl: '/sounds/coin.mp3',
      minAmount: 1,
    },
    { id: 'r2', label: 'confetti', animation: 'confetti', minAmount: 5 },
    { id: 'r3', label: 'shoutout', animation: 'flash', minAmount: 10 },
  ],
};

export const mockChallenges: Challenge[] = [
  {
    id: 'c1',
    brandName: 'Nova Sneakers',
    brandLogoUrl: 'https://i.pravatar.cc/80?img=12',
    title: 'Nova Drop Dance Challenge',
    description: 'Post a 15s clip dancing in your Nova kicks using the campaign sound.',
    hashtag: '#NovaStepChallenge',
    rewardAmount: 25,
    rewardAsset: 'USDC',
    escrowAddress: 'GC5PJ...ESCROW1',
    slotsTotal: 100,
    slotsRemaining: 34,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'open',
  },
  {
    id: 'c2',
    brandName: 'Bloom Skincare',
    brandLogoUrl: 'https://i.pravatar.cc/80?img=32',
    title: 'Bloom Glow-Up Routine',
    description: 'Show your morning routine featuring Bloom products, tag #BloomGlow.',
    hashtag: '#BloomGlow',
    rewardAmount: 15,
    rewardAsset: 'USDC',
    escrowAddress: 'GC5PJ...ESCROW2',
    slotsTotal: 200,
    slotsRemaining: 187,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    status: 'open',
  },
];
