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
- Process gets killed mid-request because there is no SIGTERM handler.
- `unhandledRejection` is being silently logged and the process keeps running with corrupted state.
- Logs/traces are missing for the last second of work because the process exits before flushing.
- Container orchestrator (Kubernetes, Lambda, ECS) reports unhealthy or sends SIGKILL because the app does not respond to SIGTERM in time.

Start here:
- Install one signal handler at the composition root for `SIGTERM` and `SIGINT`.
- The handler stops accepting new work, drains in-flight, releases resources, flushes observability, then exits.
- In production, treat `unhandledRejection` and `uncaughtException` as hard failures — log and exit.

Escalate when:
- Multiple long-lived resources need ordered shutdown (HTTP server → background workers → DB pool → telemetry exporter).
- A platform deadline forces fast shutdown (Kubernetes default 30s, Lambda 6s grace) — shutdown must complete inside it.
- Health/readiness probes need to report "draining" before "down".
- Multiple replicas — coordinate to keep one alive while others drain (handled by orchestrator usually, but readiness must report correctly).
- Hot-reload or graceful restart is required (zero-downtime).

Complexity ladder:
1. SIGTERM/SIGINT handler that calls `server.close()` and exits.
2. Add `process.on('unhandledRejection', ...)` and `process.on('uncaughtException', ...)` — fail loud.
3. Ordered shutdown of multiple resources (HTTP, workers, DB, telemetry) in reverse-startup order.
4. Readiness probe flips to "not ready" before draining starts (load balancer stops sending new requests).
5. Hard deadline: if drain takes longer than N seconds, force-exit so the orchestrator does not SIGKILL during sensitive work.
6. Coordinated replica drain (rolling deployments) — handled by orchestrator + correct readiness/liveness signals.

Do:
- Install signal handlers exactly once, in the composition root / process entrypoint.
- On SIGTERM: stop accepting new work, finish in-flight work, release resources in reverse-acquisition order, flush observability, then `process.exit(0)`.
- Treat `unhandledRejection` as a bug in production — log structured, then exit non-zero.
- Treat `uncaughtException` as fatal — process state is unreliable; exit non-zero and let the orchestrator restart.
- Set a hard deadline (e.g., 25s for Kubernetes' 30s default) so you control the exit before SIGKILL hits.
- Flush logs/traces before exit (`logger.flush()`, `tracerProvider.shutdown()`).
- Call out shutdown order in code with comments — "HTTP first so no new requests; workers next so they finish; DB last so committed work flushes."

Avoid:
- Letting the default `process.exit()` kill the process mid-request.
- Long-running shutdown work that exceeds the platform's grace period (Kubernetes will SIGKILL after `terminationGracePeriodSeconds`).
- `process.on('unhandledRejection', () => {})` that swallows silently — corrupted state continues running.
- Shutdown logic spread across multiple modules, each registering its own handler — race to exit.
- `setTimeout(() => process.exit(), 0)` as a "shutdown" — bypasses every cleanup path.
- Synchronous cleanup that calls `await` (it doesn't actually wait) — use `async` properly.
- Frameworks' built-in shutdown hooks ignored in favor of custom handlers — pick one path.

Exceptions:
- Short-lived scripts (CLI tools, one-shot jobs) may exit normally without explicit handlers.
- AWS Lambda manages most of the lifecycle; what matters there is flushing observability before the runtime freezes the container.
- Test runners install their own handlers; do not fight them in test mode.
- Frameworks like NestJS provide `app.enableShutdownHooks()` — use it as the entrypoint, do not duplicate.

Example:

Minimal Node HTTP server with graceful shutdown:

```ts
const server = http.createServer(handler);
server.listen(port);

let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("shutdown_started", { signal });

  // 1. stop accepting new connections
  server.close(() => logger.info("http_closed"));

  // 2. drain in-flight (close() above already waits for in-flight to finish)
  // 3. release other resources in reverse startup order
  await workers.stop();
  await db.pool.end();

  // 4. flush observability last
  await tracerProvider.shutdown();
  await logger.flush();

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
```

Hard deadline so platform does not SIGKILL mid-cleanup:

```ts
const GRACE_MS = 25_000; // Kubernetes default terminationGracePeriodSeconds is 30

async function shutdown(signal: NodeJS.Signals) {
  const timer = setTimeout(() => {
    logger.error("shutdown_timeout_force_exit", { signal });
    process.exit(1);
  }, GRACE_MS);
  timer.unref(); // do not keep process alive just for the timer

  try {
    server.close();
    await workers.stop();
    await db.pool.end();
    await tracerProvider.shutdown();
    await logger.flush();
    process.exit(0);
  } catch (e) {
    logger.error("shutdown_failed", { cause: e });
    process.exit(1);
  }
}
```

Unhandled rejection / uncaught exception — fail loud in production:

```ts
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { reason });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("uncaught_exception", { err });
  process.exit(1);
});
```

Readiness/liveness coordination (Kubernetes-friendly):

```ts
let ready = true;
app.get("/healthz", (_req, res) => res.sendStatus(200));         // liveness
app.get("/readyz",  (_req, res) => res.sendStatus(ready ? 200 : 503)); // readiness

async function shutdown() {
  ready = false;       // load balancer drains us
  await sleep(2_000);  // give LB time to notice (one probe interval)
  // ... rest of shutdown
}
```

NestJS — use the built-in hook:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(); // runs onModuleDestroy / onApplicationShutdown
  await app.listen(port);
}
```

Lambda — flush before the container freezes:

```ts
export async function handler(event: APIGatewayProxyEvent) {
  try {
    return await handleRequest(event);
  } finally {
    // critical for X-Ray / OTel: spans/logs must flush before the container suspends
    await tracerProvider.forceFlush();
  }
}
```

Verify:
- Exactly one SIGTERM/SIGINT handler is installed, at the process entrypoint.
- Shutdown closes resources in reverse-acquisition order.
- A hard deadline exists and is shorter than the platform's grace period.
- `unhandledRejection` and `uncaughtException` log and exit in production.
- Observability (logs, traces) flushes before `process.exit`.
- Readiness reports "not ready" early enough that the load balancer drains before requests are killed.
- For AWS Lambda: traces/logs flush in a `finally` so the frozen container does not lose data.
