import { describe, expect, it } from 'vitest';
import {
  assertValidPaymentAmount,
  InvalidPaymentError,
  validatePaymentAmount,
} from './payment-validation';

describe('validatePaymentAmount', () => {
  it('accepts a plain positive integer', () => {
    expect(validatePaymentAmount('5')).toBeNull();
  });

  it('accepts up to 7 decimal places', () => {
    expect(validatePaymentAmount('1.1234567')).toBeNull();
  });

  it('rejects zero', () => {
    expect(validatePaymentAmount('0')).toMatch(/greater than zero/);
  });

  it('rejects negative amounts', () => {
    expect(validatePaymentAmount('-5')).toMatch(/positive decimal/);
  });

  it('rejects non-numeric input', () => {
    expect(validatePaymentAmount('abc')).toMatch(/positive decimal/);
  });

  it('rejects more than 7 decimal places', () => {
    expect(validatePaymentAmount('1.12345678')).toMatch(/7 decimal places/);
  });
});

describe('assertValidPaymentAmount', () => {
  it('does not throw for a valid amount', () => {
    expect(() => assertValidPaymentAmount('5')).not.toThrow();
  });

  it('throws InvalidPaymentError for an invalid amount', () => {
    expect(() => assertValidPaymentAmount('0')).toThrow(InvalidPaymentError);
  });
});
