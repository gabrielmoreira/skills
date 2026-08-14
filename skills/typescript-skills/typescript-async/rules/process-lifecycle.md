---
id: typescript-async.process-lifecycle
owner: typescript-async
canonical: true
severity: default
references: [Twelve-Factor IX (Disposability), Node.js Process events, Kubernetes pod termination]
---

# Process Lifecycle

Decision: **A long-running process owns startup and shutdown at the composition root**, and exits within the platform's grace period after draining what is in flight.

Use when:
- **Building a server, worker, daemon, or consumer.**
- **A deployment kills work mid-flight.**
- **A process-level failure is logged and then ignored.**
- **Resources or final telemetry are lost on exit.**

Do:
- **Install process handlers once, at the entrypoint.**
- **Shut down in this order.**
  - Mark the process unready.
  - Stop accepting new work.
  - Drain bounded in-flight work.
  - Close resources in dependency order.
  - Flush telemetry last, so the shutdown itself is observable.
- **Bound the whole sequence below the orchestrator's deadline**, and define what a forced exit does.
- **Treat an uncaught exception or an unhandled rejection as fatal in production**, after a best-effort report.
- **Use the framework's lifecycle hooks** where they already provide this contract.

Avoid:
- **Lifecycle handlers inside business modules.**
- **Calling exit before cleanup has run.**
- **Several libraries installing competing handlers.**
- **Applying server lifecycle machinery to a short script or a serverless function.** Local cleanup is the right size there.

Exceptions:
- **A short-lived task MAY rely on `try` and `finally` alone.**
- **A managed runtime MAY own the signal handling**, leaving the app only its drain hook.

Example (one instance, not the set):

```ts
// One place, one order, one deadline.
async function shutdown(reason: string) {
  setReady(false);
  await server.stopAcceptingConnections();
  await drainInFlight({ timeoutMs: 10_000 });
  await closeResources();          // dependency order
  await telemetry.flush();         // last, so the shutdown is visible
  process.exit(reason === "fatal" ? 1 : 0);
}
```

Verify:
- **Check signals and handlers are registered exactly once.**
- **Check the shutdown order and the deadline are explicit**, and tested by exercising the process.
- **Check new work stops before dependencies close.**
- **Check exit codes distinguish a clean shutdown from a fatal failure.**
