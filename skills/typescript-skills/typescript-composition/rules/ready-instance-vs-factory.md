---
id: typescript-composition.ready-instance-vs-factory
owner: typescript-composition
canonical: true
severity: default
references: [Dependency Injection (Fowler), Factory Method (GoF)]
---

# Ready Instance vs Factory

Decision: Pass ready dependencies inward by default; pass factories only when construction must vary at call time or scope time.

Use when:
- A function accepts a factory but the created dependency is stable.
- A function accepts a ready dependency but needs request, tenant, transaction, or per-call inputs to construct it.
- Tests are hard because dependencies are constructed internally.
- A factory hides provider selection or lifecycle policy.

Start here:
- Pass the ready capability the behavior needs.

Escalate when:
- Construction depends on per-call, request, tenant, transaction, or lazy optional inputs.
- The dependency must be opened/closed around an operation.
- The behavior must create multiple scoped instances during one call.

Complexity ladder:
1. Ready dependency object.
2. Small factory for per-call scoped dependency.
3. Named scope factory, such as tenant/request/transaction factory.
4. Composition-root provider selector that returns ready dependencies or scoped factories.
5. Container/provider registry only when many implementations are loaded dynamically.

Do:
- Pass a ready dependency when all construction inputs are known before behavior runs.
- Pass a factory when construction depends on per-call data, request scope, tenant, transaction, or lazy resource acquisition.
- Keep factory naming specific. Prefer `makeXxx` for in-process construction, such as `makeTenantMailer`; use domain verbs like `openTransaction` when lifecycle semantics are stronger than construction.
- Keep factory ownership at the composition boundary when it encodes runtime policy.

Avoid:
- Factories that always return the same singleton.
- Ready instances that accidentally capture the wrong scope.
- Factories named generically enough to hide lifecycle or provider choice.
- Behavior modules that both choose a factory and use the dependency.

Exceptions:
- Lazy factories are acceptable for expensive optional dependencies if the lifecycle and error path are explicit.
- Framework dependency injection containers may supply factories; behavior should still depend on the smallest capability it needs.

Example:

Prefer ready dependency:

```ts
export function makeSendReceipt({ mailer }: { mailer: Mailer }) {
  return (order: Order) => mailer.send(order.email);
}
```

Escalate to factory when scope varies per tenant:

```ts
export function makeSendReceipt({ getMailerForTenant }: {
  getMailerForTenant: (tenantId: string) => Mailer;
}) {
  return (order: Order) => getMailerForTenant(order.tenantId).send(order.email);
}
```

For when to use a `makeXxx` capability object vs a class vs a plain function inside the unit being assembled, see `../typescript-coding-standards/rules/functions-vs-classes.md`.

Verify:
- Identify which inputs are known at assembly time and which vary at call time.
- Check dependency scope matches captured data.
- Check tests can pass a fake ready instance or controlled factory without global mutation.
