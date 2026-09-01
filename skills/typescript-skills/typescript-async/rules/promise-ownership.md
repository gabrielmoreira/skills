---
id: typescript-async.promise-ownership
owner: typescript-async
canonical: true
severity: default
references: [no-floating-promises (typescript-eslint), unhandled rejection termination (Node), structured concurrency]
---

# Promise Ownership

Decision: **Every promise gets an owner where it is created: awaited, returned, or handed to something that will observe its result.** A promise nobody owns is work whose success nobody checks and whose failure nobody catches. When to await belongs to `skill://typescript-skills/typescript-async/rules/parallel-and-dependencies.md`.

Use when:
- **A call returning a promise appears as a bare statement.**
- **An async callback is passed to something that ignores the returned value.** `forEach`, an event listener, a constructor.
- **A function is `async` with no `await` inside it**, or `await` is applied to a value that was never a promise.
- **A `.catch()` is attached and its result is dropped.**

Do:
- **Await it, return it, or collect it.** A promise held in a named variable and awaited later is owned.
- **Mark deliberate detachment.** `void` the call and attach a handler that reports the failure. The marker is what separates intent from oversight.
- **Give an async callback only to an API that awaits it.** `for...of` with `await`, or `Promise.all(map(...))`. Not `forEach`.
- **Make `async` earn itself.** A function with no `await` returns a promise callers must now own for nothing.
- **Await inside the `try` whose `catch` is meant to see the rejection.** Returning the promise hands the rejection past the handler.

Avoid:
- **A bare call to an async function as a statement.**
- **An async function passed where a synchronous callback is expected.**
- **`.catch(() => {})`.** That is a swallow, and what a swallow must emit belongs to `skill://typescript-skills/typescript-error-handling/rules/error-classification.md`.
- **Awaiting a non-promise to be safe.** It hides that the value was never asynchronous.

Exceptions:
- **Detached work MAY be correct** for telemetry, a cache warm, or a fire-and-forget notification, provided `void` and a failure handler are both present.
- **A promise MAY be created before it is awaited**, where a named variable makes the pending ownership visible.

Example (one instance, not the set):

```ts
// Detached on purpose, and it says so.
void recordMetric(event).catch((cause) => logger.warn({ cause }, "metric dropped"));

// Owned: the loop awaits, so a rejection reaches this frame.
for (const id of ids) await publish(id);
```

Verify:
- **Check every call to an async function used as a statement** is awaited, returned, or voided with a handler.
- **Check each `async` function contains an `await`**, or state why it returns a promise.
- **Check no callback given to a non-awaiting iterator is `async`.**
