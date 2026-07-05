/**
 * Minimal in-memory sliding-window rate limiter for API routes that touch
 * the Stellar network. This resets on every server restart and doesn't
 * share state across instances — fine for a single-instance deploy, but a
 * real production deployment behind multiple instances needs a shared store
 * (e.g. Upstash Redis) instead, or this limiter becomes bypassable simply by
 * hitting a different instance.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const requestLog = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return false;
}

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() ?? 'unknown';
}
