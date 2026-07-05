export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importing for its validation side effect — throws immediately on
    // server startup if any environment variable is missing/malformed,
    // rather than letting a bad config surface later as a random failure.
    await import('@/lib/env.server');
  }
}
