import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient, DEFAULT_TIMEOUT_MS } from "./client.js";

test("creates client with updated 5000ms default timeout", () => {
  const client = createApiClient();
  assert.equal(client.timeoutMs, 5000);
  assert.equal(DEFAULT_TIMEOUT_MS, 5000);
});

test("allows caller to override timeout", () => {
  const client = createApiClient({ timeoutMs: 12000 });
  assert.equal(client.timeoutMs, 12000);
});
