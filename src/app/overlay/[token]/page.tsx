'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { OverlayAlert } from '@/components/OverlayAlert';
import { useOverlayEvents } from '@/hooks/useOverlayEvents';
import { mockOverlaySettings } from '@/lib/mock-data';

/**
 * Meant to be added as an OBS Browser Source, so the background must stay
 * fully transparent — nothing here should render a page chrome, nav, or
 * opaque background outside of the alert itself.
 */
export default function OverlayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const simulate = searchParams.get('simulate') === '1';

  const event = useOverlayEvents(token, { simulate });
  const matchingRule = event
    ? mockOverlaySettings.alertRules.find((rule) => rule.label === event.label)
    : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      {event && <OverlayAlert event={event} animation={matchingRule?.animation ?? 'bounce'} />}
    </div>
  );
}
