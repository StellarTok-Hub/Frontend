import { describe, expect, it } from 'vitest';
import { describeSubmissionError } from './stellar';

describe('describeSubmissionError', () => {
  it('maps op_no_trust to a friendly trustline message', () => {
    const error = {
      response: { data: { extras: { result_codes: { operations: ['op_no_trust'] } } } },
    };
    expect(describeSubmissionError(error)).toMatch(/trustline/i);
  });

  it('falls back to a generic message for unrecognized errors', () => {
    expect(describeSubmissionError(new Error('boom'))).toBe('Could not submit the transaction.');
  });
});
