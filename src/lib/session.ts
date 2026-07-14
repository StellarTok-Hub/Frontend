import type { TikTokProfile } from './tiktok';

export const SESSION_COOKIE = 'stellartok_session';

/**
 * Shared by both the cookie's `Max-Age` attribute (browser-enforced) and an
 * `iat` claim embedded in the signed payload itself (server-enforced). The
 * cookie attribute alone isn't enough: a cookie value extracted from the
 * browser and replayed directly against the API (e.g. via curl) carries no
 * `Max-Age` at all, so without a claim inside the signed payload a stolen
 * cookie would verify forever. Both cookies share one duration since neither
 * has a real reason to outlive the other.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const WALLET_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function isExpired(issuedAtMs: number, maxAgeSeconds: number): boolean {
  return Date.now() - issuedAtMs > maxAgeSeconds * 1000;
}

/**
 * HMAC-signs session cookie values so a client can't forge or tamper with
 * the identity they claim to be. Uses Web Crypto (`crypto.subtle`), not
 * Node's `crypto` module — this file is imported from `src/middleware.ts`,
 * which runs on the Edge runtime and doesn't have Node's crypto API.
 *
 * SESSION_SECRET is read directly from `process.env` here rather than
 * through `env.server.ts` — that module pulls in Zod and is guarded to
 * Node-only imports (see `src/instrumentation.ts`), which isn't safe to
 * load from Edge middleware. `env.server.ts` still validates
 * SESSION_SECRET is set (and long enough) at Node boot for fail-fast
 * behavior; this is a second, Edge-safe read of the same variable.
 */
let devSecret: string | null = null;

/**
 * In production this throws if SESSION_SECRET is missing — there is no
 * safe default for a signing key. Outside production it falls back to a
 * random, process-lifetime secret instead, so `npm run dev`/`npm test`
 * keep working with zero config, matching this app's "runs fully on
 * fixtures without env config" setup story. That fallback secret changes
 * on every restart (sessions won't survive one) and is never used when
 * NODE_ENV=production, so it's not a production security gap.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is not set — cannot sign or verify session cookies.');
  }

  if (!devSecret) {
    devSecret = crypto.randomUUID() + crypto.randomUUID();
    console.warn(
      'SESSION_SECRET is not set — using a random development-only secret ' +
        '(sessions will not survive a server restart). Set SESSION_SECRET ' +
        'before deploying to production.',
    );
  }
  return devSecret;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  // `new Uint8Array(length)` (unlike `Uint8Array.from`) is typed as backed
  // by a concrete ArrayBuffer, not the wider ArrayBufferLike — required so
  // this satisfies crypto.subtle.verify's BufferSource parameter below.
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Signs an arbitrary string payload, returning `<base64url payload>.<base64url signature>`. */
async function sign(payload: string): Promise<string> {
  const encodedPayload = toBase64Url(new TextEncoder().encode(payload).buffer as ArrayBuffer);
  const key = await hmacKey(getSecret());
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(signature)}`;
}

/** Verifies a `sign()`-produced string, returning the original payload if the signature is valid. */
async function verify(value: string): Promise<string | null> {
  const separatorIndex = value.lastIndexOf('.');
  if (separatorIndex === -1) return null;

  const encodedPayload = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);

  const key = await hmacKey(getSecret());
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(signature),
    new TextEncoder().encode(encodedPayload),
  );
  if (!valid) return null;

  return new TextDecoder().decode(fromBase64Url(encodedPayload));
}

export async function encodeSession(profile: TikTokProfile): Promise<string> {
  return sign(JSON.stringify({ ...profile, iat: Date.now() }));
}

export async function decodeSession(value: string | undefined): Promise<TikTokProfile | null> {
  if (!value) return null;
  try {
    const payload = await verify(value);
    if (!payload) return null;
    const { iat, ...parsed } = JSON.parse(payload);
    if (typeof parsed?.openId !== 'string') return null;
    if (typeof iat !== 'number' || isExpired(iat, SESSION_MAX_AGE_SECONDS)) return null;
    return parsed as TikTokProfile;
  } catch {
    return null;
  }
}

export const WALLET_SESSION_COOKIE = 'stellartok_wallet';

const STELLAR_PUBLIC_KEY_PATTERN = /^G[A-Z2-7]{55}$/;

/**
 * Signs a connected Freighter public key into a cookie so the server can
 * gate /brand on "a wallet is connected" without trusting an unsigned,
 * client-editable claim. This still isn't proof the visitor *owns* that
 * wallet (Freighter only hands back the public key, not a signature) — it
 * just prevents someone from bypassing the gate by setting the cookie
 * directly instead of going through connectWallet(). See BrandGate for the
 * remaining limitation.
 */
export async function encodeWalletSession(walletAddress: string): Promise<string> {
  if (!STELLAR_PUBLIC_KEY_PATTERN.test(walletAddress)) {
    throw new Error('Not a valid Stellar public key.');
  }
  return sign(JSON.stringify({ addr: walletAddress, iat: Date.now() }));
}

export async function decodeWalletSession(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const payload = await verify(value);
  if (!payload) return null;
  try {
    const { addr, iat } = JSON.parse(payload);
    if (typeof addr !== 'string' || !STELLAR_PUBLIC_KEY_PATTERN.test(addr)) return null;
    if (typeof iat !== 'number' || isExpired(iat, WALLET_SESSION_MAX_AGE_SECONDS)) return null;
    return addr;
  } catch {
    return null;
  }
}
