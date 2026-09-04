#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
git checkout -q -b main 2>/dev/null || true

# Base commit: two immediate attempts, which is what both written places say.
cat << 'BASE' > src/fetch-orders.js
const MAX_ATTEMPTS = 2;

export async function fetchOrders(client, customerId) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await client.get("/orders/" + customerId);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
BASE

cat << 'BASE' > src/fetch-orders.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchOrders } from "./fetch-orders.js";

test("returns the first successful response", async () => {
  const client = { get: async () => ({ orders: [] }) };
  assert.deepEqual(await fetchOrders(client, "c1"), { orders: [] });
});

test("gives up after the attempt cap and rethrows", async () => {
  let calls = 0;
  const client = { get: async () => { calls++; throw new Error("upstream down"); } };
  await assert.rejects(() => fetchOrders(client, "c1"), /upstream down/);
  assert.equal(calls, 2);
});
BASE

git add package.json AGENTS.md docs/reliability.md src/fetch-orders.js src/fetch-orders.test.js src/index.js
git commit -qm "base: order fetch with two immediate retries"

# The change the prompt describes, left uncommitted: three attempts with
# exponential backoff. Neither written place has been updated.
cat << 'WIP' > src/fetch-orders.js
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchOrders(client, customerId) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await client.get("/orders/" + customerId);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastError;
}
WIP

cat << 'WIP' > src/fetch-orders.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchOrders } from "./fetch-orders.js";

test("returns the first successful response", async () => {
  const client = { get: async () => ({ orders: [] }) };
  assert.deepEqual(await fetchOrders(client, "c1"), { orders: [] });
});

test("gives up after the attempt cap and rethrows", async () => {
  let calls = 0;
  const client = { get: async () => { calls++; throw new Error("upstream down"); } };
  await assert.rejects(() => fetchOrders(client, "c1"), /upstream down/);
  assert.equal(calls, 3);
});
WIP
