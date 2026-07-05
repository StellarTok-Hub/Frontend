/**
 * Client-safe public config. Deliberately dependency-free (no zod) — this
 * file is imported from client components (e.g. `stellar-network.ts`,
 * `useOverlayEvents.ts`), and pulling a validation library in here would
 * ship it in every page's JS bundle just to read a few strings that Next
 * already inlines at build time. Full schema validation (including secrets)
 * lives in `env.server.ts` and runs once at server startup instead — see
 * `src/instrumentation.ts`.
 */

function assertStellarNetwork(value: string | undefined): 'testnet' | 'public' {
  if (value === undefined || value === 'testnet') return 'testnet';
  if (value === 'public') return 'public';
  throw new Error(
    `Invalid NEXT_PUBLIC_STELLAR_NETWORK: "${value}" — expected "testnet" or "public".`,
  );
}

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_STELLARTOK_API_URL || 'http://localhost:4000',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  tiktokClientKey: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY ?? '',
  tiktokRedirectUri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI ?? '',
  stellarNetwork: assertStellarNetwork(process.env.NEXT_PUBLIC_STELLAR_NETWORK),
  horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  platformFee: Number(process.env.NEXT_PUBLIC_PLATFORM_FEE ?? '0.01'),
};
