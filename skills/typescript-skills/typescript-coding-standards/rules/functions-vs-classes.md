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
- You are choosing between a function, object literal, `makeXxx` factory, or class.
- A class has only one public method or no meaningful instance identity.
- A function is starting to accumulate private dependencies or small private state.
- You want grouped behavior without inheritance or framework ceremony.

Start here:
- Use a plain function for pure or stateless behavior.

Escalate when:
- Several functions share dependencies or small private state.
- Tests need to inject dependencies once and call multiple related capabilities.
- A caller benefits from a named capability object.
- Instance lifecycle, ordered protocol, cleanup, identity, or very high allocation rate becomes real.

Complexity ladder:
1. Plain function for one stateless behavior.
2. Object literal for a small group of already-built functions.
3. `makeXxx` factory returning an object with function properties when dependencies/state should be closure-private.
4. Class when instances have identity, lifecycle, protocol, cleanup, subclass/framework requirements, or measured allocation/prototype pressure.
5. Interface/base class only when boundary or polymorphism pressure is real.

Do:
- Use functions for pure or stateless transformations.
- Use `makeXxx` for small capability objects that close over dependencies or private state.
- Return the smallest public object callers need.
- Use classes when instances represent identity, lifecycle, mutable resource state, subscription handles, resources, or ordered protocols.
- Keep construction separate from behavior when dependencies are external.

Avoid:
- Classes used only as namespaces.
- `new` where a function or `makeXxx` capability object preserves local reasoning.
- Inheritance for code reuse before composition has failed.
- Exposing mutable private state that could stay closure-private.
- Creating huge numbers of closure objects on hot paths without measurement.

Exceptions:
- Framework APIs may require classes; keep framework ceremony at the edge.
- A class can wrap a real resource handle even if the first version has few methods.
- If thousands of instances are created per second, measure allocation and consider class/prototype methods or hoisted functions.

Example:

Start with a function when behavior is stateless:

```ts
export function formatReceipt(order: Order) {
  return `${order.id}:${order.total}`;
}
```

Escalate to `makeXxx` when dependencies or private state should be scoped once:

```ts
export function makeReceiptSender({ mailer, audit }: {
  mailer: Mailer;
  audit: AuditLog;
}) {
  let sentCount = 0;

  async function sendReceipt(order: Order) {
    await mailer.send(order.email, formatReceipt(order));
    sentCount += 1;
    await audit.record("receipt-sent", { orderId: order.id });
  }

  function stats() {
    return { sentCount };
  }

  return { sendReceipt, stats };
}
```

Use a class when lifecycle or protocol is the point:

```ts
class ReceiptStream {
  constructor(private readonly connection: Connection) {}

  async open() { /* acquire resource */ }
  async send(order: Order) { /* requires open connection */ }
  async close() { /* release resource */ }
}
```

Verify:
- State what an instance represents beyond a bag of functions.
- Check whether closure-private state would be simpler than class-private state.
- Check whether two instances can differ meaningfully.
- Check whether lifecycle cleanup, state transitions, protocol order, or measured allocation pressure matter to callers.
