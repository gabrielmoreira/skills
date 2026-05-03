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
- A resource is leaking in tests (handles open between cases) or production (memory creep).
- Setup/teardown logic is repeated across callers — pattern is begging for a disposable abstraction.
- Multiple resources must release in reverse order, or one's failure must not skip another's cleanup.

Start here:
- Acquire the resource as close to first use as possible.
- Release it in `finally` (sync) or `await using` (preferred when supported).
- One acquisition = one release path. No conditional cleanup that misses error branches.

Escalate when:
- Multiple resources need disposal — wrap each in `using` / `await using`, or stack `try/finally`.
- A resource has its own protocol (open → use → close) — model as a class with `[Symbol.dispose]` / `[Symbol.asyncDispose]`.
- Cleanup order matters — release in reverse acquisition order (LIFO), like a stack.
- Test setup/teardown is verbose — extract a `using` helper that creates and disposes.
- Process lifecycle: many long-lived resources need shutdown coordination — see `process-lifecycle.md`.

Complexity ladder:
1. `try { ... } finally { resource.close(); }` — single resource, sync close.
2. `try { ... } finally { await resource.close(); }` — single resource, async close.
3. `await using x = makeX();` — implements `[Symbol.asyncDispose]`, automatic LIFO release.
4. Stacked `await using` for multiple resources — automatic reverse-order release.
5. Disposable wrapper class for a resource that needs custom acquire/release semantics.
6. Dispose registry / scope helper when many cleanups must run together (frameworks, test harnesses).

Do:
- Pair every `acquire()` with a release path that runs on every exit.
- Use `await using` when the runtime/TS target supports it (TS 5.2+, Node 20+ with explicit-resource-management flag, or via tslib helpers).
- Implement `[Symbol.dispose]` (sync) or `[Symbol.asyncDispose]` (async) on classes that own resources.
- Order multi-resource cleanup in reverse of acquisition — last acquired, first released.
- Make `dispose` idempotent: calling twice is safe.
- Surface cleanup failures explicitly when they matter (e.g., `await tx.commit()` failing in `finally` should not be silent).
- For tests, prefer `await using tmp = await tmpdir()` style over `beforeEach`/`afterEach` boilerplate.

Avoid:
- Cleanup only in the success path. The failure path leaks.
- `try/catch` that swallows the error and never cleans up.
- Async cleanup without `await` — `finally { resource.close(); }` is wrong if `close()` returns a Promise.
- Re-implementing dispose semantics per call site when an owner already exposes `dispose()` / `[Symbol.dispose]`.
- Cleanup that depends on global mutable state (`finally { globalRegistry.delete(this) }` shared across tests).
- Long synchronous cleanup in a hot path — measure before optimizing, but prefer cheap dispose.

Exceptions:
- Process-lifetime singletons (DB pool, OpenTelemetry exporter) are released only at shutdown; they live behind a process-lifecycle handler — see `process-lifecycle.md`.
- Pure functions with no resource acquisition do not need `finally`.
- React effects use the cleanup callback returned from `useEffect` — same pattern, different syntax.

Example:

Single resource, async close:

```ts
async function withDbConnection<T>(fn: (conn: DbConnection) => Promise<T>): Promise<T> {
  const conn = await db.connect();
  try {
    return await fn(conn);
  } finally {
    await conn.close();
  }
}
```

`await using` (TC39 explicit resource management):

```ts
class DbConnection {
  constructor(private readonly raw: RawConn) {}
  async query<T>(sql: string): Promise<T[]> { /* ... */ }
  async [Symbol.asyncDispose]() {
    await this.raw.close();
  }
}

async function example() {
  await using conn = await db.connect();
  return conn.query("select * from orders");
  // conn is disposed automatically here, on success or throw
}
```

Stacked resources release in reverse order (LIFO):

```ts
async function importOrders(file: string) {
  await using src = await openReadStream(file);
  await using tx  = await db.beginTransaction();
  for await (const row of src) {
    await tx.insert("orders", row);
  }
  await tx.commit();
  // Release order on exit: tx, then src — last in, first out.
}
```

Transaction with explicit commit/rollback in `finally`:

```ts
async function transferFunds(from: string, to: string, amount: number) {
  const tx = await db.beginTransaction();
  let committed = false;
  try {
    await tx.update("accounts", { id: from }, { $inc: { balance: -amount } });
    await tx.update("accounts", { id: to },   { $inc: { balance:  amount } });
    await tx.commit();
    committed = true;
  } finally {
    if (!committed) await tx.rollback();
  }
}
```

Test fixture with disposable temp dir:

```ts
async function tmpdir(): Promise<{ path: string; [Symbol.asyncDispose]: () => Promise<void> }> {
  const path = await fs.mkdtemp(join(os.tmpdir(), "test-"));
  return {
    path,
    async [Symbol.asyncDispose]() {
      await fs.rm(path, { recursive: true, force: true });
    },
  };
}

it("writes and reads a file", async () => {
  await using tmp = await tmpdir();
  const file = join(tmp.path, "x.txt");
  await fs.writeFile(file, "hi");
  expect(await fs.readFile(file, "utf8")).toBe("hi");
  // tmp cleaned up automatically when test ends
});
```

React effect cleanup (same pattern, different syntax):

```ts
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);
```

Idempotent dispose:

```ts
class FileLock {
  private released = false;
  async release() {
    if (this.released) return;
    this.released = true;
    await fs.unlink(this.path);
  }
  async [Symbol.asyncDispose]() { await this.release(); }
}
```

Verify:
- Every `acquire`/`open`/`begin`/`connect` has a release on every exit path.
- Async cleanup is `await`ed — no fire-and-forget `finally { close() }` on a Promise-returning method.
- Multi-resource flows release in reverse acquisition order.
- Dispose is idempotent.
- Tests do not leak handles (`vitest --reporter=verbose` or similar shows no warnings about open handles).
- Errors during cleanup are logged or rethrown deliberately, not silently swallowed.
