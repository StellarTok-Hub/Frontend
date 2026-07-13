import { describe, expect, it } from 'vitest';
import { parseJsonBody } from './request-json';

function requestWithBody(body: string): Request {
  return new Request('http://localhost/api/tip', { method: 'POST', body });
}

describe('parseJsonBody', () => {
  it('parses a valid JSON body', async () => {
    const request = requestWithBody('{"amount":"5","asset":"XLM"}');
    expect(await parseJsonBody(request)).toEqual({ amount: '5', asset: 'XLM' });
  });

  it('returns null for malformed JSON instead of throwing', async () => {
    const request = requestWithBody('{not valid json');
    expect(await parseJsonBody(request)).toBeNull();
  });

  it('returns null for an empty body', async () => {
    const request = requestWithBody('');
    expect(await parseJsonBody(request)).toBeNull();
  });
});
