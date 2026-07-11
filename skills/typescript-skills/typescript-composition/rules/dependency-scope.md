---
id: typescript-composition.dependency-scope
owner: typescript-composition
canonical: true
severity: default
references: [Object Lifetime (Seemann), Unit of Work]
---

# Dependency Scope

Decision: Lifecycle, cache, singleton, pool, and request-scope policy must be explicit at assembly boundaries.

Use when:
- Code adds a singleton, module-level cache, pool, memoized client, or request-scoped object.
- A dependency includes credentials, tenant, user, request, transaction, or cleanup state.
- Tests leak state between cases, or performance optimization changes dependency lifetime.
- Construction is expensive and safe to reuse, or a cache needs invalidation, bounds, or cleanup.

Do:
- Use a ready dependency with the narrowest lifetime that matches its captured data; choose scope deliberately (app, worker, request, tenant, transaction, or call).
- Create long-lived dependencies at the edge and pass them inward.
- Keep request/tenant/user state out of app-singleton dependencies.
- Expose cleanup when dependencies own resources.

Avoid:
- Hidden module-level singletons inside behavior code.
- Caches without invalidation, ownership, or scope.
- Reusing request-scoped dependencies as app-scoped instances.
- Using performance as an excuse for implicit global state.

Exceptions:
- Pure immutable constants may be module-level.
- SDK clients documented as safe app singletons may be app-scoped when constructed at the edge.
- Memoization is acceptable for pure deterministic functions with bounded key space or explicit cache policy.

Example:

```ts
// Bad: tenant state captured in an app singleton.
let cachedClient: Client | undefined;
export function getClient(tenantId: string) {
  cachedClient ??= makeClient({ tenantId });
  return cachedClient;
}

// Good: scope follows captured data.
export function makeTenantDependencies(tenantId: string) {
  return { client: makeClient({ tenantId }) };
}
```

For lazy/tiered scope (app singletons → app infra → request-scoped via `memoizeByReference`), see `references/patterns/layered-resolve.md`. Reference material; escalate from the canonical default above only when scope tiers earn it.

Verify:
- State the dependency scope in one phrase.
- Check whether dependency input includes tenant/user/request/transaction data.
- Check tests can isolate state without module reset hacks.
- Check resource owners have cleanup or process-lifetime justification.
