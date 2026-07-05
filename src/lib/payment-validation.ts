/**
 * Client-safe. No Stellar SDK dependency, so both the API routes and the
 * client components that call them (TipButton, the campaign form) can
 * validate an amount instantly before ever making a network round trip.
 */
export class InvalidPaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaymentError';
  }
}

const MAX_STROOP_DECIMALS = 7;

export function validatePaymentAmount(amount: string): string | null {
  if (!/^\d+(\.\d+)?$/.test(amount)) {
    return 'Amount must be a positive decimal number.';
  }
  if (Number(amount) <= 0) {
    return 'Amount must be greater than zero.';
  }
  const decimals = amount.split('.')[1]?.length ?? 0;
  if (decimals > MAX_STROOP_DECIMALS) {
    return `Amount supports at most ${MAX_STROOP_DECIMALS} decimal places.`;
  }
  return null;
}

/** Throwing variant for server code that wants to fail with a single catch. */
export function assertValidPaymentAmount(amount: string): void {
  const error = validatePaymentAmount(amount);
  if (error) throw new InvalidPaymentError(error);
}
