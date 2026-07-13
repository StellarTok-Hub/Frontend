'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { connectFreighter, FreighterNotInstalledError } from '@/lib/freighter';
import { linkIdentity } from '@/lib/api';
import type { LinkedIdentity } from '@/types';
import type { TikTokProfile } from '@/lib/tiktok';

interface AuthState {
  tiktokProfile: TikTokProfile | null;
  walletAddress: string | null;
  /** Derived client-side the moment both a TikTok profile and wallet are present. */
  identity: LinkedIdentity | null;
  /** Whether the backend has confirmed the link — best-effort, not required for the UI to work. */
  isLinkedRemotely: boolean;
  isLoadingSession: boolean;
  isConnectingWallet: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  connectWallet: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tiktokProfile, setTiktokProfile] = useState<TikTokProfile | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLinkedRemotely, setIsLinkedRemotely] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/session')
      .then((res) => res.json())
      .then((data) => setTiktokProfile(data.tiktokProfile ?? null))
      .catch(() => setTiktokProfile(null))
      .finally(() => setIsLoadingSession(false));
  }, []);

  const identity = useMemo<LinkedIdentity | null>(() => {
    if (!tiktokProfile || !walletAddress) return null;
    return {
      tiktokId: tiktokProfile.openId,
      tiktokUsername: tiktokProfile.username,
      displayName: tiktokProfile.displayName,
      avatarUrl: tiktokProfile.avatarUrl,
      walletAddress,
    };
  }, [tiktokProfile, walletAddress]);

  useEffect(() => {
    if (!identity || isLinkedRemotely) return;
    linkIdentity({ tiktokOpenId: identity.tiktokId, walletAddress: identity.walletAddress })
      .then(() => setIsLinkedRemotely(true))
      .catch(() => {
        // Backend isn't live yet — the identity link still works locally
        // (tiktokProfile + walletAddress together are the source of truth
        // for unlocking the UI), it just isn't persisted remotely yet.
      });
  }, [identity, isLinkedRemotely]);

  const connectWallet = useCallback(async () => {
    setIsConnectingWallet(true);
    setError(null);
    try {
      const address = await connectFreighter();
      setWalletAddress(address);
      // Best-effort: sets the signed wallet cookie middleware checks for
      // /brand access. If this fails, the UI still unlocks locally (the
      // in-memory walletAddress is enough for BrandGate), but a direct
      // request to a /brand route won't pass middleware until it succeeds.
      fetch('/api/session/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      }).catch(() => {});
    } catch (err) {
      if (err instanceof FreighterNotInstalledError) {
        setError('Install the Freighter wallet extension to continue.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not connect wallet.');
      }
    } finally {
      setIsConnectingWallet(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      fetch('/api/session', { method: 'DELETE' }).catch(() => {}),
      fetch('/api/session/wallet', { method: 'DELETE' }).catch(() => {}),
    ]);
    setTiktokProfile(null);
    setWalletAddress(null);
    setIsLinkedRemotely(false);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      tiktokProfile,
      walletAddress,
      identity,
      isLinkedRemotely,
      isLoadingSession,
      isConnectingWallet,
      error,
      connectWallet,
      signOut,
    }),
    [
      tiktokProfile,
      walletAddress,
      identity,
      isLinkedRemotely,
      isLoadingSession,
      isConnectingWallet,
      error,
      connectWallet,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
