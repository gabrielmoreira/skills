---
id: typescript-async.process-lifecycle
owner: typescript-async
canonical: true
severity: default
references: [Twelve-Factor IX (Disposability), Node.js Process events, Kubernetes pod termination, NestJS enableShutdownHooks]
---

# Process Lifecycle

Decision: Long-running processes own startup and shutdown at the composition root. Stop new work, drain in-flight work, release resources, flush observability, and exit within the platform grace period.

Use when:
- Building a server, worker, daemon, or consumer.
- Deployments kill work mid-flight.
- process-level failures are logged but ignored.
- resources or final telemetry are lost on exit.

Do:
- Install process handlers once at the entrypoint.
- On shutdown, mark unready, stop accepting work, drain bounded in-flight work, close resources in dependency order, then flush telemetry.
- Bound the whole sequence below the orchestrator deadline and define forced-exit behavior.
- Treat `uncaughtException` and `unhandledRejection` as fatal in production after best-effort reporting.
- Use framework lifecycle hooks when they already provide this contract.

Avoid:
- Lifecycle handlers inside business modules.
- Immediate `process.exit()` before cleanup.
- Multiple libraries installing competing handlers.
- Applying server lifecycle machinery to short scripts or serverless functions; use local `try/finally` there.

Verify:
- Signals and handlers are registered once.
- Shutdown order and deadline are explicit and tested by exercising the process.
- New work stops before dependencies close.
- Exit codes distinguish clean shutdown from fatal failure.
