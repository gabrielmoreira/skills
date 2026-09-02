// ---------------------------------------------------------------- formatting
// Six pure functions. Nothing here reads state, nothing calls out, and none of
// them is used by anything in this file except the receipt at the bottom.

export function formatMoney(cents, currency) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${currency} ${(abs / 100).toFixed(2)}`;
}

export function formatQuantity(n, unit) {
  return n === 1 ? `1 ${unit}` : `${n} ${unit}s`;
}

export function formatAddress(a) {
  return [a.line1, a.line2, a.city, a.postcode, a.country].filter(Boolean).join(", ");
}

export function formatDate(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

export function truncate(s, max) {
  return s.length <= max ? s : `${s.slice(0, max - 1)}\u2026`;
}

export function pluralHeading(n) {
  return n === 1 ? "Your item" : "Your items";
}

// -------------------------------------------------------------- the checkout
// One flow, read top to bottom, in the order the steps happen. Each step needs
// what the step before it produced. Nothing in here is called from anywhere
// else, and no step of it is reachable on its own.

export async function checkout(cart, customer, deps) {
  if (!cart.lines.length) {
    return { ok: false, reason: "empty-cart" };
  }

  const priced = [];
  for (const line of cart.lines) {
    const product = await deps.catalogue.find(line.sku);
    if (!product) return { ok: false, reason: "unknown-sku", sku: line.sku };
    if (product.stock < line.quantity) {
      return { ok: false, reason: "out-of-stock", sku: line.sku, available: product.stock };
    }
    priced.push({ ...line, unitCents: product.priceCents, name: product.name });
  }

  let subtotal = 0;
  for (const line of priced) subtotal += line.unitCents * line.quantity;

  let discountCents = 0;
  if (customer.tier === "gold") discountCents = Math.floor(subtotal * 0.1);
  else if (customer.tier === "silver") discountCents = Math.floor(subtotal * 0.05);
  if (cart.voucher) {
    const voucher = await deps.vouchers.redeem(cart.voucher, customer.id);
    if (!voucher.valid) return { ok: false, reason: "voucher-rejected", code: cart.voucher };
    discountCents += voucher.amountCents;
  }
  if (discountCents > subtotal) discountCents = subtotal;

  const taxable = subtotal - discountCents;
  const taxRate = customer.address.country === "GB" ? 0.2 : 0;
  const taxCents = Math.round(taxable * taxRate);

  const weightGrams = priced.reduce((a, l) => a + l.quantity * 250, 0);
  let shippingCents;
  if (taxable >= 5000) shippingCents = 0;
  else if (weightGrams < 1000) shippingCents = 399;
  else shippingCents = 399 + Math.ceil((weightGrams - 1000) / 1000) * 150;

  const totalCents = taxable + taxCents + shippingCents;

  const payment = await deps.payments.charge({
    customerId: customer.id,
    amountCents: totalCents,
    currency: cart.currency,
  });
  if (!payment.approved) {
    return { ok: false, reason: "payment-declined", code: payment.declineCode };
  }

  const order = await deps.orders.create({
    customerId: customer.id,
    lines: priced,
    subtotalCents: subtotal,
    discountCents,
    taxCents,
    shippingCents,
    totalCents,
    paymentRef: payment.reference,
    placedAt: deps.clock.now(),
  });

  for (const line of priced) {
    await deps.catalogue.decrement(line.sku, line.quantity);
  }

  return { ok: true, orderId: order.id, totalCents };
}

// ------------------------------------------------------------------- receipt
// Reads nothing, calls nothing, and is the only caller of the formatters above.

export function renderReceipt(order, customer) {
  const lines = order.lines.map(
    (l) => `${formatQuantity(l.quantity, "unit")}  ${truncate(l.name, 32)}  ${formatMoney(l.unitCents * l.quantity, order.currency)}`,
  );
  return [
    pluralHeading(order.lines.length),
    formatDate(order.placedAt),
    formatAddress(customer.address),
    "",
    ...lines,
    "",
    `Subtotal  ${formatMoney(order.subtotalCents, order.currency)}`,
    `Discount  ${formatMoney(-order.discountCents, order.currency)}`,
    `Tax       ${formatMoney(order.taxCents, order.currency)}`,
    `Shipping  ${formatMoney(order.shippingCents, order.currency)}`,
    `Total     ${formatMoney(order.totalCents, order.currency)}`,
  ].join("\n");
}
