'use client';

import { useEffect, useRef, useState } from 'react';
import { env } from '@/lib/env';
import type { OverlayEvent } from '@/components/OverlayAlert';

interface UseOverlayEventsOptions {
  /** Fires a fake event on an interval so the overlay can be previewed without a live backend. */
  simulate?: boolean;
}

/**
 * Subscribes to the backend's live tip feed for a given overlay token and
 * surfaces one alert at a time. The backend is the source of truth for
 * matching a tip's memo/label to an alert — this hook just renders whatever
 * it's told to.
 */
export function useOverlayEvents(overlayToken: string, options: UseOverlayEventsOptions = {}) {
  const [currentEvent, setCurrentEvent] = useState<OverlayEvent | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout>>();

  function showEvent(event: OverlayEvent) {
    setCurrentEvent(event);
    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setCurrentEvent(null), 5000);
  }

  useEffect(() => {
    if (options.simulate) {
      const interval = setInterval(() => {
        showEvent({
          label: 'play_sound',
          amount: Math.ceil(Math.random() * 20),
          asset: Math.random() > 0.5 ? 'USDC' : 'XLM',
          fromWalletShort: 'GABC...WXYZ',
        });
      }, 8000);
      return () => clearInterval(interval);
    }

    const wsUrl = `${env.apiUrl.replace(/^http/, 'ws')}/overlay/${overlayToken}`;
    let socket: WebSocket | undefined;

    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as OverlayEvent;
          showEvent(event);
        } catch {
          // Ignore malformed frames.
        }
      };
    } catch {
      // Backend not reachable yet — the overlay simply stays idle.
    }

    return () => socket?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayToken, options.simulate]);

  return currentEvent;
}
