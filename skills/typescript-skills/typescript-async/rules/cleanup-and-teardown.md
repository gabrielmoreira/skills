---
id: typescript-async.cleanup-and-teardown
owner: typescript-async
canonical: true
severity: default
references: [TC39 Explicit Resource Management (using/Symbol.dispose), try/finally, RAII (C++/Rust), Effect.scoped]
---

# Cleanup and Teardown

Decision: **Every acquired resource has one release path that runs on success and on failure alike.** Prefer `using` and `await using` where available, otherwise `try` with `finally`.

Use when:
- **Code opens something that must be closed.** A file, connection, transaction, lock, listener, timer, or child process.
- **A function may throw or be cancelled** between acquiring and releasing.
- **A resource is leaking.** Open handles between tests, or memory creep in production.
- **Setup and teardown repeat across callers**, which is the pattern asking for a disposable.
- **Several resources must release in reverse order**, or one failure must not skip another's cleanup.

Do:
- **Acquire as close to first use as possible.**
- **Pair every acquisition with a release that runs on every exit.** No conditional cleanup that misses an error branch.
- **Await an asynchronous close.**
- **Let the owner expose disposal**, through `[Symbol.dispose]`, `[Symbol.asyncDispose]`, or `dispose()`.
- **Model a resource with its own protocol as a class**, rather than scattered acquire and release calls.
- **Release in reverse order of acquisition.** Stack `await using` declarations, or nest `try` and `finally`.
- **Make dispose idempotent**, so calling it twice is safe.
- **Surface a cleanup failure that matters.** A failing commit inside `finally` must not vanish.
- **Extract a disposable helper** once the boilerplate repeats, or a scope helper once many cleanups must run together.

Avoid:
- **Cleanup only on the success path.** The failure path is the one that leaks.
- **A `catch` that swallows the error and never releases.**
- **Async cleanup with no `await`.**
- **Reimplementing dispose per callsite** where the owner already exposes it.
- **Cleanup that depends on global mutable state** shared across tests or callers.

Exceptions:
- **A process-lifetime singleton releases at shutdown**, behind `skill://typescript-skills/typescript-async/rules/process-lifecycle.md`.
- **A pure function with no acquisition needs no `finally`.**
- **An effect cleanup and a test fixture follow the same discipline** in different syntax.

Example (one instance, not the set):

```ts
class DbConnection {
  private disposed = false;
  constructor(private readonly raw: RawConn) {}
  async [Symbol.asyncDispose]() {
    if (this.disposed) return;   // idempotent
    this.disposed = true;
    await this.raw.close();
  }
}

async function importOrders(file: string) {
  await using src = await openReadStream(file);   // acquired first
  await using tx  = await db.beginTransaction();  // released first, LIFO
  for await (const row of src) await tx.insert("orders", row);
  await tx.commit();
}
```

- **Without `await using`, spell the same discipline out by hand**, tracking success with a flag so rollback runs only when commit did not.

Verify:
- **Check every acquisition has a release on every exit path**, and that async cleanup is awaited.
- **Check multi-resource flows release in reverse order**, and dispose is idempotent.
- **Check the test runner reports no open handles.**
- **Check a cleanup error is logged or rethrown deliberately**, never swallowed.
