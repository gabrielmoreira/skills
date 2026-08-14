---
id: typescript-composition.dependency-scope
owner: typescript-composition
canonical: true
severity: default
references: [Object Lifetime (Seemann), Unit of Work]
---

# Dependency Scope

Decision: **Lifecycle, cache, singleton, pool, and request-scope policy MUST be explicit at the assembly boundary.**

Use when:
- **Code adds something that outlives one call.**
  - A singleton or a module-level cache.
  - A pool or a memoized client.
  - A request-scoped object.
- **A dependency captures state that belongs to someone.**
  - Credentials.
  - Tenant, user, or request.
  - A transaction, or something needing cleanup.
- **Tests leak state between cases.**
- **A performance change alters how long a dependency lives.**
- **Construction is expensive and looks safe to reuse.**
- **A cache needs invalidation, bounds, or cleanup.**

Do:
- **Give a dependency the narrowest lifetime that matches the data it captured.**
- **Choose the scope deliberately, and be able to name it.** App, worker, request, tenant, transaction, or call.
- **Build long-lived dependencies at the edge** and pass them inward.
- **Keep request, tenant, and user state out of app singletons.**
- **Expose cleanup where a dependency owns a resource.**

Avoid:
- **A hidden module-level singleton inside behaviour code.**
- **A cache with no invalidation, no owner, and no scope.**
- **Reusing a request-scoped dependency as an app-scoped one.**
- **Performance as the reason for implicit global state.**

Exceptions:
- **A pure immutable constant MAY be module-level.**
- **An SDK client documented as safe to share MAY be app-scoped**, when it is constructed at the edge.
- **Memoization is fine for a pure deterministic function** with a bounded key space or an explicit cache policy.

Example (one instance, not the set):

```ts
// Bad: tenant state captured in an app singleton.
let cachedClient: Client | undefined;
export function getClient(tenantId: string) {
  cachedClient ??= makeClient({ tenantId });
  return cachedClient;
}

// Good: scope follows the data it captured.
export function makeTenantDependencies(tenantId: string) {
  return { client: makeClient({ tenantId }) };
}
```

- **Where scope genuinely needs tiers**, read `skill://typescript-skills/references/patterns/layered-resolve.md`. Reference material. Escalate from the default above only once the tiers earn it.

Verify:
- **State the scope of each dependency in one phrase.** Being unable to is the finding.
- **Check whether its construction input carries tenant, user, request, or transaction data.**
- **Check tests can isolate state** without a module reset hack.
- **Check every resource owner has cleanup**, or a stated reason it lives for the process.
