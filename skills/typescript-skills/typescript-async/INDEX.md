# TypeScript Async Topic Index

Use this topic when async coordination is the question: should this be parallel? Can it be cancelled? What cleans up if it fails halfway? What happens at SIGTERM?

## Rule Routing

| If you see... | Read |
| --- | --- |
| sequential `await`s for independent operations, or `Promise.all` question | `skill://typescript-skills/typescript-async/rules/parallel-and-dependencies.md` |
| 500 IDs in `Promise.all` causing rate-limit, batching, p-limit, p-map | `skill://typescript-skills/typescript-async/rules/parallel-and-dependencies.md` |
| `fetch` without `AbortSignal`, query that should cancel on unmount, hanging request | `skill://typescript-skills/typescript-async/rules/cancellation-and-abort.md` |
| resource left open on error, missing `finally`, `using`/`Disposable` question | `skill://typescript-skills/typescript-async/rules/cleanup-and-teardown.md` |
| SIGTERM, graceful shutdown, `unhandledRejection`, `process.on`, draining requests | `skill://typescript-skills/typescript-async/rules/process-lifecycle.md` |
| retry loop, exponential backoff, jitter, `Retry-After`, idempotency key | `skill://typescript-skills/typescript-async/rules/retry-and-backoff.md` |

## Owns

- Concurrency policy (parallel vs sequential vs bounded).
- Cancellation propagation via `AbortSignal` / `AbortController`.
- Operation-level cleanup (`finally`, `using`, dispose).
- Process-level lifecycle (signal handlers, graceful shutdown, unhandled rejection, top-level error handlers).
- Retry mechanism: backoff, jitter, attempt cap, AbortSignal-aware, library-or-hand-rolled.
- Idempotency considerations for retried operations (idempotency keys, safe-to-retry semantics).

## Does Not Own

- Dependency lifecycle and scope: read `skill://typescript-skills/typescript-composition/rules/dependency-scope.md`.
- Whether failure becomes throw or Result: read `skill://typescript-skills/typescript-error-handling/INDEX.md`.
- Tracing async context propagation: read `skill://typescript-skills/typescript-observability/rules/tracing-boundary.md`.
- Retry classification: read `skill://typescript-skills/typescript-error-handling/rules/error-classification.md`; this topic owns the *retry mechanism*, not the *retry decision*.

## Default

Sequential `await` is correct when one operation needs the previous result. `Promise.all` for independent operations. Bound concurrency when the input set can grow unbounded. Pass `AbortSignal` as a capability when an operation may be cancelled. Clean up resources in `finally` or with `using`. Handle SIGTERM at the process boundary so requests drain instead of being killed mid-flight.
