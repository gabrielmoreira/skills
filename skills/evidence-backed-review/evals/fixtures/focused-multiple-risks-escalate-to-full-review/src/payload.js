export function billingPayload(invoice) {
  return {
    invoiceId: invoice.id,
    subtotalCents: invoice.subtotalCents,
    totalCents: invoice.totalCents,
  };
}
