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
