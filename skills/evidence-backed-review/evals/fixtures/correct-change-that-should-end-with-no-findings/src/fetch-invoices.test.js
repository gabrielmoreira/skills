import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchInvoices, InvoiceFetchFailed } from "./fetch-invoices.js";
import { client } from "./client.js";

test("returns the client's invoices", async () => {
  assert.deepEqual(await fetchInvoices("acct_1"), [{ id: "inv_1", accountId: "acct_1" }]);
});

test("cancellation stays an AbortError", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => fetchInvoices("acct_1", { signal: controller.signal }), { name: "AbortError" });
});

test("a client failure becomes InvoiceFetchFailed and keeps the cause", async () => {
  const boom = Object.assign(new Error("400"), { status: 400 });
  const original = client.invoices.list;
  client.invoices.list = async () => { throw boom; };
  try {
    await assert.rejects(() => fetchInvoices("acct_1"), (e) => e instanceof InvoiceFetchFailed && e.cause === boom);
  } finally {
    client.invoices.list = original;
  }
});
