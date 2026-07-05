'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TikTokSignInButton } from '@/components/TikTokSignInButton';
import { Card, CardTitle } from '@/components/ui/Card';

export function DashboardGate({ children }: { children: ReactNode }) {
  const { tiktokProfile, isLoadingSession } = useAuth();

  if (isLoadingSession) return null;

  if (!tiktokProfile) {
    return (
      <Card className="mx-auto mt-16 max-w-md text-center">
        <CardTitle>Sign in to view your dashboard</CardTitle>
        <p className="my-4 text-sm text-white/60">
          Your tipping profile, live-stream overlay, and campaign marketplace are all tied to your
          TikTok identity — sign in to continue.
        </p>
        <div className="flex justify-center">
          <TikTokSignInButton />
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
