import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "./client.js";

const status = (code) => Object.assign(new Error(String(code)), { status: code });

test("retries a 5xx three times, then surfaces it", async () => {
  let calls = 0;
  const c = createClient({ transport: async () => { calls++; throw status(503); }, sleep: async () => {} });
  await assert.rejects(() => c.invoices.list({ accountId: "acct_1" }), { message: "503" });
  assert.equal(calls, 3);
});

test("does not retry a 400", async () => {
  let calls = 0;
  const c = createClient({ transport: async () => { calls++; throw status(400); }, sleep: async () => {} });
  await assert.rejects(() => c.invoices.list({ accountId: "acct_1" }), { message: "400" });
  assert.equal(calls, 1);
});

test("surfaces AbortError without retrying", async () => {
  let calls = 0;
  const c = createClient({
    transport: async () => { calls++; throw Object.assign(new Error("aborted"), { name: "AbortError" }); },
    sleep: async () => {},
  });
  await assert.rejects(() => c.invoices.list({ accountId: "acct_1" }), { name: "AbortError" });
  assert.equal(calls, 1);
});
