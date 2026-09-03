#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"

git checkout -q -b main 2>/dev/null || true

# Base version: only domestic fee
cat << 'EOF' > src/fees.js
export function calculateDomesticFee(amountCents) {
  if (!amountCents || amountCents <= 0) return 0;
  return Math.round(amountCents * 0.015) + 30;
}
EOF

cat << 'EOF' > src/fees.test.js
import assert from "node:assert/strict";
import test from "node:test";

import { calculateDomesticFee } from "./fees.js";

test("calculates domestic interchange fee", () => {
  const fee = calculateDomesticFee(10000);
  assert.equal(fee, 180);
});
EOF

git add package.json .github src/fees.js src/fees.test.js verify-defect.js
git commit -qm "base: domestic fee calculation"

git checkout -qb feat/cross-border-fees

# Branch version: adds international fee calculation with defect and weak test
cat << 'EOF' > src/fees.js
export function calculateDomesticFee(amountCents) {
  if (!amountCents || amountCents <= 0) return 0;
  return Math.round(amountCents * 0.015) + 30;
}

/**
 * Calculates cross-border international transaction fee.
 * Specification: 3% fee on non-US transfers, capped at 5000 cents ($50).
 */
export function calculateInternationalFee(amountCents, countryCode, currency) {
  if (!amountCents || amountCents <= 0) return 0;
  if (countryCode === "US") return 0;

  // Defect: returns 0 instead of 3% markup!
  return 0;
}
EOF

cat << 'EOF' > src/fees.test.js
import assert from "node:assert/strict";
import test from "node:test";

import { calculateDomesticFee, calculateInternationalFee } from "./fees.js";

test("calculates domestic interchange fee", () => {
  const fee = calculateDomesticFee(10000);
  assert.equal(fee, 180);
});

test("calculates cross-border fees for international transactions", () => {
  const fee = calculateInternationalFee(10000, "CA", "CAD");
  // Test vacuum: asserts only that the function returned a number, asserting nothing about value!
  assert.ok(typeof fee === "number");
});
EOF

git add PULL_REQUEST.md src/fees.js src/fees.test.js
git commit -qm "feat: add international cross-border transaction fees"
