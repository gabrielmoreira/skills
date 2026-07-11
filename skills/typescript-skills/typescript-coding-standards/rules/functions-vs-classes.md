---
id: typescript-coding-standards.functions-vs-classes
owner: typescript-coding-standards
canonical: true
severity: default
references: [Closure Module Pattern, SRP (SOLID)]
---

# Functions vs Classes

Decision: Prefer functions first; use `makeXxx` capability objects when closure-private scope helps; use classes when identity, lifecycle, protocol, or allocation pressure earns the class.

Use when:
- Choosing between a function, object literal, `makeXxx` factory, or class.
- A class has one public method or no meaningful instance identity; or several functions share dependencies/small private state and tests need to inject them once for multiple related capabilities.

Do:
- Use plain functions for pure/stateless transformations.
- Use a `makeXxx` factory (object of functions closing over dependencies) once a second function needs the same dependencies or private state.
- Reach for a class only when instances represent identity, lifecycle, mutable resource state, subscription handles, or ordered protocols (open/use/close) — not for grouping alone.
- Keep construction separate from behavior when dependencies are external; return the smallest public object callers need.

Avoid:
- Classes used only as namespaces, or `new` where a function/`makeXxx` object preserves local reasoning just as well.
- Treating "related functions," OO consistency, or future flexibility as sufficient reason for a class on their own.
- Inheritance for reuse before composition has failed, exposing mutable private state that could stay closure-private, or creating huge numbers of closure objects on hot paths without measuring allocation.

Exceptions: framework APIs may require classes (keep the ceremony at the edge); a class can wrap a real resource handle even with few methods; at high instance-creation rates, measure allocation before choosing class/prototype methods over closures.

Example — function → `makeXxx` when dependencies should be closure-private; class only when lifecycle/protocol is the point (composition-root vs per-call assembly: `../typescript-composition/rules/ready-instance-vs-factory.md`):

```ts
export function makeReceiptSender({ mailer, audit }: { mailer: Mailer; audit: AuditLog }) {
  let sentCount = 0;
  async function sendReceipt(order: Order) {
    await mailer.send(order.email, formatReceipt(order));
    sentCount += 1;
    await audit.record("receipt-sent", { orderId: order.id });
  }
  return { sendReceipt, stats: () => ({ sentCount }) };
}

class ReceiptStream {
  constructor(private readonly connection: Connection) {}
  async open()  { /* acquire resource */ }
  async send(order: Order) { /* requires open connection */ }
  async close() { /* release resource */ }
}
```

Verify:
- State what an instance represents beyond a bag of functions.
- Check whether closure-private state would be simpler than class-private state.
- Check whether lifecycle cleanup, protocol order, identity, or measured allocation pressure genuinely matter to callers.
