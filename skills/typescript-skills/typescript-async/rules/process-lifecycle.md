---
id: typescript-async.process-lifecycle
owner: typescript-async
canonical: true
severity: default
references: [Twelve-Factor IX (Disposability), Node.js Process events, Kubernetes pod termination, NestJS enableShutdownHooks]
---

# Process Lifecycle

Decision: A long-running process (server, worker, daemon) handles its lifecycle explicitly. SIGTERM drains in-flight work and releases resources; `unhandledRejection` and `uncaughtException` fail loudly in production rather than being swallowed; observability flushes before exit. Wrap the lifecycle once at the composition root, not inside business logic.

Use when:
- Building a server, worker, or daemon that runs longer than one request.
- The process gets killed mid-request because there is no SIGTERM handler, or shutdown work exceeds the platform's grace period and the orchestrator sends SIGKILL.
- `unhandledRejection` is silently logged while the process keeps running with corrupted state.
- Logs/traces are missing for the last second of work because the process exits before flushing.

Do:
- Install signal handlers exactly once, at the composition root / process entrypoint, for `SIGTERM` and `SIGINT`.
- On SIGTERM: stop accepting new work, finish in-flight work, release resources in reverse-acquisition order, flush observability, then `process.exit(0)`. Call out the order in comments (HTTP first so no new requests; workers next so they finish; DB last so committed work flushes).
- Set a hard deadline shorter than the platform's grace period (e.g. 25s for Kubernetes' 30s default; `.unref()` the timer) so you control the exit before SIGKILL hits.
- Treat `unhandledRejection` and `uncaughtException` as fatal in production — log structured, then exit non-zero; process state is unreliable after either.
- Flip readiness to "not ready" before draining starts, so the load balancer stops sending new requests ahead of the drain.
- Flush logs/traces before exit (`logger.flush()`, `tracerProvider.shutdown()`); for Lambda, flush in a `finally` around the handler since the container can freeze without warning.
- Prefer a framework's built-in shutdown hook (NestJS `app.enableShutdownHooks()`) over a duplicate custom handler.

Avoid:
- Letting the default `process.exit()` kill the process mid-request.
- Shutdown work that can exceed the platform's grace period — Kubernetes SIGKILLs after `terminationGracePeriodSeconds`.
- `process.on('unhandledRejection', () => {})` that swallows silently while corrupted state keeps running.
- Shutdown logic spread across multiple modules, each registering its own handler — a race to exit.
- `setTimeout(() => process.exit(), 0)` as "shutdown" — bypasses every cleanup path; synchronous cleanup that calls `await` without being `async` — it doesn't actually wait.
- Ignoring a framework's built-in shutdown hooks in favor of a duplicate custom path.

Exceptions:
- Short-lived scripts (CLI tools, one-shot jobs) may exit normally without explicit handlers.
- AWS Lambda manages most of the lifecycle; what matters is flushing observability before the runtime freezes the container.
- Test runners and frameworks (e.g. NestJS) install their own handlers/hooks — do not fight them with a duplicate custom handler.

Example — signal handler with hard deadline, reverse-order release, and fail-loud process events:

```ts
const GRACE_MS = 25_000; // shorter than Kubernetes' 30s terminationGracePeriodSeconds default
const server = http.createServer(handler);
server.listen(port);

let ready = true;
app.get("/readyz", (_req, res) => res.sendStatus(ready ? 200 : 503)); // flips before draining starts

let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  ready = false; // 1. stop accepting new work — let the LB notice and drain
  const timer = setTimeout(() => { logger.error("shutdown_timeout_force_exit", { signal }); process.exit(1); }, GRACE_MS);
  timer.unref(); // do not keep the process alive just for this timer

  try {
    server.close();                  // 2. finish in-flight requests, refuse new ones
    await workers.stop();            // 3. release resources in reverse-acquisition order
    await db.pool.end();
    await tracerProvider.shutdown(); // 4. flush observability last
    await logger.flush();
    process.exit(0);
  } catch (e) {
    logger.error("shutdown_failed", { cause: e });
    process.exit(1);
  }
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// unhandledRejection/uncaughtException: fail loud in production — state is unreliable after either.
process.on("unhandledRejection", (reason) => { logger.error("unhandled_rejection", { reason }); process.exit(1); });
process.on("uncaughtException",  (err)    => { logger.error("uncaught_exception", { err });    process.exit(1); });
```

Frameworks with built-in hooks (NestJS `app.enableShutdownHooks()`) call `onModuleDestroy`/`onApplicationShutdown` for you — use them instead of duplicating this by hand. In Lambda, wrap the handler body in `try { ... } finally { await tracerProvider.forceFlush(); }` since the container can freeze without ever invoking a signal handler.

Verify:
- Exactly one SIGTERM/SIGINT handler is installed, at the process entrypoint; shutdown closes resources in reverse-acquisition order.
- A hard deadline exists and is shorter than the platform's grace period, forcing exit before SIGKILL.
- `unhandledRejection` and `uncaughtException` log and exit in production; observability flushes before `process.exit`.
- Readiness reports "not ready" early enough for the load balancer to drain before requests are killed; for Lambda, traces/logs flush in a `finally` so the frozen container does not lose data.
