export type StellarAsset = 'USDC' | 'XLM';

export interface LinkedIdentity {
  tiktokId: string;
  tiktokUsername: string;
  displayName: string;
  avatarUrl: string;
  walletAddress: string;
}

export type AccountRole = 'creator' | 'viewer' | 'brand';

export interface TikTokVideo {
  id: string;
  thumbnailUrl: string;
  caption: string;
  postedAt: string;
  viewCount: number;
  likeCount: number;
  shareUrl: string;
}

export interface CreatorProfile {
  tiktokUsername: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  walletAddress: string;
  videos: TikTokVideo[];
}

export interface Tip {
  id: string;
  fromWalletAddress: string;
  toWalletAddress: string;
  asset: StellarAsset;
  amount: number;
  label?: AlertLabel;
  memo?: string;
  txHash: string;
  createdAt: string;
}

export type AlertLabel = 'play_sound' | 'confetti' | 'shoutout' | 'none';

export interface AlertRule {
  id: string;
  label: AlertLabel;
  soundUrl?: string;
  animation: 'confetti' | 'bounce' | 'flash' | 'none';
  minAmount: number;
}

export interface OverlaySettings {
  creatorId: string;
  overlayToken: string;
  alertRules: AlertRule[];
}

export type ChallengeStatus = 'open' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

export interface Challenge {
  id: string;
  brandName: string;
  brandLogoUrl: string;
  title: string;
  description: string;
  hashtag: string;
  rewardAmount: number;
  rewardAsset: StellarAsset;
  escrowAddress: string;
  slotsTotal: number;
  slotsRemaining: number;
  deadline: string;
  status: ChallengeStatus;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  creatorId: string;
  tiktokPostUrl: string;
  submittedAt: string;
  status: ChallengeStatus;
  rejectionReason?: string;
}

export interface EscrowAccount {
  id: string;
  brandId: string;
  balance: number;
  asset: StellarAsset;
  lockedForChallengeIds: string[];
}
