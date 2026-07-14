/**
 * Minimal in-memory sliding-window rate limiter for API routes that touch
 * the Stellar network. This resets on every server restart and doesn't
 * share state across instances. That isn't a hypothetical multi-instance
 * edge case to plan for later — Vercel's default deploy topology for this
 * app already runs multiple instances/regions behind the scenes, so as
 * shipped, a caller can already get a fresh 20-requests/minute allowance
 * simply by landing on a different instance. Treat this limiter as UX
 * (discourages accidental double-submits, absorbs light abuse) rather than
 * a real abuse control until it's backed by a shared store (e.g. Upstash
 * Redis) — do not rely on it as the thing standing between this app and a
 * request-flooding attacker.
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

/**
 * `x-forwarded-for` is a comma-separated hop list that each proxy in the
 * chain *appends* to — so the leftmost entry is whatever the client put
 * there themselves, and the rightmost entry is the one added by the proxy
 * closest to this server. Keying on the leftmost entry (the old behavior)
 * let any client bypass rate limiting entirely by sending a fresh fake
 * `x-forwarded-for` value on every request. This assumes a single trusted
 * reverse proxy in front of the app (true for a standard Vercel/Nginx
 * deploy); a multi-hop setup would need to trust a specific hop count
 * instead of "last".
 */
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const hops = forwardedFor?.split(',').map((hop) => hop.trim()) ?? [];
  return hops.at(-1) || 'unknown';
}
