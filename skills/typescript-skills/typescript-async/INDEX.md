# TypeScript Async Topic Index

**Use this topic when coordinating concurrency, cancellation, cleanup, retries, or process shutdown.**

**This table is a gate, not a checklist.** Match the left column against what you can see in the code.

- **Enter at the matched row, and read a second where the code matches two.** Say which of them owns the decision and why the other applies. What costs is reading every row, not reading two.
- **Cancellation against cleanup.** Cancellation stops work that is no longer wanted. Cleanup releases what was already acquired. A cancelled operation still has to release.
- **Retry against process lifecycle.** Retry bounds one operation. Lifecycle bounds the whole process.
- **Ownership against ordering.** Ownership asks whether anyone observes this promise at all. Parallel-and-dependencies asks when to await one that is already owned.

| If you see... | Read |
| --- | --- |
| a promise nobody awaits, an async callback given to `forEach`, `async` with no `await`, an unhandled rejection | `skill://typescript-skills/typescript-async/rules/promise-ownership.md` |
| sequential awaits, `Promise.all`, batching, rate limits | `skill://typescript-skills/typescript-async/rules/parallel-and-dependencies.md` |
| cancellable work, `fetch`, unmount, hanging request | `skill://typescript-skills/typescript-async/rules/cancellation-and-abort.md` |
| resource cleanup, `finally`, `using`, disposal | `skill://typescript-skills/typescript-async/rules/cleanup-and-teardown.md` |
| SIGTERM, graceful shutdown, process handlers | `skill://typescript-skills/typescript-async/rules/process-lifecycle.md` |
| backoff, jitter, `Retry-After`, attempt caps | `skill://typescript-skills/typescript-async/rules/retry-and-backoff.md` |

**Default stance.**

- **Preserve true dependencies and required ordering.**
- **Run work concurrently only where budgets, downstream limits, and failure semantics allow it.**
- **Bound growing inputs, propagate cancellation, and release what you acquired.**

**Edges.**

- **This topic owns retry mechanics, not retry classification.** Deciding what is retryable belongs to `skill://typescript-skills/typescript-error-handling/rules/error-classification.md`.
- **Dependency scope and lifetime belong to composition.**
- **What reaches a log during a retry belongs to security.**
- **Whether a slow path deserves a span belongs to observability.**
