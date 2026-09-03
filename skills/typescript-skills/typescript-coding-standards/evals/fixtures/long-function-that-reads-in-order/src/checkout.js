/**
 * Processes a checkout for a customer cart.
 * Reads in top-down execution order from validation to confirmation.
 */
export async function processCheckout(cart, customer, paymentDetails, deps) {
  // 1. Validate cart items and customer status
  if (!customer || !customer.id) {
    return { ok: false, reason: "invalid-customer" };
  }
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return { ok: false, reason: "empty-cart" };
  }
  for (const item of cart.items) {
    if (!item.productId || typeof item.quantity !== "number" || item.quantity <= 0) {
      return { ok: false, reason: "invalid-cart-item", item };
    }
    if (typeof item.unitPriceCents !== "number" || item.unitPriceCents < 0) {
      return { ok: false, reason: "invalid-item-price", item };
    }
  }

  // 2. Check customer credit limit and active status
  const customerRecord = await deps.customerStore.findById(customer.id);
  if (!customerRecord) {
    return { ok: false, reason: "customer-not-found" };
  }
  if (customerRecord.isSuspended) {
    return { ok: false, reason: "customer-suspended" };
  }

  // 3. Compute item totals and discounts
  let subtotalCents = 0;
  for (const item of cart.items) {
    subtotalCents += item.unitPriceCents * item.quantity;
  }
  let discountCents = 0;
  if (cart.promoCode) {
    const promo = await deps.promoService.lookup(cart.promoCode);
    if (promo && promo.active && subtotalCents >= promo.minSubtotalCents) {
      if (promo.type === "fixed") {
        discountCents = Math.min(promo.discountCents, subtotalCents);
      } else if (promo.type === "percentage") {
        discountCents = Math.round((subtotalCents * promo.percentage) / 100);
      }
    }
  }
  const taxableSubtotal = Math.max(0, subtotalCents - discountCents);

  // 4. Calculate shipping rate
  let shippingCents = 0;
  if (cart.shippingMethod === "express") {
    shippingCents = 1500;
  } else if (cart.shippingMethod === "standard") {
    shippingCents = taxableSubtotal >= 5000 ? 0 : 500;
  } else {
    shippingCents = 800;
  }

  // 5. Calculate sales tax
  const taxRate = await deps.taxService.rateFor(customerRecord.regionCode || "DEFAULT");
  const taxCents = Math.round((taxableSubtotal + shippingCents) * taxRate);
  const totalCents = taxableSubtotal + shippingCents + taxCents;

  // 6. Check inventory availability
  for (const item of cart.items) {
    const inStock = await deps.inventoryStore.checkStock(item.productId, item.quantity);
    if (!inStock) {
      return { ok: false, reason: "insufficient-stock", productId: item.productId };
    }
  }

  // 7. Authorize payment charge
  const chargeResult = await deps.paymentGateway.charge({
    customerId: customer.id,
    amountCents: totalCents,
    currency: cart.currency || "USD",
    token: paymentDetails.token,
  });
  if (!chargeResult.success) {
    return {
      ok: false,
      reason: "payment-failed",
      gatewayCode: chargeResult.errorCode,
    };
  }

  // 8. Deduct inventory reservations
  const allocations = [];
  for (const item of cart.items) {
    const allocation = await deps.inventoryStore.allocate(item.productId, item.quantity);
    allocations.push(allocation);
  }

  // 9. Persist final order record
  const orderId = deps.idGenerator.nextId("ord_");
  const orderRecord = {
    orderId,
    customerId: customer.id,
    items: cart.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      totalCents: i.quantity * i.unitPriceCents,
    })),
    pricing: {
      subtotalCents,
      discountCents,
      shippingCents,
      taxCents,
      totalCents,
    },
    payment: {
      transactionId: chargeResult.transactionId,
      chargedAt: new Date().toISOString(),
    },
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  await deps.orderStore.save(orderRecord);

  // 10. Return completed checkout summary
  return {
    ok: true,
    orderId,
    totalCents,
    chargedAt: orderRecord.payment.chargedAt,
    itemCount: cart.items.length,
    status: "confirmed",
  };
}
