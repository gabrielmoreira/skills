---
id: typescript-coding-standards.functions-vs-classes
owner: typescript-coding-standards
canonical: true
severity: default
references: [Closure Module Pattern, SRP (SOLID)]
---

# Functions vs Classes

Decision: **Prefer a function. Use a `makeXxx` capability object once closure-private scope helps. Use a class only where identity, lifecycle, protocol, or measured allocation pressure earns it.**

Use when:
- **Choosing between a function, an object literal, a factory, and a class.**
- **A class has one public method**, or no meaningful instance identity.
- **Several functions share dependencies or small private state**, and tests want to inject them once.

Do:
- **Use a plain function for a pure or stateless transformation.**
- **Move to a `makeXxx` factory** once a second function needs the same dependencies or private state.
- **Reach for a class only when an instance represents something.**
  - Identity.
  - Lifecycle or mutable resource state.
  - A subscription handle.
  - An ordered protocol, such as open then use then close.
- **Keep construction separate from behaviour** where dependencies come from outside.
- **Return the smallest public object callers need.**

Avoid:
- **A class used as a namespace.**
- **`new` where a function or a capability object reads just as well.**
- **Grouping, OO consistency, or future flexibility as the whole reason** for a class.
- **Inheritance for reuse**, before composition has actually failed.
- **Exposing mutable state** that could have stayed closure-private.
- **Creating very many closure objects on a hot path** without measuring first.

Exceptions:
- **A framework API MAY require a class.** Keep that ceremony at the edge.
- **A class MAY wrap a real resource handle** even with few methods.
- **At high instance rates, measure allocation** before choosing prototype methods over closures.

Example (one instance, not the set):

```ts
// Capability object: dependencies stay closure-private, and tests inject once.
export function makeReceiptSender({ mailer, audit }: { mailer: Mailer; audit: AuditLog }) {
  let sentCount = 0;
  async function sendReceipt(order: Order) {
    await mailer.send(order.email, formatReceipt(order));
    sentCount += 1;
    await audit.record("receipt-sent", { orderId: order.id });
  }
  return { sendReceipt, stats: () => ({ sentCount }) };
}

// Class: the protocol is the point, and order matters.
class ReceiptStream {
  constructor(private readonly connection: Connection) {}
  async open()  { /* acquire */ }
  async send(order: Order) { /* requires an open connection */ }
  async close() { /* release */ }
}
```

- **For where that object is assembled**, read `skill://typescript-skills/typescript-composition/rules/ready-instance-vs-factory.md`.

Verify:
- **Say what an instance represents** beyond a bag of functions.
- **Check whether closure-private state would be simpler** than class-private state.
- **Check the lifecycle, protocol order, identity, or measured allocation** genuinely matters to callers.
