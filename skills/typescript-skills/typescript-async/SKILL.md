---
name: typescript-async
description: Use when TypeScript code coordinates async work — Promise.all vs sequential, bounded concurrency, AbortSignal cancellation, cleanup/teardown, or process lifecycle (SIGTERM, graceful shutdown).
---

# TypeScript Async

Use this skill when async coordination is the question: should this be parallel? Can it be cancelled? What cleans up if it fails halfway? What happens at SIGTERM?

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| sequential `await`s for independent operations, or `Promise.all` question | `rules/parallel-and-dependencies.md` |
| 500 IDs in `Promise.all` causing rate-limit, batching, p-limit, p-map | `rules/parallel-and-dependencies.md` |
| `fetch` without `AbortSignal`, query that should cancel on unmount, hanging request | `rules/cancellation-and-abort.md` |
| resource left open on error, missing `finally`, `using`/`Disposable` question | `rules/cleanup-and-teardown.md` |
| SIGTERM, graceful shutdown, `unhandledRejection`, `process.on`, draining requests | `rules/process-lifecycle.md` |
| retry loop, exponential backoff, jitter, `Retry-After`, idempotency key | `rules/retry-and-backoff.md` |

## Owns

- Concurrency policy (parallel vs sequential vs bounded).
- Cancellation propagation via `AbortSignal` / `AbortController`.
- Operation-level cleanup (`finally`, `using`, dispose).
- Process-level lifecycle (signal handlers, graceful shutdown, unhandled rejection, top-level error handlers).
- Retry mechanism: backoff, jitter, attempt cap, AbortSignal-aware, library-or-hand-rolled.
- Idempotency considerations for retried operations (idempotency keys, safe-to-retry semantics).

## Does Not Own

- Dependency lifecycle and scope (use `../typescript-composition/rules/dependency-scope.md`).
- Whether failure becomes throw or Result (use `../typescript-error-handling/`).
- Tracing async context propagation (use `../typescript-observability/rules/tracing-boundary.md`).
- Retry classification (use `../typescript-error-handling/rules/error-classification.md`); this skill owns the *retry mechanism*, not the *retry decision*.

## Default

Sequential `await` is correct when one operation needs the previous result. `Promise.all` for independent operations. Bound concurrency when the input set can grow unbounded. Pass `AbortSignal` as a capability when an operation may be cancelled. Clean up resources in `finally` or with `using`. Handle SIGTERM at the process boundary so requests drain instead of being killed mid-flight.
