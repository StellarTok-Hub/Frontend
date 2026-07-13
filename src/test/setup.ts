import '@testing-library/jest-dom/vitest';

// env.server.ts validates SESSION_SECRET (min 32 chars) at import time, and
// several test files transitively import it (e.g. stellar.test.ts via
// lib/stellar.ts). Set a fixed test value here rather than in every file
// that happens to need it.
process.env.SESSION_SECRET ??= 'vitest-test-secret-do-not-use-in-prod';

// Also read at env.server.ts import time (via lib/stellar.ts's resolveAsset)
// — needed for any test that exercises the USDC payment path.
process.env.STELLAR_USDC_ISSUER_TESTNET ??=
  'GCFSY3NTUPB5NHRQ47ZCJBY7HXZODGLJMXSQOHKY7Q3CVCNBHOVM2PUL';
