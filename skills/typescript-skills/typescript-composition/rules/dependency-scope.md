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
- Tests leak state between cases.
- Performance optimization changes dependency lifetime.

Start here:
- Use a ready dependency with the narrowest lifetime that matches its captured data.

Escalate when:
- Construction is expensive and safe to reuse.
- Dependency input includes tenant, user, request, transaction, or credential scope.
- A cache needs invalidation, bounds, or cleanup.
- Tests reveal state leakage or module-reset hacks.

Complexity ladder:
1. Per-call local value for cheap stateless work.
2. App-scoped ready instance for safe clients/constants.
3. Request/tenant/transaction-scoped factory for scoped data.
4. Explicit cache/pool with owner, bounds, invalidation, and cleanup.
5. Container-managed lifecycle only when framework/plugin pressure earns it.

Do:
- Choose scope deliberately: app, worker, request, tenant, transaction, or call.
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

Bad: tenant state captured in an app singleton.

```ts
let cachedClient: Client | undefined;

export function getClient(tenantId: string) {
  cachedClient ??= makeClient({ tenantId });
  return cachedClient;
}
```

Good: scope follows captured data.

```ts
export function makeTenantDependencies(tenantId: string) {
  return {
    client: makeClient({ tenantId }),
  };
}
```

Good: request-scoped dependencies built per-request at the handler edge.

```ts
async function handleCreateOrder(req: ParsedRequest, appDeps: AppDeps) {
  const requestDeps = makeRequestDeps(appDeps, {
    correlationId: req.correlationId,
    userId: req.userId,
  });
  return createOrder(req.body, requestDeps);
}

function makeRequestDeps(app: AppDeps, ctx: RequestContext) {
  return {
    db: app.db,
    logger: app.logger.child({ correlationId: ctx.correlationId }),
    userId: ctx.userId,
  };
}
```


For lazy/tiered scope (app singletons → app infra → request-scoped via `memoizeByReference`), see `references/patterns/layered-resolve.md`. Reference material; escalate from the canonical default in `composition-root.md` only when scope tiers earn it.
Verify:
- State the dependency scope in one phrase.
- Check whether dependency input includes tenant/user/request/transaction data.
- Check tests can isolate state without module reset hacks.
- Check resource owners have cleanup or process-lifetime justification.
