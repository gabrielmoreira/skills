---
id: typescript-async.cleanup-and-teardown
owner: typescript-async
canonical: true
severity: default
references: [TC39 Explicit Resource Management (using/Symbol.dispose), try/finally, RAII (C++/Rust), Effect.scoped]
---

# Cleanup and Teardown

Decision: Every resource that is acquired must have a clear, deterministic release path that runs on success and failure alike. Prefer `using` / `await using` (TC39 Explicit Resource Management) when available; otherwise `try { ... } finally { ... }`. Owners of resources expose disposal; consumers do not invent their own.

Use when:
- Code opens a file, connection, transaction, lock, listener, timer, child process, browser context, etc.
- A function may throw or be cancelled between resource acquisition and release.
- A resource is leaking in tests (open handles between cases) or production (memory creep).
- Setup/teardown logic is repeated across callers — the pattern is begging for a disposable abstraction.
- Multiple resources must release in reverse order, or one's failure must not skip another's cleanup.

Do:
- Acquire the resource as close to first use as possible; pair every `acquire()` with a release path that runs on every exit. One acquisition, one release path — no conditional cleanup that misses error branches.
- Prefer `using`/`await using` (TS 5.2+, Node 20+, or via tslib helpers) when the runtime/target supports it; otherwise `try { ... } finally { ... }`, `await`ing `close()` when it's async.
- Owners expose disposal (`[Symbol.dispose]`/`[Symbol.asyncDispose]` or `dispose()`); consumers call it rather than inventing their own teardown per call site.
- Model a resource with its own protocol (open → use → close) as a class implementing `[Symbol.dispose]`/`[Symbol.asyncDispose]`, not as scattered acquire/release calls at each site.
- Release multiple resources in reverse of acquisition order (LIFO) — stack `await using` declarations or nested `try/finally`.
- Make `dispose` idempotent: calling it twice is safe.
- Surface cleanup failures explicitly when they matter (a failing `commit()` in `finally` should not be silent). For partial-failure ordering, track success with a flag and roll back only when it's false.
- Extract a disposable wrapper/helper when setup/teardown boilerplate repeats across call sites or test fixtures, or a dispose registry/scope helper when many cleanups must run together (frameworks, test harnesses).

Avoid:
- Cleanup only in the success path — the failure path leaks.
- `try/catch` that swallows the error and never cleans up.
- Async cleanup without `await` — `finally { resource.close() }` is wrong when `close()` returns a Promise.
- Re-implementing dispose semantics per call site when an owner already exposes `dispose()`/`[Symbol.dispose]`.
- Cleanup that depends on global mutable state shared across tests or callers.
- Long synchronous cleanup in a hot path — measure before optimizing, but prefer cheap dispose.

Exceptions:
- Process-lifetime singletons (DB pool, OpenTelemetry exporter) are released only at shutdown, behind a process-lifecycle handler — see `process-lifecycle.md`.
- Pure functions with no resource acquisition do not need `finally`.
- React's `useEffect` cleanup callback and test fixtures (`await using tmp = await tmpdir()`) follow the same acquire/release discipline under different syntax.

Example — disposable resources released automatically in LIFO order, with idempotent dispose:

```ts
class DbConnection {
  private disposed = false;
  constructor(private readonly raw: RawConn) {}
  async query<T>(sql: string): Promise<T[]> { /* ... */ }
  async [Symbol.asyncDispose]() {
    if (this.disposed) return; // idempotent
    this.disposed = true;
    await this.raw.close();
  }
}

async function importOrders(file: string) {
  await using src = await openReadStream(file);   // acquired first...
  await using tx  = await db.beginTransaction();  // ...released last: tx disposed, then src (LIFO)
  for await (const row of src) await tx.insert("orders", row);
  await tx.commit();
}
```

Where `await using` is not available, or commit/rollback needs an explicit success flag for partial-failure ordering, use `try { await tx.commit(); committed = true; } finally { if (!committed) await tx.rollback(); }` — same reverse-release discipline, spelled out by hand.

Verify:
- Every `acquire`/`open`/`begin`/`connect` has a release on every exit path, and async cleanup is `await`ed.
- Multi-resource flows release in reverse acquisition order; dispose is idempotent.
- Tests do not leak handles (no open-handle warnings from the test runner).
- Errors during cleanup are logged or rethrown deliberately, not silently swallowed.
