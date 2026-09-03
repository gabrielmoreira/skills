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

  const targetPath = path.join("/var/data/uploads", filename);
  await storage.save(targetPath, content);

  return { status: 201, body: { ok: true, savedPath: targetPath } };
}
