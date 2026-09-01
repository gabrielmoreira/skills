---
id: typescript-coding-standards.functions-vs-classes
owner: typescript-coding-standards
canonical: true
severity: default
references: [Utility Class, Speculative Generality (Fowler), Refused Bequest (Fowler), Premature Optimization (Knuth), composition over inheritance]
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
- **Utility Class.** Every method static, so it is a module wearing ceremony, and each reader has to rule out instance state before they can ignore it.
- **Speculative Generality.** Grouping, OO consistency or future flexibility as the whole reason, so the class protects no invariant and nothing tells the next author what may go in it.
- **Refused Bequest.** Inheritance taken for reuse before composition has failed, so a base fixes every subclass at once and the first requirement that does not fit is paid for by all of them.
- **Premature Optimization.** Closures replaced on a hot path with no measurement, trading a readable shape for a guess about an allocation cost nobody has seen.
- **Ceremony without a seam.** `new` where a function or a capability object reads as well, so the caller pays construction for a boundary that is not there.
- **State the object cannot defend.** Public mutable fields that could have stayed closure-private, so any caller can move what it depends on and its invariants stop being local.

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
