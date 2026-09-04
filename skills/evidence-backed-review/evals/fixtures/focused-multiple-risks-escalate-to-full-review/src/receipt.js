import { billingPayload } from "./payload.js";

export function receiptLines(invoice) {
  const payload = billingPayload(invoice);
  return [
    "Invoice " + payload.invoiceId,
    "Subtotal " + (payload.subtotalCents / 100).toFixed(2),
    "Tax " + (payload.taxCents / 100).toFixed(2),
    "Total " + (payload.totalCents / 100).toFixed(2),
  ];
}
