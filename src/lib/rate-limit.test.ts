import { describe, expect, it } from 'vitest';
import { getClientKey } from './rate-limit';

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
});
