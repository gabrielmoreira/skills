#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
git checkout -q -b main 2>/dev/null || true

# Base: the payload still carries taxCents, the timeout is the documented one,
# and the error class sits in a single flat file rather than a directory.
mkdir -p src
cat << 'BASE' > src/payload.js
export function billingPayload(invoice) {
  return {
    invoiceId: invoice.id,
    subtotalCents: invoice.subtotalCents,
    taxCents: invoice.taxCents,
    totalCents: invoice.totalCents,
  };
}
BASE

cat << 'BASE' > src/config.js
export const config = {
  upstreamTimeoutMs: 5000,
  retries: 2,
};
BASE

cat << 'BASE' > src/app-error.js
export class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}
BASE

cat << 'BASE' > src/index.js
export { billingPayload } from "./payload.js";
export { config } from "./config.js";
export { AppError } from "./app-error.js";
BASE

rm -rf src/errors
git add package.json docs/consumers.md src/payload.js src/receipt.js src/config.js src/app-error.js src/payload.test.js src/index.js
git commit -qm "base: billing payload with tax, 5s timeout, flat error module"

# The three changes the prompt describes, all uncommitted at once.
cat << 'WIP' > src/payload.js
export function billingPayload(invoice) {
  return {
    invoiceId: invoice.id,
    subtotalCents: invoice.subtotalCents,
    totalCents: invoice.totalCents,
  };
}
WIP

cat << 'WIP' > src/config.js
export const config = {
  // Raised while working on the payload change.
  upstreamTimeoutMs: 30000,
  retries: 2,
};
WIP

mkdir -p src/errors
git rm -q --cached src/app-error.js
rm -f src/app-error.js
cat << 'WIP' > src/errors/app-error.js
export class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}
WIP

cat << 'WIP' > src/errors/index.js
export { AppError } from "./app-error.js";
WIP

cat << 'WIP' > src/index.js
export { billingPayload } from "./payload.js";
export { config } from "./config.js";
export { AppError } from "./errors/index.js";
WIP
