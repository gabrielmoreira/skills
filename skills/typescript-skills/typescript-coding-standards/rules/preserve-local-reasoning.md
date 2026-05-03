---
title: Preserve Local Reasoning
decision: Use this when one behavior is getting spread across too many thin layers
tags: typescript, readability, structure
---

## ✅ Prefer

Keep important behavior understandable in one small local read.

### Use this when

- one action now requires opening many files to understand
- layers mostly rename, forward, or reshuffle values
- orchestration is becoming too fragmented

### Example

```ts
export async function sendReceipt(input: ReceiptInput) {
  const receipt = buildReceipt(input);
  await mailer.send(receipt);
  return receipt.id;
}
```

```ts
export async function createInvoice(input: InvoiceInput) {
  const invoice = buildInvoice(input);
  await invoiceStore.save(invoice);
  await notifier.notify(invoice.id);
  return invoice.id;
}
```

### Why this helps

- readers can understand inputs, outputs, and side effects quickly
- changes stay safer because behavior is still locally legible
- abstraction cost stays proportional to its value

## ⚠️ Avoid

Do not split one behavior across many pass-through layers.

### This is a poor fit when

- each layer adds little meaning
- the call path is long but conceptually thin
- file count rises without increasing clarity

### Example

```text
handler -> workflow -> resolver -> wrapper -> adapter
```

### Why to avoid it

- the reader has to reconstruct simple behavior from scattered pieces
- local edits become slower and riskier
- the design gets elegant on a diagram and expensive in practice
