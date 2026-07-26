# TypeScript Async Topic Index

Use when coordinating concurrency, cancellation, cleanup, retries, or process shutdown.

| If you see... | Read |
| --- | --- |
| sequential awaits, `Promise.all`, batching, rate limits | `skill://typescript-skills/typescript-async/rules/parallel-and-dependencies.md` |
| cancellable work, `fetch`, unmount, hanging request | `skill://typescript-skills/typescript-async/rules/cancellation-and-abort.md` |
| resource cleanup, `finally`, `using`, disposal | `skill://typescript-skills/typescript-async/rules/cleanup-and-teardown.md` |
| SIGTERM, graceful shutdown, process handlers | `skill://typescript-skills/typescript-async/rules/process-lifecycle.md` |
| backoff, jitter, `Retry-After`, attempt caps | `skill://typescript-skills/typescript-async/rules/retry-and-backoff.md` |

This topic owns retry mechanics, not retry classification; for classification read `skill://typescript-skills/typescript-error-handling/rules/error-classification.md`. Dependency scope belongs to composition.

Default: preserve true dependencies and required ordering. Run work concurrently only when resource budgets, downstream limits, and failure semantics allow it. Bound growing inputs, propagate cancellation, and release acquired resources.
