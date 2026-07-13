import '@testing-library/jest-dom/vitest';

// env.server.ts validates SESSION_SECRET (min 32 chars) at import time, and
// several test files transitively import it (e.g. stellar.test.ts via
// lib/stellar.ts). Set a fixed test value here rather than in every file
// that happens to need it.
process.env.SESSION_SECRET ??= 'vitest-test-secret-do-not-use-in-prod';
