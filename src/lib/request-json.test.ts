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
});
