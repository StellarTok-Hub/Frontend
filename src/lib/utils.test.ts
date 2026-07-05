import { describe, expect, it } from 'vitest';
import { cn, formatAsset, truncateAddress } from './utils';

describe('cn', () => {
  it('joins truthy class values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });
});

describe('truncateAddress', () => {
  it('leaves short addresses untouched', () => {
    expect(truncateAddress('GABC')).toBe('GABC');
  });

  it('truncates long Stellar addresses to head...tail', () => {
    const address = 'GAK5NC4G3IB4XQ54EIP7ZQ6NAMEB4C6MMMDDZ5B6LWTP4YFUCPYAWVU3';
    expect(truncateAddress(address)).toBe('GAK5...WVU3');
  });

  it('respects a custom character count', () => {
    const address = 'GAK5NC4G3IB4XQ54EIP7ZQ6NAMEB4C6MMMDDZ5B6LWTP4YFUCPYAWVU3';
    expect(truncateAddress(address, 6)).toBe('GAK5NC...YAWVU3');
  });
});

describe('formatAsset', () => {
  it('formats an amount with its asset code', () => {
    expect(formatAsset(5, 'USDC')).toBe('5 USDC');
  });

  it('caps display precision at 2 decimal places', () => {
    expect(formatAsset(5.123456, 'XLM')).toBe('5.12 XLM');
  });
});
