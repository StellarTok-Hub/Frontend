import { describe, expect, it } from 'vitest';
import { getClientKey, isRateLimited } from './rate-limit';

function requestWithForwardedFor(value: string | null): Request {
  const headers = new Headers();
  if (value !== null) headers.set('x-forwarded-for', value);
  return new Request('http://localhost/api/tip', { headers });
}

describe('getClientKey', () => {
  it('uses the rightmost x-forwarded-for hop, not the client-supplied leftmost one', () => {
    const request = requestWithForwardedFor('203.0.113.5, 10.0.0.1');
    expect(getClientKey(request)).toBe('10.0.0.1');
  });

  it('falls back to "unknown" when the header is missing', () => {
    expect(getClientKey(requestWithForwardedFor(null))).toBe('unknown');
  });

  it('handles a single-hop header with no comma', () => {
    expect(getClientKey(requestWithForwardedFor('203.0.113.5'))).toBe('203.0.113.5');
  });
});

describe('isRateLimited', () => {
  // requestLog is a module-level Map keyed by client key, so each test
  // uses its own unique key to avoid bleeding state across tests.
  it('allows requests under the threshold', () => {
    const key = 'test-client-under-threshold';
    for (let i = 0; i < 20; i++) {
      expect(isRateLimited(key)).toBe(false);
    }
  });

  it('blocks the 21st request within the window', () => {
    const key = 'test-client-over-threshold';
    for (let i = 0; i < 20; i++) {
      isRateLimited(key);
    }
    expect(isRateLimited(key)).toBe(true);
  });
});
