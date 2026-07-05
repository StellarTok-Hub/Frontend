'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function TikTokSignInButton() {
  const { tiktokProfile, isLoadingSession } = useAuth();

  if (isLoadingSession) return null;

  if (tiktokProfile) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 px-4 py-2 text-sm text-white/80">
        {tiktokProfile.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- external TikTok CDN avatar, not worth a remotePatterns entry per-user
          <img src={tiktokProfile.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
        )}
        @{tiktokProfile.username || tiktokProfile.displayName}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- this is a Route Handler (sets a cookie + redirects), not an app page, so client-side <Link> routing doesn't apply
    <a href="/api/auth/tiktok/start">
      <Button variant="secondary" size="sm">
        Sign in with TikTok
      </Button>
    </a>
  );
}
