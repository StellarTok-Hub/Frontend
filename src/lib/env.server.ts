import { z } from 'zod';

/**
 * Server-only. Full schema validation, including secrets — never import
 * this from a client component. `src/instrumentation.ts` imports it once
 * at server startup purely for its validation side effect, so a
 * misconfigured deployment fails immediately with a readable error instead
 * of surfacing later as a cryptic runtime failure.
 */
const schema = z.object({
  apiUrl: z.string().url(),
  appUrl: z.string().url(),
  tiktokClientKey: z.string(),
  tiktokClientSecret: z.string(),
  tiktokRedirectUri: z.union([z.string().url(), z.literal('')]),
  stellarNetwork: z.enum(['testnet', 'public']),
  horizonUrl: z.string().url(),
  platformFee: z.coerce.number().min(0).max(1),
  usdcIssuerMainnet: z.string(),
  usdcIssuerTestnet: z.string(),
});

function parseOrThrow(): z.infer<typeof schema> {
  const result = schema.safeParse({
    apiUrl: process.env.NEXT_PUBLIC_STELLARTOK_API_URL || 'http://localhost:4000',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    tiktokClientKey: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY ?? '',
    tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET ?? '',
    tiktokRedirectUri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI ?? '',
    stellarNetwork: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
    horizonUrl:
      process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    platformFee: process.env.NEXT_PUBLIC_PLATFORM_FEE ?? '0.01',
    usdcIssuerMainnet: process.env.STELLAR_USDC_ISSUER_MAINNET ?? '',
    usdcIssuerTestnet: process.env.STELLAR_USDC_ISSUER_TESTNET ?? '',
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

const validated = parseOrThrow();

/**
 * Server-only secrets. Never import this from a client component —
 * `serverEnv.tiktokClientSecret` must not reach the browser bundle.
 */
export const serverEnv = {
  tiktokClientSecret: validated.tiktokClientSecret,
  /**
   * Deliberately NOT defaulted. A wrong or placeholder USDC issuer would
   * silently misroute real payments, so `lib/stellar.ts` throws rather than
   * falling back to a guessed address. Set this only after independently
   * verifying the issuer against https://stellar.expert or Circle's own
   * published issuer list for the target network.
   */
  usdcIssuerMainnet: validated.usdcIssuerMainnet,
  usdcIssuerTestnet: validated.usdcIssuerTestnet,
};
