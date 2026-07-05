import { env } from './env';

/**
 * Client-safe network passphrase constants. Deliberately hardcoded rather
 * than imported from `@stellar/stellar-sdk` so client components (e.g. the
 * tip button) never pull the SDK — and its native crypto dependencies —
 * into the browser bundle. Server routes still use the SDK directly.
 */
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const PUBLIC_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

export const networkPassphrase =
  env.stellarNetwork === 'public' ? PUBLIC_PASSPHRASE : TESTNET_PASSPHRASE;
