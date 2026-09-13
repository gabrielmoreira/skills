import { client } from "./client.js";

// The client owns the retry policy for 429 and 5xx; see src/client.test.js.
export async function fetchInvoices(accountId, { signal } = {}) {
  try {
    return await client.invoices.list({ accountId, signal });
  } catch (error) {
    // Callers distinguish cancellation from failure, so both surface unchanged.
    if (error.name === "AbortError") throw error;
    throw new InvoiceFetchFailed(accountId, { cause: error });
  }
}

export class InvoiceFetchFailed extends Error {
  constructor(accountId, options) {
    super(`could not fetch invoices for ${accountId}`, options);
    this.name = "InvoiceFetchFailed";
    this.accountId = accountId;
  }
}
