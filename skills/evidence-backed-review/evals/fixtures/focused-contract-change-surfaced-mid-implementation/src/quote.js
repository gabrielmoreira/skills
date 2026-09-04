export function buildQuote(cart, shipping) {
  if (!cart || !cart.id) {
    throw new Error("Invalid cart");
  }

  return {
    quoteId: `q_${cart.id}`,
    totalCents: cart.totalCents + shipping.costCents,
    currency: cart.currency ?? "USD",
  };
}
