const DOMESTIC_BASE_CENTS = 499;

export function shippingFor(cart) {
  if (!cart || !Array.isArray(cart.items)) {
    throw new Error("Invalid cart");
  }

  const weightGrams = cart.items.reduce((total, item) => total + item.weightGrams * item.quantity, 0);

  // TODO: international rates and the weight bands above 5kg are not written yet.
  return { costCents: DOMESTIC_BASE_CENTS, weightGrams };
}
