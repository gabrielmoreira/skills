#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"

git checkout -q -b main 2>/dev/null || true

# Base version with 30000ms timeout
cat << 'EOF' > src/client.js
export const DEFAULT_TIMEOUT_MS = 30000;

export function createApiClient(options = {}) {
  return {
    baseUrl: options.baseUrl ?? "https://api.internal.example",
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    retries: options.retries ?? 3,
  };
}
EOF

cat << 'EOF' > src/client.test.js
import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient, DEFAULT_TIMEOUT_MS } from "./client.js";

test("creates client with default 30000ms timeout", () => {
  const client = createApiClient();
  assert.equal(client.timeoutMs, 30000);
  assert.equal(DEFAULT_TIMEOUT_MS, 30000);
});

test("allows caller to override timeout", () => {
  const client = createApiClient({ timeoutMs: 12000 });
  assert.equal(client.timeoutMs, 12000);
});
EOF

git add package.json README.md docs/onboarding.md check-doc-drift.js src/client.js src/client.test.js
git commit -qm "base: initial client implementation with 30s timeout"

git checkout -qb perf/reduce-client-timeout

# Branch version: changes default to 5000ms
cat << 'EOF' > src/client.js
// Default request timeout reduced from 30s to 5s in this branch
export const DEFAULT_TIMEOUT_MS = 5000;

export function createApiClient(options = {}) {
  return {
    baseUrl: options.baseUrl ?? "https://api.internal.example",
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    retries: options.retries ?? 3,
  };
}
EOF

cat << 'EOF' > src/client.test.js
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
EOF

git add PULL_REQUEST.md src/client.js src/client.test.js
git commit -qm "perf: reduce default client timeout from 30s to 5s"
