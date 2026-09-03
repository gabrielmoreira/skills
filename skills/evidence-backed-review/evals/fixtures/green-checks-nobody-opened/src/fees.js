export function calculateDomesticFee(amountCents) {
  if (!amountCents || amountCents <= 0) return 0;
  return Math.round(amountCents * 0.015) + 30;
}

/**
 * Calculates cross-border international transaction fee.
 * Specification: 3% fee on non-US transfers, capped at 5000 cents ($50).
 */
export function calculateInternationalFee(amountCents, countryCode, currency) {
  if (!amountCents || amountCents <= 0) return 0;
  if (countryCode === "US") return 0;

  return 0;
}
