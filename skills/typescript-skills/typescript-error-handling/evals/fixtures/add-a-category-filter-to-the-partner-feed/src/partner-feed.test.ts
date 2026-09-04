import assert from "node:assert/strict";
import test from "node:test";

import { buildPartnerFeed } from "./partner-feed.ts";

const rows = [
  { sku: "A1", display: { title: { long: "Long name" } }, pricing: { amount: 10, currency: "EUR" }, stock: 3, categoryCode: "SHOES" },
  { sku: "B2", pricing: { amount: 20, currency: "EUR" }, stock: 0, categoryCode: "BAGS" },
];

// The catalogue is reached through the global fetch, so the test replaces that
// rather than the module. Module mocking needs a flag the harness does not pass,
// and swapping the module would also hide the path the failure travels.
function withFetch(impl: typeof globalThis.fetch, run: () => Promise<void>) {
  const real = globalThis.fetch;
  globalThis.fetch = impl;
  return run().finally(() => { globalThis.fetch = real; });
}

const ok = (body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof globalThis.fetch;

test("maps rows to partner items", async () => {
  await withFetch(ok({ rows }), async () => {
    const feed = await buildPartnerFeed("p-1");
    assert.equal(feed.length, 2);
    assert.equal(feed[0].title, "Long name");
    assert.equal(feed[1].available, false);
  });
});

test("falls back to the short title when there is no long one", async () => {
  await withFetch(ok({ rows: [{ sku: "C3", display: { title: { short: "Short" } }, pricing: { amount: 5, currency: "EUR" }, stock: 1 }] }), async () => {
    const feed = await buildPartnerFeed("p-1");
    assert.equal(feed[0].title, "Short");
  });
});
