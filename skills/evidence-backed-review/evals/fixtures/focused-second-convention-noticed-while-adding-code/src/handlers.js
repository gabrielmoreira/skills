import { AppError } from "./errors.js";

// Newer shape, and the one docs/standards.md names.
export function getOrder(store, id) {
  const order = store.orders.get(id);
  if (!order) {
    throw new AppError("ORDER_NOT_FOUND", 404, "no order with that id");
  }
  return order;
}

// Older shape, left from before the standard was written.
export function getInvoice(store, id) {
  const invoice = store.invoices.get(id);
  if (!invoice) {
    throw new Error("invoice " + id + " not found (404)");
  }
  return invoice;
}
