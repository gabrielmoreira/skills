---
id: typescript-composition.ready-instance-vs-factory
owner: typescript-composition
canonical: true
severity: default
references: [Dependency Injection (Fowler), Factory Method (GoF)]
---

# Ready Instance vs Factory

Decision: **Pass a ready dependency inward by default, and a factory only where construction must vary at call time or scope time.**

Use when:
- **A function takes a factory** but the thing it builds never varies.
- **A function takes a ready dependency** but needs per-call, request, tenant, or transaction input to build it.
- **Tests are hard** because the dependency is constructed inside.
- **A factory hides provider selection or lifecycle policy.**
- **A dependency must be opened and closed around one operation.**
- **Behaviour must create several scoped instances during a single call.**

Do:
- **Pass a ready dependency when every construction input is known before behaviour runs.**
- **Pass a factory when construction depends on something only the call knows.** Per-call data, request scope, tenant, transaction, or a lazily acquired resource.
- **Name a factory for what it builds.** Prefer `makeXxx` for in-process construction, such as `makeTenantMailer`.
- **Use a domain verb such as `openTransaction`** where the lifecycle meaning is stronger than the construction.
- **Keep factory ownership at the composition boundary** whenever it encodes runtime policy.

Avoid:
- **A factory that always returns the same singleton.**
- **A ready instance that captured the wrong scope.**
- **A factory named generically enough to hide a lifecycle or a provider choice.**
- **A behaviour module that both picks the factory and uses what it makes.**

Exceptions:
- **A lazy factory is fine for an expensive optional dependency**, where the lifecycle and the error path are both explicit.
- **A framework container MAY supply factories.** Behaviour still depends on the smallest capability it needs.

Example (one instance, not the set):

```ts
// Prefer a ready dependency:
export function makeSendReceipt({ mailer }: { mailer: Mailer }) {
  return (order: Order) => mailer.send(order.email);
}

// Escalate to a factory once scope varies per tenant:
export function makeSendReceipt({ getMailerForTenant }: {
  getMailerForTenant: (tenantId: string) => Mailer;
}) {
  return (order: Order) => getMailerForTenant(order.tenantId).send(order.email);
}
```

- **For choosing between a capability object, a class, and a plain function** inside the unit being assembled, read `skill://typescript-skills/typescript-coding-standards/rules/functions-vs-classes.md`.

Verify:
- **Separate the inputs known at assembly time from those that vary at call time.**
- **Check the scope of the dependency matches the data it captured.**
- **Check a test can pass a fake ready instance or a controlled factory** without touching global state.
