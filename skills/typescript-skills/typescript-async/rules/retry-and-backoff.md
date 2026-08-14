---
id: typescript-async.retry-and-backoff
owner: typescript-async
canonical: true
severity: default
references: [Exponential backoff with jitter (AWS Architecture Blog), Retry storms (Google SRE), p-retry / cockatiel / async-retry]
---

# Retry and Backoff

Decision: **Retry only an operation that is explicitly retryable and safe to repeat, inside a finite budget the caller owns.** Prefer a proven project dependency, otherwise use capped exponential backoff with jitter and cancellation. Deciding what counts as retryable belongs to `skill://typescript-skills/typescript-error-handling/rules/error-classification.md`.

Use when:
- **Transient network, throttling, or availability failures are expected.**
- **Existing retries are missing something.** A cap, jitter, cancellation, or a timeout budget.
- **Replicas retry in lockstep**, or ignore a server's `Retry-After`.
- **A write may be repeated after an ambiguous outcome.**

Do:
- **Keep classification separate from mechanics.** One decides whether to retry, the other decides how.
- **Cap both attempts and elapsed time**, below the outer request or runtime deadline.
- **Use exponential backoff with full jitter.** Lockstep replicas are what turns a blip into a storm.
- **Treat `Retry-After` as input**, bounded by local policy rather than obeyed blindly.
- **Propagate the abort signal through every attempt and every wait.**
- **Require idempotency for a repeatable write.** An idempotency key, or deduplication.
- **Record attempts and the final failure**, without logging secrets.

Avoid:
- **Retrying every exception.** A caller error will fail identically every time.
- **A constant sleep, or unlimited attempts.**
- **Nested retry layers.** Their budgets multiply, and nobody owns the total.
- **Waiting past the caller's budget**, which returns an answer nobody is waiting for.
- **Retrying non-idempotent work** with no duplicate-prevention contract.
- **Swallowing the final failure.**

Exceptions:
- **A single attempt is fine** where the operation is cheap to fail and the caller retries at a higher level.
- **A library MAY expose the knobs without choosing the policy**, leaving the budget to its caller.

Example (one instance, not the set):

```ts
// Full jitter, capped, and cancellable.
const delay = Math.random() * Math.min(capMs, baseMs * 2 ** attempt);
await sleep(delay, { signal });
```

Verify:
- **Check each of these is explicit.**
  - Classification.
  - The attempt cap and the elapsed budget.
  - The per-attempt timeout.
  - Jitter and cancellation.
- **Check only one layer owns retries for an operation.**
- **Check a repeated write is safe to repeat.**
- **Check the final failure keeps its cause and its classification.**
