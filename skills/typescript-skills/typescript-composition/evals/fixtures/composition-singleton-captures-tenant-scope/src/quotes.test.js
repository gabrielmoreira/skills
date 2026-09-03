import assert from "node:assert/strict";
import test from "node:test";

import { quoteFor } from "./quotes.js";

const shipment = { originZone: "N1", destinationZone: "S4", weightGrams: 800 };

function deps(priceCents) {
  return {
    build: () => ({
      async bands() { return [{ upToGrams: 1000, priceCents }]; },
    }),
  };
}

test("quotes from the account's own rates", async () => {
  const account = { id: "acc-1", rateEndpoint: "https://a.example", credentials: "k1", marginBps: 250 };
  const r = await quoteFor(shipment, account, deps(1200));
  assert.equal(r.ok, true);
  assert.equal(r.priceCents, 1200);
});

test("refuses a shipment over the heaviest band", async () => {
  const account = { id: "acc-1", rateEndpoint: "https://a.example", credentials: "k1", marginBps: 250 };
  const heavy = { ...shipment, weightGrams: 5000 };
  const r = await quoteFor(heavy, account, deps(1200));
  assert.deepEqual(r, { ok: false, reason: "over-max-weight" });
});
