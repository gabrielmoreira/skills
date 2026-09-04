import { buildQuote } from "./quote.js";

export function confirmationLines(cart, shipping) {
  const quote = buildQuote(cart, shipping);
  return [
    `Quote ${quote.quoteId}`,
    `Total ${(quote.totalCents / 100).toFixed(2)} ${quote.currency}`,
    `Arrives in about ${quote.estimatedDeliveryDays} days`,
  ];
}
