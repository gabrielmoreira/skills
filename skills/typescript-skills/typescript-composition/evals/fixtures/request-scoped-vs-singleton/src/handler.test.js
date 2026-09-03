import assert from "node:assert/strict";
import test from "node:test";

import { handle } from "./handler.js";

function deps(latencyMs = 0) {
  const saved = [];
  const wait = () => new Promise((r) => setTimeout(r, latencyMs));
  return {
    saved,
    store: {
      async load(id) { await wait(); return { id, status: "in-transit", depotCode: "AA1" }; },
      async save(c) { await wait(); saved.push(c); },
    },
    depots: {
      async find(code) { await wait(); return { code, acceptsInbound: true }; },
    },
  };
}

test("stamps the actor who made the request", async () => {
  const d = deps();
  const r = await handle(
    { actor: { id: "u-1", name: "Ada" }, consignmentId: "c-1", depotCode: "BB2" },
    d,
  );
  assert.equal(r.ok, true);
  assert.equal(d.saved[0].changedBy, "u-1");
});

test("refuses a consignment already delivered", async () => {
  const d = deps();
  d.store.load = async (id) => ({ id, status: "delivered" });
  const r = await handle(
    { actor: { id: "u-1", name: "Ada" }, consignmentId: "c-9", depotCode: "BB2" },
    d,
  );
  assert.deepEqual(r, { ok: false, reason: "already-delivered" });
});

test("refuses a depot that is not accepting", async () => {
  const d = deps();
  d.depots.find = async (code) => ({ code, acceptsInbound: false });
  const r = await handle(
    { actor: { id: "u-2", name: "Grace" }, consignmentId: "c-2", depotCode: "CC3" },
    d,
  );
  assert.deepEqual(r, { ok: false, reason: "depot-closed", depotCode: "CC3" });
});
