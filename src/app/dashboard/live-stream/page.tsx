'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getOverlaySettings } from '@/lib/api';
import { mockOverlaySettings } from '@/lib/mock-data';
import { env } from '@/lib/env';

export default function LiveStreamSettingsPage() {
  const [settings, setSettings] = useState(mockOverlaySettings);
  const [copied, setCopied] = useState(false);
  const [overlayUrl, setOverlayUrl] = useState(`/overlay/${mockOverlaySettings.overlayToken}`);

  useEffect(() => {
    getOverlaySettings(mockOverlaySettings.creatorId)
      .then(setSettings)
      .catch(() => setSettings(mockOverlaySettings));
  }, []);

  // Computed after mount, not during render — the server has no notion of
  // `window.location.origin`, so filling it in during the render itself
  // would make the server-rendered HTML disagree with the first client
  // render and trigger a hydration mismatch.
  useEffect(() => {
    setOverlayUrl(`${window.location.origin}/overlay/${settings.overlayToken}`);
  }, [settings.overlayToken]);

  function handleCopy() {
    navigator.clipboard?.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Live Stream Settings</h1>
        <p className="text-sm text-white/50">
          Add this as an OBS Browser Source. Tips sent with a matching label will fire the
          configured alert live on your stream.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OBS Browser Source URL</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-ink-950 px-3 py-2 text-xs text-white/70">
            {overlayUrl}
          </code>
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? 'Copied ✓' : 'Copy'}
          </Button>
        </div>
        <p className="mt-3 text-xs text-white/40">
          Recommended size: 400×300, transparent background enabled.
        </p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert rules</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {settings.alertRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-950 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Badge tone="brand">{rule.label}</Badge>
                <span className="text-sm text-white/60">→ {rule.animation}</span>
              </div>
              <span className="text-xs text-white/40">min {rule.minAmount} tip</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/40">
          Editing alert rules will call the backend once live — this list currently reflects local
          defaults.
        </p>
      </Card>

      {!env.tiktokClientKey && (
        <p className="text-xs text-amber-400">
          Heads up: NEXT_PUBLIC_TIKTOK_CLIENT_KEY isn&apos;t set, so this dashboard is running fully
          in preview mode.
        </p>
      )}
    </div>
  );
}
