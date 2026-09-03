#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"

git checkout -q -b main 2>/dev/null || true

# Base version with empty routes
cat << 'EOF' > src/invoices.js
export async function listInvoices(req, db) {
  return { status: 200, body: await db.findByOwner(req.user.id) };
}
EOF

cat << 'EOF' > src/invoices.test.js
import assert from "node:assert/strict";
import test from "node:test";

import { listInvoices } from "./invoices.js";

test("lists invoices for owner", async () => {
  const req = { user: { id: "usr_alice" } };
  const db = { findByOwner: async () => [] };
  const res = await listInvoices(req, db);
  assert.equal(res.status, 200);
});
EOF

git add package.json verify-abuse.js src/invoices.js src/invoices.test.js
git commit -qm "base: initial invoices service"

git checkout -qb feat/invoice-lookup-and-upload

# Branch version: adds getInvoiceById and uploadReceiptAttachment
cat << 'EOF' > src/invoices.js
import path from "node:path";

/**
 * Retrieves invoice by ID.
 * Note: Authentication middleware has verified req.user.
 */
export async function getInvoiceById(req, db) {
  const invoiceId = req.params.id;
  const invoice = await db.findById(invoiceId);
  if (!invoice) {
    return { status: 404, body: { error: "Invoice not found" } };
  }

  // Abuse path 1 (IDOR): Object ownership is not validated against req.user.id!
  // Any authenticated user can read invoices belonging to any other user.
  return { status: 200, body: invoice };
}

/**
 * Uploads a receipt attachment for an invoice.
 */
export async function uploadReceiptAttachment(req, storage) {
  const { invoiceId, filename, content } = req.body;
  if (!invoiceId || !filename || !content) {
    return { status: 400, body: { error: "Missing required fields" } };
  }

  // Abuse path 2 (Path traversal): Filename is not sanitized against directory traversal.
  const targetPath = path.join("/var/data/uploads", filename);
  await storage.save(targetPath, content);

  return { status: 201, body: { ok: true, savedPath: targetPath } };
}
EOF

cat << 'EOF' > src/invoices.test.js
import assert from "node:assert/strict";
import test from "node:test";

import { getInvoiceById, uploadReceiptAttachment } from "./invoices.js";

function mockDb() {
  return {
    async findById(id) {
      if (id === "inv_alice_1") {
        return { id: "inv_alice_1", ownerId: "usr_alice", amountCents: 1500 };
      }
      return null;
    },
  };
}

function mockStorage() {
  const written = [];
  return {
    written,
    async save(dest, content) {
      written.push({ dest, content });
    },
  };
}

test("retrieves invoice for owner when found", async () => {
  const req = {
    user: { id: "usr_alice" },
    params: { id: "inv_alice_1" },
  };
  const res = await getInvoiceById(req, mockDb());
  assert.equal(res.status, 200);
  assert.equal(res.body.id, "inv_alice_1");
  assert.equal(res.body.amountCents, 1500);
});

test("returns 404 when invoice not found", async () => {
  const req = {
    user: { id: "usr_alice" },
    params: { id: "inv_nonexistent" },
  };
  const res = await getInvoiceById(req, mockDb());
  assert.equal(res.status, 404);
});

test("uploads receipt attachment successfully", async () => {
  const req = {
    user: { id: "usr_alice" },
    body: {
      invoiceId: "inv_alice_1",
      filename: "receipt.pdf",
      content: "PDF_BYTES",
    },
  };
  const storage = mockStorage();
  const res = await uploadReceiptAttachment(req, storage);
  assert.equal(res.status, 201);
  assert.equal(storage.written.length, 1);
});
EOF

git add PULL_REQUEST.md src/invoices.js src/invoices.test.js
git commit -qm "feat: get invoice by id endpoint and receipt upload"
