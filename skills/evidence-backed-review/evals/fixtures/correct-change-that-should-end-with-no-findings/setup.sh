#!/usr/bin/env bash
set -e
# A private scratch dir: arms of one comparison run at the same time, and a
# shared path let one setup delete the copies the other had not restored yet.
keep=$(mktemp -d)
trap 'rm -rf "$keep"' EXIT
git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
cp src/fetch-invoices.js "$keep"/proposed-fetch.js
cp docs/runbook.md "$keep"/proposed-runbook.md
# Base: our own retry loop over the same statuses the client already retries,
# and a runbook describing the nine attempts that produced.
cat > src/fetch-invoices.js <<'JS'
import { client } from "./client.js";

const RETRYABLE = (error) => error.status === 429 || error.status >= 500;

export async function fetchInvoices(accountId, { signal } = {}) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await client.invoices.list({ accountId, signal });
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (!RETRYABLE(error)) throw new InvoiceFetchFailed(accountId, { cause: error });
      lastError = error;
      await new Promise((r) => setTimeout(r, 50 * 2 ** attempt));
    }
  }
  throw new InvoiceFetchFailed(accountId, { cause: lastError });
}

export class InvoiceFetchFailed extends Error {
  constructor(accountId, options) {
    super(`could not fetch invoices for ${accountId}`, options);
    this.name = "InvoiceFetchFailed";
    this.accountId = accountId;
  }
}
JS
cat > docs/runbook.md <<'JS'
# Invoice sync runbook

A 429 or 5xx from the vendor is retried three times by our wrapper, on top of
the client's own three attempts. Anything else fails on the first attempt. If
the sync still fails, `InvoiceFetchFailed` is raised with the account id and
the original error as `cause`.
JS
git add -A -- . ':!setup.sh' ':!PULL_REQUEST.md'
git commit -qm "base: local retry wrapper over the client"
git branch -M main
git checkout -qb drop-the-retry-wrapper
cp "$keep"/proposed-fetch.js src/fetch-invoices.js
cp "$keep"/proposed-runbook.md docs/runbook.md
git add -A -- . ':!setup.sh'
git commit -qm "refactor: rely on the client's own retry policy"
