---
id: evidence-backed-review.runtime-and-resources
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [time-of-check to time-of-use, idempotency, resource lifetime, actionable observability, failure recovery]
---

# Runtime, Observability and Recovery

Decision: Judge the change under overlap, failure, repetition and realistic operating conditions, including how people detect and recover from those failures. Local defects belong to `rules/defects-in-the-change.md`; delivery order to `rules/contracts-and-rollout.md`; data exposure to `rules/security-and-abuse-paths.md`; the truth of written claims to `rules/claims-and-proof.md`.

Use when:
- Shared state, a transaction, a cache, a queue or a background task changes.
- A retry, timeout, cancellation path, resource, query or operating limit changes.
- A user-visible action becomes asynchronous or depends on an external service.
- Logging, metrics, traces, alerts, dashboards, support reports or recovery procedures change.

Do:
1. **Name the interleaving.** Between a check and its use, what can another caller change? Read transaction isolation, lock scope and shared-state ownership. An in-process lock may not protect multiple instances. Single-threaded code can still interleave across awaits, processes, devices or workers.
2. **Inspect partial writes and partial work.** What remains when step two of three fails? Check transaction boundaries, compensation, cancellation and which party learns that work is incomplete. A successful HTTP response may acknowledge a job without completing it; trace the later result and user-visible failure state.
3. **Ask what repetition and reordering do.** Retries, duplicate messages and restarts can repeat side effects. Find the deduplication or idempotency boundary and whether it covers the full operation, not merely receipt. Check key scope and lifetime, event order and partial-success retries. Not every operation needs an idempotency key; a naturally idempotent operation can be sufficient.
4. **Read the waiting and overload policy.** Timeouts, retry classification, retry budget, backoff, cancellation and backpressure should agree across caller and callee. Check queue growth, poison-message handling, rate limits and recovery after a dependency outage. A timeout after the remote write succeeded can duplicate work on retry. Do not require a particular mechanism if the existing design meets the constraint.
5. **Trace ownership and release.** Connections, files, subscriptions, timers, listeners, locks and UI effects need cleanup on success, failure and cancellation as applicable. Read the lifetime boundary rather than demanding one syntactic cleanup shape. Check stale state and callbacks after unmount or shutdown.
6. **Evaluate cost at realistic size.** Query count, pagination, data volume, cache bounds and invalidation, bundle or cold-start cost, rendering and main-thread work may matter. State measured size or a justified workload assumption. Separate a demonstrable growth mechanism from a measured regression; a micro-optimization without a user or operating consequence is not a blocking defect.
7. **Trace each materially new failure to a usable signal.** Can a user or operator tell acceptance from completion, failure from delay, and one incident from another? Check error context, correlation across async boundaries, metrics with useful dimensions and traces at the relevant boundary. Read existing instrumentation before asking for more. A log entry alone does not show that someone can detect the failure or find its cause.
8. **Judge observability changes as product behavior.** Does an alert reach an owner with an action, at a threshold justified by the service objective? Does a dashboard distinguish missing data from healthy zero? Can a logging change hide a failure, expose personal data, explode cardinality or cost, or let telemetry failures break the main operation? Missing dashboards are not defects by themselves; identify the missing diagnostic or response capability.
9. **Walk recovery and operating procedures.** Check prerequisites, permissions, stop conditions, interruption handling, restore or roll-forward steps and post-recovery validation. Does the runbook match the actual deployed component and the people on call? For destructive or irreversible work, determine what data is preserved and what cannot be recovered. Recommend an isolated recovery exercise or name missing evidence; do not execute the live procedure during review.
10. **Account for external state.** Runtime quotas, subscriptions, platform checks, service availability and operator permissions may not be in this repository. Source demonstrates intent, not current readiness. Locate available evidence and name what remains unknown instead of assuming provisioning happened.

Avoid:
- **Calling a race because two lines look separate** without tracing the boundary that may already serialize them.
- **Accepting a retry because it helps availability** while ignoring duplicated effects or permanent errors.
- **Reporting performance degradation as measured when it was inferred.** Unknown workload is a limitation, not permission to invent a benchmark.
- **Requiring new logs, traces and dashboards by checklist.** Reuse sufficient signals and explain the failure an additional one would reveal.
- **Treating rollback as the only recovery**, or a written runbook as evidence that restoration has succeeded.

Example (one instance, not the set):
```
Important: worker:30 commits the export before acknowledging its message.
Redelivery repeats publication; the existing key only deduplicates intake.
Important: result-page:44 displays accepted jobs as complete, while the new
worker failure is neither shown to the user nor reported by an existing alert.
Gap: restore-guide:19 assumes write access after failover. The available
role definition establishes intended access, not the operator's effective role.
```

Verify:
- Each consequential shared-state or async change has a failure, repetition or overlap analysis.
- Resource lifetime and waiting policy cover relevant error and cancellation paths.
- Operating claims identify workload, observed evidence or an explicit assumption.
- New failures have an adequate detection and recovery path, or a specific finding or gap.
